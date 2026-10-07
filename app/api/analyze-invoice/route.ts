import { NextResponse } from "next/server";

const UPSTREAM_ANALYZE_INVOICE =
  process.env.ANALYZE_INVOICE_URL ??
  "https://us-central1-hackathon-cursor.cloudfunctions.net/analyzeInvoice";

/** Matrícula de demostración: la descarga en la empresa de energía ya no responde. */
const MOCK_MATRICULA = "184770";

const MOCK_INVOICE_184770 = {
  name: "Comercial El Vergel S.A.S.",
  total_factura: "412.350",
  total_energia: "296.400",
  rangos: [
    {
      rango: "0-173",
      valor_kwh: "650",
      consumo_wats: "173",
      total_energia: "112.450",
      subsidio: "18.200",
      total: "94.250",
    },
    {
      rango: ">173",
      valor_kwh: "820",
      consumo_wats: "207",
      total_energia: "169.740",
      subsidio: "0",
      total: "169.740",
    },
  ],
  consumo_pasado: [
    { Mes: "Abr", kWh: "310", Valor: "241.800", "Dias facturados": "30" },
    { Mes: "May", kWh: "340", Valor: "265.200", "Dias facturados": "31" },
    { Mes: "Jun", kWh: "365", Valor: "284.700", "Dias facturados": "30" },
    { Mes: "Jul", kWh: "390", Valor: "304.200", "Dias facturados": "31" },
    { Mes: "Ago", kWh: "410", Valor: "319.800", "Dias facturados": "31" },
    { Mes: "Sep", kWh: "380", Valor: "296.400", "Dias facturados": "30" },
  ],
};

function matriculaFromBody(body: unknown): string {
  if (!body || typeof body !== "object" || !("num_matricula" in body)) return "";
  const value = (body as { num_matricula: unknown }).num_matricula;
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Cuerpo JSON inválido" },
      { status: 400 }
    );
  }

  if (matriculaFromBody(body) === MOCK_MATRICULA) {
    return NextResponse.json({
      success: true,
      data: MOCK_INVOICE_184770,
      execution_time_ms: 840,
    });
  }

  try {
    const upstream = await fetch(UPSTREAM_ANALYZE_INVOICE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "El servicio devolvió una respuesta no válida",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "No se pudo contactar el servicio de análisis",
      },
      { status: 502 }
    );
  }
}
