import re
import time
import os
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests
import cfscrape
from scripts.shared.supabase_client import supabase

# ---------- CONFIG ----------
BASE_URL = "https://www.oksid.com.tr"

# Proxy from uploaded JSON (fallback/default). You can override by env PROXY_URL
# Uploaded file showed: ip=254.201.138.0, port=55227 -> we'll use that as default proxy
DEFAULT_PROXY = "http://254.201.138.0:55227"
PROXY_URL = os.environ.get("PROXY_URL", DEFAULT_PROXY)

# Timeout settings
REQUEST_TIMEOUT = 30
PROXY_TIMEOUT = 20

# Create cfscrape scraper for fallback
scraper = cfscrape.create_scraper()

# ---------- Helpers ----------
def print_redirect_info(resp):
    if resp.history:
        print(f"⚠️ Yönlendirme tespit edildi ({len(resp.history)} adım):")
        for i, h in enumerate(resp.history, start=1):
            try:
                print(f"   {i}. {h.status_code} → {h.url}")
            except Exception:
                print(f"   {i}. {h.status_code} → (url parse error)")
        print(f"   🔚 Son URL: {resp.url}")
    else:
        print(f"✅ Yönlendirme yok, final URL: {resp.url}")

def is_unwanted_final_url(final_url):
    """Aboutus gibi yönlendirmeleri istenmeyen sayfa olarak işaretle."""
    if not final_url:
        return True
    # Basit kontrol: aboutus, maintenance, en alt domain vb.
    lowered = final_url.lower()
    if "aboutus.oksid" in lowered or "maintenance" in lowered:
        return True
    return False

# ---------- Proxy-first fetch ----------
def fetch_html_with_proxy(url, proxy_url=PROXY_URL, timeout=PROXY_TIMEOUT):
    """
    Proxy üzerinden doğrudan requests ile dene.
    Eğer proxy auth gerekiyorsa PROXY_URL ortam değişkenine "http://user:pass@ip:port" formatında ver.
    """
    if not proxy_url:
        print("⚠️ PROXY_URL tanımlı değil, proxy ile deneme atlandı.")
        return None

    proxies = {
        "http": proxy_url,
        "https": proxy_url,
    }

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Connection": "keep-alive",
        "Referer": "https://www.google.com/",
        "Host": "www.oksid.com.tr",
    }

    try:
        print(f"🌍 Proxy ile deneme: {proxy_url} -> {url}")
        resp = requests.get(url, headers=headers, proxies=proxies, timeout=timeout, allow_redirects=True, verify=True)
        print("HTTP status:", resp.status_code)
        print_redirect_info(resp)

        # Eğer final URL istenmeyen bir sayfaysa proxy geçerli sayılmasın
        if is_unwanted_final_url(resp.url):
            print("❌ Proxy ile gelen final URL istenmeyen bir sayfa (aboutus/maintenance). Proxy başarısız sayıldı.")
            return None

        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        print(f"🔻 Proxy fetch hatası: {e}")
        return None

# ---------- Fallback fetch using cfscrape ----------
def fetch_html_with_scraper(url):
    try:
        print(f"🔁 cfscrape fallback ile deneme -> {url}")
        resp = scraper.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        print("HTTP status:", resp.status_code)
        print_redirect_info(resp)

        # Eğer final URL istenmeyen bir sayfaysa bunu da başarısız say
        if is_unwanted_final_url(resp.url):
            print("❌ cfscrape ile gelen final URL istenmeyen bir sayfa (aboutus/maintenance).")
            return None

        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        print(f"🔻 cfscrape fetch hatası: {e}")
        return None

# ---------- Unified fetch_html (proxy first, then fallback) ----------
def fetch_html(url):
    # İlk önce proxy ile dene
    soup = fetch_html_with_proxy(url)
    if soup:
        return soup

    # Proxy başarısızsa veya unwanted redirect döndüyse fallback
    soup = fetch_html_with_scraper(url)
    return soup

# ---------- The rest of your scraper (with small improvements) ----------
def clean_price(price_text):
    if not price_text:
        return None
    cleaned_text = re.sub(r"[^\d,.]", "", price_text)
    if "," in cleaned_text and cleaned_text.count(",") == 1:
        cleaned_text = cleaned_text.replace(".", "").replace(",", ".")
    elif "." in cleaned_text and cleaned_text.count(".") > 1:
        parts = cleaned_text.split(".")
        cleaned_text = "".join(parts[:-1]) + "." + parts[-1]
    try:
        return float(cleaned_text)
    except:
        return None

