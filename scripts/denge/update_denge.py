import os
import re
import time
import json
from urllib.parse import urljoin
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
# scripts.shared.supabase_client dosyasının var olduğunu varsayıyoruz
from scripts.shared.supabase_client import supabase 

# Ortam değişkenlerini yükle
load_dotenv()

# --- Sabitler ve Ayarlar ---
EMAIL = os.getenv("DENGE_EMAIL")
PASSWORD = os.getenv("DENGE_PASSWORD")
# YENİ: Proxy URL'sini ortam değişkeninden oku
PROXY_URL = os.getenv("TR_PROXY_URL") 
OTP_TABLE = "sms_codes"
BASE_URL = "https://www.edenge.com.tr"
TIMEOUT_SECONDS = 180

if not EMAIL or not PASSWORD:
    raise RuntimeError("🚨 .env dosyasında DENGE_EMAIL ve DENGE_PASSWORD tanımlı olmalı!")

# --- Helper Fonksiyon: Fiyat Temizleme (Değişiklik yok) ---
def clean_price(price_str):
    if not price_str:
        return None
    try:
        cleaned_str = str(price_str).replace(".", "").replace(",", ".")
        return float(re.sub(r"[^\d.]", "", cleaned_str))
    except (ValueError, TypeError):
        return None

# --- Supabase OTP Yönetimi (Değişiklik yok) ---
def get_and_clear_otp(timeout=TIMEOUT_SECONDS, poll_interval=5):
    # ... (Bu fonksiyonun içeriği aynı kalmıştır)
    start_time = time.time()
    print(f"⏳ {timeout} saniye boyunca DB'den OTP bekleniyor (Tablo: {OTP_TABLE})...")
    while time.time() - start_time < timeout:
        try:
            response = supabase.table(OTP_TABLE).select("otp_code").order("created_at", desc=True).limit(1).execute()
            if response.data and response.data[0] and response.data[0].get("otp_code"):
                otp_code = response.data[0]["otp_code"]
                print(f"✅ OTP bulundu. ({int(time.time() - start_time)} saniye bekleme)")
                delete_response = supabase.table(OTP_TABLE).delete().eq("otp_code", otp_code).execute()
                print(f"🗑️ OTP veritabanından silindi. Silinen satır sayısı: {len(delete_response.data)}")
                return otp_code
        except Exception as e:
            print(f"⚠️ Supabase OTP sorgu/silme hatası: {e}")
        time.sleep(poll_interval)
    raise TimeoutError(f"🚨 OTP {timeout} saniye içinde Supabase'e yazılmadı, işlem iptal edildi.")


