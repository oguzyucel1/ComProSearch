(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn() {
    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){
        inputs[_key] = arguments[_key];
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
    variants: {
        variant: {
            default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
            destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
            outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
            secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
            ghost: "hover:bg-slate-100 hover:text-slate-900",
            link: "text-slate-900 underline-offset-4 hover:underline"
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = (param, ref)=>{
    let { className, variant, size, ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/button.tsx",
        lineNumber: 41,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Button;
Button.displayName = "Button";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TABLE_NAMES",
    ()=>TABLE_NAMES,
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://wkavtbgrmwrqjdlaudkp.supabase.co");
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYXZ0YmdybXdycWpkbGF1ZGtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MzgxNzYsImV4cCI6MjA3NDExNDE3Nn0.8SWmeMD1eOgsb8l287Blz9WX7P1tl8tor2qd0dNKW-k");
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey);
const TABLE_NAMES = {
    bayinet: {
        products: "bayinet_products"
    },
    denge: {
        products: "denge_products"
    },
    oksid: {
        products: "oksid_products"
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/database.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compareProductsAcrossStores",
    ()=>compareProductsAcrossStores,
    "getCategoriesByStore",
    ()=>getCategoriesByStore,
    "getProductsByCategory",
    ()=>getProductsByCategory,
    "searchProductsByName",
    ()=>searchProductsByName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-client] (ecmascript)");
;
// Bayinet verilerini normalize et
function normalizeBayinetProduct(item) {
    return {
        id: item.id,
        name: item.name,
        price: item.price,
        category_id: undefined,
        store: "bayinet",
        image_url: item.image_url,
        description: item.description,
        stock_status: item.stock_status
    };
}
// Denge verilerini normalize et
function normalizeDengeProduct(item) {
    return {
        id: item.id,
        name: item.product_name,
        price: item.cost,
        category_id: undefined,
        store: "denge",
        image_url: item.image,
        description: item.details,
        stock_status: item.availability
    };
}
// Oksid verilerini normalize et - Gerçek şema
function normalizeOksidProduct(item) {
    return {
        id: item.id.toString(),
        name: item.name || "İsimsiz Ürün",
        price: item.price_1 || item.price_2 || undefined,
        category_id: undefined,
        store: "oksid",
        image_url: undefined,
        description: item.url || undefined,
        stock_status: item.stock || undefined,
        created_at: item.created_at || undefined
    };
}
async function getCategoriesByStore(store) {
    try {
        const storeKey = store.toLowerCase();
        switch(storeKey){
            case "bayinet":
                return await getBayinetCategoriesFromProducts();
            case "denge":
                return await getDengeCategoriesFromProducts();
            case "oksid":
                return await getOksidCategoriesFromProducts();
            default:
                console.error("Unknown store: ".concat(store));
                return [];
        }
    } catch (error) {
        console.error("Error in getCategoriesByStore:", error);
        return [];
    }
}
// Bayinet için ürünlerden benzersiz kategori listesi çek
async function getBayinetCategoriesFromProducts() {
    try {
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from("bayinet_products").select("category").not("category", "is", null).order("category");
        if (error) {
            console.error("Error fetching Bayinet categories from products:", error);
            return [];
        }
        if (!data) return [];
        // Benzersiz kategorileri çıkar ve normalize et
        const uniqueCategories = [
            ...new Set(data.map((item)=>item.category))
        ];
        return uniqueCategories.filter((category)=>category) // null/undefined'ları filtrele
        .map((category, index)=>({
                id: (index + 1).toString(),
                name: category,
                store: "bayinet"
            }));
    } catch (error) {
        console.error("Error in getBayinetCategoriesFromProducts:", error);
        return [];
    }
}
// Denge için ürünlerden benzersiz kategori listesi çek
async function getDengeCategoriesFromProducts() {
    try {
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from("denge_products").select("category").not("category", "is", null).order("category");
        if (error) {
            console.error("Error fetching Denge categories from products:", error);
            return [];
        }
        if (!data) return [];
        // Benzersiz kategorileri çıkar ve normalize et
        const uniqueCategories = [
            ...new Set(data.map((item)=>item.category))
        ];
        return uniqueCategories.filter((category)=>category) // null/undefined'ları filtrele
        .map((category, index)=>({
                id: (index + 1).toString(),
                name: category,
                store: "denge"
            }));
    } catch (error) {
        console.error("Error in getDengeCategoriesFromProducts:", error);
        return [];
    }
}
// Oksid için ürünlerden benzersiz kategori listesi çek
async function getOksidCategoriesFromProducts() {
    try {
        // Sayfalama ile tüm kategori verilerini çek
        // İlk önce distinct kategorileri çekelim - bu performansı artırır
        const { data: distinctData, error: distinctError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].rpc("get_distinct_oksid_categories");
        // RPC fonksiyonu kullanılabilir değilse (oluşturulmadıysa), tüm verileri çekerek manuel olarak ayrıştıralım
        if (distinctError || !distinctData) {
            console.log("Distinct RPC fonksiyonu kullanılamıyor, manuel yöntem kullanılıyor...");
            // Sayfa sayfa veri çekelim (paginasyon)
            let allCategories = [];
            let hasMoreData = true;
            let offset = 0;
            const pageSize = 1000;
            while(hasMoreData){
                const { data: pageData, error: pageError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from("oksid_products").select("category").not("category", "is", null).range(offset, offset + pageSize - 1);
                if (pageError) {
                    console.error("Error fetching Oksid categories (page ".concat(offset / pageSize + 1, "):"), pageError);
                    break;
                }
                if (!pageData || pageData.length === 0) {
                    hasMoreData = false;
                    break;
                }
                // Bu sayfadaki kategorileri ekle
                const pageCategories = pageData.map((item)=>item.category);
                allCategories = [
                    ...allCategories,
                    ...pageCategories
                ];
                // Sonraki sayfa için offset'i güncelle
                offset += pageSize;
                // Son sayfaya ulaştıysak döngüden çık
                if (pageData.length < pageSize) {
                    hasMoreData = false;
                }
                console.log("Oksid kategorileri sayfa ".concat(offset / pageSize, " yüklendi. ").concat(pageData.length, " ürün, toplam şu ana kadar: ").concat(allCategories.length));
            }
            // Benzersiz kategorileri çıkar
            const uniqueCategories = [
                ...new Set(allCategories)
            ].filter((category)=>category) // null/undefined'ları filtrele
            .sort((a, b)=>{
                // Türkçe karakterleri doğru sıralamak için localeCompare kullan
                return a.localeCompare(b, "tr-TR", {
                    sensitivity: "base",
                    numeric: true
                });
            });
            console.log("Toplam ".concat(uniqueCategories.length, " benzersiz Oksid kategorisi bulundu."));
            return uniqueCategories.map((category, index)=>({
                    id: (index + 1).toString(),
                    name: category,
                    store: "oksid"
                }));
        } else {
            // RPC fonksiyonu başarıyla çalıştı, benzersiz kategorileri dönelim
            const uniqueCategories = distinctData.filter((category)=>category) // null/undefined'ları filtrele
            .sort((a, b)=>{
                // Türkçe karakterleri doğru sıralamak için localeCompare kullan
                return a.localeCompare(b, "tr-TR", {
                    sensitivity: "base",
                    numeric: true
                });
            });
            console.log("RPC ile ".concat(uniqueCategories.length, " benzersiz Oksid kategorisi bulundu."));
            return uniqueCategories.map((category, index)=>({
                    id: (index + 1).toString(),
                    name: category,
                    store: "oksid"
                }));
        }
    } catch (error) {
        console.error("Error in getOksidCategoriesFromProducts:", error);
        return [];
    }
}
async function searchProductsByName(searchTerm, store) {
    try {
        if (!store) {
            // Tüm mağazalarda ara
            const allResults = await Promise.all([
                searchInStore(searchTerm, "bayinet"),
                searchInStore(searchTerm, "denge"),
                searchInStore(searchTerm, "oksid")
            ]);
            return allResults.flat();
        }
        return await searchInStore(searchTerm, store.toLowerCase());
    } catch (error) {
        console.error("Error in searchProductsByName:", error);
        return [];
    }
}
// Belirli bir mağazada arama yap
async function searchInStore(searchTerm, storeKey) {
    try {
        var _TABLE_NAMES_storeKey;
        const tableName = (_TABLE_NAMES_storeKey = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TABLE_NAMES"][storeKey]) === null || _TABLE_NAMES_storeKey === void 0 ? void 0 : _TABLE_NAMES_storeKey.products;
        if (!tableName) {
            console.error("Unknown store: ".concat(storeKey));
            return [];
        }
        // Her mağaza için farklı alan adlarıyla arama yap
        let query;
        switch(storeKey){
            case "bayinet":
                query = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from(tableName).select("*").ilike("name", "%".concat(searchTerm, "%")).order("name");
                break;
            case "denge":
                query = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from(tableName).select("*").ilike("product_name", "%".concat(searchTerm, "%")).order("product_name");
                break;
            case "oksid":
                query = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from(tableName).select("*").ilike("name", "%".concat(searchTerm, "%")) // Gerçek şemada 'name' alanı var
                .order("name");
                break;
            default:
                return [];
        }
        const { data, error } = await query;
        if (error) {
            console.error("Error searching products in ".concat(storeKey, ":"), error);
            return [];
        }
        if (!data) return [];
        // Her mağaza için uygun normalize fonksiyonunu kullan
        switch(storeKey){
            case "bayinet":
                return data.map(normalizeBayinetProduct);
            case "denge":
                return data.map(normalizeDengeProduct);
            case "oksid":
                return data.map(normalizeOksidProduct);
            default:
                return [];
        }
    } catch (error) {
        console.error("Error in searchInStore for ".concat(storeKey, ":"), error);
        return [];
    }
}
async function getProductsByCategory(categoryId, store) {
    try {
        if (!store) {
            // Tüm mağazalarda ara
            const allResults = await Promise.all([
                getProductsByCategoryInStore(categoryId, "bayinet"),
                getProductsByCategoryInStore(categoryId, "denge"),
                getProductsByCategoryInStore(categoryId, "oksid")
            ]);
            return allResults.flat();
        }
        return await getProductsByCategoryInStore(categoryId, store.toLowerCase());
    } catch (error) {
        console.error("Error in getProductsByCategory:", error);
        return [];
    }
}
// Belirli bir mağazada kategoriye göre ürün getir
async function getProductsByCategoryInStore(categoryId, storeKey) {
    try {
        var _TABLE_NAMES_storeKey;
        const tableName = (_TABLE_NAMES_storeKey = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TABLE_NAMES"][storeKey]) === null || _TABLE_NAMES_storeKey === void 0 ? void 0 : _TABLE_NAMES_storeKey.products;
        if (!tableName) {
            console.error("Unknown store: ".concat(storeKey));
            return [];
        }
        // Her mağaza için kategori adıyla arama yap
        let query;
        switch(storeKey){
            case "bayinet":
                query = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from(tableName).select("*").eq("category", categoryId) // Artık hepsi 'category' alanı kullanıyor
                .order("name");
                break;
            case "denge":
                query = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from(tableName).select("*").eq("category", categoryId) // Artık hepsi 'category' alanı kullanıyor
                .order("product_name");
                break;
            case "oksid":
                query = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from(tableName).select("*").eq("category", categoryId) // Gerçek şemada 'category' alanı var
                .order("name");
                break;
            default:
                return [];
        }
        const { data, error } = await query;
        if (error) {
            console.error("Error fetching products by category in ".concat(storeKey, ":"), error);
            return [];
        }
        if (!data) return [];
        // Her mağaza için uygun normalize fonksiyonunu kullan
        switch(storeKey){
            case "bayinet":
                return data.map(normalizeBayinetProduct);
            case "denge":
                return data.map(normalizeDengeProduct);
            case "oksid":
                return data.map(normalizeOksidProduct);
            default:
                return [];
        }
    } catch (error) {
        console.error("Error in getProductsByCategoryInStore for ".concat(storeKey, ":"), error);
        return [];
    }
}
async function compareProductsAcrossStores(searchTerm) {
    try {
        // Tüm mağazalarda paralel arama yap
        const allResults = await Promise.all([
            searchInStore(searchTerm, "bayinet"),
            searchInStore(searchTerm, "denge"),
            searchInStore(searchTerm, "oksid")
        ]);
        // Sonuçları birleştir ve fiyata göre sırala
        return allResults.flat().sort((a, b)=>{
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ComproAppUI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/database.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ComproAppUI() {
    _s();
    const [activeMethod, setActiveMethod] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("searchByStore");
    const [selectedStore, setSelectedStore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("Bayinet");
    const [searchMethod, setSearchMethod] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("searchByName");
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedCategory, setSelectedCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Supabase state'leri
    const [categories, setCategories] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Progress bar state
    const [jobId, setJobId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [progress, setProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Kategorileri yükle
    const loadCategories = async (store)=>{
        setLoading(true);
        setError(null);
        try {
            const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCategoriesByStore"])(store);
            setCategories(data);
        } catch (err) {
            setError("Kategoriler yüklenirken hata oluştu");
            console.error("Error loading categories:", err);
        } finally{
            setLoading(false);
        }
    };
    // Mağaza değiştiğinde kategorileri yükle
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ComproAppUI.useEffect": ()=>{
            loadCategories(selectedStore);
        }
    }["ComproAppUI.useEffect"], [
        selectedStore
    ]);
    // Ürün arama fonksiyonu
    const handleSearch = async ()=>{
        if (!searchTerm.trim()) return;
        setLoading(true);
        setError(null);
        try {
            let data = [];
            if (activeMethod === "compare") {
                data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compareProductsAcrossStores"])(searchTerm);
            } else {
                data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchProductsByName"])(searchTerm, selectedStore);
            }
            setProducts(data);
        } catch (err) {
            setError("Ürünler aranırken hata oluştu");
            console.error("Error searching products:", err);
        } finally{
            setLoading(false);
        }
    };
    // Kategori seçimi fonksiyonu
    const handleCategorySelect = async ()=>{
        if (!selectedCategory) return;
        setLoading(true);
        setError(null);
        try {
            let categoryIdentifier = selectedCategory;
            if (selectedStore.toLowerCase() === "oksid") {
                const selectedCat = categories.find((cat)=>cat.name === selectedCategory);
                categoryIdentifier = selectedCat ? selectedCat.name : selectedCategory;
            }
            const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getProductsByCategory"])(categoryIdentifier, selectedStore);
            setProducts(data);
        } catch (err) {
            setError("Kategori ürünleri yüklenirken hata oluştu");
            console.error("Error loading category products:", err);
        } finally{
            setLoading(false);
        }
    };
    // ✅ Oksid güncelle butonu (progress ile)
    const handleOksidUpdate = async ()=>{
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/start-job", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    marketplace: "oksid"
                })
            });
            const result = await response.json();
            if (response.ok) {
                setJobId(result.id);
                setStatus(result.status);
                setProgress(0);
                // progress poller başlat
                const interval = setInterval(async ()=>{
                    const res = await fetch("/api/job-status?id=".concat(result.id));
                    const job = await res.json();
                    setProgress(job.progress);
                    setStatus(job.status);
                    if (job.status === "done" || job.status === "failed") {
                        clearInterval(interval);
                    }
                }, 2000);
            } else {
                throw new Error(result.error || "Güncelleme başlatılamadı");
            }
        } catch (error) {
            console.error("Oksid güncelleme hatası:", error);
            setError("Oksid güncelleme sırasında hata oluştu: " + error.message);
        } finally{
            setLoading(false);
        }
    };
    // Dummy kategoriler (Bayinet/Denge için)
    const bayinetCategories = [
        {
            id: "01",
            name: "Bilgisayar Bileşenleri"
        },
        {
            id: "02",
            name: "Kişisel Bilgisayar"
        },
        {
            id: "10",
            name: "Ağ Ürünleri"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-6xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-4xl font-bold text-white mb-8 text-center",
                    children: "✨ ComPro Ürün Arama"
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 156,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-8 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-600",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-semibold text-white mb-4 text-center",
                            children: "🔄 Veritabanı Güncellemeleri"
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 162,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                onClick: handleOksidUpdate,
                                disabled: loading,
                                className: "bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg",
                                children: loading ? "⏳ Güncelleniyor..." : "🔄 Oksid Güncelle"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 166,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 165,
                            columnNumber: 11
                        }, this),
                        jobId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-full bg-gray-200 rounded h-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-green-500 h-4 rounded",
                                        style: {
                                            width: "".concat(progress, "%")
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 179,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 178,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-2 text-white text-center",
                                    children: [
                                        status,
                                        " - ",
                                        progress,
                                        "%"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 184,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 177,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 161,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 155,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 154,
        columnNumber: 5
    }, this);
}
_s(ComproAppUI, "Yv6YasjIKzeMqzjjvYkIONGHIto=");
_c = ComproAppUI;
var _c;
__turbopack_context__.k.register(_c, "ComproAppUI");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_a6a0fae7._.js.map