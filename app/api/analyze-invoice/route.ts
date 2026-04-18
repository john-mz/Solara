import { NextResponse } from "next/server";

const UPSTREAM_ANALYZE_INVOICE =
  process.env.ANALYZE_INVOICE_URL ??
  "https://us-central1-hackathon-cursor.cloudfunctions.net/analyzeInvoice";

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