# --- Supabase kayıt (Fiyat Geçmişi ile) - YENİ VE VERİMLİ VERSİYON ---
# --- Supabase kayıt (Fiyat Geçmişi ile) - GÜNCELLENMİŞ VE DÜZELTİLMİŞ VERSİYON ---
def save_products_to_supabase(products, batch_size=50):
    """
    Sadece yeni veya fiyatı değişen ürünleri DB'ye yazar.
    Okuma işlemini de büyük veri setleri için parçalara böler.
    """
    if not products or not supabase:
        print("❌ Supabase client eksik veya ürün listesi boş. Kayıt atlandı.")
        return

    product_ids = [p["product_id"] for p in products if p.get("product_id")]
    existing_products = {}
    
    # Adım 1: Mevcut ürünlerin fiyat bilgilerini DB'den verimli şekilde çek
    SELECT_CHUNK_SIZE = 900
    if product_ids:
        print(f"📊 DB'den {len(product_ids)} ürünün mevcut durumu sorgulanacak...")
        for i in range(0, len(product_ids), SELECT_CHUNK_SIZE):
            id_chunk = product_ids[i:i + SELECT_CHUNK_SIZE]
            try:
                response = supabase.table("denge_products").select("product_id,special_price").in_("product_id", id_chunk).execute()
                for item in response.data:
                    existing_products[item["product_id"]] = item
                print(f"   -> {len(response.data)} mevcut ürün bilgisi alındı (grup {i//SELECT_CHUNK_SIZE + 1}).")
            except Exception as e:
                print(f"⚠️ Mevcut ürünler çekilirken hata (grup {i//SELECT_CHUNK_SIZE + 1}): {e}")
        print(f"✅ Toplam {len(existing_products)} mevcut ürün bilgisi başarıyla alındı.")

    # Adım 2: Sadece güncellenecek veya eklenecek ürünleri belirle
    products_to_upsert = []
    print("\n🔍 Değişiklikler kontrol ediliyor...")
    for p in products:
        product_id = p.get("product_id")
        if not product_id:
            continue

        # Durum 1: Ürün veritabanında yok (YENİ ÜRÜN)
        if product_id not in existing_products:
            print(f"✨ Yeni ürün bulundu: {p['name'][:60]}...")
            # ÇÖZÜM: Yeni ürüne de 'last_price' alanını None olarak ekliyoruz.
            p['last_price'] = None
            products_to_upsert.append(p)
            continue
        
        # Durum 2: Ürün veritabanında var, fiyatları karşılaştır
        old_price = existing_products[product_id].get("special_price")
        new_price = p.get("special_price")

        if old_price is not None and new_price is not None and old_price != new_price:
            p['last_price'] = old_price
            print(f"💰 Fiyat Değişti: {p['name'][:60]}... | Eski: {old_price} -> Yeni: {new_price}")
            products_to_upsert.append(p)

    # Adım 3: Sadece filtrelenmiş listeyi veritabanına yaz
    if not products_to_upsert:
        print("\n✅ Veritabanı güncel. Bu kategoride değişiklik veya yeni ürün bulunamadı.")
        return
        
    print(f"\n💾 Toplam {len(products_to_upsert)} üründe değişiklik tespit edildi. Veritabanı güncelleniyor...")
    for i in range(0, len(products_to_upsert), batch_size):
        chunk = products_to_upsert[i:i+batch_size]
        for attempt in range(3):
            try:
                data = (
                    supabase.table("denge_products")
                    .upsert(chunk, on_conflict="product_id")
                    .execute()
                )
                print(f"✅ DB'ye {len(data.data)} ürün yazıldı (chunk {i//batch_size+1})")
                break
            except Exception as e:
                print(f"⚠️ Supabase error (chunk {i//batch_size+1}), retry {attempt+1}/3: {e}")
                time.sleep(5)

# --- Login + Otomatik OTP (Proxy Ayarı Eklendi) ---
# GÜNCELLENDİ: Fonksiyon artık proxy_settings parametresi alıyor
def eden_login(p, proxy_settings=None):
    launch_options = {
        "headless": True,
        "slow_mo": 50
    }
    # YENİ: Eğer proxy ayarı varsa, başlatma seçeneklerine ekle
    if proxy_settings:
        launch_options["proxy"] = proxy_settings
        print("🚀 Tarayıcı proxy ile başlatılıyor...")
    
    browser = p.chromium.launch(**launch_options)
    context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
    page = context.new_page()
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")
    
    print("➡️ Giriş sayfasına gidiliyor...")
    page.goto(f"{BASE_URL}/Account/Login", wait_until="networkidle", timeout=60000)
    
    page.wait_for_selector("#username_", timeout=20000)
    page.fill("#username_", EMAIL)
    page.fill("#password_", PASSWORD)
    print("✅ E-Posta ve Şifre dolduruldu.")
    
    page.click("button[type='submit']")
    print("🚀 Giriş butonuna tıklandı, ana sayfanın yüklenmesi bekleniyor...")

    page.wait_for_selector("a.navigation-categories-item-title", timeout=60000)
    print("🏁 Ana sayfa yüklendi, oturum hazır:", page.url)
    
    return page, browser

