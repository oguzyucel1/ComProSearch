import time
import urllib.parse
import json
from urllib.parse import urljoin, urlparse, parse_qs
from playwright.sync_api import sync_playwright
from scripts.shared.supabase_client import supabase

BASE_URL = "https://www.bayinet.com.tr/"

# --- Supabase Kaydetme ---
def save_products_to_supabase(products, batch_size=50):
    if not products or not supabase:
        print("❌ Supabase client eksik veya ürün listesi boş. Kayıt atlandı.")
        return

    for i in range(0, len(products), batch_size):
        chunk = products[i:i+batch_size]
        for attempt in range(3):
            try:
                data = (
                    supabase.table("bayinet_products")
                    .upsert(chunk, on_conflict="product_id")
                    .execute()
                )
                print(f"✅ DB'ye {len(data.data)} ürün yazıldı (chunk {i//batch_size+1})")
                break
            except Exception as e:
                print(f"⚠️ Supabase error (chunk {i//batch_size+1}), retry {attempt+1}/3: {e}")
                time.sleep(5)

# --- Scraper (Playwright DOM tabanlı) ---
def scrape_all_pages(page, category_id, max_pages=200):
    for page_num in range(max_pages):
        search_model = {
            "SelectedProperties": [],
            "SelectedPropertyGroups": [],
            "AllProp": False,
            "PageNumber": page_num,
            "VisibleProductCount": "36",
            "SearchTextInProducts": "",
            "Categories": [category_id],
            "CategoriesLevel4": [],
            "CategoriesLevel2": [],
            "Brands": [],
            "PropertyGroups": [],
            "Properties": [],
            "StoragePlace": "2001",
            "Sorting": "en-dusuk-fiyat",
            "IsStockOnly": False,
            "AllStoragePlaces": False,
            "WithPropertiesAggregation": False,
            "WithPropertyGroupAggregation": False,
            "SearchCategoryId": category_id,
            "MaxPrice": {"Price": 0, "SelectedPrice": 0, "Currency": ""},
            "MinPrice": {"Price": 0, "SelectedPrice": 0, "Currency": ""},
            "IsSubscription": "false",
            "IsN11": False
        }

        url = f"{BASE_URL}Product/Index?searchModel={urllib.parse.quote(json.dumps(search_model, ensure_ascii=False))}"
        page.goto(url)
        page.wait_for_load_state("networkidle")

        product_divs = page.locator("div.product-list__item.grid-item")
        count = product_divs.count()

        if count == 0:
            print(f"⛔️ Kategori {category_id}, Sayfa {page_num}: ürün yok, durdu.")
            break

        products = []
        for i in range(count):
            try:
                link_tag = product_divs.nth(i).locator("h5 a")
                product_name = link_tag.inner_text().strip()
                product_url_absolute = urljoin(BASE_URL, link_tag.get_attribute("href"))
                product_id = parse_qs(urlparse(product_url_absolute).query).get("ProductId", [None])[0]

                price_value, price_display = 0.0, "Belirtilmemiş"
                price_tag = product_divs.nth(i).locator("strong.fiyatTooltip.pointer")
                if price_tag.count() > 0:
                    data_price = price_tag.first.get_attribute("data-price")
                    if data_price:
                        price_value = float(data_price.replace(",", "."))
                        price_display = f"{price_value:.2f} USD + %20 KDV"

                stock_divs = product_divs.nth(i).locator("span.stock-status")
                stock_info = " | ".join([
                    stock_divs.nth(j).inner_text().strip() for j in range(stock_divs.count())
                ]) if stock_divs.count() > 0 else "Belirtilmemiş"

                products.append({
                    "product_id": product_id,
                    "name": product_name,
                    "url": product_url_absolute,
                    "category_id": category_id,
                    "price": price_value,
                    "price_display": price_display,
                    "stock_info": stock_info,
                    "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
                })
            except Exception as e:
                print(f"⚠️ Ürün ayrıştırma hatası (Kategori {category_id}, Sayfa {page_num}): {e}")

        print(f"✅ Kategori {category_id}, Sayfa {page_num}: {count} ürün bulundu.")

        # 🔥 Tek seferde DB'ye yaz
        try:
            data = supabase.table("bayinet_products").upsert(products, on_conflict="product_id").execute()
            print(f"💾 DB'ye {len(data.data)} ürün yazıldı (Kategori {category_id}, Sayfa {page_num})")
        except Exception as e:
            print(f"❌ DB kaydı hatası (Kategori {category_id}, Sayfa {page_num}): {e}")

        time.sleep(1)



