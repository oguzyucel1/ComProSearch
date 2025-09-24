
import cfscrape

scraper = cfscrape.create_scraper()  
response = scraper.get("https://www.oksid.com.tr/k/notebook/1798/")
html = response.text

print("Status:", response.status_code)
print("Title:", html[:500])  # sadece ilk 500 karakteri yazdır
