import re
import time
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests
import os
from scripts.shared.supabase_client import supabase # Supabase'in dahil olduğunu varsayıyoruz

# Supabase Client'ın Tanımlandığı Varsayımı
try:
    from scripts.shared.supabase_client import supabase
except ImportError:
    print("⚠️ Supabase client import edilemedi. Veritabanı işlemleri pas geçilecektir.")
    supabase = None 

BASE_URL = "https://www.oksid.com.tr"

# Düz Requests için Başlıklar (Türkiye'den geliyormuş izlenimi)
HEADERS = {
    'User-Agent': (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Connection': 'keep-alive',
}

# --- HTML Çekme (Sıralı, Hata Denemesi 3) ---
def fetch_html(url, retries=3, backoff=5): 
    for attempt in range(retries):
        try:
            # Hız için timeout 120 saniyeye düşürüldü
            res = requests.get(url, headers=HEADERS, timeout=120) 
            res.raise_for_status()
            
            if res.history:
                 print(f"⚠️ Yönlendirme Tespit Edildi! Son URL: {res.url}")

            return BeautifulSoup(res.text, "html.parser")
        except Exception as e:
            # Hata durumunda bekleme süresi korunur
            print(f"⚠️ Hata {e} (URL: {url}) → retry {attempt+1}/{retries}")
            if attempt < retries - 1:
                time.sleep(backoff * (attempt + 1))
            else:
                raise

# --- Fiyat Temizleme (Aynı) ---
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

# --- Supabase Kaydetme (Aynı) ---
def save_to_supabase(products, category_name, batch_size=50):
    if not products or not supabase:
        return

    for i in range(0, len(products), batch_size):
        chunk = products[i:i+batch_size]

        for p in chunk:
            p["marketplace"] = "oksid"
            p["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

        for attempt in range(3):
            try:
                data = (
                    supabase.table("oksid_products")
                    .upsert(chunk, on_conflict="url")
                    .execute()
                )
                print(
                    f"✅ {category_name} → {len(data.data)} ürün yazıldı "
                    f"(chunk {i//batch_size+1}/{(len(products)+batch_size-1)//batch_size})"
                )
                break
            except Exception as e:
                print(f"⚠️ Supabase error (chunk {i//batch_size+1}), retry {attempt+1}/3: {e}")
                time.sleep(5)

# --- Ürün Sayfası ---
def crawl_product_page(url, category_name):
    products = []
    while True:
        soup = fetch_html(url)

        if not soup:
            break

        product_list_div = soup.select_one("div.colProductIn.shwstock.shwcheck.colPrdList")
        if not product_list_div:
            # Sayfa sonu, hata veya yönlendirme sonrası doğru içerik gelmedi
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
             except Exception:
                 continue

        # ➡️ Sonraki sayfa
        next_page = soup.select_one("a.next")
        if not next_page:
            break
        href = next_page.get("href")
        if not href or href.startswith("javascript"):
            break
        url = urljoin(BASE_URL, href)
        time.sleep(1)  # ✅ Sayfalar arası bekleme 1 saniyeye düşürüldü

    if products:
        save_to_supabase(products, category_name)
        print(f"✅ {category_name} için {len(products)} ürün kaydedildi.")

# --- Kategori Tarama ---
def crawl_category(url, category_name="Ana Sayfa"):
    # Sıralı olduğu için kategori başlangıcında yazdırıldı
    print(f"\n📂 Kategori başlıyor: {category_name} → {url}") 
    try:
        crawl_product_page(url, category_name)
    except Exception as e:
        print(f"❌ {category_name} genel hatası: {e}")
    time.sleep(2)  # ✅ Kategoriler arası bekleme 2 saniyeye düşürüldü

# --- Ana Fonksiyon (Sıralı Çalışma) ---
def crawl_from_homepage():
    print("🚀 Tarama başladı...")
    
    try:
        soup = fetch_html(BASE_URL)
        if not soup:
            print("❌ Ana sayfa çekilemedi. Tarama durduruldu.")
            return
    except Exception as e:
        print(f"❌ Ana sayfa hatası: {e}. Tarama durduruldu.")
        return

    topcats = soup.select("div.catsMenu ul.hidden-xs li a")
    if not topcats:
        print("⚠️ Ana sayfada kategori menüsü bulunamadı.")
        return

    # Sıralı döngü: Her kategori bitince diğerine geçilir.
    for a in topcats:
        name = a.get_text(strip=True)
        link = urljoin(BASE_URL, a.get("href"))
        if name != "Tüm Alt Kategoriler":
            crawl_category(link, category_name=name)

    print("\n✅ Tüm kategoriler tamamlandı.")

if __name__ == "__main__":
    crawl_from_homepage()