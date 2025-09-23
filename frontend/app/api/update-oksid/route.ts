import { NextResponse } from "next/server";

export async function POST() {
  try {
    const GH_TOKEN = process.env.GH_TOKEN; // PAT (repo permissions: actions, workflow)
    const REPO = "oguzyucel1/ComProSearch";

    const res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/oksid.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          ref: "main", // workflow hangi branch’te çalışacak
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Workflow başlatılamadı: ${errorText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Oksid güncelleme başlatıldı 🚀",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Beklenmedik hata: " + (error as Error).message },
      { status: 500 }
    );
  }
}
