import time
import urllib.parse
import json
import os
from urllib.parse import urljoin, urlparse, parse_qs
from playwright.sync_api import sync_playwright
# scripts.shared.supabase_client dosyasının var olduğunu varsayıyoruz
from scripts.shared.supabase_client import supabase 

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
            # 1. Kontrol: OTP var mı?
            response = supabase.table(OTP_TABLE).select("otp_code").limit(1).execute()
            
            if response.data and response.data[0] and response.data[0].get("otp_code"):
                otp_code = response.data[0]["otp_code"]
                print(f"✅ OTP bulundu. ({int(time.time() - start_time)} saniye bekleme)")

                # 2. Temizlik: OTP'yi veritabanından hemen sil
                delete_response = supabase.table(OTP_TABLE).delete().eq("otp_code", otp_code).execute()
                print(f"🗑️ OTP veritabanından silindi. Silinen satır sayısı: {len(delete_response.data)}")

                return otp_code
            
        except Exception as e:
            print(f"⚠️ Supabase OTP sorgu/silme hatası: {e}")
            
        time.sleep(poll_interval)
        
    raise TimeoutError(f"🚨 OTP {timeout} saniye içinde girilmedi, işlem iptal edildi.")

# --- Supabase Ürün Kaydı ---
def save_products_to_supabase(products, batch_size=50):
    if not products or not supabase:
        print("❌ Supabase client eksik veya ürün listesi boş. Kayıt atlandı.")
        return

    # Tek seferlik upsert işlemi (scrape_all_pages içinde zaten yapılıyor)
    # Eğer bu fonksiyonu kullanacaksanız, chunk mantığını burada bırakıyoruz.
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

# --- Playwright ile Oturum Açma (En Kritik Kısım) ---
def manual_login_and_get_session(p):
    CUSTOMER_CODE = os.getenv("BAYINET_CUSTOMER_CODE")
    EMAIL = os.getenv("BAYINET_EMAIL")
    PASSWORD = os.getenv("BAYINET_PASSWORD")

    if not all([CUSTOMER_CODE, EMAIL, PASSWORD]):
        raise RuntimeError("🚨 Giriş bilgileri eksik (env BAYINET_CUSTOMER_CODE, EMAIL, PASSWORD)!")

    # 🎉 Bot Tespiti Atlama Argümanları
    launch_args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled' 
    ]

    # Başlatma Ayarları (Headless kalmalı!)
    browser = p.chromium.launch(
        headless=True, 
        slow_mo=50,
        args=launch_args
    )
    
    # Context Ayarları (Kullanıcı gibi görünmek için)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        viewport={"width": 1366, "height": 768}
    )
    
    page = context.new_page()
    
    # 🌟 JavaScript Enjeksiyonu: navigator.webdriver özelliğini gizle
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")

    print(f"➡️ {BASE_URL}Login adresine gidiliyor...")
    page.goto(
        f"{BASE_URL}Login", 
        wait_until="domcontentloaded", 
        timeout=60000 
    )

    # Ağ işlemlerinin durmasını bekle
    page.wait_for_load_state("networkidle", timeout=30000) 

    print("➡️ Login formu yükleniyor (Ağ boşta)...") 
    
    try:
        # 🔥 En güvenilir locator: Placeholder metnine göre bekleme ve doldurma
        # Bu, önceki hataları atlatmalıdır.
        musteri_kodu_input = page.get_by_placeholder("Müşteri Kodu").first

        # İlk input'un görünmesini beklemek için bunu zorlayabiliriz.
        musteri_kodu_input.wait_for(timeout=20000)
        print("✅ Placeholder ile ilk input bulundu.")

        # Doldurma işlemleri (.fill() kullanarak)
        musteri_kodu_input.fill(CUSTOMER_CODE) 
        page.get_by_placeholder("E-Posta veya telefon numarası").first.fill(EMAIL) 
        page.get_by_placeholder("Şifre").first.fill(PASSWORD) 

        print("✅ Giriş bilgileri dolduruldu.")

    except Exception as e:
        # Hata ayıklama için ekran görüntüsü alın
        page.screenshot(path="login_form_timeout.png")
        print(f"🚨 Login formu yüklenemedi. 'login_form_timeout.png' dosyasını kontrol edin. Hata: {e}")
        # Tarayıcıyı kapatıp hatayı yükseltin
        browser.close()
        raise

    # Giriş Yap
    page.locator("button:has-text('Giriş Yap')").click()
    page.wait_for_load_state("networkidle")
    print("➡️ Giriş yapıldı, OTP ekranı bekleniyor...")

    # OTP ekranı yüklendiğinde, UI'dan girişi bekle
    page.wait_for_selector("div.css-1phe0ka input", timeout=120000)
    print("✨ OTP Giriş Ekranı Yüklendi. DB'den kod çekiliyor.")

    # 🔥 DB'den OTP'yi bekle ve çek
    try:
        otp_code = get_and_clear_otp(timeout=180, poll_interval=5)
    except TimeoutError as e:
        browser.close()
        raise e 
    
    # OTP'yi Playwright ile giriş alanlarına parse et
    otp_inputs = page.locator("div.css-1phe0ka input")
    
    for i, digit in enumerate(otp_code):
        if i < otp_inputs.count():
             otp_inputs.nth(i).fill(digit) 

    print("✅ OTP kodu Playwright ile dolduruldu.")

    # Doğrula
    page.locator("button:has-text('Doğrula')").click()
    page.wait_for_load_state("networkidle", timeout=60000) # Doğrulama için daha uzun bekle
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

