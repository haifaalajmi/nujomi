import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPayment } from "@/lib/myfatoorah";

const UPGRADE_PRICE_KWD = 3;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id, full_name, email")
    .eq("id", user.id)
    .single();
  if (!profile?.family_id) {
    return NextResponse.json({ error: "No family found for this account" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const reference = crypto.randomUUID();

  try {
    const result = await sendPayment({
      invoiceValue: UPGRADE_PRICE_KWD,
      currency: "KWD",
      customerName: profile.full_name || "Nujomi parent",
      customerEmail: profile.email ?? undefined,
      customerReference: reference,
      callBackUrl: `${origin}/api/checkout/callback`,
      errorUrl: `${origin}/parent/kids?upgrade=error`,
    });

    const { error: insertError } = await supabase.from("payments").insert({
      family_id: profile.family_id,
      invoice_id: result.InvoiceId,
      reference,
      amount: UPGRADE_PRICE_KWD,
      currency: "KWD",
      status: "pending",
    });
    if (insertError) throw insertError;

    return NextResponse.json({ url: result.InvoiceURL });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment could not be started";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
