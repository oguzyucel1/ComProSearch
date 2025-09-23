import {
  supabase,
  Category,
  Product,
  TABLE_NAMES,
  StoreType,
  BayinetProduct,
  DengeProduct,
  OksidProduct,
} from "./supabase";

// Bayinet verilerini normalize et
function normalizeBayinetProduct(item: BayinetProduct): Product {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    category_id: undefined, // Artık category_id yok, category string olarak var
    store: "bayinet",
    image_url: item.image_url,
    description: item.description,
    stock_status: item.stock_status,
  };
}

// Denge verilerini normalize et
function normalizeDengeProduct(item: DengeProduct): Product {
  return {
    id: item.id,
    name: item.product_name, // Farklı alan adı
    price: item.cost, // Farklı alan adı
    category_id: undefined, // Artık category_id yok, category string olarak var
    store: "denge",
    image_url: item.image, // Farklı alan adı
    description: item.details, // Farklı alan adı
    stock_status: item.availability, // Farklı alan adı
  };
}

// Oksid verilerini normalize et - Gerçek şema
function normalizeOksidProduct(item: OksidProduct): Product {
  return {
    id: item.id.toString(), // number'dan string'e çevir
    name: item.name || "İsimsiz Ürün", // null olabilir
    price: item.price_1 || item.price_2 || undefined, // İki fiyat alanından birini kullan
    category_id: undefined, // category string olarak geliyor, id yok
    store: "oksid",
    image_url: undefined, // Şemada resim alanı yok
    description: item.url || undefined, // URL'yi açıklama olarak kullan
    stock_status: item.stock || undefined,
    created_at: item.created_at || undefined,
  };
}

// Kategorileri ürün tablolarından çek - Her mağaza için
export async function getCategoriesByStore(store: string): Promise<Category[]> {
  try {
    const storeKey = store.toLowerCase() as StoreType;

    switch (storeKey) {
      case "bayinet":
        return await getBayinetCategoriesFromProducts();
      case "denge":
        return await getDengeCategoriesFromProducts();
      case "oksid":
        return await getOksidCategoriesFromProducts();
      default:
        console.error(`Unknown store: ${store}`);
        return [];
    }
  } catch (error) {
    console.error("Error in getCategoriesByStore:", error);
    return [];
  }
}

// Bayinet için ürünlerden benzersiz kategori listesi çek
async function getBayinetCategoriesFromProducts(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("bayinet_products")
      .select("category")
      .not("category", "is", null)
      .order("category");

    if (error) {
      console.error("Error fetching Bayinet categories from products:", error);
      return [];
    }

    if (!data) return [];

    // Benzersiz kategorileri çıkar ve normalize et
    const uniqueCategories = [...new Set(data.map((item) => item.category))];

    return uniqueCategories
      .filter((category) => category) // null/undefined'ları filtrele
      .map((category, index) => ({
        id: (index + 1).toString(),
        name: category!,
        store: "bayinet",
      }));
  } catch (error) {
    console.error("Error in getBayinetCategoriesFromProducts:", error);
    return [];
  }
}

// Denge için ürünlerden benzersiz kategori listesi çek
async function getDengeCategoriesFromProducts(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("denge_products")
      .select("category")
      .not("category", "is", null)
      .order("category");

    if (error) {
      console.error("Error fetching Denge categories from products:", error);
      return [];
    }

    if (!data) return [];

    // Benzersiz kategorileri çıkar ve normalize et
    const uniqueCategories = [...new Set(data.map((item) => item.category))];

    return uniqueCategories
      .filter((category) => category) // null/undefined'ları filtrele
      .map((category, index) => ({
        id: (index + 1).toString(),
        name: category!,
        store: "denge",
      }));
  } catch (error) {
    console.error("Error in getDengeCategoriesFromProducts:", error);
    return [];
  }
}

