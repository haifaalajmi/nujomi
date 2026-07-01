import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaymentStatusByReference } from "@/lib/myfatoorah";

const UNLIMITED_KID_LIMIT = 999;

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: profile } = await supabase.from("profiles").select("family_id").eq("id", user.id).single();
  if (!profile?.family_id) {
    return NextResponse.redirect(`${origin}/parent/kids?upgrade=error`);
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("family_id", profile.family_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return NextResponse.redirect(`${origin}/parent/kids?upgrade=error`);
  }

  try {
    const status = await getPaymentStatusByReference(payment.reference);
    const paidTransaction = status.InvoiceTransactions.find((t) => t.TransactionStatus === "Succss");

    if (status.InvoiceStatus !== "Paid" || !paidTransaction || Number(status.InvoiceValue) < payment.amount) {
      await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
      return NextResponse.redirect(`${origin}/parent/kids?upgrade=error`);
    }

    await supabase
      .from("payments")
      .update({ status: "paid", payment_id: paidTransaction.PaymentId, paid_at: new Date().toISOString() })
      .eq("id", payment.id);

    await supabase
      .from("families")
      .update({ plan: "paid", kid_limit: UNLIMITED_KID_LIMIT })
      .eq("id", profile.family_id);

    return NextResponse.redirect(`${origin}/parent/kids?upgrade=success`);
  } catch {
    return NextResponse.redirect(`${origin}/parent/kids?upgrade=error`);
  }
}