# --- Giriş Fonksiyonu (mantık aynen korunuyor) ---
def manual_login_and_get_session(p):
    import os
    CUSTOMER_CODE = os.getenv("BAYINET_CUSTOMER_CODE")
    EMAIL = os.getenv("BAYINET_EMAIL")
    PASSWORD = os.getenv("BAYINET_PASSWORD")

    if not all([CUSTOMER_CODE, EMAIL, PASSWORD]):
        raise RuntimeError("🚨 Giriş bilgileri eksik (env BAYINET_CUSTOMER_CODE, EMAIL, PASSWORD)!")

    browser = p.chromium.launch(headless=False, slow_mo=100)
    context = browser.new_context()
    page = context.new_page()
    page.goto(f"{BASE_URL}Login")

    print("➡️ Login formu yükleniyor...")
    FORM_CONTROL_SELECTOR = ".MuiFormControl-root.css-10ki1mm"
    page.wait_for_selector(FORM_CONTROL_SELECTOR, timeout=10000)

    # Kod / Mail / Şifre doldur
    page.locator(FORM_CONTROL_SELECTOR).nth(0).locator("input").type(CUSTOMER_CODE, delay=50)
    page.locator(FORM_CONTROL_SELECTOR).nth(1).locator("input").type(EMAIL, delay=50)
    page.locator(FORM_CONTROL_SELECTOR).nth(2).locator("input").type(PASSWORD, delay=50)
    print("✅ Giriş bilgileri dolduruldu.")

    # Giriş Yap
    page.locator("button:has-text('Giriş Yap')").click()
    page.wait_for_load_state("networkidle")
    print("➡️ Giriş yapıldı, OTP ekranı bekleniyor...")

    # OTP ekranı
    page.wait_for_selector("div.css-1phe0ka input", timeout=120000)
    otp_code = input("🔑 OTP kodunu gir: ").strip()
    otp_inputs = page.locator("div.css-1phe0ka input")

    for i, digit in enumerate(otp_code):
        otp_inputs.nth(i).type(digit, delay=50)

    print("✅ OTP kodu dolduruldu.")

    # Doğrula
    page.locator("button:has-text('Doğrula')").click()
    page.wait_for_load_state("networkidle")
    print("➡️ OTP doğrulandı, yönlendirme bekleniyor...")

    # Pentadijital → Bayinet
    print("🔎 Mevcut URL (OTP sonrası):", page.url)
    page.wait_for_selector("span:has-text('Bayinet')", timeout=60000)
    print("➡️ Bayinet butonu bulundu, tıklanıyor...")
    page.click("span:has-text('Bayinet')")

    print("⏳ Bayinet ana sayfasına yönlendiriliyor...")
    page.wait_for_selector(".menu-categories__toggle.collapsed.js_collapsed.hidden-xs", timeout=120000)
    print("✅ Bayinet ana sayfası tamamen yüklendi. URL:", page.url)

    return page

# --- Main ---
def run_scraper():
    print("🚀 Bayinet Scraper başlıyor...")

    with sync_playwright() as p:
        page = manual_login_and_get_session(p)

        print("✅ Oturum hazır, scraping başlıyor...")
        for i in range(1, 52):
            category_id = f"{i:02d}"
            print(f"\n📂 Kategori {category_id} çekiliyor...")
            scrape_all_pages(page, category_id)

        print("✅ Scraping tamamlandı.")

if __name__ == "__main__":
    run_scraper()
