import re
import time
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests
import os

# Supabase Client'ın Tanımlandığı Varsayımı
try:
    from scripts.shared.supabase_client import supabase
except ImportError:
    print("⚠️ Supabase client import edilemedi. Veritabanı işlemleri pas geçilecektir.")
    supabase = None 

BASE_URL = "https://www.oksid.com.tr"

# Düz Requests için Başlıklar
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

# Proxy Yapılandırması
PROXY_URL = os.getenv('TR_PROXY_URL')
PROXIES = {}
if PROXY_URL:
    PROXIES = {
        'http': PROXY_URL,
        'https': PROXY_URL,
    }

# --- HTML Çekme Fonksiyonu ---
def fetch_html(url, retries=3, backoff=5): 
    for attempt in range(retries):
        try:
            res = requests.get(url, headers=HEADERS, proxies=PROXIES, timeout=120) 
            res.raise_for_status()
            if res.history:
                 print(f"⚠️ Yönlendirme Tespit Edildi! Son URL: {res.url}")
            return BeautifulSoup(res.text, "html.parser")
        except Exception as e:
            print(f"⚠️ Hata {e} (URL: {url}) → retry {attempt+1}/{retries}")
            if attempt < retries - 1:
                time.sleep(backoff * (attempt + 1))
            else:
                raise

# --- Fiyat Temizleme Fonksiyonu ---
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

