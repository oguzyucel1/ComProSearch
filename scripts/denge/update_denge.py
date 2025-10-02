import os
import re
import time
import shutil
import json # urllib.parse ile kullanılmak üzere
import pandas as pd
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
OTP_TABLE = "sms_codes"
BASE_URL = "https://www.edenge.com.tr"
DOWNLOAD_DIR = "downloads"
TIMEOUT_SECONDS = 180

if not EMAIL or not PASSWORD:
    raise RuntimeError("🚨 .env dosyasında DENGE_EMAIL ve DENGE_PASSWORD tanımlı olmalı!")

# --- Supabase OTP Yönetimi (Bayinet'ten taşındı) ---
def get_and_clear_otp(timeout=TIMEOUT_SECONDS, poll_interval=5):
    """
    Supabase'den OTP'yi bekleyerek çeker ve veritabanından siler (Polling).
    """
    start_time = time.time()
    
    print(f"⏳ {timeout} saniye boyunca DB'den OTP bekleniyor (Tablo: {OTP_TABLE})...")

    while time.time() - start_time < timeout:
        try:
            # 1. Kontrol: En yeni OTP var mı? (Tarihe göre veya ID'ye göre sıralama eklenebilir)
            response = supabase.table(OTP_TABLE).select("otp_code").limit(1).execute()
            
            if response.data and response.data[0] and response.data[0].get("otp_code"):
                otp_code = response.data[0]["otp_code"]
                print(f"✅ OTP bulundu. ({int(time.time() - start_time)} saniye bekleme)")

                # 2. Temizlik: OTP'yi veritabanından hemen sil
                # OTP'nin tek kullanımlık olması için temizlik kritik
                delete_response = supabase.table(OTP_TABLE).delete().eq("otp_code", otp_code).execute()
                print(f"🗑️ OTP veritabanından silindi. Silinen satır sayısı: {len(delete_response.data)}")

                return otp_code
            
        except Exception as e:
            print(f"⚠️ Supabase OTP sorgu/silme hatası: {e}")
            
        time.sleep(poll_interval)
        
    raise TimeoutError(f"🚨 OTP {timeout} saniye içinde Supabase'e yazılmadı, işlem iptal edildi.")

# --- Supabase kayıt (Aynı kaldı) ---
def save_products_to_supabase(products, batch_size=50):
    if not products or not supabase:
        print("❌ Supabase client eksik veya ürün listesi boş. Kayıt atlandı.")
        return

    # Tekrar deneme mantığı ile upsert
    for i in range(0, len(products), batch_size):
        chunk = products[i:i+batch_size]
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

# --- Excel parse (Aynı kaldı, iyi durumda) ---
def parse_excel(file_path, category_name):
    # ... (Fonksiyon içeriği aynı kalır, mükemmel çalışıyor)
    try:
        # Excel'i HTML tablosu olarak okuma (e-denge'nin .xls formatı için doğru bir yaklaşımdır)
        dfs = pd.read_html(file_path, header=2)
        df = dfs[0]
        print(f"✅ {file_path} HTML tablodan okundu")
    except Exception as e:
        print(f"❌ Tablo okunamadı: {file_path}, hata: {e}")
        return []

    # Sadece gerekli sütunları koru
    df = df[["Açıklama", "Özel Fiyat", "Sk Fiyat", "PB", "Stok"]].copy()

    def clean_price(x):
        if pd.isna(x):
            return None
        # TL formatını (1.000,00) İngilizce/Float formatına (1000.00) çevir
        s = str(x).replace(".", "").replace(",", ".")
        s = "".join(ch for ch in s if (ch.isdigit() or ch == "."))
        try:
            return float(s)
        except:
            return None

    df["Özel Fiyat"] = df["Özel Fiyat"].apply(clean_price)
    df["Sk Fiyat"] = df["Sk Fiyat"].apply(clean_price)

    products = []
    for _, row in df.iterrows():
        name = str(row["Açıklama"]) if pd.notna(row["Açıklama"]) else "Unknown"
        # product_id oluşturma: Temizlenmiş ürün adının ilk 50 karakteri
        # Not: Gerçek bir ürün ID'si kullanılamadığı için bu mantık geçerlidir
        product_id = re.sub(r"[^a-zA-Z0-9]", "_", name)[:50]

        products.append({
            "product_id": product_id,
            "name": name,
            "special_price": row["Özel Fiyat"],
            "list_price": row["Sk Fiyat"],
            "currency": row["PB"],
            "stock_info": row["Stok"],
            "category": category_name,
            "marketplace": "edenge",
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
        })
    return products

