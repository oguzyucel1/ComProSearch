import time
from scripts.shared.supabase_client import supabase
from scripts.oksid.update_oksid import crawl_from_homepage

POLL_INTERVAL = 5  # saniye

def update_job_status(job_id: str, status: str, error: str = None):
    """Job durumunu günceller"""
    supabase.table("jobs").update({
        "status": status,
        "error": error,
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }).eq("id", job_id).execute()


def run_worker():
    print("🚀 Oksid worker başlatıldı, jobs tablosu dinleniyor...")

    while True:
        try:
            # pending jobları çek
            res = supabase.table("jobs").select("*") \
                .eq("status", "pending") \
                .eq("store", "oksid") \
                .limit(1).execute()

            if res.data:
                job = res.data[0]
                job_id = job["id"]
                print(f"\n🆕 Yeni job bulundu: {job_id} - oksid")

                # job'u processing olarak işaretle
                update_job_status(job_id, "processing")

                try:
                    # scraperi çalıştır
                    crawl_from_homepage(job_id)

                    # başarıyla bitti
                    update_job_status(job_id, "completed")
                    print(f"✅ Job tamamlandı: {job_id}")
                except Exception as e:
                    # hata varsa job'u failed yap
                    update_job_status(job_id, "failed", error=str(e))
                    print(f"❌ Job hata verdi: {job_id} | {e}")

            else:
                # job yok → bekle
                time.sleep(POLL_INTERVAL)

        except Exception as e:
            print(f"⚠️ Worker döngü hatası: {e}")
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run_worker()
