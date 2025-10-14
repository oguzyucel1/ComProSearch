import { supabase } from "../lib/supabase";
import type { Product, TabType } from "../types";

// Oksid ve Denge için stok kontrolü
function toBoolStock(val: any): boolean {
  const s = String(val ?? "")
    .trim()
    .toLowerCase();
  
  // Boş değer → stokta var kabul et
  if (!s) return true;
  
  // "Stokta Yok" veya benzer ifadeleri kontrol et
  const falsy = new Set([
    "0",
    "false",
    "no",
    "hayir",
    "yok",
    "out",
    "stok yok",
    "stokta yok",
    "yoktur",
    "stok bulunmamaktadır",
    "mevcut değil",
  ]);
  
  return !falsy.has(s);
}

// Bayinet/Penta için özel stok kontrolü
function toBoolStockBayinet(val: any): boolean {
  const s = String(val ?? "").trim();
  
  // Boş değer → stokta var kabul et
  if (!s) return true;
  
  // Tüm depoları ayır ("|" ile ayrılmış)
  const depots = s.split("|").map(d => d.trim());
  
  // Her depodaki stok miktarını topla
  let totalStock = 0;
  
  for (const depot of depots) {
    // "Merkez (0)" veya "Dış depo (13)" gibi formatlardan sayıyı çıkar
    // Hem büyük hem küçük parantez destekle: (0) veya （0）
    const match = depot.match(/[(\(](\d+)[)\)]/);
    if (match && match[1]) {
      totalStock += parseInt(match[1], 10);
    }
  }
  
  // Toplam stok 0'dan büyükse stokta var
  return totalStock > 0;
}

// Denge için sayısal stok kontrolü
function toBoolStockDenge(val: any): boolean {
  // Null veya undefined → stokta yok
  if (val === null || val === undefined) return false;
  
  // Sayıya çevir
  const stockNum = Number(val);
  
  // NaN değilse ve 0'dan büyükse stokta var
  if (!isNaN(stockNum)) {
    return stockNum > 0;
  }
  
  // Sayı değilse string kontrolü yap (eski veriler için)
  const s = String(val).trim().toLowerCase();
  if (!s) return false;
  
  const falsy = new Set([
    "0",
    "false",
    "no",
    "hayir",
    "yok",
    "out",
    "stok yok",
    "stokta yok",
    "yoktur",
  ]);
  
  return !falsy.has(s);
}

// Bayinet category code mapping
const BAYINET_CATEGORY_MAP: Record<string, string> = {
  "01": "Bilgisayar Bileşenleri",
  "02": "Kişisel Bilgisayar",
  "03": "Çevre Birimleri",
  "04": "Baskı Çözümleri",
  "05": "Kurumsal Ürünler",
  "07": "Tüketici Elektroniği",
  "08": "Aksesuar ve Sarf",
  "09": "Diğer",
  "10": "Ağ Ürünleri",
  "11": "Güvenlik Ürünleri",
  "12": "Taşınabilir Depolama",
  "15": "Yazılım",
  "17": "Servis Hizmetleri",
};

// Helper for Bayinet category mapping
const resolveBayinetCategory = (code: any): string => {
  const c = String(code ?? "").trim();
  if (!c) return "Diğer";
  const normalizedCode = c.padStart(2, "0");
  return BAYINET_CATEGORY_MAP[normalizedCode] ?? "Diğer";
};

const isDigits = (s: string) => /^\d+$/.test(s);

// For Bayinet: keep categories distinct when unknown by appending code.
const formatBayinetCategoryDisplay = (codeOrLabel: any): string => {
  const s = String(codeOrLabel ?? "").trim();
  if (!s) return "Diğer";
  if (isDigits(s)) {
    const key = s.padStart(2, "0");
    const mapped = BAYINET_CATEGORY_MAP[key];
    return mapped ?? `Diğer (${key})`;
  }
  return s;
};

// 🟢 oksid_products mapper
const oksidMapper = (row: any): Product => ({
  id: String(row.id),
  name: row.name ?? "",
  category: row.category ?? "Diğer",
  price: Number(row.price_1 ?? row.price_2 ?? 0),
  image: "", // oksid’de image yok gibi, boş bırakıyoruz
  rating: 0,
  reviews: 0,
  description: "",
  inStock: toBoolStock(row.stock),
  url: row.url ?? undefined,
  currency: row.currency ?? undefined,
  priceText: undefined,
  lastPrice: row.last_price ? Number(row.last_price) : undefined,
  marketplace: "oksid",
});

