// Ortak alanlar
export interface BaseProduct {
  id: string; // her yerde string olsun
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  url?: string;
  currency?: string;
  lastPrice?: number; // Önceki fiyat (fiyat değişikliği takibi için)
  marketplace?: string; // Ürünün hangi marketplace'den geldiği (oksid, penta, denge)
}

// Opsiyonel alanlar (her tabloda yok)
export interface ExtraProductFields {
  image?: string;
  rating?: number;
  reviews?: number;
  description?: string;
  priceText?: string;
}

// Final tip = core + opsiyonel
export type Product = BaseProduct & Partial<ExtraProductFields>;

// Tab enum
export type TabType = "oksid" | "penta" | "denge" | "comparison";


// Dosya Yolu: src/types.ts

export interface ShoppingResult {
  title: string;
  link: string;
  price: string;
  imageUrl: string;
  rating?: number;
}