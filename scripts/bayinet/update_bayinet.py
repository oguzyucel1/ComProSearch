import time
import urllib.parse
import json
import os
from urllib.parse import urljoin, urlparse, parse_qs
from playwright.sync_api import sync_playwright
# Lütfen projenizde scripts/shared/supabase_client.py dosyasının
# doğru şekilde ayarlandığından emin olun.
from scripts.shared.supabase_client import supabase 

# --- Sabitler ---
BASE_URL = "https://www.bayinet.com.tr/"
OTP_TABLE = "otp_codes" 

# --- Supabase OTP Yönetimi ---
def get_and_clear_otp(timeout=180, poll_interval=5):
    """
    Supabase'den OTP'yi bekleyerek çeker ve veritabanından siler (Polling).
    """
    start_time = time.time()
    
    print(f"⏳ {timeout} saniye boyunca DB'den OTP bekleniyor...")

    while time.time() - start_time < timeout:
        try:
            response = supabase.table(OTP_TABLE).select("otp_code").limit(1).execute()
            
            if response.data and response.data[0] and response.data[0].get("otp_code"):
                otp_code = response.data[0]["otp_code"]
                print(f"✅ OTP bulundu. ({int(time.time() - start_time)} saniye bekleme)")

                delete_response = supabase.table(OTP_TABLE).delete().eq("otp_code", otp_code).execute()
                print(f"🗑️ OTP veritabanından silindi. Silinen satır sayısı: {len(delete_response.data)}")

                return otp_code
            
        except Exception as e:
            print(f"⚠️ Supabase OTP sorgu/silme hatası: {e}")
            
        time.sleep(poll_interval)
        
    raise TimeoutError(f"🚨 OTP {timeout} saniye içinde girilmedi, işlem iptal edildi.")

# --- Supabase Ürün Kaydı (Fiyat Geçmişi ile) ---
# GÜNCELLENDİ: Bu fonksiyon artık sadece yeni veya fiyatı değişen ürünleri DB'ye yazar.
def save_products_to_supabase(products, batch_size=50):
    if not products or not supabase:
        print("❌ Supabase client eksik veya ürün listesi boş. Kayıt atlandı.")
        return

    product_ids = [p["product_id"] for p in products if p.get("product_id")]
    existing_products = {}
    
    # Adım 1: Mevcut ürünlerin fiyat bilgilerini DB'den çek (bu kısım aynı)
    SELECT_CHUNK_SIZE = 900 
    if product_ids:
        print(f"📊 DB'den {len(product_ids)} ürünün mevcut durumu sorgulanacak...")
        for i in range(0, len(product_ids), SELECT_CHUNK_SIZE):
            id_chunk = product_ids[i:i + SELECT_CHUNK_SIZE]
            try:
                response = supabase.table("bayinet_products").select("product_id,price").in_("product_id", id_chunk).execute()
                for item in response.data:
                    existing_products[item["product_id"]] = item
                print(f"   -> {len(response.data)} mevcut ürün bilgisi alındı (grup {i//SELECT_CHUNK_SIZE + 1}).")
            except Exception as e:
                print(f"⚠️ Mevcut ürünler çekilirken hata (grup {i//SELECT_CHUNK_SIZE + 1}): {e}")
        print(f"✅ Toplam {len(existing_products)} mevcut ürün bilgisi başarıyla alındı.")

    # Adım 2: YENİ - Sadece güncellenecek veya eklenecek ürünleri belirle
    products_to_upsert = []
    print("\n🔍 Değişiklikler kontrol ediliyor...")
    for p in products:
        product_id = p.get("product_id")
        if not product_id:
            continue

        # Durum 1: Ürün veritabanında yok (YENİ ÜRÜN)
        if product_id not in existing_products:
            print(f"✨ Yeni ürün bulundu: {p['name'][:60]}...")
            products_to_upsert.append(p)
            continue
        
        # Durum 2: Ürün veritabanında var, fiyatları karşılaştır
        old_price = existing_products[product_id].get("price")
        new_price = p.get("price")

        # Fiyatlar farklıysa, `last_price`'ı ata ve güncelleme listesine ekle
        if old_price is not None and new_price is not None and old_price != new_price:
            p['last_price'] = old_price
            print(f"💰 Fiyat Değişti: {p['name'][:60]}... | Eski: {old_price} -> Yeni: {new_price}")
            products_to_upsert.append(p)

    # Adım 3: Sadece filtrelenmiş listeyi veritabanına yaz
    if not products_to_upsert:
        print("\n✅ Veritabanı güncel. Değişiklik veya yeni ürün bulunamadı.")
        return
        
    print(f"\n💾 Toplam {len(products_to_upsert)} üründe değişiklik tespit edildi. Veritabanı güncelleniyor...")
    for i in range(0, len(products_to_upsert), batch_size):
        chunk = products_to_upsert[i:i+batch_size]
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

