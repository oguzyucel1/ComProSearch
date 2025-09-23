"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getCategoriesByStore,
  searchProductsByName,
  getProductsByCategory,
  compareProductsAcrossStores,
} from "@/lib/database";
import { Category, Product } from "@/lib/supabase";

export default function ComproAppUI() {
  const [activeMethod, setActiveMethod] = useState("searchByStore");
  const [selectedStore, setSelectedStore] = useState("Bayinet");
  const [searchMethod, setSearchMethod] = useState("searchByName");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Supabase state'leri
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Progress bar state
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  // Kategorileri yükle
  const loadCategories = async (store: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategoriesByStore(store);
      setCategories(data);
    } catch (err) {
      setError("Kategoriler yüklenirken hata oluştu");
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(selectedStore);
  }, [selectedStore]);

  // Ürün arama fonksiyonu
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    try {
      let data: Product[] = [];
      if (activeMethod === "compare") {
        data = await compareProductsAcrossStores(searchTerm);
      } else {
        data = await searchProductsByName(searchTerm, selectedStore);
      }
      setProducts(data);
    } catch (err) {
      setError("Ürünler aranırken hata oluştu");
      console.error("Error searching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Kategori seçimi
  const handleCategorySelect = async () => {
    if (!selectedCategory) return;

    setLoading(true);
    setError(null);
    try {
      let categoryIdentifier = selectedCategory;
      if (selectedStore.toLowerCase() === "oksid") {
        const selectedCat = categories.find(
          (cat) => cat.name === selectedCategory
        );
        categoryIdentifier = selectedCat ? selectedCat.name : selectedCategory;
      }

      const data = await getProductsByCategory(
        categoryIdentifier,
        selectedStore
      );
      setProducts(data);
    } catch (err) {
      setError("Kategori ürünleri yüklenirken hata oluştu");
      console.error("Error loading category products:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Oksid güncelle butonu
  const handleOksidUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/start-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplace: "oksid" }),
      });

      const result = await response.json();

      if (response.ok && result.job) {
        setJobId(result.job.id);
        setProgress(0);
        setStatus("pending");
      } else {
        throw new Error(result.error || "Güncelleme başlatılamadı");
      }
    } catch (error) {
      console.error("Oksid güncelleme hatası:", error);
      setError("Oksid güncelleme sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Polling ile job durumunu takip et
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/job-status?id=${jobId}`);
        const data = await res.json();
        if (res.ok && data) {
          setProgress(data.progress || 0);
          setStatus(data.status || "pending");
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Job status fetch hatası:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          ✨ ComPro Ürün Arama
        </h1>

        {/* Güncelleme Butonları */}
        <div className="mb-8 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-600">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            🔄 Veritabanı Güncellemeleri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleOksidUpdate}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
            >
              {loading ? "⏳ Güncelleniyor..." : "🔄 Oksid Güncelle"}
            </Button>
          </div>

          {/* ✅ Progress bar */}
          {jobId && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded h-4">
                <div
                  className="bg-green-500 h-4 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-white text-center">
                {status} - {progress}%
              </p>
            </div>
          )}
        </div>

        {/* 🔍 Arama Alanı (senin mevcut kodun devam edecek) */}
      </div>
    </div>
  );
}
