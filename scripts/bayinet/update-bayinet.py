from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time, json, urllib.parse
from urllib.parse import urlparse, parse_qs, urljoin
from supabase import create_client

# --- Supabase Bağlantısı ---
SUPABASE_URL = "https://wkavtbgrmwrqjdlaudkp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYXZ0YmdybXdycWpkbGF1ZGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MzgxNzYsImV4cCI6MjA3NDExNDE3Nn0.8SWmeMD1eOgsb8l287Blz9WX7P1tl8tor2qd0dNKW-k"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BASE_URL = "https://www.bayinet.com.tr/"

# --- Supabase Insert ---
def save_products_to_supabase(products):
    try:
        data, count = supabase.table("bayinet_products").insert(products).execute()
        print(f"📦 {len(products)} ürün Supabase'e eklendi.")
    except Exception as e:
        print(f"❌ Supabase kayıt hatası: {e}")

# --- Product Parse ---
def parse_product_info(product_div, category_id):
    try:
        link_tag = product_div.select_one("h5[class*='product-list'] a")
        if not link_tag:
            return None

        product_name = link_tag.get_text(" ", strip=True)
        product_url = urljoin(BASE_URL, link_tag["href"])
        product_id = parse_qs(urlparse(product_url).query).get("ProductId", [None])[0]

        price_value, price_display = 0.0, "Belirtilmemiş"
        price_tag = product_div.select_one("strong.fiyatTooltip.pointer")
        if price_tag and price_tag.get("data-price"):
            try:
                price_value = float(price_tag["data-price"].replace(",", "."))
                price_display = f"{price_value:.2f} USD + %20 KDV"
            except:
                pass

        stock_divs = product_div.select("span.stock-status")
        stock_info = " | ".join(s.get_text(" ", strip=True) for s in stock_divs) if stock_divs else "Belirtilmemiş"

        return {
            "product_id": product_id,
            "name": product_name,
            "url": product_url,
            "category_id": category_id,
            "price": price_value,
            "price_display": price_display,
            "stock_info": stock_info,
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as e:
        print(f"⚠️ Ürün ayrıştırma hatası: {e}")
        return None

# --- Scraper ---
def scrape_all_pages(page, category_id, max_pages=200):
    all_products = []
    for page_num in range(max_pages):
        search_model = {
            "PageNumber": page_num,
            "VisibleProductCount": "36",
            "Categories": [category_id],
            "StoragePlace": "2001",
            "Sorting": "en-dusuk-fiyat",
        }
        encoded_model = urllib.parse.quote(json.dumps(search_model, ensure_ascii=False))
        url = f"{BASE_URL}Product/Index?searchModel={encoded_model}"

        page.goto(url)
        page.wait_for_load_state("networkidle")
        soup = BeautifulSoup(page.content(), "html.parser")

        product_divs = soup.select("div.product-list__item.grid-item")
        if not product_divs:
            print(f"⛔️ Kategori {category_id}, Sayfa {page_num}: ürün yok, durdu.")
            break

        products = [parse_product_info(div, category_id) for div in product_divs]
        products = [p for p in products if p]
        if products:
            print(f"✅ Kategori {category_id}, Sayfa {page_num}: {len(products)} ürün bulundu.")
            save_products_to_supabase(products)
            all_products.extend(products)
        else:
            break
        time.sleep(1)
    return all_products

# --- Main ---
def run_scraper():
    with sync_playwright() as p:
        # Farklı tarayıcı seçenekleri dene
        try:
            # İlk Firefox'u dene
            browser = p.firefox.launch(
                headless=False,
                args=[
                    '--ignore-certificate-errors',
                    '--disable-web-security'
                ]
            )
            context = browser.new_context(
                ignore_https_errors=True,
                accept_downloads=True
            )
            print("🦊 Firefox tarayıcısı başlatıldı")
        except Exception as e:
            print(f"❌ Firefox başlatılamadı: {e}")
            try:
                # Firefox başarısızsa Chromium ile güvenli parametreler
                browser = p.chromium.launch(
                    headless=False,
                    args=[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--ignore-certificate-errors'
                    ]
                )
                context = browser.new_context(
                    ignore_https_errors=True,
                    accept_downloads=True
                )
                print("🌐 Chromium tarayıcısı başlatıldı")
            except Exception as e2:
                print(f"❌ Chromium da başarısız: {e2}")
                # Son çare olarak headless mod
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(ignore_https_errors=True)
                print("🔇 Headless modda başlatıldı")
        
        page = context.new_page()

        # Login ekranına git
        page.goto("https://www.bayinet.com.tr/Login")
        print("➡️ Tarayıcı açıldı. Lütfen müşteri kodu, email, şifre ve OTP'yi girin.")

        # Ana sayfa yüklenene kadar bekle
        page.wait_for_url("**/Home", timeout=300000)
        print("✅ Login başarılı, scraping başlıyor...")

        # Kategorileri tara
        for i in range(1, 52):  # 01 → 51
            category_id = f"{i:02d}"
            print(f"\n📂 Kategori {category_id} çekiliyor...")
            scrape_all_pages(page, category_id)

        print("🎉 Tüm ürünler Supabase'e aktarıldı.")
        browser.close()

if __name__ == "__main__":
    run_scraper()