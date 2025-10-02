// Ortak alanlar
export interface BaseProduct {
  id: string; // her yerde string olsun
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  url?: string;
  currency?: string;
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