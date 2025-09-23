import { NextResponse } from "next/server";

export async function POST() {
  try {
    const ghRes = await fetch(
      "https://api.github.com/repos/oguzyucel1/ComProSearch/actions/workflows/oksid.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GH_TOKEN}`, // ✅ Token env’den
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          ref: "main", // ✅ branch adını buraya yaz (main / master / dev)
          inputs: {
            marketplace: "oksid",
          },
        }),
      }
    );

    if (!ghRes.ok) {
      const text = await ghRes.text();
      return NextResponse.json({ message: text }, { status: ghRes.status });
    }

    return NextResponse.json({
      message: "🚀 Scraper workflow triggered, Supabase güncellenecek!",
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
