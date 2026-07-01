import "server-only";

const BASE_URL = process.env.MYFATOORAH_BASE_URL ?? "https://apitest.myfatoorah.com";

function apiKey() {
  const key = process.env.MYFATOORAH_API_KEY;
  if (!key) throw new Error("MYFATOORAH_API_KEY is not configured");
  return key;
}

async function myFatoorahRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || !json.IsSuccess) {
    throw new Error(json.Message || `MyFatoorah request to ${path} failed`);
  }
  return json.Data as T;
}

export type SendPaymentResult = {
  InvoiceId: number;
  InvoiceURL: string;
  CustomerReference: string;
};

/**
 * Creates a hosted MyFatoorah invoice. Unlike ExecutePayment, this doesn't
 * require pre-selecting a PaymentMethodId — the customer picks their method
 * (KNET, card, Apple Pay, etc.) on MyFatoorah's own page.
 */
export function sendPayment(params: {
  invoiceValue: number;
  currency: string;
  customerName: string;
  customerEmail?: string;
  customerReference: string;
  callBackUrl: string;
  errorUrl: string;
}) {
  return myFatoorahRequest<SendPaymentResult>("/v2/SendPayment", {
    CustomerName: params.customerName,
    NotificationOption: "LNK",
    CustomerEmail: params.customerEmail,
    InvoiceValue: params.invoiceValue,
    DisplayCurrencyIso: params.currency,
    CallBackUrl: params.callBackUrl,
    ErrorUrl: params.errorUrl,
    Language: "EN",
    CustomerReference: params.customerReference,
  });
}

export type PaymentStatus = {
  InvoiceId: number;
  InvoiceStatus: string;
  InvoiceValue: number;
  CustomerReference: string;
  InvoiceTransactions: {
    TransactionStatus: string;
    PaymentId: string;
    PaidCurrency: string;
    PaidCurrencyValue: string;
  }[];
};

/** Verifies payment status server-to-server — never trust the browser redirect alone. */
export function getPaymentStatusByReference(customerReference: string) {
  return myFatoorahRequest<PaymentStatus>("/v2/GetPaymentStatus", {
    Key: customerReference,
    KeyType: "CustomerReference",
  });
}