// 🟡 bayinet_products mapper
const bayinetMapper = (row: any): Product => ({
  id: String(row.product_id ?? row.id ?? ""),
  name: row.name ?? "",
  category: formatBayinetCategoryDisplay(
    row.category_id ?? row.category ?? row.categoryCode
  ),
  price: Number(row.price ?? 0),
  image: "",
  rating: 0,
  reviews: 0,
  description: "",
  inStock: toBoolStockBayinet(row.stock_info),
  url: row.url ?? undefined,
  currency: row.currency ?? undefined,
  priceText:
    row.price != null
      ? `${Number(row.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${row.currency ?? ""}`
      : undefined,
  lastPrice: row.last_price ? Number(row.last_price) : undefined,
  marketplace: "penta",
});

// 🔵 denge_products mapper
const dengeMapper = (row: any): Product => ({
  id: String(row.product_id), // denge'de id var ama product_id unique → UI için product_id daha mantıklı
  name: row.name ?? "",
  category: row.category ?? "Diğer",
  price: Number(row.special_price ?? 0),
  image: "",
  rating: 0,
  reviews: 0,
  description: "",
  inStock: toBoolStockDenge(row.stock_info),
  url: row.url ?? undefined,
  currency: row.currency ?? undefined,
  priceText: row.special_price
    ? `${row.special_price} ${row.currency ?? ""}`
    : undefined,
  lastPrice: row.last_price ? Number(row.last_price) : undefined,
  marketplace: "denge",
});

// Fetch last updated date for a specific marketplace
export async function fetchLastUpdatedDate(tabType: TabType): Promise<string | null> {
  const tableConfig = TABLES[tabType];
  if (!tableConfig) {
    console.log(`[fetchLastUpdatedDate] No table config for ${tabType}`);
    return null;
  }

  try {
    // Use the correct column names for each marketplace
    let timestampColumn = "last_updated"; // Tüm marketplaces için last_updated kullan
    
    if (tabType === "denge") {
      timestampColumn = "last_updated";
    } else if (tabType === "oksid") {
      timestampColumn = "last_updated";
    } else if (tabType === "penta") {
      timestampColumn = "last_updated";
    }

    console.log(`[fetchLastUpdatedDate] Fetching for ${tabType} from table ${tableConfig.table}, column: ${timestampColumn}`);

    const { data, error } = await supabase
      .from(tableConfig.table)
      .select(timestampColumn)
      .not(timestampColumn, 'is', null) // Sadece last_updated değeri olan kayıtları al
      .order(timestampColumn, { ascending: false })
      .limit(1);

    if (error) {
      console.error(`Error fetching last updated date for ${tabType}:`, error);
      return null;
    }

    console.log(`[fetchLastUpdatedDate] Data received for ${tabType}:`, data);

    if (!data || data.length === 0) {
      console.log(`[fetchLastUpdatedDate] No data found for ${tabType}`);
      return null;
    }

    const row = data[0] as Record<string, any>;
    if (!row) return null;

    const lastDate = row[timestampColumn];
    if (!lastDate) {
      console.log(`[fetchLastUpdatedDate] No ${timestampColumn} value in row for ${tabType}`);
      return null;
    }

    console.log(`[fetchLastUpdatedDate] Last date raw for ${tabType}:`, lastDate);

    // Parse the date
    const date = new Date(lastDate);
    
    // Sadece Oksid ve Penta için 3 saat geri al
    if (tabType === "oksid" || tabType === "penta") {
      date.setHours(date.getHours() - 3); // 3 saat geri al
    }
    
    // Format the date to Turkish locale
    const formatted = date.toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    
    console.log(`[fetchLastUpdatedDate] Formatted date for ${tabType}:`, formatted);
    return formatted;
  } catch (error) {
    console.error(`Unexpected error fetching last updated date for ${tabType}:`, error);
    return null;
  }
}

// Tablo–mapper–select eşlemesi
const TABLES: Record<
  TabType,
  { table: string; select: string; mapper: (row: any) => Product } | null
> = {
  oksid: {
    table: "oksid_products",
    select:
      "id,name,url,price_1,price_2,currency,stock,category,last_updated,last_price",
    mapper: oksidMapper,
  },
  penta: {
    table: "bayinet_products",
    select:
      "product_id,name,url,category_id,price,currency,stock_info,last_updated,last_price",
    mapper: bayinetMapper,
  },
  denge: {
    table: "denge_products",
    select:
      "id,product_id,name,category,special_price,list_price,currency,stock_info,last_updated,url,last_price",
    mapper: dengeMapper,
  },
  comparison: null,
};

// 🔑 Ana fetch fonksiyonu
const BAYINET_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(BAYINET_CATEGORY_MAP).map(([code, label]) => [label, code])
);