# --- Playwright ile Oturum Açma ---
def manual_login_and_get_session(p):
    CUSTOMER_CODE = os.getenv("BAYINET_CUSTOMER_CODE")
    EMAIL = os.getenv("BAYINET_EMAIL")
    PASSWORD = os.getenv("BAYINET_PASSWORD")
 
    if not all([CUSTOMER_CODE, EMAIL, PASSWORD]):
        raise RuntimeError("🚨 Giriş bilgileri eksik (env BAYINET_CUSTOMER_CODE, EMAIL, PASSWORD)!")

    launch_args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    browser = p.chromium.launch(headless=True, slow_mo=50, args=launch_args)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768}
    )
    page = context.new_page()
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")

    print(f"➡️ {BASE_URL}Login adresine gidiliyor...")
    page.goto(f"{BASE_URL}Login", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_load_state("networkidle", timeout=30000)
    print("➡️ Login formu yükleniyor (Ağ boşta)...")
    
    try:
        musteri_kodu_input = page.get_by_placeholder("Müşteri Kodu").first
        musteri_kodu_input.wait_for(timeout=20000)
        print("✅ Placeholder ile ilk input bulundu.")
        musteri_kodu_input.fill(CUSTOMER_CODE)
        page.get_by_placeholder("E-Posta veya telefon numarası").first.fill(EMAIL)
        page.get_by_placeholder("Şifre").first.fill(PASSWORD)
        print("✅ Giriş bilgileri dolduruldu.")
    except Exception as e:
        page.screenshot(path="login_form_timeout.png")
        print(f"🚨 Login formu yüklenemedi. 'login_form_timeout.png' dosyasını kontrol edin. Hata: {e}")
        browser.close()
        raise

    page.locator("button:has-text('Giriş Yap')").click()
    page.wait_for_load_state("networkidle")
    print("➡️ Giriş yapıldı, OTP ekranı bekleniyor...")

    page.wait_for_selector("div.css-1phe0ka input", timeout=120000)
    print("✨ OTP Giriş Ekranı Yüklendi. DB'den kod çekiliyor.")

    try:
        otp_code = get_and_clear_otp(timeout=180, poll_interval=5)
    except TimeoutError as e:
        browser.close()
        raise e
    
    otp_inputs = page.locator("div.css-1phe0ka input")
    for i, digit in enumerate(otp_code):
        if i < otp_inputs.count():
             otp_inputs.nth(i).fill(digit)
    print("✅ OTP kodu Playwright ile dolduruldu.")

    page.locator("button:has-text('Doğrula')").click()
    page.wait_for_load_state("networkidle", timeout=60000)
    print("➡️ OTP doğrulandı, yönlendirme bekleniyor...")

    print("🔎 Mevcut URL (OTP sonrası):", page.url)
    page.wait_for_selector("span:has-text('Bayinet')", timeout=60000)
    print("➡️ Bayinet butonu bulundu, tıklanıyor...")
    page.click("span:has-text('Bayinet')")

    print("⏳ Bayinet ana sayfasına yönlendiriliyor...")
    page.wait_for_selector(".menu-categories__toggle.collapsed.js_collapsed.hidden-xs", timeout=120000)
    print("✅ Bayinet ana sayfası tamamen yüklendi. URL:", page.url)

    return page

# --- Scraper Fonksiyonu (Sadece veri çeker, DB'ye yazmaz) ---
def scrape_all_pages(page, category_id, max_pages=200):
    """
    Belirli bir kategorideki tüm sayfalardaki ürünleri çeker ve bir liste olarak döndürür.
    """
    all_products_in_category = []
    for page_num in range(max_pages):
        # ... search_model ve URL oluşturma kısmı aynı ...
        search_model = {
            "SelectedProperties": [], "SelectedPropertyGroups": [], "AllProp": False, "PageNumber": page_num,
            "VisibleProductCount": "36", "SearchTextInProducts": "", "Categories": [category_id],
            "CategoriesLevel4": [], "CategoriesLevel2": [], "Brands": [], "PropertyGroups": [], "Properties": [],
            "StoragePlace": "2001", "Sorting": "en-dusuk-fiyat", "IsStockOnly": False, "AllStoragePlaces": False,
            "WithPropertiesAggregation": False, "WithPropertyGroupAggregation": False, "SearchCategoryId": category_id,
            "MaxPrice": {"Price": 0, "SelectedPrice": 0, "Currency": ""},
            "MinPrice": {"Price": 0, "SelectedPrice": 0, "Currency": ""},
            "IsSubscription": "false", "IsN11": False
        }

        url = f"{BASE_URL}Product/Index?searchModel={urllib.parse.quote(json.dumps(search_model, ensure_ascii=False))}"
        page.goto(url)
        page.wait_for_load_state("networkidle")

        product_divs = page.locator("div.product-list__item.grid-item")
        count = product_divs.count()

        if count == 0:
            print(f"⛔️ Kategori {category_id}, Sayfa {page_num}: ürün yok, bu kategori bitti.")
            break

        products_on_page = []
        for i in range(count):
            try:
                link_tag = product_divs.nth(i).locator("h5 a")
                product_name = link_tag.inner_text().strip()
                product_url_absolute = urljoin(BASE_URL, link_tag.get_attribute("href"))
                product_id = parse_qs(urlparse(product_url_absolute).query).get("ProductId", [None])[0]

                # --- FİYAT ALMA BÖLÜMÜ GÜNCELLENDİ ---
                price_value = 0.0
                currency = None # YENİ: Currency için değişken
                
                price_tag = product_divs.nth(i).locator("strong.fiyatTooltip.pointer")
                if price_tag.count() > 0:
                    # Sayısal değeri al (Mevcut mantık)
                    data_price = price_tag.first.get_attribute("data-price")
                    if data_price:
                        price_value = float(data_price.replace(",", "."))
                    
                    # YENİ: Para birimini al
                    currency = price_tag.first.get_attribute("data-currency")

                stock_divs = product_divs.nth(i).locator("span.stock-status")
                stock_info = " | ".join([
                    stock_divs.nth(j).inner_text().strip() for j in range(stock_divs.count())
                ]) if stock_divs.count() > 0 else "Belirtilmemiş"

                # DEĞİŞTİ: Append edilen sözlük güncellendi
                products_on_page.append({
                    "product_id": product_id,
                    "name": product_name,
                    "url": product_url_absolute,
                    "category_id": category_id,
                    "price": price_value,        # Karşılaştırma için sayısal fiyat
                    "currency": currency,        # YENİ: Para birimi
                    "stock_info": stock_info,
                    "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
                    # KALDIRILDI: price_display ve price_str alanları silindi
                })
            except Exception as e:
                print(f"⚠️ Ürün ayrıştırma hatası (Kategori {category_id}, Sayfa {page_num}): {e}")
        
        print(f"✅ Kategori {category_id}, Sayfa {page_num}: {len(products_on_page)} ürün bulundu.")
        all_products_in_category.extend(products_on_page)

        time.sleep(1)
    
    return all_products_in_category

# --- Ana Çalıştırma Fonksiyonu ---
def run_scraper():
    print("🚀 Bayinet Scraper başlıyor...")

    with sync_playwright() as p:
        page = manual_login_and_get_session(p)

        print("✅ Oturum hazır, scraping başlıyor...")
        # Kategori ID'lerini 01'den 51'e (52 dahil değil) kadar çeker
        for i in range(1, 52): 
            category_id = f"{i:02d}"
            print(f"\n📂 Kategori {category_id} çekiliyor...")
            
            # 1. Adım: O kategorideki TÜM ürünleri çek
            products_from_category = scrape_all_pages(page, category_id)
            
            # 2. Adım: Çekilen ürünleri, last_price mantığını içeren fonksiyona gönder
            if products_from_category:
                print(f"💾 {category_id} kategorisinden {len(products_from_category)} ürün DB'ye yazılmak üzere gönderiliyor...")
                save_products_to_supabase(products_from_category)
            else:
                print(f"ℹ️ {category_id} kategorisinden hiç ürün çekilemedi.")

        print("\n✅ Scraping tamamlandı.")

# --- Script'in Başlangıç Noktası ---
if __name__ == "__main__":
    run_scraper()