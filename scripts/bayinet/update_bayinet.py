import time
import urllib.parse
import json
import os
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



def get_and_clear_otp(timeout=180, poll_interval=5):
    """
    Supabase'den OTP'yi bekleyerek çeker ve veritabanından siler.
    """
    start_time = time.time()
    
    print(f"⏳ {timeout} saniye boyunca DB'den OTP bekleniyor...")

    while time.time() - start_time < timeout:
        try:
            # 1. Kontrol: OTP var mı? (otp_code sütununu oku)
            response = supabase.table(OTP_TABLE).select("otp_code").limit(1).execute()
            
            # response.data, Supabase'den gelen bir liste olmalıdır.
            if response.data and response.data[0] and response.data[0].get("otp_code"):
                otp_code = response.data[0]["otp_code"]
                print(f"✅ OTP bulundu. ({int(time.time() - start_time)} saniye bekleme)")

                # 2. Temizlik: OTP'yi veritabanından hemen sil
                # OTP'yi sildiğimizden emin olmak için değeri eşleştirerek siliyoruz
                delete_response = supabase.table(OTP_TABLE).delete().eq("otp_code", otp_code).execute()
                print(f"🗑️ OTP veritabanından silindi. Silinen satır sayısı: {len(delete_response.data)}")

                return otp_code
            
        except Exception as e:
            # Supabase'e erişim hatası olabilir
            print(f"⚠️ Supabase OTP sorgu/silme hatası: {e}")
            
        # Bekle ve tekrar dene (Polling)
        time.sleep(poll_interval)
        
    # Zaman aşımı
    raise TimeoutError(f"🚨 OTP {timeout} saniye içinde girilmedi, işlem iptal edildi.")


def manual_login_and_get_session(p):
    
    CUSTOMER_CODE = os.getenv("BAYINET_CUSTOMER_CODE")
    EMAIL = os.getenv("BAYINET_EMAIL")
    PASSWORD = os.getenv("BAYINET_PASSWORD")

    if not all([CUSTOMER_CODE, EMAIL, PASSWORD]):
        raise RuntimeError("🚨 Giriş bilgileri eksik (env BAYINET_CUSTOMER_CODE, EMAIL, PASSWORD)!")

    # GH Actions'ta çalıştığınız için headless=True kalmalı
    browser = p.chromium.launch(headless=True, slow_mo=50) 
    context = browser.new_context()
    page = context.new_page()
    
    # page.goto'ya timeout ve load_state parametrelerini ekleyerek daha agresif bir bekleme uygulayın
    page.goto(
        f"{BASE_URL}Login", 
        wait_until="domcontentloaded",  # İlk olarak sadece DOM içeriğinin yüklenmesini bekle
        timeout=60000                   # Bu adım için bekleme süresini 1 dakikaya çıkar
    )

    # Bu bekleme artık opsiyonel, ancak ağın durmasını garanti etmek için kalmalı:
    page.wait_for_load_state("networkidle", timeout=30000) 

    print("➡️ Login formu yükleniyor (Ağ boşta)...") 
    
    # Seçiciniz:
    INPUT_SELECTOR = "input" 
    
    # İlk input'un sayfada görünmesini beklerken:
    # state='visible' yerine state='attached' deneyerek sadece DOM'a eklenmesini bekleyelim
    page.wait_for_selector(INPUT_SELECTOR, state='attached', timeout=20000) 
    print("✅ Input selector bulundu.")

    # Kod / Mail / Şifre doldurma adımında da locator'ı basitleştiriyoruz:
    # Playwright'ta 'locator' ile direkt olarak 'input'ları hedeflemek daha doğru ve kararlıdır.
    
    # Tüm input'ları al (Müşteri Kodu, E-posta, Şifre)
    login_inputs = page.locator(INPUT_SELECTOR) 

    # Müşteri Kodu (0. index)
    login_inputs.nth(0).fill(CUSTOMER_CODE, delay=50) 
    
    # E-posta (1. index)
    login_inputs.nth(1).fill(EMAIL, delay=50) 
    
    # Şifre (2. index)
    login_inputs.nth(2).fill(PASSWORD, delay=50) 
    
    print("✅ Giriş bilgileri dolduruldu.")

    # Giriş Yap butonuna tıklama adımı aynı kalır
    page.locator("button:has-text('Giriş Yap')").click()
    page.wait_for_load_state("networkidle")
    print("➡️ Giriş yapıldı, OTP ekranı bekleniyor...")

    # OTP ekranı yüklendiğinde, UI'dan girişi beklemeye başla
    page.wait_for_selector("div.css-1phe0ka input", timeout=120000)
    print("✨ OTP Giriş Ekranı Yüklendi. DB'den kod çekiliyor.")

    # 🔥 BURASI DEĞİŞTİ: DB'den OTP'yi bekle ve çek
    try:
        otp_code = get_and_clear_otp(timeout=180, poll_interval=5) # 3 dakika bekle
    except TimeoutError as e:
        # Zaman aşımında tarayıcıyı kapat ve hatayı yükselt
        browser.close()
        raise e 
    
    # OTP'yi Playwright ile giriş alanlarına parse et
    otp_inputs = page.locator("div.css-1phe0ka input")

    if len(otp_code) != otp_inputs.count():
        print(f"⚠️ Uyarı: DB'den çekilen OTP uzunluğu ({len(otp_code)}) ile input sayısı ({otp_inputs.count()}) uyuşmuyor.")
    
    for i, digit in enumerate(otp_code):
        if i < otp_inputs.count():
             # Playwright ile her haneyi ilgili input'a yaz
            otp_inputs.nth(i).fill(digit) 

    print("✅ OTP kodu Playwright ile dolduruldu.")

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

