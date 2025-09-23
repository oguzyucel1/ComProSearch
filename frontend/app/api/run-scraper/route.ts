import { NextResponse } from "next/server";

export async function POST() {
  try {
    const ghRes = await fetch(
      "https://api.github.com/repos/oguzyucel1/ComProSearch/actions/workflows/oksid.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `token ${process.env.GH_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          ref: "main", // branch adın neyse onu yaz
          inputs: {
            marketplace: "oksid",
            job_id: "manual_run", // ✅ required input buraya
          },
        }),
      }
    );

    if (!ghRes.ok) {
      const text = await ghRes.text();
      return NextResponse.json({ message: text }, { status: ghRes.status });
    }

    return NextResponse.json({ message: "Scraper workflow triggered 🚀" });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
