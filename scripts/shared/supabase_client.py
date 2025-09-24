import os
from supabase import create_client
from dotenv import load_dotenv
import socket

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise RuntimeError("🚨 SUPABASE_URL veya SUPABASE_KEY eksik!")

# 🔍 Debug: URL formatını ve DNS çözümlemesini kontrol et
print("🔍 Supabase URL (raw):", url)
try:
    host = url.replace("https://", "").split("/")[0]
    ip = socket.gethostbyname(host)
    print(f"🌍 DNS çözümleme başarılı: {host} -> {ip}")
except Exception as e:
    print(f"❌ DNS çözümleme hatası: {e}")

supabase = create_client(url, key)
print("✅ Supabase client initialized:", url)