def save_to_supabase(products):
    for p in products:
        p["marketplace"] = "oksid"
        p["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

    try:
        data = supabase.table("oksid_products") \
            .upsert(products, on_conflict="url") \
            .execute()
        print(f"✅ {len(data.data)} ürün yazıldı")
    except Exception as e:
        print(f"❌ Supabase error: {e}")

def crawl_product_page(url, category_name):
    products = []
    while True:
        soup = fetch_html(url)
        print(f"➡️ Sayfa: {url}")

        if not soup:
            print(f"❌ {url} için içerik alınamadı, atlanıyor.")
            break

        product_list_div = soup.select_one("div.colProductIn.shwstock.shwcheck.colPrdList")
        if not product_list_div:
            print("⚠️ product_list_div bulunamadı, muhtemelen sayfa yapısı farklı veya redirect oldu.")
            break

        for li in product_list_div.select("ul li"):
            try:
                link_tag = li.select_one("a.ihlog.product_click")
                if not link_tag:
                    continue

                name = link_tag.get("data-name", "N/A")
                url_product = urljoin(BASE_URL, link_tag.get("href", ""))

                price1, price2, currency = None, None, None
                p1_tag = li.select_one("span.fiyat1")
                if p1_tag:
                    price1_text = p1_tag.get_text(strip=True)
                    price1 = clean_price(price1_text)
                    cur = re.search(r"[₺$€]", price1_text)
                    if cur:
                        currency = cur.group(0)

                p2_tag = li.select_one("span.fiyat3")
                if p2_tag:
                    price2 = clean_price(p2_tag.get_text(strip=True))

                stock_span = li.select_one("span.stock")
                stock = "Bilinmiyor"
                if stock_span:
                    classes = stock_span.get("class", [])
                    if "stocktel" in classes:
                        stock = "Stokta Yok"
                    elif any(re.match(r"^stock\d+$", c) for c in classes):
                        stock = "Stokta Var"

                product = {
                    "name": name,
                    "url": url_product,
                    "price_1": price1,
                    "price_2": price2,
                    "currency": currency,
                    "stock": stock,
                    "category": category_name,
                }
                products.append(product)
            except Exception as e:
                print(f"⚠️ Ürün ayrıştırma hatası: {e}")

        next_page = soup.select_one("a.next")
        if not next_page:
            break
        href = next_page.get("href")
        if not href or href.startswith("javascript"):
            break
        url = urljoin(BASE_URL, href)

    if products:
        save_to_supabase(products)
        print(f"✅ {category_name} için {len(products)} ürün kaydedildi.")

def crawl_category(url, category_name="Ana Sayfa", visited=None):
    if visited is None:
        visited = set()
    if url in visited:
        return
    visited.add(url)

    soup = fetch_html(url)
    if not soup:
        print(f"⚠️ {url} çekilemedi, alt kategori taraması atlandı.")
        return

    subcats = soup.select("div.colProductIn.product45.shwstock.shwcheck.colPrdList a.main-title.ox-url")
    if subcats:
        for a in subcats:
            name = a.get_text(strip=True)
            link = urljoin(BASE_URL, a.get("href"))
            if name != "Tüm Alt Kategoriler":
                print(f"[CAT] {name} → {link}")
                crawl_category(link, category_name=name, visited=visited)
    else:
        crawl_product_page(url, category_name)

def crawl_from_homepage():
    print("🚀 Tarama başladı...")
    soup = fetch_html(BASE_URL)

    if not soup:
        print("❌ Ana sayfa çekilemedi. Tarama durduruldu.")
        return

    topcats = soup.select("div.catsMenu ul.hidden-xs li a")
    if not topcats:
        print("⚠️ Ana sayfada kategori menüsü bulunamadı. Sayfa içeriğini kontrol et.")
        # debug snippet
        print("Sayfa başlığı:", soup.title.string if soup.title else "(başlık yok)")
        return

    for a in topcats:
        name = a.get_text(strip=True)
        link = urljoin(BASE_URL, a.get("href"))
        if name != "Tüm Alt Kategoriler":
            print(f"[TOPCAT] {name} → {link}")
            crawl_category(link, category_name=name)

    print("✅ Tarama tamamlandı.")

# ---------- Run ----------
if __name__ == "__main__":
    # LOG: hangi proxy kullanılıyor
    print("⤴️ PROXY_URL:", PROXY_URL if PROXY_URL else "(yok)")
    crawl_from_homepage()
