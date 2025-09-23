import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Bayinet ürün tablosu için tip tanımları
export interface BayinetProduct {
  id: string;
  name: string;
  price?: number;
  category?: string; // Kategori doğrudan ürün tablosunda
  image_url?: string;
  description?: string;
  stock_status?: string;
  // Bayinet'e özgü diğer alanlar
}

// Denge ürün tablosu için tip tanımları
export interface DengeProduct {
  id: string;
  product_name: string; // Farklı alan adı
  cost?: number; // Farklı alan adı (price yerine)
  category?: string; // Kategori doğrudan ürün tablosunda
  image?: string; // Farklı alan adı
  details?: string; // Farklı alan adı
  availability?: string; // Farklı alan adı
  // Denge'ye özgü diğer alanlar
}

// Oksid tabloları için tip tanımları - Gerçek şema
export interface OksidCategory {
  id: number;
  name: string;
  // Oksid için kategori tablosu şeması henüz belirtilmedi
}

export interface OksidProduct {
  id: number; // bigserial
  name: string | null; // text
  url: string | null; // text
  price_1: number | null; // double precision
  price_2: number | null; // double precision
  currency: string | null; // text
  stock: string | null; // text
  category: string | null; // text (kategori adı doğrudan)
  created_at: string | null; // timestamp
}

// Genel tip tanımları (normalize edilmiş)
export interface Category {
  id: string;
  name: string;
  store: string;
}

export interface Product {
  id: string;
  name: string;
  price?: number;
  category_id?: string;
  store: string;
  image_url?: string;
  description?: string;
  stock_status?: string;
  created_at?: string;
}

// Tablo isimleri mapping - Sadece ürün tabloları
export const TABLE_NAMES = {
  bayinet: {
    products: "bayinet_products",
  },
  denge: {
    products: "denge_products",
  },
  oksid: {
    products: "oksid_products", // Gerçek tablo adı
  },
} as const;

export type StoreType = keyof typeof TABLE_NAMES;
