// Dosya Yolu: supabase/functions/shopping-search/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Bu fonksiyon, Serper API'sini güvenli bir şekilde çağırır ve
// sadece belirli alanları seçerek React tarafına döndürür.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Serper'dan gelen ham veri için bir tip tanımı
interface SerperShoppingItem {
  title: string;
  link: string;
  price: string;
  imageUrl: string;
  rating?: number;
  ratingCount?: number;
}

serve(async (req) => {
  // Tarayıcıların CORS için yaptığı OPTIONS isteğini yönetir
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const q = requestBody.q;

    if (!q) {
      throw new Error("Arama sorgusu ('q') zorunludur.");
    }

    const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");
    if (!SERPER_API_KEY) {
      throw new Error("API anahtarı yapılandırılmamış.");
    }

    const payload = {
      q: q,
      location: "Turkey",
      gl: "tr",
      num: 20,
    };

    const response = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API isteği başarısız: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();

    // Gelen ham veriyi işleyip sadece istediğimiz alanları seçiyoruz.
    const mappedResults = (data.shopping || []).map((item: SerperShoppingItem) => ({
      title: item.title,
      link: item.link,
      price: item.price,
      imageUrl: item.imageUrl,
      rating: item.rating,
    }));

    return new Response(JSON.stringify({ shopping: mappedResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});