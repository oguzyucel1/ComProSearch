import re
import time
import random
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup

from scripts.shared.supabase_client import supabase  # ✅ merkezi client import

# --- Sabitler ---
BASE_URL = "https://www.oksid.com.tr"
TIMEOUT = 30
MAX_RETRIES = 3
RETRY_DELAY = (1, 3)  # 1–3 saniye arası bekleme
BATCH_SIZE = 500

# --- Global Session & Headers ---
session = requests.Session()
session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.google.com/",
})


# --- Supabase'e Veri Kaydetme ---
def save_to_supabase(products, job_id: str):
    total = len(products)
    print(f"💾 {total} ürün Supabase'e kaydedilecek...")

    for i in range(0, total, BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]

        for p in batch:
            p["job_id"] = job_id

        try:
            data = supabase.table("oksid_products") \
                .upsert(batch, on_conflict="url") \
                .execute()
            print(f"✅ Batch {i // BATCH_SIZE + 1}: {len(data.data)} ürün yazıldı")
        except Exception as e:
            print(f"⚠️ Batch {i // BATCH_SIZE + 1} hata: {e}")


# --- Yardımcı Fonksiyonlar ---
def fetch_html(url, retries=0):
    """URL'den HTML çeker, blok yememek için headers, session ve random delay kullanır"""
    try:
        time.sleep(random.uniform(*RETRY_DELAY))  # rastgele bekleme
        r = session.get(url, timeout=TIMEOUT)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")

    except requests.exceptions.RequestException as e:
        if retries < MAX_RETRIES:
            print(f"⚠️ Hata: {e}, tekrar deneme {retries + 1}")
            return fetch_html(url, retries + 1)
        else:
            print(f"❌ Maksimum deneme aşıldı: {url}")
            return None


def clean_price(price_text):
    if not price_text:
        return None
    cleaned_text = re.sub(r'[^\d,.]', '', price_text)
    if ',' in cleaned_text and cleaned_text.count(',') == 1:
        cleaned_text = cleaned_text.replace('.', '').replace(',', '.')
    elif '.' in cleaned_text and cleaned_text.count('.') > 1:
        parts = cleaned_text.split('.')
        cleaned_text = ''.join(parts[:-1]) + '.' + parts[-1]
    try:
        return float(cleaned_text)
    except:
        return None


# --- Scraper Fonksiyonları ---
def crawl_product_page(initial_url, category_name, job_id):
    current_url = initial_url
    all_products = []

    while True:
        soup = fetch_html(current_url)
        if not soup:
            break

        print(f"➡️ Sayfa: {current_url}")
        product_list_div = soup.select_one("div.colProductIn.shwstock.shwcheck.colPrdList")

        if product_list_div:
            products_li = product_list_div.select("ul li")
            for li in products_li:
                try:
                    link_tag = li.select_one('a.ihlog.product_click')
                    if not link_tag:
                        continue

                    name = link_tag.get('data-name', 'N/A')
                    url_product = urljoin(BASE_URL, link_tag.get('href', ''))

                    price1, price2, currency = None, None, None

                    p1_tag = li.select_one("span.fiyat1")
                    if p1_tag:
                        price1_text = p1_tag.get_text(strip=True)
                        price1 = clean_price(price1_text)
                        cur = re.search(r'[₺$€]', price1_text)
                        if cur:
                            currency = cur.group(0)

                    p2_tag = li.select_one("span.fiyat3")
                    if p2_tag:
                        price2 = clean_price(p2_tag.get_text(strip=True))

                    stock_span = li.select_one("span.stock")
                    stock = "Bilinmiyor"
                    if stock_span:
                        classes = stock_span.get('class', [])
                        if 'stocktel' in classes:
                            stock = "Stokta Yok"
                        elif any(re.match(r'^stock\d+$', c) for c in classes):
                            stock = "Stokta Var"

                    product = {
                        "name": name,
                        "url": url_product,
                        "price_1": price1,
                        "price_2": price2,
                        "currency": currency,
                        "stock": stock,
                        "category": category_name,
                        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    }
                    all_products.append(product)
                except Exception as e:
                    print(f"⚠️ Ürün ayrıştırma hatası: {e}")

            print(f"📦 {len(products_li)} ürün bu sayfadan toplandı.")

        next_page = soup.select_one('a.next')
        if not next_page:
            break
        href = next_page.get('href')
        if not href or href.startswith("javascript"):
            break
        current_url = urljoin(BASE_URL, href)

    if all_products:
        save_to_supabase(all_products, job_id)

    print(f"✅ {category_name} için toplam {len(all_products)} ürün kaydedildi.")


def crawl_category(url, job_id, depth=0, visited=None, category_name="Ana Sayfa"):
    if visited is None:
        visited = set()
    if url in visited:
        return
    visited.add(url)

    soup = fetch_html(url)
    if not soup:
        return

    subcats = soup.select("div.colProductIn.product45.shwstock.shwcheck.colPrdList a.main-title.ox-url")

    if subcats:
        for a in subcats:
            name = a.get_text(strip=True)
            link = a.get("href")
            if link and not link.startswith("http"):
                link = BASE_URL + link
            print("  " * depth + f"[CAT] {name} → {link}")
            crawl_category(link, job_id, depth + 1, visited, name)
    else:
        print("  " * depth + f"[PRODUCT PAGE] {url}")
        crawl_product_page(url, category_name, job_id)


def crawl_from_homepage(job_id: str):
    print("🚀 Tarama başladı...")
    soup = fetch_html(BASE_URL)
    if not soup:
        return

    topcats = soup.select("div.catsMenu ul.hidden-xs li a")
    for a in topcats:
        name = a.get_text(strip=True)
        link = a.get("href")
        if link and not link.startswith("http"):
            link = BASE_URL + link
        print(f"[TOPCAT] {name} → {link}")
        crawl_category(link, job_id, depth=1, category_name=name)

    print("✅ Tarama tamamlandı.")
