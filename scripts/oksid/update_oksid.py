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
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Connection': 'keep-alive',
}

# Proxy Yapılandırması
PROXY_URL = os.getenv('TR_PROXY_URL')
PROXIES = {}
if PROXY_URL:
    PROXIES = {'http': PROXY_URL, 'https': PROXY_URL}

# --- TEMEL FONKSİYONLAR ---
def fetch_html(url, retries=3, backoff=5): 
    for attempt in range(retries):
        try:
            res = requests.get(url, headers=HEADERS, proxies=PROXIES, timeout=120) 
            res.raise_for_status()
            return BeautifulSoup(res.text, "html.parser")
        except Exception as e:
            print(f"⚠️ Hata {e} (URL: {url}) → retry {attempt+1}/{retries}")
            if attempt < retries - 1:
                time.sleep(backoff * (attempt + 1))
            else: raise

def clean_price(price_text):
    if not price_text: return None
    cleaned_text = re.sub(r"[^\d,.]", "", price_text)
    if "," in cleaned_text and cleaned_text.count(",") == 1:
        cleaned_text = cleaned_text.replace(".", "").replace(",", ".")
    elif "." in cleaned_text and cleaned_text.count(".") > 1:
        parts = cleaned_text.split(".")
        cleaned_text = "".join(parts[:-1]) + "." + parts[-1]
    try: return float(cleaned_text)
    except: return None

def save_to_supabase(products, category_name, batch_size=50):
    if not products or not supabase: return
    product_urls = [p["url"] for p in products if p.get("url")]
    existing_products = {}
    SELECT_CHUNK_SIZE = 900 
    if product_urls:
        print(f"    📊 DB'den {len(product_urls)} ürünün mevcut durumu sorgulanacak...")
        for i in range(0, len(product_urls), SELECT_CHUNK_SIZE):
            url_chunk = product_urls[i:i + SELECT_CHUNK_SIZE]
            try:
                response = supabase.table("oksid_products").select("url, price_1, stock").in_("url", url_chunk).execute()
                for item in response.data: existing_products[item["url"]] = item
            except Exception as e: print(f"    ⚠️ Mevcut ürünler çekilirken hata: {e}")
    products_to_upsert = []
    for p in products:
        url = p.get("url")
        if not url: continue
        if url not in existing_products:
            p['last_price'] = None
            products_to_upsert.append(p)
            continue
        existing_product = existing_products[url]
        old_price, new_price = existing_product.get("price_1"), p.get("price_1")
        old_stock, new_stock = existing_product.get("stock"), p.get("stock")
        price_has_changed = (old_price is not None and new_price is not None and old_price != new_price)
        stock_has_changed = (old_stock is not None and new_stock is not None and old_stock != new_stock)
        if price_has_changed or stock_has_changed:
            p['last_price'] = old_price
            products_to_upsert.append(p)
    if not products_to_upsert:
        print(f"    ✅ Veritabanı güncel. '{category_name}' için değişiklik yok.")
        return
    print(f"    💾 '{category_name}' için {len(products_to_upsert)} değişiklik DB'ye yazılıyor...")
    for p in products_to_upsert:
        p.update({"marketplace": "oksid", "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")})
    for i in range(0, len(products_to_upsert), batch_size):
        chunk = products_to_upsert[i:i+batch_size]
        try: supabase.table("oksid_products").upsert(chunk, on_conflict="url").execute()
        except Exception as e: print(f"    ⚠️ Supabase yazma hatası: {e}")

