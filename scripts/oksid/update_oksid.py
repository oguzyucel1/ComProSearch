import os
import time
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests
from scripts.shared.supabase_client import supabase

BASE_URL = "https://www.oksid.com.tr"
SCRAPERAPI_KEY = os.environ.get("SCRAPERAPI_KEY")  # set in GH Actions secrets

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Connection": "keep-alive",
    "Referer": "https://www.google.com/",
}

REQUEST_TIMEOUT = 30

def fetch_via_scraperapi(url, country_code="tr", timeout=60):
    """Fetch a URL through ScraperAPI (api_key via env). Returns requests.Response"""
    if not SCRAPERAPI_KEY:
        raise RuntimeError("SCRAPERAPI_KEY not set in environment")
    params = {
        "api_key": SCRAPERAPI_KEY,
        "url": url,
        "country_code": country_code,  # ensure TR exit
        "render": "false"  # optionally true if need JS rendering
    }
    resp = requests.get("http://api.scraperapi.com", params=params, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp

def is_unwanted_final_url(final_url):
    if not final_url:
        return True
    lowered = final_url.lower()
    if "aboutus.oksid" in lowered or "maintenance" in lowered:
        return True
    return False

def soup_from_response(resp):
    return BeautifulSoup(resp.text, "html.parser")

# --- Clean price helper (same as before) ---
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

# --- Save to supabase (unchanged) ---
def save_to_supabase(products):
    if not products or not supabase:
        return
    for p in products:
        p["marketplace"] = "oksid"
        p["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    try:
        data = supabase.table("oksid_products").upsert(products, on_conflict="url").execute()
        print(f"✅ {len(data.data)} ürün yazıldı")
    except Exception as e:
        print(f"❌ Supabase error: {e}")

# ---------- Hybrid fetch flow ----------
def get_homepage_and_start_session():
    """
    1) Get homepage via ScraperAPI (TR exit).
    2) Create a normal requests.Session for subsequent requests.
    3) Transfer cookies from ScraperAPI response into the session (best-effort).
    Returns: (soup_homepage, session)
    """
    print("🔐 Fetching homepage via ScraperAPI (TR exit)...")
    resp = fetch_via_scraperapi(BASE_URL)
    print("Status:", resp.status_code, "Final URL:", resp.url)
    if is_unwanted_final_url(resp.url):
        raise RuntimeError(f"Homepage returned unwanted final URL: {resp.url}")

    soup = soup_from_response(resp)

    # Create a session for non-proxied requests
    sess = requests.Session()
    sess.headers.update(HEADERS)

    # Transfer cookies from the ScraperAPI response into the session (best-effort).
    # Note: ScraperAPI may or may not expose exact same cookie semantics; do best-effort.
    try:
        for c in resp.cookies:
            # requests.cookies.Cookie has attributes .name and .value
            sess.cookies.set(c.name, c.value, domain=c.domain if getattr(c, "domain", None) else None)
        print("🔁 Cookies transferred from ScraperAPI response to session (best-effort).")
    except Exception as e:
        print("⚠️ Cookie transfer failed:", e)

    return soup, sess

def fetch_via_session(sess, url, timeout=REQUEST_TIMEOUT):
    """
    Use the provided session to fetch url without proxy.
    Returns soup or None on failure/unwanted redirect.
    """
    try:
        print(f"➡️ Session fetch: {url}")
        resp = sess.get(url, timeout=timeout, allow_redirects=True)
        print("Status:", resp.status_code, "Final URL:", resp.url)
        if is_unwanted_final_url(resp.url):
            print("❌ Session fetch returned unwanted final URL (geo/maintenance).")
            return None
        resp.raise_for_status()
        return soup_from_response(resp)
    except Exception as e:
        print("🔻 Session fetch error:", e)
        return None

def fetch_with_hybrid(sess, url):
    """
    Try session fetch first (fast). If session fails OR returns unwanted redirect,
    fallback to fetching that specific URL via ScraperAPI (consumes credit).
    """
    # Try session first
    soup = fetch_via_session(sess, url)
    if soup:
        return soup

    # Fallback to ScraperAPI for this URL
    try:
        print(f"🔁 Fallback: using ScraperAPI for {url}")
        resp = fetch_via_scraperapi(url)
        print("Status:", resp.status_code, "Final URL:", resp.url)
        if is_unwanted_final_url(resp.url):
            print("❌ ScraperAPI fallback also returned unwanted final URL.")
            return None
        return soup_from_response(resp)
    except Exception as e:
        print("🔻 ScraperAPI fallback failed:", e)
        return None

# ---------- Crawler (uses hybrid fetch) ----------
def crawl_product_page(soup_getter, start_url, category_name, sess):
    """
    soup_getter: function that takes (sess, url) and returns BeautifulSoup (we'll use fetch_with_hybrid)
    sess: the session for normal fetches
    """
    products = []
    url = start_url
    while True:
        soup = soup_getter(sess, url)
        print(f"➡️ Crawling page: {url}")
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

        # next page
        next_page = soup.select_one("a.next")
        if not next_page:
            break
        href = next_page.get("href")
        if not href or href.startswith("javascript"):
            break
        url = urljoin(BASE_URL, href)
        time.sleep(1)

    if products:
        save_to_supabase(products)
        print(f"✅ {category_name} için {len(products)} ürün kaydedildi.")

def crawl_from_homepage_hybrid():
    print("🚀 Tarama başladı (hybrid: homepage via ScraperAPI, then session)...")
    try:
        homepage_soup, session = get_homepage_and_start_session()
    except Exception as e:
        print("❌ Homepage fetch failed:", e)
        return

    # find top categories from homepage
    topcats = homepage_soup.select("div.catsMenu ul.hidden-xs li a")
    if not topcats:
        print("⚠️ Ana sayfada kategori menüsü bulunamadı. Sayfa içeriğini kontrol et.")
        print("Sayfa başlığı:", homepage_soup.title.string if homepage_soup.title else "(başlık yok)")
        return

    for a in topcats:
        name = a.get_text(strip=True)
        link = urljoin(BASE_URL, a.get("href"))
        if name != "Tüm Alt Kategoriler":
            print(f"[TOPCAT] {name} → {link}")
            # Use hybrid fetch for category & products: session first, then ScraperAPI fallback if needed
            crawl_product_page(fetch_with_hybrid, link, category_name=name, sess=session)

    print("✅ Tarama tamamlandı.")

if __name__ == "__main__":
    # require SCRAPERAPI_KEY in env for this hybrid approach
    print("SCRAPERAPI_KEY present:", bool(SCRAPERAPI_KEY))
    crawl_from_homepage_hybrid()