// Oksid için ürünlerden benzersiz kategori listesi çek
async function getOksidCategoriesFromProducts(): Promise<Category[]> {
  try {
    // Sayfalama ile tüm kategori verilerini çek
    // İlk önce distinct kategorileri çekelim - bu performansı artırır
    const { data: distinctData, error: distinctError } = await supabase.rpc(
      "get_distinct_oksid_categories"
    );

    // RPC fonksiyonu kullanılabilir değilse (oluşturulmadıysa), tüm verileri çekerek manuel olarak ayrıştıralım
    if (distinctError || !distinctData) {
      console.log(
        "Distinct RPC fonksiyonu kullanılamıyor, manuel yöntem kullanılıyor..."
      );

      // Sayfa sayfa veri çekelim (paginasyon)
      let allCategories: Array<string> = [];
      let hasMoreData = true;
      let offset = 0;
      const pageSize = 1000;

      while (hasMoreData) {
        const { data: pageData, error: pageError } = await supabase
          .from("oksid_products")
          .select("category")
          .not("category", "is", null)
          .range(offset, offset + pageSize - 1);

        if (pageError) {
          console.error(
            `Error fetching Oksid categories (page ${offset / pageSize + 1}):`,
            pageError
          );
          break;
        }

        if (!pageData || pageData.length === 0) {
          hasMoreData = false;
          break;
        }

        // Bu sayfadaki kategorileri ekle
        const pageCategories = pageData.map(
          (item: { category: string }) => item.category
        );
        allCategories = [...allCategories, ...pageCategories];

        // Sonraki sayfa için offset'i güncelle
        offset += pageSize;

        // Son sayfaya ulaştıysak döngüden çık
        if (pageData.length < pageSize) {
          hasMoreData = false;
        }

        console.log(
          `Oksid kategorileri sayfa ${offset / pageSize} yüklendi. ${
            pageData.length
          } ürün, toplam şu ana kadar: ${allCategories.length}`
        );
      }

      // Benzersiz kategorileri çıkar
      const uniqueCategories = [...new Set(allCategories)]
        .filter((category: string | null | undefined) => category) // null/undefined'ları filtrele
        .sort((a: string, b: string) => {
          // Türkçe karakterleri doğru sıralamak için localeCompare kullan
          return a.localeCompare(b, "tr-TR", {
            sensitivity: "base",
            numeric: true,
          });
        });

      console.log(
        `Toplam ${uniqueCategories.length} benzersiz Oksid kategorisi bulundu.`
      );

      return uniqueCategories.map((category: string, index: number) => ({
        id: (index + 1).toString(),
        name: category,
        store: "oksid",
      }));
    } else {
      // RPC fonksiyonu başarıyla çalıştı, benzersiz kategorileri dönelim
      const uniqueCategories = distinctData
        .filter((category: string | null | undefined) => category) // null/undefined'ları filtrele
        .sort((a: string, b: string) => {
          // Türkçe karakterleri doğru sıralamak için localeCompare kullan
          return a.localeCompare(b, "tr-TR", {
            sensitivity: "base",
            numeric: true,
          });
        });

      console.log(
        `RPC ile ${uniqueCategories.length} benzersiz Oksid kategorisi bulundu.`
      );

      return uniqueCategories.map((category: string, index: number) => ({
        id: (index + 1).toString(),
        name: category,
        store: "oksid",
      }));
    }
  } catch (error) {
    console.error("Error in getOksidCategoriesFromProducts:", error);
    return [];
  }
}

// Ürünleri isme göre ara
export async function searchProductsByName(
  searchTerm: string,
  store?: string
): Promise<Product[]> {
  try {
    if (!store) {
      // Tüm mağazalarda ara
      const allResults = await Promise.all([
        searchInStore(searchTerm, "bayinet"),
        searchInStore(searchTerm, "denge"),
        searchInStore(searchTerm, "oksid"),
      ]);
      return allResults.flat();
    }

    return await searchInStore(searchTerm, store.toLowerCase() as StoreType);
  } catch (error) {
    console.error("Error in searchProductsByName:", error);
    return [];
  }
}

