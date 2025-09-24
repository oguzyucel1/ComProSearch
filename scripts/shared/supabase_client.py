import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()


url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise RuntimeError("🚨 SUPABASE_URL veya SUPABASE_KEY eksik!")

supabase = create_client(url, key)
print("✅ Supabase client initialized:", url)