# --- ANA SCRAPER FONKSİYONU (Değişiklik yok) ---
def scrape_category(page, category_name):
    # ... (Bu fonksiyonun içeriği aynı kalmıştır)
    all_products = []
    page_count = 1
    while True:
        print(f"📄 '{category_name}' kategorisi, sayfa {page_count} taranıyor...")
        page.wait_for_selector(".table-row.js_basket_parents", timeout=30000)
        product_rows = page.query_selector_all(".table-row.js_basket_parents")
        print(f"   -> Bu sayfada {len(product_rows)} ürün bulundu.")
        for row in product_rows:
            try:
                product_id = row.query_selector("input[name='cbxitem']").get_attribute("data-pid")
                name = row.query_selector(".title-cell h4").inner_text().strip()
                url_element = row.query_selector(".product-figure a")
                relative_url = url_element.get_attribute("href") if url_element else None
                stock = row.query_selector(".stock-status .stock").inner_text().strip()
                special_price_element = row.query_selector(".price-cell:not(.price-cell-last) .price")
                special_price_raw = special_price_element.get_attribute("data-pprice") if special_price_element else None
                list_price_element = row.query_selector(".price-cell-last .price")
                list_price_raw = list_price_element.get_attribute("data-pprice") if list_price_element else None
                currency_element = row.query_selector(".currency")
                currency = currency_element.inner_text().strip() if currency_element else "$"
                all_products.append({
                    "product_id": f"denge_{product_id}",
                    "name": name,
                    "special_price": clean_price(special_price_raw),
                    "list_price": clean_price(list_price_raw),
                    "currency": currency,
                    "stock_info": stock,
                    "category": category_name,
                    "url": urljoin(BASE_URL, relative_url) if relative_url else None,
                    "marketplace": "edenge",
                    "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
                })
            except Exception as e:
                print(f"⚠️ Bir ürün satırı işlenirken hata oluştu, atlanıyor: {e}")
        next_page_button = page.query_selector("a.js_pagelink[rel='next']")
        if next_page_button:
            print("   -> Sonraki sayfa butonuna tıklandı.")
            next_page_button.click()
            page.wait_for_load_state("networkidle", timeout=60000)
            page_count += 1
        else:
            print(f"🏁 '{category_name}' kategorisi için son sayfaya ulaşıldı. Toplam {len(all_products)} ürün çekildi.")
            break
    return all_products

# --- ANA ÇALIŞTIRMA BLOĞU (Proxy Ayarı Eklendi) ---
# --- ANA ÇALIŞTIRMA BLOĞU (Tekilleştirme Adımı Eklendi) ---
def run_scraper():
    print("🚀 Edenge Scraper (Doğrudan Veri Çekme Modu) başlıyor...")
    
    proxy_config = None
    if PROXY_URL:
        proxy_config = {"server": PROXY_URL}
        proxy_host = PROXY_URL.split('@')[-1] if '@' in PROXY_URL else PROXY_URL
        print(f"✅ Proxy yapılandırıldı: {proxy_host}")
    else:
        print("ℹ️ Proxy ayarı (TR_PROXY_URL) bulunamadı. Direkt bağlantı kullanılacak.")

    try:
        with sync_playwright() as p:
            page, browser = eden_login(p, proxy_settings=proxy_config)
            
            category_elems = page.query_selector_all("a.navigation-categories-item-title")
            categories = []
            for elem in category_elems:
                href = elem.get_attribute("href")
                name = elem.inner_text().strip()
                if href and name:
                    categories.append((name, urljoin(BASE_URL, href)))
            
            print(f"🔎 {len(categories)} kategori bulundu.")
            for i, (cat_name, cat_url) in enumerate(categories, start=1):
                print(f"\n➡️ {i}/{len(categories)}. Kategori Başlatılıyor: {cat_name}")
                try:
                    page.goto(cat_url, wait_until="networkidle", timeout=60000)
                    
                    # 1. Scraper'dan ürünleri çek
                    products = scrape_category(page, cat_name)
                    
                    # --- YENİ: TEKİLLEŞTİRME ADIMI ---
                    if products:
                        print(f"   -> Tekilleştirme öncesi ürün sayısı: {len(products)}")
                        unique_products = {}
                        for product in products:
                            # Her bir ürünü product_id'yi anahtar olarak kullanarak bir sözlüğe ekle.
                            # Eğer aynı product_id tekrar gelirse, eski kaydın üzerine yazar.
                            # Bu, listedeki son görülen ürünün geçerli olmasını sağlar.
                            unique_products[product['product_id']] = product
                        
                        # Sözlüğün değerlerini (tekilleştirilmiş ürünleri) tekrar bir listeye çevir.
                        products = list(unique_products.values())
                        print(f"   -> Tekilleştirme sonrası ürün sayısı: {len(products)}")
                    # --- TEKİLLEŞTİRME ADIMI SONU ---

                    if products:
                        # 2. Sadece tekilleştirilmiş listeyi veritabanına gönder
                        save_products_to_supabase(products)
                    else:
                        print(f"ℹ️ '{cat_name}' kategorisinden hiç ürün çekilemedi.")
                except Exception as e:
                    print(f"🚨 Kategori '{cat_name}' işlenirken kritik bir hata oluştu: {e}")
            
            browser.close()
            print("\n✅ Tüm kategoriler başarıyla işlendi. Script tamamlandı.")
    except Exception as e:
        print(f"🔥🔥 Kritik hata, tarayıcı başlatılamadı veya oturum açılamadı: {e}")

if __name__ == "__main__":
    run_scraper()