# --- FİNAL HİYERARŞİK TARAMA SİSTEMİ ---
def crawl_category_tree(url, category_path, visited_urls):
    if url in visited_urls: return
    visited_urls.add(url)

    depth = len(category_path) - 1
    prefix = "  " * depth
    current_category_name = category_path[-1]
    
    print(f"{prefix}➡️ '{current_category_name}' analiz ediliyor...")
    
    try:
        soup = fetch_html(url)
        if not soup: return
    except Exception as e:
        print(f"{prefix}❌ Sayfa çekilirken hata: {e}")
        return

    # ÖNCE ÜRÜN LİSTESİ SAYFASI MI DİYE KONTROL ET (en spesifik durum)
    product_container = soup.select_one("div.colProductIn.productnlist")
    if product_container:
        print(f"{prefix}  -> '{current_category_name}' bir ÜRÜN LİSTESİ. Tarama başlıyor...")
        all_products = []
        current_page_soup = soup
        current_url = url
        page_num = 1
        while True:
            if page_num > 1:
                try:
                    current_page_soup = fetch_html(current_url)
                    if not current_page_soup: break
                except Exception: break
            
            print(f"{prefix}    📄 Sayfa {page_num} taranıyor...")
            product_list_div = current_page_soup.select_one("div.colProductIn.productnlist")
            if not product_list_div or not product_list_div.select("ul li"): break
            for li in product_list_div.select("ul li"):
                try:
                    link_tag = li.select_one("a.ihlog.product_click")
                    if not link_tag: continue
                    name, url_product = link_tag.get("data-name", "N/A"), urljoin(BASE_URL, link_tag.get("href", ""))
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
                        stock_classes = stock_span.get("class", [])
                        if "stocktel" in stock_classes: stock = "Stokta Yok"
                        elif any(re.match(r"^stock\d+$", c) for c in stock_classes): stock = "Stokta Var"
                    all_products.append({"name": name, "url": url_product, "price_1": price1, "price_2": price2,"currency": currency, "stock": stock, "category": current_category_name})
                except Exception: continue
            next_page = current_page_soup.select_one("a.next")
            if not next_page: break
            href = next_page.get("href")
            if not href or href.startswith("javascript"): break
            current_url = urljoin(BASE_URL, href)
            page_num += 1
            time.sleep(1)
        if all_products:
            print(f"{prefix}    💾 Toplam {len(all_products)} ürün çekildi. Veritabanı işlemi başlıyor...")
            save_to_supabase(all_products, current_category_name)
        return

    # EĞER ÜRÜN LİSTESİ DEĞİLSE, ARA KATEGORİ BLOKLARI VAR MI DİYE KONTROL ET
    # KESİN ÇÖZÜM: `select` ile sayfadaki TÜM `product45` bloklarını bul.
    sub_category_containers = soup.select("div.colProductIn.product45")
    if sub_category_containers:
        print(f"{prefix}  -> '{current_category_name}' bir ARA KATEGORİ. {len(sub_category_containers)} alt başlık bulundu.")
        
        for container in sub_category_containers:
            # Her bir bloğun içindeki `a.main-title` linkini bul
            link_tag = container.select_one("a.main-title")
            if link_tag:
                sub_name = link_tag.get_text(strip=True)
                sub_href = link_tag.get("href")
                if sub_name and sub_href:
                    full_link = urljoin(BASE_URL, sub_href)
                    crawl_category_tree(full_link, category_path + [sub_name], visited_urls)
        return

    print(f"{prefix}  -> '{current_category_name}' sayfasında bilinen bir yapı bulunamadı. Atlanıyor.")


# --- ANA FONKSİYON (BAŞLATICI) ---
def crawl_from_homepage():
    print("🚀 Oksid Scraper (Hiyerarşik Tarama - Final v5) başlıyor...")
    if PROXIES:
        proxy_host = PROXY_URL.split('@')[-1] if '@' in PROXY_URL else PROXY_URL
        print(f"✅ Proxy ile çalışılıyor: {proxy_host}")
    else:
        print("ℹ️ Proxy ayarı bulunamadı. Direkt bağlantı kullanılacak.")
    try:
        soup = fetch_html(BASE_URL)
        if not soup: return
    except Exception as e:
        print(f"❌ Ana sayfa hatası: {e}")
        return
    top_level_cats = soup.select("div.catsMenu > ul.hidden-xs > li > a")
    if not top_level_cats:
        print("⚠️ Ana sayfada kategori menüsü bulunamadı.")
        return
    visited_urls = set()
    print(f"🔎 {len(top_level_cats)} ana kategori dalı bulundu. Tarama başlıyor...")
    for a_tag in top_level_cats:
        name = a_tag.get_text(strip=True)
        link = urljoin(BASE_URL, a_tag.get("href"))
        if name and link and name not in ["Tüm Alt Kategoriler", "Outlet"]:
            print(f"\n===== Ana Kategori Dalına Giriliyor: {name} =====")
            crawl_category_tree(link, [name], visited_urls)
    print("\n✅ Tüm kategoriler tamamlandı.")

if __name__ == "__main__":
    crawl_from_homepage()