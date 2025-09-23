import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { marketplace } = await req.json();

  const { data, error } = await supabase
    .from("jobs")
    .insert({ marketplace, status: "pending" })
    .select()
    .single();

  if (error) return new Response(JSON.stringify(error), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
}
