import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service_role key şart
);

export async function POST(req: Request) {
  try {
    const { marketplace } = await req.json();

    // Şimdilik sadece oksid destekleniyor
    if (marketplace !== "oksid") {
      return new Response(
        JSON.stringify({ error: "Şimdilik sadece oksid destekleniyor." }),
        { status: 400 }
      );
    }

    // 1. Supabase'e job ekle
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({ marketplace, status: "pending", progress: 0 })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify(error), { status: 500 });
    }

    // 2. GitHub Actions workflow tetikle
    const ghRes = await fetch(
      `https://api.github.com/repos/${process.env.GH_REPO}/actions/workflows/oksid.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GH_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: { job_id: job.id },
        }),
      }
    );

    if (!ghRes.ok) {
      const err = await ghRes.text();
      console.error("GitHub API error:", err);
      return new Response(
        JSON.stringify({ error: "GitHub Actions tetiklenemedi", details: err }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify(job), { status: 200 });
  } catch (err: any) {
    console.error("start-job error:", err);
    return new Response(
      JSON.stringify({ error: "start-job hata", details: err.message }),
      { status: 500 }
    );
  }
}
