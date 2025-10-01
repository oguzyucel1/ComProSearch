// src/components/OtpInputPage.tsx

import React, { useState, FormEvent, ChangeEvent } from "react";
import { supabase } from "../lib/supabase"; // Supabase istemcinizi buradan import edin
import { triggerScraperWorkflow } from "../utils/githubActions"; // GitHub API tetikleme fonksiyonu

// Scraper scriptinizdeki tablo adıyla aynı olmalı
const OTP_TABLE: string = "otp_codes";

const OtpInputPage: React.FC = () => {
  // Durum Yönetimi
  const [otpCode, setOtpCode] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isScraperLoading, setIsScraperLoading] = useState<boolean>(false); // Workflow loading (Güncelle butonu)
  const [isOtpSending, setIsOtpSending] = useState<boolean>(false); // OTP gönderme loading (Kaydet butonu)

  // --- Input Değişikliğini Yönetir ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Sadece rakamlara ve 6 haneye izin verir
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setOtpCode(value.slice(0, 6));
    }
  };

  // --- GitHub Actions Tetikleme (Güncelle Butonu) ---
  const handleTriggerScraper = async () => {
    setMessage("");
    setIsScraperLoading(true);
    try {
      const result = await triggerScraperWorkflow();
      setMessage(`✅ ${result.message}`);
    } catch (error: any) {
      console.error("Workflow Tetikleme Hatası:", error);
      setMessage(`❌ Workflow tetikleme hatası: ${error.message}`);
    } finally {
      setIsScraperLoading(false);
    }
  };

  // --- Supabase OTP Gönderme (Kaydet Butonu) ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    if (otpCode.length !== 6) {
      setMessage("❌ Hata: Lütfen 6 haneli geçerli bir OTP girin.");
      return;
    }

    setIsOtpSending(true);

    try {
      // 1. Önce mevcut kayıtları temizle (tek bir kodun kalmasını sağlamak için)
      await supabase
        .from(OTP_TABLE)
        .delete()
        .neq("otp_code", "non-existent-code");

      // 2. Yeni OTP'yi kaydet
      const { error: insertError } = await supabase
        .from(OTP_TABLE)
        .insert([{ otp_code: otpCode }])
        .select();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setMessage(
        `✅ Başarılı! OTP (${otpCode}) veritabanına kaydedildi. Script şimdi devam ediyor...`
      );
      setOtpCode(""); // Formu temizle
    } catch (error: any) {
      console.error("Supabase Kayıt Hatası:", error);
      setMessage(
        `❌ Kayıt hatası: ${
          error.message || "Bilinmeyen bir hata oluştu."
        } Konsolu kontrol edin.`
      );
    } finally {
      setIsOtpSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-8">
      {/* Ana Başlık */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Scraper Kontrol Paneli
        </h2>
        <p className="text-gray-400">
          Marketlerden ürün verilerini güncelleyin
        </p>
      </div>

      {/* Grid Layout - 3 Card Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* BAYINET CARD */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-red-500/30 overflow-hidden hover:border-red-500/50 transition-all">
          {/* Banner Image */}
          <div className="relative h-32 overflow-hidden">
            <img
              src="/src/public/images/penta_banner.jpg"
              alt="Penta Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-red-500/30">
                <span className="text-2xl">🔴</span>
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-1">
                Bayinet (Penta)
              </h3>
              <p className="text-sm text-gray-400">OTP ile giriş gerekli</p>
            </div>

            <button
              onClick={handleTriggerScraper}
              disabled={isScraperLoading || isOtpSending}
              className="w-full py-3 px-4 mb-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-red-500/30"
            >
              {isScraperLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Başlatılıyor...</span>
                </>
              ) : (
                <span>GÜNCELLE</span>
              )}
            </button>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-blue-300 text-xs">
                <strong>Adım 1:</strong> Yukarıdaki butona basın.
                <br />
                <strong>Adım 2:</strong> Gelen OTP'yi aşağıya girin.
              </p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={otpCode}
                onChange={handleInputChange}
                placeholder="6 Hane OTP"
                maxLength={6}
                disabled={isOtpSending}
                className="w-full px-3 py-3 bg-gray-800/60 border border-white/10 rounded-lg text-center text-xl tracking-widest text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="submit"
                disabled={isOtpSending || otpCode.length !== 6}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isOtpSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <span>OTP Kaydet</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* OKSİD CARD */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-orange-500/30 overflow-hidden hover:border-orange-500/50 transition-all">
          {/* Banner Image */}
          <div className="relative h-32 overflow-hidden">
            <img
              src="/src/public/images/oksid_banner.jpg"
              alt="Oksid Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/30">
                <span className="text-2xl">🟠</span>
              </div>
              <h3 className="text-xl font-bold text-orange-400 mb-1">Oksid</h3>
              <p className="text-sm text-gray-400">Doğrudan güncelleme</p>
            </div>

            <button
              onClick={() => {
                setMessage("⚠️ Oksid scraper henüz yapım aşamasında.");
              }}
              disabled={isScraperLoading || isOtpSending}
              className="w-full py-3 px-4 mb-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/30"
            >
              <span>GÜNCELLE</span>
            </button>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-300 text-xs">
                <strong>Avantaj:</strong> OTP gerektirmez, direkt başlatılır.
              </p>
            </div>
          </div>
        </div>

        {/* DENGE CARD */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-500/30 overflow-hidden hover:border-gray-500/50 transition-all">
          {/* Banner Image */}
          <div className="relative h-32 overflow-hidden">
            <img
              src="/src/public/images/denge_banner.png"
              alt="Denge Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-gray-500/30">
                <span className="text-2xl">⚫</span>
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-1">Denge</h3>
              <p className="text-sm text-gray-400">Doğrudan güncelleme</p>
            </div>

            <button
              onClick={() => {
                setMessage("⚠️ Denge scraper henüz yapım aşamasında.");
              }}
              disabled={isScraperLoading || isOtpSending}
              className="w-full py-3 px-4 mb-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-gray-500/30"
            >
              <span>GÜNCELLE</span>
            </button>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-300 text-xs">
                <strong>Avantaj:</strong> OTP gerektirmez, direkt başlatılır.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Mesaj Alanı */}
      {message && (
        <div className="max-w-2xl mx-auto mt-6">
          <div
            className={`p-4 rounded-lg border ${
              message.startsWith("❌")
                ? "bg-red-900/20 border-red-500/50 text-red-300"
                : message.startsWith("⚠️")
                ? "bg-yellow-900/20 border-yellow-500/50 text-yellow-300"
                : "bg-green-900/20 border-green-500/50 text-green-300"
            }`}
          >
            <p className="font-medium text-center">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtpInputPage;