# --- GÜNCELLENMİŞ SUPABASE KAYDETME FONKSİYONU ---
def save_to_supabase(products, category_name, batch_size=50):
    """
    Sadece yeni veya fiyatı değişen ürünleri DB'ye yazar.
    1000 satır limitini aşmak için okuma işlemini de parçalara böler.
    """
    if not products or not supabase:
        print("❌ Supabase client eksik veya ürün listesi boş. Kayıt atlandı.")
        return

    product_urls = [p["url"] for p in products if p.get("url")]
    existing_products = {}
    
    # Adım 1: Mevcut ürünleri DB'den verimli şekilde çek (1000 limitini aşarak)
    SELECT_CHUNK_SIZE = 900 
    if product_urls:
        print(f"📊 DB'den {len(product_urls)} ürünün mevcut durumu sorgulanacak...")
        for i in range(0, len(product_urls), SELECT_CHUNK_SIZE):
            url_chunk = product_urls[i:i + SELECT_CHUNK_SIZE]
            try:
                response = supabase.table("oksid_products").select("url,price_2").in_("url", url_chunk).execute()
                for item in response.data:
                    existing_products[item["url"]] = item
                print(f"   -> {len(response.data)} mevcut ürün bilgisi alındı (grup {i//SELECT_CHUNK_SIZE + 1}).")
            except Exception as e:
                print(f"⚠️ Mevcut ürünler çekilirken hata (grup {i//SELECT_CHUNK_SIZE + 1}): {e}")
        print(f"✅ Toplam {len(existing_products)} mevcut ürün bilgisi başarıyla alındı.")

    # Adım 2: Sadece güncellenecek veya eklenecek ürünleri belirle
    products_to_upsert = []
    print("\n🔍 Değişiklikler kontrol ediliyor...")
    for p in products:
        url = p.get("url")
        if not url:
            continue

        # Durum 1: Yeni ürün
        if url not in existing_products:
            print(f"✨ Yeni ürün bulundu: {p['name'][:60]}...")
            products_to_upsert.append(p)
            continue
        
        # Durum 2: Mevcut ürün, fiyatları karşılaştır (price_2'ye göre)
        old_price = existing_products[url].get("price_2")
        new_price = p.get("price_2")

        if old_price is not None and new_price is not None and old_price != new_price:
            p['last_price'] = old_price
            print(f"💰 Fiyat Değişti: {p['name'][:60]}... | Eski: {old_price} -> Yeni: {new_price}")
            products_to_upsert.append(p)

    # Adım 3: Sadece filtrelenmiş listeyi veritabanına yaz
    if not products_to_upsert:
        print(f"\n✅ Veritabanı güncel. '{category_name}' kategorisinde değişiklik veya yeni ürün bulunamadı.")
        return
        
    print(f"\n💾 '{category_name}' kategorisinde {len(products_to_upsert)} üründe değişiklik tespit edildi. Veritabanı güncelleniyor...")
    # Statik alanları ekle
    for p in products_to_upsert:
        p["marketplace"] = "oksid"
        p["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

    for i in range(0, len(products_to_upsert), batch_size):
        chunk = products_to_upsert[i:i+batch_size]
        for attempt in range(3):
            try:
                data = (
                    supabase.table("oksid_products")
                    .upsert(chunk, on_conflict="url") # `on_conflict` "url" olmalı
                    .execute()
                )
                print(f"✅ DB'ye {len(data.data)} ürün yazıldı (chunk {i//batch_size+1})")
                break
            except Exception as e:
                print(f"⚠️ Supabase error (chunk {i//batch_size+1}), retry {attempt+1}/3: {e}")
                time.sleep(5)

# --- Ürün Sayfası Tarama Fonksiyonu ---
def crawl_product_page(url, category_name):
    products = []
    page_num = 1
    while True:
        print(f"📄 '{category_name}' kategorisi, sayfa {page_num} taranıyor...")
        soup = fetch_html(url)

        if not soup:
            break

        product_list_div = soup.select_one("div.colProductIn.shwstock.shwcheck.colPrdList")
        if not product_list_div or not product_list_div.select("ul li"):
            print(f"🏁 '{category_name}' kategorisi için son sayfaya ulaşıldı.")
            break

        for li in product_list_div.select("ul li"):
             try:
                 link_tag = li.select_one("a.ihlog.product_click")
                 if not link_tag: continue
 
                 name = link_tag.get("data-name", "N/A")
                 url_product = urljoin(BASE_URL, link_tag.get("href", ""))
 
                 price1, price2, currency = None, None, None
                 p1_tag = li.select_one("span.fiyat1")
                 if p1_tag:
                     price1_text = p1_tag.get_text(strip=True)
                     price1 = clean_price(price1_text)
                     cur = re.search(r"[₺$€]", price1_text)
                     if cur: currency = cur.group(0)
 
                 p2_tag = li.select_one("span.fiyat3")
                 if p2_tag: price2 = clean_price(p2_tag.get_text(strip=True))
 
                 stock_span = li.select_one("span.stock")
                 stock = "Bilinmiyor"
                 if stock_span:
                     classes = stock_span.get("class", [])
                     if "stocktel" in classes: stock = "Stokta Yok"
                     elif any(re.match(r"^stock\d+$", c) for c in classes): stock = "Stokta Var"
 
                 products.append({
                     "name": name, "url": url_product, "price_1": price1,
                     "price_2": price2, "currency": currency, "stock": stock,
                     "category": category_name,
                 })
             except Exception:
                 continue

        next_page = soup.select_one("a.next")
        if not next_page: break
        href = next_page.get("href")
        if not href or href.startswith("javascript"): break
        
        url = urljoin(BASE_URL, href)
        page_num += 1
        time.sleep(1)

    if products:
        print(f"💾 '{category_name}' kategorisinden {len(products)} ürün çekildi. Veritabanı kontrol ediliyor...")
        save_to_supabase(products, category_name)

# --- Kategori Tarama Fonksiyonu ---
def crawl_category(url, category_name="Ana Sayfa"):
    print(f"\n📂 Kategori başlıyor: {category_name} → {url}") 
    try:
        crawl_product_page(url, category_name)
    except Exception as e:
        print(f"❌ {category_name} genel hatası: {e}")
    time.sleep(2)

# --- Ana Fonksiyon ---
def crawl_from_homepage():
    print("🚀 Oksid Scraper başlıyor...")
    
    if PROXIES:
        proxy_host = PROXY_URL.split('@')[-1] if '@' in PROXY_URL else PROXY_URL
        print(f"✅ Proxy ile çalışılıyor: {proxy_host}")
    else:
        print("ℹ️ Proxy ayarı bulunamadı. Direkt bağlantı kullanılacak.")

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

    for a in topcats:
        name = a.get_text(strip=True)
        link = urljoin(BASE_URL, a.get("href"))
        if name != "Tüm Alt Kategoriler":
            crawl_category(link, category_name=name)

    print("\n✅ Tüm kategoriler tamamlandı.")

if __name__ == "__main__":
    crawl_from_homepage()