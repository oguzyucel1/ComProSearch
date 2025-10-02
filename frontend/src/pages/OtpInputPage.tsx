// src/components/OtpInputPage.tsx

import React, { useState, FormEvent, ChangeEvent } from "react";
import { supabase } from "../lib/supabase"; // Supabase istemcinizi buradan import edin
import { triggerWorkflow } from "../utils/githubActions"; // GitHub API tetikleme fonksiyonu

// Scraper scriptinizdeki tablo adıyla aynı olmalı
const OTP_TABLE: string = "otp_codes";

// Workflow dosya adlarını tanımlayın
const BAYINET_WORKFLOW_ID: string = "bayinet.yml";
const OKSID_WORKFLOW_ID: string = "oksid.yml";
const DENGE_WORKFLOW_ID: string = "denge.yml";

const OtpInputPage: React.FC = () => {
  // Durum Yönetimi - Her market için ayrı OTP ve Yüklenme Durumu

  // OTP State'leri
  const [bayinetOtpCode, setBayinetOtpCode] = useState<string>("");
  const [dengeOtpCode, setDengeOtpCode] = useState<string>("");

  // Her market için ayrı mesaj state'leri
  const [bayinetMessage, setBayinetMessage] = useState<string>("");
  const [oksidMessage, setOksidMessage] = useState<string>("");
  const [dengeMessage, setDengeMessage] = useState<string>("");

  // Scraper Workflow Yüklenme State'leri (Güncelle Butonu)
  const [isBayinetScraperLoading, setIsBayinetScraperLoading] =
    useState<boolean>(false);
  const [isOksidScraperLoading, setIsOksidScraperLoading] =
    useState<boolean>(false);
  const [isDengeScraperLoading, setIsDengeScraperLoading] =
    useState<boolean>(false);

  // OTP Gönderme Yüklenme State'leri (OTP Kaydet Butonu)
  const [isBayinetOtpSending, setIsBayinetOtpSending] =
    useState<boolean>(false);
  const [isDengeOtpSending, setIsDengeOtpSending] = useState<boolean>(false);

  // --- Input Değişikliğini Yönetir (Genelleştirilmiş) ---
  const handleOtpChange =
    (setOtpCode: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Sadece rakam kabul et ve 6 hane ile sınırla
      if (/^\d*$/.test(value)) {
        setOtpCode(value.slice(0, 6));
      }
    };

  // --- GitHub Actions Tetikleme (Genelleştirilmiş) ---
  const handleTriggerWorkflow = async (
    workflowId: string,
    marketName: string,
    requiresOtp: boolean, // OTP gerektirip gerektirmediği
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    clearOtpCode: React.Dispatch<React.SetStateAction<string>>,
    setMarketMessage: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Diğer marketlerin yüklenme durumu kontrol edilmiyor, sadece ilgili marketin
    // Ancak sadece birinin OTP gönderimdeyken scraper tetiklenmesini engelleyebiliriz (opsiyonel)
    if (isBayinetOtpSending || isDengeOtpSending) return;

    setMarketMessage("");
    setLoading(true);

    try {
      const result = await triggerWorkflow(workflowId);

      let successMessage = `${marketName} workflow'u başarıyla tetiklendi.`;
      if (requiresOtp) {
        successMessage += ` Script şimdi login adımına geçiyor. Lütfen gelen 6 haneli OTP'yi girin.`;
        // OTP gerekiyorsa, kullanıcı tekrar girmesi için inputu temizle
        clearOtpCode("");
      }

      setMarketMessage(`✅ ${successMessage}`);
    } catch (error: any) {
      console.error(`[${marketName}] Workflow Tetikleme Hatası:`, error);
      setMarketMessage(`❌ ${marketName} tetikleme hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Supabase OTP Gönderme (Genelleştirilmiş) ---
  const handleOtpSubmit = async (
    e: FormEvent<HTMLFormElement>,
    otpCode: string,
    marketName: string,
    setOtpCode: React.Dispatch<React.SetStateAction<string>>,
    setSending: React.Dispatch<React.SetStateAction<boolean>>,
    setMarketMessage: React.Dispatch<React.SetStateAction<string>>
  ) => {
    e.preventDefault();
    setMarketMessage("");

    if (otpCode.length !== 6) {
      setMarketMessage("❌ Hata: Lütfen 6 haneli geçerli bir OTP girin.");
      return;
    }

    setSending(true);

    try {
      // Önceki OTP'leri sil
      await supabase
        .from(OTP_TABLE)
        .delete()
        .neq("otp_code", "non-existent-code"); // Tüm satırları silmenin Supabase yolu

      // Yeni OTP'yi kaydet
      const { error: insertError } = await supabase
        .from(OTP_TABLE)
        .insert([{ otp_code: otpCode }])
        .select();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setMarketMessage(
        `✅ Başarılı! ${marketName} OTP (${otpCode}) veritabanına kaydedildi. Script devam ediyor...`
      );
      setOtpCode(""); // Başarılı gönderim sonrası inputu temizle
    } catch (error: any) {
      console.error(`${marketName} Supabase Kayıt Hatası:`, error);
      setMarketMessage(
        `❌ ${marketName} OTP kayıt hatası: ${
          error.message || "Bilinmeyen bir hata oluştu."
        }`
      );
    } finally {
      setSending(false);
    }
  };

  // --- Yardımcı Tetikleme Fonksiyonları ---
  const triggerBayinet = () =>
    handleTriggerWorkflow(
      BAYINET_WORKFLOW_ID,
      "Bayinet",
      true,
      setIsBayinetScraperLoading,
      setBayinetOtpCode,
      setBayinetMessage
    );

  const triggerOksid = () =>
    handleTriggerWorkflow(
      OKSID_WORKFLOW_ID,
      "Oksid",
      false, // OTP Gerekli değil
      setIsOksidScraperLoading,
      setBayinetOtpCode, // Dummy setter çünkü OTP gerekmiyor
      setOksidMessage
    );

  const triggerDenge = () =>
    handleTriggerWorkflow(
      DENGE_WORKFLOW_ID,
      "Denge",
      true,
      setIsDengeScraperLoading,
      setDengeOtpCode,
      setDengeMessage
    );

  // --- Render (JSX) ---
  return (
    <div className="max-w-7xl mx-auto mt-8">
      {/* Ana Başlık */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Ürün Güncelleme Paneli
        </h2>
        <p className="text-gray-400">
          Marketlerden ürün verilerini güncelleyin
        </p>
      </div>

      {/* Grid Layout - 3 Card Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* BAYINET CARD (OTP GEREKLİ) */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-red-500/30 overflow-hidden hover:border-red-500/50 transition-all">
          {/* Banner Image */}
          <div className="relative h-32 overflow-hidden">
            <img
              src="/images/penta_banner.jpg"
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
              onClick={triggerBayinet}
              // Sadece Bayinet'in kendi loading state'ini kontrol et
              disabled={isBayinetScraperLoading || isBayinetOtpSending}
              className="w-full py-3 px-4 mb-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-red-500/30"
            >
              {isBayinetScraperLoading ? (
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

            {/* Bayinet OTP Form */}
            <form
              onSubmit={(e) =>
                handleOtpSubmit(
                  e,
                  bayinetOtpCode,
                  "Bayinet",
                  setBayinetOtpCode,
                  setIsBayinetOtpSending,
                  setBayinetMessage
                )
              }
              className="space-y-3"
            >
              <input
                type="text"
                value={bayinetOtpCode}
                onChange={handleOtpChange(setBayinetOtpCode)}
                placeholder="6 Hane OTP"
                maxLength={6}
                disabled={isBayinetOtpSending}
                className="w-full px-3 py-3 bg-gray-800/60 border border-white/10 rounded-lg text-center text-l tracking-widest text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="submit"
                disabled={isBayinetOtpSending || bayinetOtpCode.length !== 6}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isBayinetOtpSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <span>OTP Kaydet</span>
                )}
              </button>
            </form>

            {/* Bayinet Mesaj Alanı */}
            {bayinetMessage && (
              <div className="mt-4">
                <div
                  className={`p-3 rounded-lg border text-sm ${
                    bayinetMessage.startsWith("❌")
                      ? "bg-red-900/20 border-red-500/50 text-red-300"
                      : bayinetMessage.startsWith("⚠️")
                      ? "bg-yellow-900/20 border-yellow-500/50 text-yellow-300"
                      : "bg-green-900/20 border-green-500/50 text-green-300"
                  }`}
                >
                  <p className="font-medium text-center">{bayinetMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* OKSİD CARD (OTP GEREKMİYOR) */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-orange-500/30 overflow-hidden hover:border-orange-500/50 transition-all">
          {/* Banner Image */}
          <div className="relative h-32 overflow-hidden">
            <img
              src="/images/oksid_banner.jpg"
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
              onClick={triggerOksid}
              // Sadece Oksid'in kendi loading state'ini kontrol et
              disabled={isOksidScraperLoading}
              className="w-full py-3 px-4 mb-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/30"
            >
              {isOksidScraperLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Başlatılıyor...</span>
                </>
              ) : (
                <span>GÜNCELLE</span>
              )}
            </button>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-300 text-xs">
                <strong>Avantaj:</strong> OTP gerektirmez, direkt başlatılır.
              </p>
            </div>

            {/* Oksid Mesaj Alanı */}
            {oksidMessage && (
              <div className="mt-4">
                <div
                  className={`p-3 rounded-lg border text-sm ${
                    oksidMessage.startsWith("❌")
                      ? "bg-red-900/20 border-red-500/50 text-red-300"
                      : oksidMessage.startsWith("⚠️")
                      ? "bg-yellow-900/20 border-yellow-500/50 text-yellow-300"
                      : "bg-green-900/20 border-green-500/50 text-green-300"
                  }`}
                >
                  <p className="font-medium text-center">{oksidMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DENGE CARD (OTP GEREKLİ) */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-red-500/30 overflow-hidden hover:border-red-500/50 transition-all">
          {/* Banner Image */}
          <div className="relative h-32 overflow-hidden">
            <img
              src="/images/denge_banner.png"
              alt="Denge Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto bg-gradient-to-r from-black-600 to-black-700 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-gray-500/30">
                <span className="text-2xl">⚫️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-1">Denge</h3>
              <p className="text-sm text-gray-400">OTP ile giriş gerekli</p>
            </div>

            <button
              onClick={triggerDenge}
              // Sadece Denge'nin kendi loading state'ini kontrol et
              disabled={isDengeScraperLoading || isDengeOtpSending}
              className="w-full py-3 px-4 mb-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-gray-500/30"
            >
              {isDengeScraperLoading ? (
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

            {/* Denge OTP Form */}
            <form
              onSubmit={(e) =>
                handleOtpSubmit(
                  e,
                  dengeOtpCode,
                  "Denge",
                  setDengeOtpCode,
                  setIsDengeOtpSending,
                  setDengeMessage
                )
              }
              className="space-y-3"
            >
              <input
                type="text"
                value={dengeOtpCode}
                onChange={handleOtpChange(setDengeOtpCode)}
                placeholder="6 Hane OTP"
                maxLength={6}
                disabled={isDengeOtpSending}
                className="w-full px-3 py-3 bg-gray-800/60 border border-white/10 rounded-lg text-center text-l tracking-widest text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="submit"
                disabled={isDengeOtpSending || dengeOtpCode.length !== 6}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isDengeOtpSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <span>OTP Kaydet</span>
                )}
              </button>
            </form>

            {/* Denge Mesaj Alanı */}
            {dengeMessage && (
              <div className="mt-4">
                <div
                  className={`p-3 rounded-lg border text-sm ${
                    dengeMessage.startsWith("❌")
                      ? "bg-red-900/20 border-red-500/50 text-red-300"
                      : dengeMessage.startsWith("⚠️")
                      ? "bg-yellow-900/20 border-yellow-500/50 text-yellow-300"
                      : "bg-green-900/20 border-green-500/50 text-green-300"
                  }`}
                >
                  <p className="font-medium text-center">{dengeMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpInputPage;
