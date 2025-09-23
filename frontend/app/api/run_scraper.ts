import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const ghRes = await fetch(
      "https://api.github.com/repos/oguzyucel1/ComProSearch/actions/workflows/oksid.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `token ${process.env.GH_TOKEN}`, // PAT
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          ref: "main", // veya hangi branch’te workflow varsa
        }),
      }
    );

    if (!ghRes.ok) {
      const text = await ghRes.text();
      return res.status(ghRes.status).json({ message: text });
    }

    return res.status(200).json({ message: "Scraper workflow triggered 🚀" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}