// Belirli bir mağazada arama yap
async function searchInStore(
  searchTerm: string,
  storeKey: StoreType
): Promise<Product[]> {
  try {
    const tableName = TABLE_NAMES[storeKey]?.products;

    if (!tableName) {
      console.error(`Unknown store: ${storeKey}`);
      return [];
    }

    // Her mağaza için farklı alan adlarıyla arama yap
    let query;
    switch (storeKey) {
      case "bayinet":
        query = supabase
          .from(tableName)
          .select("*")
          .ilike("name", `%${searchTerm}%`)
          .order("name");
        break;
      case "denge":
        query = supabase
          .from(tableName)
          .select("*")
          .ilike("product_name", `%${searchTerm}%`)
          .order("product_name");
        break;
      case "oksid":
        query = supabase
          .from(tableName)
          .select("*")
          .ilike("name", `%${searchTerm}%`) // Gerçek şemada 'name' alanı var
          .order("name");
        break;
      default:
        return [];
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error searching products in ${storeKey}:`, error);
      return [];
    }

    if (!data) return [];

    // Her mağaza için uygun normalize fonksiyonunu kullan
    switch (storeKey) {
      case "bayinet":
        return (data as BayinetProduct[]).map(normalizeBayinetProduct);
      case "denge":
        return (data as DengeProduct[]).map(normalizeDengeProduct);
      case "oksid":
        return (data as OksidProduct[]).map(normalizeOksidProduct);
      default:
        return [];
    }
  } catch (error) {
    console.error(`Error in searchInStore for ${storeKey}:`, error);
    return [];
  }
}

// Ürünleri kategoriye göre getir
export async function getProductsByCategory(
  categoryId: string,
  store?: string
): Promise<Product[]> {
  try {
    if (!store) {
      // Tüm mağazalarda ara
      const allResults = await Promise.all([
        getProductsByCategoryInStore(categoryId, "bayinet"),
        getProductsByCategoryInStore(categoryId, "denge"),
        getProductsByCategoryInStore(categoryId, "oksid"),
      ]);
      return allResults.flat();
    }

    return await getProductsByCategoryInStore(
      categoryId,
      store.toLowerCase() as StoreType
    );
  } catch (error) {
    console.error("Error in getProductsByCategory:", error);
    return [];
  }
}

// Belirli bir mağazada kategoriye göre ürün getir
async function getProductsByCategoryInStore(
  categoryId: string,
  storeKey: StoreType
): Promise<Product[]> {
  try {
    const tableName = TABLE_NAMES[storeKey]?.products;

    if (!tableName) {
      console.error(`Unknown store: ${storeKey}`);
      return [];
    }

    // Her mağaza için kategori adıyla arama yap
    let query;
    switch (storeKey) {
      case "bayinet":
        query = supabase
          .from(tableName)
          .select("*")
          .eq("category", categoryId) // Artık hepsi 'category' alanı kullanıyor
          .order("name");
        break;
      case "denge":
        query = supabase
          .from(tableName)
          .select("*")
          .eq("category", categoryId) // Artık hepsi 'category' alanı kullanıyor
          .order("product_name");
        break;
      case "oksid":
        query = supabase
          .from(tableName)
          .select("*")
          .eq("category", categoryId) // Gerçek şemada 'category' alanı var
          .order("name");
        break;
      default:
        return [];
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        `Error fetching products by category in ${storeKey}:`,
        error
      );
      return [];
    }

    if (!data) return [];

    // Her mağaza için uygun normalize fonksiyonunu kullan
    switch (storeKey) {
      case "bayinet":
        return (data as BayinetProduct[]).map(normalizeBayinetProduct);
      case "denge":
        return (data as DengeProduct[]).map(normalizeDengeProduct);
      case "oksid":
        return (data as OksidProduct[]).map(normalizeOksidProduct);
      default:
        return [];
    }
  } catch (error) {
    console.error(
      `Error in getProductsByCategoryInStore for ${storeKey}:`,
      error
    );
    return [];
  }
}

// Tüm mağazalarda ürün karşılaştırması
export async function compareProductsAcrossStores(
  searchTerm: string
): Promise<Product[]> {
  try {
    // Tüm mağazalarda paralel arama yap
    const allResults = await Promise.all([
      searchInStore(searchTerm, "bayinet"),
      searchInStore(searchTerm, "denge"),
      searchInStore(searchTerm, "oksid"),
    ]);

    // Sonuçları birleştir ve fiyata göre sırala
    return allResults.flat().sort((a, b) => {
      // Önce mağazaya göre sırala, sonra fiyata göre
      if (a.store !== b.store) {
        return a.store.localeCompare(b.store);
      }
      return (a.price || 0) - (b.price || 0);
    });
  } catch (error) {
    console.error("Error in compareProductsAcrossStores:", error);
    return [];
  }
}
