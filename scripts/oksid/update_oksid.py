import re
import time
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from scripts.shared.supabase_client import supabase

BASE_URL = "https://www.oksid.com.tr"

def fetch_html(page, url):
    page.goto(url, timeout=60000)
    return BeautifulSoup(page.content(), "html.parser")

def clean_price(price_text):
    if not price_text:
        return None
    cleaned_text = re.sub(r"[^\d,.]", "", price_text)
    if "," in cleaned_text and cleaned_text.count(",") == 1:
        cleaned_text = cleaned_text.replace(".", "").replace(",", ".")
    elif "." in cleaned_text and cleaned_text.count(".") > 1:
        parts = cleaned_text.split(".")
        cleaned_text = "".join(parts[:-1]) + "." + parts[-1]
    try:
        return float(cleaned_text)
    except:
        return None

def save_to_supabase(products):
    for p in products:
        p["marketplace"] = "oksid"
        p["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

    data = supabase.table("oksid_products").upsert(products, on_conflict="url").execute()
    print(f"✅ {len(data.data)} ürün yazıldı")

def crawl_product_page(page, url, category_name):
    products = []
    while True:
        soup = fetch_html(page, url)
        print(f"➡️ Sayfa: {url}")

        product_list_div = soup.select_one("div.colProductIn.shwstock.shwcheck.colPrdList")
        if not product_list_div:
            break

        for li in product_list_div.select("ul li"):
            try:
                link_tag = li.select_one("a.ihlog.product_click")
                if not link_tag:
                    continue

                name = link_tag.get("data-name", "N/A")
                url_product = urljoin(BASE_URL, link_tag.get("href", ""))

                price1, price2, currency = None, None, None
                p1_tag = li.select_one("span.fiyat1")
                if p1_tag:
                    price1_text = p1_tag.get_text(strip=True)
                    price1 = clean_price(price1_text)
                    cur = re.search(r"[₺$€]", price1_text)
                    if cur:
                        currency = cur.group(0)

                p2_tag = li.select_one("span.fiyat3")
                if p2_tag:
                    price2 = clean_price(p2_tag.get_text(strip=True))

                stock_span = li.select_one("span.stock")
                stock = "Bilinmiyor"
                if stock_span:
                    classes = stock_span.get("class", [])
                    if "stocktel" in classes:
                        stock = "Stokta Yok"
                    elif any(re.match(r"^stock\d+$", c) for c in classes):
                        stock = "Stokta Var"

                product = {
                    "name": name,
                    "url": url_product,
                    "price_1": price1,
                    "price_2": price2,
                    "currency": currency,
                    "stock": stock,
                    "category": category_name,
                }
                products.append(product)
            except Exception as e:
                print(f"⚠️ Ürün ayrıştırma hatası: {e}")

        next_page = soup.select_one("a.next")
        if not next_page:
            break
        href = next_page.get("href")
        if not href or href.startswith("javascript"):
            break
        url = urljoin(BASE_URL, href)

    if products:
        save_to_supabase(products)
        print(f"✅ {category_name} için {len(products)} ürün kaydedildi.")

def crawl_category(page, url, category_name="Ana Sayfa", visited=None):
    if visited is None:
        visited = set()
    if url in visited:
        return
    visited.add(url)

    soup = fetch_html(page, url)

    subcats = soup.select("div.colProductIn.product45.shwstock.shwcheck.colPrdList a.main-title.ox-url")
    if subcats:
        for a in subcats:
            name = a.get_text(strip=True)
            link = urljoin(BASE_URL, a.get("href"))
            print(f"[CAT] {name} → {link}")
            crawl_category(page, link, category_name=name, visited=visited)
    else:
        crawl_product_page(page, url, category_name)

def crawl_from_homepage():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("🚀 Tarama başladı...")
        soup = fetch_html(page, BASE_URL)

        topcats = soup.select("div.catsMenu ul.hidden-xs li a")
        for a in topcats:
            name = a.get_text(strip=True)
            link = urljoin(BASE_URL, a.get("href"))
            print(f"[TOPCAT] {name} → {link}")
            crawl_category(page, link, category_name=name)

        browser.close()
        print("✅ Tarama tamamlandı.")

if __name__ == "__main__":
    crawl_from_homepage()
