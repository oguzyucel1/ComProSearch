import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ service role key
);

export async function POST(req: Request) {
  try {
    const { marketplace } = await req.json();

    // Job ekle
    // Job ekle
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({ marketplace, status: "pending" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 👇 job_id'yi de workflow'a gönder
    const ghRes = await fetch(
      `https://api.github.com/repos/${process.env.GH_REPO}/actions/workflows/oksid.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            marketplace,
            job_id: job.id, // ✅ ekledik
          },
        }),
      }
    );

    if (!ghRes.ok) {
      const details = await ghRes.text(); // 👈 detaylı hata göreceğiz
      console.error("GitHub Actions hatası:", details);
      return NextResponse.json(
        { error: "GitHub Actions tetiklenemedi", details },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Beklenmeyen hata", details: err.message },
      { status: 500 }
    );
  }
}