# --- Login + Otomatik OTP (Revize Edildi) ---
def eden_login(p):
    # ⚙️ Headless: Otomasyon sunucusu için True olmalı
    browser = p.chromium.launch(headless=True, slow_mo=50) 
    context = browser.new_context(
        accept_downloads=True,
        # Bot Tespiti Önleme
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    )
    page = context.new_page()
    # 🌟 JavaScript Enjeksiyonu: navigator.webdriver özelliğini gizle
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")

    page.goto(f"{BASE_URL}/Account/Login")
    page.wait_for_selector("#username_", timeout=20000)

    # Email & şifre doldur
    page.fill("#username_", EMAIL)
    page.fill("#password_", PASSWORD)
    print("✅ E-Posta ve Şifre dolduruldu")

    # Giriş yap
    page.click("button[type='submit']")
    print("🚀 Giriş butonuna tıklandı, OTP ekranı bekleniyor...")

    # 🔥 OTP inputunu bekle ve otomatik kod çek
    page.wait_for_selector("#smscode", timeout=60000)

    # 🎉 Otomatik OTP Çekme
    try:
        otp_code = get_and_clear_otp(timeout=TIMEOUT_SECONDS)
    except TimeoutError as e:
        browser.close()
        raise e 
    
    # OTP'yi doldur
    page.fill("#smscode", otp_code)
    print(f"✅ OTP kodu ({len(otp_code)} hane) Supabase'den çekilip dolduruldu.")

    # 🔹 'Bu Tarayıcıya Güvenme' seçeneği (Her zaman OTP sorulmasını garantiler)
    try:
        # Güvenilir olmayan seçeneği zorla seç
        page.check("input[name='IsTrusted'][value='false']", force=True)
        print("☑️ 'Bu Tarayıcıya Güvenme' force seçildi.")
    except Exception:
        # Nadir de olsa bu site, radio butonu yerine label click gerektirebilir
        page.click("label:has-text('Bu Tarayıcıya Güvenme')", force=True)
        print("☑️ 'Bu Tarayıcıya Güvenme' label click ile seçildi.")


    # 🔹 Devam et butonu
    try:
        page.wait_for_selector("button.button-1[type='submit']", timeout=10000)
        page.click("button.button-1[type='submit']", force=True)
        print("▶️ Devam et tıklandı.")
    except Exception as e:
        # Fallback: formu JS ile submit et
        try:
            page.evaluate("document.querySelector('form#js_submit').submit()")
            print("▶️ Form JS ile submit edildi (fallback).")
        except Exception as e:
            print("❌ Form submit edilemedi, tarayıcı kapatılıyor:", e)
            browser.close()
            raise

    # Ana sayfa yüklendiğinde, kategori linklerinden birini bekle
    page.wait_for_selector("a.navigation-categories-item-title", timeout=60000)
    print("🏁 Ana sayfa yüklendi, oturum hazır:", page.url)

    return page, browser


# --- Main scraper (Aynı mantık, daha iyi hata yönetimi) ---
def run_scraper():
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    print("🚀 Edenge Scraper başlıyor...")

    try:
        with sync_playwright() as p:
            page, browser = eden_login(p)

            # Kategori linklerini çek
            category_elems = page.query_selector_all("a.navigation-categories-item-title")
            categories = []
            for elem in category_elems:
                href = elem.get_attribute("href")
                name = elem.inner_text().strip()
                if href and name:
                    categories.append((name, urljoin(BASE_URL, href)))
            print(f"🔎 {len(categories)} kategori bulundu.")

            # Kategori bazlı scraping
            for i, (cat_name, cat_url) in enumerate(categories, start=1):
                print(f"\n➡️ {i}/{len(categories)}. Kategori: {cat_name}")

                try:
                    # Sayfaya git ve ağın boşalmasını bekle
                    page.goto(cat_url, wait_until="networkidle", timeout=60000)

                    excel_btn = page.query_selector("a.js_exportexcel")
                    if not excel_btn:
                        print(f"❌ Kategori {cat_name} için Excel butonu bulunamadı, atlanıyor.")
                        continue

                    # İndirme işlemini bekle
                    with page.expect_download(timeout=120000) as dl_info:
                        excel_btn.click()
                    download = dl_info.value

                    # Dosyayı kaydet ve ismini güvenli hale getir
                    safe_name = re.sub(r"[\\/:\*\?\"<>\|]", "_", cat_name)[:80]
                    file_path = os.path.join(DOWNLOAD_DIR, f"{i}_{safe_name}.xls")
                    download.save_as(file_path)
                    print(f"⬇️ Excel indirildi: {file_path}")

                    # Veriyi parse et ve Supabase'e kaydet
                    products = parse_excel(file_path, cat_name)
                    save_products_to_supabase(products)

                except Exception as e:
                    print(f"🚨 Kategori {cat_name} işlenirken hata oluştu: {e}")
                    # Hata olsa bile diğer kategorilere geçmeye devam et

            browser.close()

    except Exception as e:
        print(f"🔥🔥 Kritik hata, tarayıcı başlatılamadı veya oturum açılamadı: {e}")
        # Tarayıcının bu noktada kapalı olması beklenir, ama yine de cleanup yapılabilir.
    finally:
        # Cleanup
        try:
            shutil.rmtree(DOWNLOAD_DIR)
            print("\n🗑️ İndirilen Excel dosyaları klasörü silindi.")
        except Exception as e:
            print(f"⚠️ Klasör silinemedi: {e}")


if __name__ == "__main__":
    run_scraper()