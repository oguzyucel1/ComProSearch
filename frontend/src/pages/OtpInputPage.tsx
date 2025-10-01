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
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-white/10 p-8">
        {/* Başlık */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Bayinet Scraper Kontrol Paneli
          </h2>
        </div>

        {/* 1. Güncelle Butonu (Scripti Tetikler) */}
        <button
          onClick={handleTriggerScraper}
          disabled={isScraperLoading || isOtpSending}
          className="w-full py-3 px-4 mb-6 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-red-500/30"
        >
          {isScraperLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Script Başlatılıyor...</span>
            </>
          ) : (
            <span>BAYİNET GÜNCELLE</span>
          )}
        </button>

        {/* Bilgilendirme Kutusu */}
        <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded mb-6">
          <p className="text-blue-300 text-sm">
            <strong>Adım 1:</strong> Yukarıdaki butona basarak scripti başlatın.
            <br />
            <strong>Adım 2:</strong> Gelen **6 haneli OTP'yi** aşağıdaki alana
            girip kaydedin.
          </p>
        </div>

        {/* 2. OTP Formu (Supabase'e Kaydeder) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={otpCode}
            onChange={handleInputChange}
            placeholder="6 Hane OTP Kodu"
            maxLength={6}
            disabled={isOtpSending}
            className="w-full px-4 py-4 bg-gray-800/60 border border-white/10 rounded-lg text-center text-2xl tracking-widest text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={isOtpSending || otpCode.length !== 6}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isOtpSending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>OTP Gönderiliyor...</span>
              </>
            ) : (
              <span>OTP'yi Kaydet ve Devam Ettir</span>
            )}
          </button>
        </form>

        {/* Mesaj Alanı */}
        {message && (
          <div
            className={`mt-6 p-4 rounded-lg border ${
              message.startsWith("❌")
                ? "bg-red-900/20 border-red-500/50 text-red-300"
                : "bg-green-900/20 border-green-500/50 text-green-300"
            }`}
          >
            <p className="font-medium text-center">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpInputPage;
