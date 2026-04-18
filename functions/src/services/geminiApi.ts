import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { config } from '../config/env';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

/**
 * Resuelve un captcha de imagen devolviendo los 5 caracteres alfanuméricos.
 */
export async function solveCaptcha(imageBuffer: Buffer): Promise<string> {
  const prompt = 'Please extract the 5 alphanumeric characters from this captcha image. Respond ONLY with the 5 characters exactly as they appear, with no extra spaces, punctuation, or newlines.';
  
  const imagePart: Part = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/png',
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  return response.text().trim().toLowerCase();
}

/**
 * Analiza una factura de energía en formato PDF y extrae información estructurada en JSON.
 */
export async function analyzeInvoicePdf(pdfBuffer: Buffer): Promise<any> {
  const prompt = `
Analiza la factura de energía adjunta (PDF) y extrae la siguiente información.

Ubicación de las variables en el documento:
- total_factura: Sección arriba a la derecha. Valor de "Total".
- total_energia: Sección arriba a la derecha. Valor de "Energía".
- rangos: En la sección "liquidación del consumo actual" hay una tabla, cada registro es un rango (ej. 0-173 y >173).
  - valor_kwh: En el registro del rango, valor de "Valor KWh".
  - consumo_wats: En el registro del rango, valor de "Consumo kWh".
  - total_energia_rango: En el registro del rango, valor de "Total energía".
  - subsidio: En el registro del rango, valor de "subsidio".
  - total: En el registro del rango, valor de "Total".
- consumo_pasado: En la sección "INFORMACIÓN DE CONSUMO", tabla "Consumo últimos seis meses".
  - Mes: El mes correspondiente.
  - kWh: Valor de consumo en kWh.
  - Valor: Valor facturado.
  - Dias facturados: Cantidad de días del periodo.

Genera un JSON válido siguiendo esta estructura exacta:
{
  "total_factura": "...",
  "total_energia": "...",
  "rangos": [
    {
      "rango": "...",
      "valor_kwh": "...",
      "consumo_wats": "...",
      "total_energia": "...",
      "subsidio": "...",
      "total": "..."
    }
  ],
  "consumo_pasado": [
    {
      "Mes": "...",
      "kWh": "...",
      "Valor": "...",
      "Dias facturados": "..."
    }
  ]
}

Responde ÚNICAMENTE con el objeto JSON válido.
`;

  const pdfPart: Part = {
    inlineData: {
      data: pdfBuffer.toString('base64'),
      mimeType: 'application/pdf',
    },
  };

  const result = await model.generateContent([prompt, pdfPart]);
  const response = await result.response;
  const text = response.text();
  
  // Limpiar posibles bloques de código markdown
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  return JSON.parse(text);
}
