# ComProSearch - Çoklu Mağaza Ürün Arama Sistemi

Bu proje, farklı mağazalardan (Bayinet, Denge, Oksid) ürün arama ve karşılaştırma yapmanıza olanak sağlayan bir Next.js uygulamasıdır.

## 🏗️ Veritabanı Yapısı

Sistemde 3 ayrı ürün tablosu bulunmaktadır. **Ayrı kategori tabloları yoktur** - kategoriler her ürün tablosunun içinde `category` alanı olarak tutulur:

### Bayinet Tablosu

```sql
-- bayinet_products
CREATE TABLE bayinet_products (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  price DECIMAL,
  category VARCHAR, -- Kategori doğrudan burada
  image_url VARCHAR,
  description TEXT,
  stock_status VARCHAR
);
```

### Denge Tablosu

```sql
-- denge_products
CREATE TABLE denge_products (
  id VARCHAR PRIMARY KEY,
  product_name VARCHAR NOT NULL, -- Farklı alan adı
  cost DECIMAL,                  -- Farklı alan adı (price yerine)
  category VARCHAR,              -- Kategori doğrudan burada
  image VARCHAR,                 -- Farklı alan adı (image_url yerine)
  details TEXT,                  -- Farklı alan adı (description yerine)
  availability VARCHAR           -- Farklı alan adı (stock_status yerine)
);
```

### Oksid Tablosu (Gerçek Şema)

```sql
-- oksid_products (gerçek tablo şeması)
CREATE TABLE public.oksid_products (
  id bigserial NOT NULL,
  name text NULL,
  url text NULL,
  price_1 double precision NULL,
  price_2 double precision NULL,
  currency text NULL,
  stock text NULL,
  category text NULL, -- Kategori doğrudan burada
  created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
```

## 🚀 Kurulum

1. **Bağımlılıkları yükleyin:**

   ```bash
   npm install
   ```

2. **Environment variables ayarlayın:**
   `.env.local` dosyasında Supabase bilgilerinizi güncelleyin:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```

## ✨ Özellikler

- **Çoklu Mağaza Desteği**: Her mağaza için farklı tablolar ve alan adları
- **Dinamik Kategori Listesi**: Seçilen mağazaya göre kategoriler otomatik yüklenir
- **Ürün Arama**: İsimle arama ve kategoriye göre filtreleme
- **Mağaza Karşılaştırması**: Tüm mağazalarda ürün karşılaştırma
- **Responsive Tasarım**: Mobil ve desktop uyumlu arayüz
- **Hata Yönetimi**: Kullanıcı dostu hata mesajları
- **Loading Durumları**: Yükleme animasyonları

## 🔧 Teknik Detaylar

### Veri Normalize Edilmesi

Her mağazanın farklı alan adlarına sahip olması nedeniyle, veriler ortak bir formata normalize edilir:

```typescript
interface Category {
  id: string;
  name: string;
  store: string;
}

interface Product {
  id: string;
  name: string;
  price?: number;
  category_id?: string;
  store: string;
  image_url?: string;
  description?: string;
  stock_status?: string;
}
```

### Tablo Mapping

```typescript
const TABLE_NAMES = {
  bayinet: {
    categories: "bayinet_categories",
    products: "bayinet_products",
  },
  denge: {
    categories: "denge_categories",
    products: "denge_products",
  },
  oksid: {
    categories: "oksid_categories",
    products: "oksid_products",
  },
};
```

## 📱 Kullanım

1. **Mağaza Seçimi**: Bayinet, Denge veya Oksid'den birini seçin
2. **Arama Yöntemi**: İsimle ara veya kategoriye göre filtrele
3. **Ürün Arama**: Arama terimini girin ve "Ara" butonuna basın
4. **Karşılaştırma**: Tüm mağazalarda aynı anda ürün arayın

## 🛠️ Teknolojiler

- **Next.js 15** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Supabase** - Veritabanı ve backend
- **Radix UI** - UI bileşenleri

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