# --- Scraper (Playwright DOM tabanlı) ---
def scrape_all_pages(page, category_id, max_pages=200):
    for page_num in range(max_pages):
        # search_model aynı kalır
        search_model = {
            # ... (model içeriği aynı)
            "PageNumber": page_num,
            "Categories": [category_id],
            # ... (geri kalan model içeriği)
        }

        # URL encoding ve goto işlemi
        url = f"{BASE_URL}Product/Index?searchModel={urllib.parse.quote(json.dumps(search_model, ensure_ascii=False))}"
        page.goto(url)
        page.wait_for_load_state("networkidle")

        # Ürün ayrıştırma mantığı aynı kalır, ancak hata durumunda browser.close() olmamalı.

        product_divs = page.locator("div.product-list__item.grid-item")
        count = product_divs.count()

        if count == 0:
            print(f"⛔️ Kategori {category_id}, Sayfa {page_num}: ürün yok, durdu.")
            break

        products = []
        for i in range(count):
            try:
                # ... (Ürün verisi çekme ve products listesine ekleme mantığı aynı)
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

        # Tek seferde DB'ye yaz
        try:
            # save_products_to_supabase yerine doğrudan upsert işlemi
            data = supabase.table("bayinet_products").upsert(products, on_conflict="product_id").execute()
            print(f"💾 DB'ye {len(data.data)} ürün yazıldı (Kategori {category_id}, Sayfa {page_num})")
        except Exception as e:
            print(f"❌ DB kaydı hatası (Kategori {category_id}, Sayfa {page_num}): {e}")

        time.sleep(1)


# --- Main ---
def run_scraper():
    print("🚀 Bayinet Scraper başlıyor...")

    with sync_playwright() as p:
        page = manual_login_and_get_session(p)

        print("✅ Oturum hazır, scraping başlıyor...")
        # Kategori ID'lerini 01'den 51'e (52 dahil değil) kadar çeker
        for i in range(1, 52): 
            category_id = f"{i:02d}"
            print(f"\n📂 Kategori {category_id} çekiliyor...")
            scrape_all_pages(page, category_id)

        print("✅ Scraping tamamlandı.")

if __name__ == "__main__":
    run_scraper()