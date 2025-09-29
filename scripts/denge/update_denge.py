import os
import re
import time
import shutil
import pandas as pd
from urllib.parse import urljoin
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
from scripts.shared.supabase_client import supabase

load_dotenv()

EMAIL = os.getenv("DENGE_EMAIL")
PASSWORD = os.getenv("DENGE_PASSWORD")

if not EMAIL or not PASSWORD:
    raise RuntimeError("🚨 .env dosyasında DENGE_EMAIL ve DENGE_PASSWORD tanımlı olmalı!")

BASE_URL = "https://www.edenge.com.tr"
DOWNLOAD_DIR = "downloads"

# --- Supabase kayıt ---
def save_products_to_supabase(products, batch_size=50):
    if not products or not supabase:
        print("❌ Supabase client eksik veya ürün listesi boş. Kayıt atlandı.")
        return

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

# --- Excel parse ---
def parse_excel(file_path, category_name):
    try:
        dfs = pd.read_html(file_path, header=2)
        df = dfs[0]
        print(f"✅ {file_path} HTML tablodan okundu")
    except Exception as e:
        print(f"❌ Tablo okunamadı: {file_path}, hata: {e}")
        return []

    df = df[["Açıklama", "Özel Fiyat", "Sk Fiyat", "PB", "Stok"]].copy()

    def clean_price(x):
        if pd.isna(x):
            return None
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


# --- Login + OTP ---
def eden_login(p):
    browser = p.chromium.launch(headless=False, slow_mo=80)
    context = browser.new_context(accept_downloads=True)
    page = context.new_page()

    page.goto(f"{BASE_URL}/Account/Login")
    page.wait_for_selector("#username_", timeout=10000)

    # Email & şifre doldur
    page.fill("#username_", EMAIL)
    page.fill("#password_", PASSWORD)
    print("✅ E-Posta ve Şifre dolduruldu")

    # Giriş yap
    page.click("button[type='submit']")
    print("🚀 Giriş butonuna tıklandı, OTP ekranı bekleniyor...")

        # OTP inputunu bekle
    page.wait_for_selector("#smscode", timeout=60000)

    otp_code = input("🔑 OTP kodunu gir (6 hane): ").strip()
    page.fill("#smscode", otp_code)
    print("✅ OTP kodu dolduruldu")

    # 🔹 Radio label üzerinden tıkla (Bu Tarayıcıya Güvenme)
    try:
        page.click("label:has-text('Bu Tarayıcıya Güvenme')", timeout=5000)
        print("☑️ 'Bu Tarayıcıya Güvenme' seçildi (label click)")
    except Exception:
        # fallback: checked = true
        radio = page.query_selector("input[name='IsTrusted'][value='false']")
        if radio:
            page.evaluate("el => el.checked = true", radio)
            print("☑️ 'Bu Tarayıcıya Güvenme' force seçildi (JS)")

    # 🔹 Devam et → önce normal click, sonra fallback submit
    try:
        page.wait_for_selector("button.button-1[type='submit']", timeout=5000)
        page.click("button.button-1[type='submit']", force=True)
        print("▶️ Devam et tıklandı")
        # küçük bekleme, çalışmazsa fallback çalışacak
        page.wait_for_timeout(2000)
    except Exception:
        print("⚠️ Devam Et click olmadı, fallback'e geçiliyor")

    # 🔹 Fallback: formu submit et
    try:
        page.evaluate("document.querySelector('form#js_submit').submit()")
        print("▶️ Form JS ile submit edildi (fallback)")
    except Exception as e:
        print("❌ Form submit edilemedi:", e)

    # Ana sayfa bekle
    page.wait_for_selector("a.navigation-categories-item-title", timeout=60000)
    print("🏁 Ana sayfa yüklendi:", page.url)


    return page, browser


# --- Main scraper ---
def run_scraper():
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    print("🚀 Edenge Scraper başlıyor...")

    with sync_playwright() as p:
        page, browser = eden_login(p)

        # Kategori linkleri
        category_elems = page.query_selector_all("a.navigation-categories-item-title")
        categories = []
        for elem in category_elems:
            href = elem.get_attribute("href")
            name = elem.inner_text().strip()
            if href:
                categories.append((name, urljoin(BASE_URL, href)))
        print(f"🔎 {len(categories)} kategori bulundu")

        # Kategori bazlı scraping
        for i, (cat_name, cat_url) in enumerate(categories, start=1):
            print(f"\n➡️ {i}. Kategori: {cat_name}")

            page.goto(cat_url)
            page.wait_for_load_state("networkidle")

            excel_btn = page.query_selector("a.js_exportexcel")
            if not excel_btn:
                print("❌ Excel butonu bulunamadı")
                continue

            with page.expect_download() as dl_info:
                excel_btn.click()
            download = dl_info.value

            safe_name = re.sub(r"[\\/:\*\?\"<>\|]", "_", cat_name)[:80]
            file_path = os.path.join(DOWNLOAD_DIR, f"{i}_{safe_name}.xls")
            download.save_as(file_path)
            print(f"⬇️ Excel indirildi: {file_path}")

            products = parse_excel(file_path, cat_name)
            save_products_to_supabase(products)

            page.goto(BASE_URL)

        browser.close()

    # Cleanup
    try:
        shutil.rmtree(DOWNLOAD_DIR)
        print("🗑️ İndirilen Excel dosyaları silindi.")
    except Exception as e:
        print(f"⚠️ Klasör silinemedi: {e}")


if __name__ == "__main__":
    run_scraper()
