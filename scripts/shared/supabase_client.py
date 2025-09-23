import os
from supabase import create_client, Client
from dotenv import load_dotenv

# ✅ Local için .env dosyasını yükle (scripts/.env varsa)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# ✅ Ortam değişkenlerini oku
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("❌ Supabase environment değişkenleri eksik! Lütfen .env veya Secrets ayarını kontrol et.")

# ✅ Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