function resolvePentaCategoryCodeFromDisplay(
  display: string | undefined
): string | null {
  if (!display || display === "all") return null;
  const s = String(display).trim();
  // Exact label match in map
  const mapped = BAYINET_LABEL_TO_CODE[s];
  if (mapped) return mapped;
  // Try to extract code from pattern: Diğer (NN)
  const m = s.match(/\((\d+)\)$/);
  if (m && m[1]) return m[1].padStart(2, "0");
  // If string is just digits assume it's a code
  if (/^\d+$/.test(s)) return s.padStart(2, "0");
  return null;
}

export async function fetchProductsByTab(
  tab: TabType,
  page = 1,
  pageSize = 50,
  opts?: { search?: string; category?: string; sort?: string; onlyInStock?: boolean }
): Promise<{ items: Product[]; total: number }> {
  const cfg = TABLES[tab];
  if (!cfg) return { items: [], total: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Primary fetch with exact count and range
  let query = supabase.from(cfg.table).select(cfg.select, { count: "exact" });

  // Apply filters
  const search = opts?.search?.trim();
  const category = opts?.category;
  const sort = opts?.sort;
  const onlyInStock = opts?.onlyInStock;

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (category && category !== "all") {
    if (tab === "penta") {
      const code = resolvePentaCategoryCodeFromDisplay(category);
      if (code) query = query.eq("category_id", code);
    } else if (tab === "oksid" || tab === "denge") {
      query = query.eq("category", category);
    }
  }

  // Apply sorting
  if (sort === "price-low") {
    const priceCol =
      tab === "oksid" ? "price_2" : tab === "penta" ? "price" : "special_price";
    query = query.order(priceCol, { ascending: true });
  } else if (sort === "price-high") {
    const priceCol =
      tab === "oksid" ? "price_2" : tab === "penta" ? "price" : "special_price";
    query = query.order(priceCol, { ascending: false });
  }

  let { data, error, count } = await query.range(from, to);

  // Fallback for Penta/Bayinet in case of column mismatch
  if (error && tab === "penta") {
    // eslint-disable-next-line no-console
    console.warn(
      "Penta select failed with specific columns, retrying with select('*'):",
      error.message
    );
    let altQuery = supabase.from(cfg.table).select("*", { count: "exact" });
    if (search) {
      altQuery = altQuery.ilike("name", `%${search}%`);
    }
    if (category && category !== "all") {
      if (tab === "penta") {
        const code = resolvePentaCategoryCodeFromDisplay(category);
        if (code) altQuery = altQuery.eq("category_id", code);
      } else if (tab === "oksid" || tab === "denge") {
        altQuery = altQuery.eq("category", category);
      }
    }
    // Apply sorting to fallback (penta only in this block)
    if (sort === "price-low") {
      altQuery = altQuery.order("price", { ascending: true });
    } else if (sort === "price-high") {
      altQuery = altQuery.order("price", { ascending: false });
    }
    const alt = await altQuery.range(from, to);
    data = alt.data as any[] | null;
    error = alt.error as any;
    count = alt.count as number | null;
  }

  if (error) throw error;

  // Map products
  let items = (data || []).map(cfg.mapper);
  
  // Client-side filtering for stock if needed
  if (onlyInStock) {
    items = items.filter(product => product.inStock);
  }

  return { items, total: count ?? 0 };
}

// 🔎 Kategori listesi: tüm veritabanını sayfalayarak kategorileri toplayıp eşsiz hale getirir
export async function fetchCategoriesByTab(tab: TabType): Promise<string[]> {
  const cfg = TABLES[tab];
  if (!cfg) return [];

  // Hangi kolon?
  const categoryColumn = tab === "penta" ? "category_id" : "category";
  const pageSize = 1000;
  let offset = 0;
  const set = new Set<string>();

  while (true) {
    let query = supabase
      .from(cfg.table)
      .select(categoryColumn)
      .range(offset, offset + pageSize - 1);

    let { data, error } = await query;

    if (error && tab === "penta") {
      // Fallback: tüm kolonlar, sonra uygun alanı seç
      const alt = await supabase
        .from(cfg.table)
        .select("*")
        .range(offset, offset + pageSize - 1);
      data = alt.data as any[] | null;
      error = alt.error as any;
    }

    if (error) throw error;
    const rows = (data || []) as any[];
    for (const r of rows) {
      const raw = r[categoryColumn] ?? r.category ?? r.categoryCode;
      if (raw === null || raw === undefined) continue;
      const value = String(raw).trim();
      if (!value) continue;
      // Bayinet: bilinmeyen kodları ayırt etmek için "Diğer (XX)" olarak göster
      const display =
        tab === "penta" ? formatBayinetCategoryDisplay(value) : value;
      set.add(display);
    }

    if (rows.length < pageSize) break; // son sayfa
    offset += pageSize;
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
}
