import { onRequest } from 'firebase-functions/v2/https';
import { getSessionAndCaptcha, downloadInvoice } from '../services/eepApi';
import { solveCaptcha, analyzeInvoicePdf } from '../services/geminiApi';

export const analyzeInvoice = onRequest({ timeoutSeconds: 300, memory: '1GiB' }, async (req, res) => {
  const startTime = Date.now();
  // Solo permitir POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { num_matricula } = req.body;

  if (!num_matricula) {
    res.status(400).send({ success: false, message: 'Falta el número de matrícula (num_matricula).' });
    return;
  }

  try {
    console.log(`Iniciando proceso para matrícula: ${num_matricula}`);

    // 1. Obtener sesión y captcha
    const { client, captchaBuffer } = await getSessionAndCaptcha();
    console.log('Sesión iniciada y captcha descargado.');

    // 2. Resolver captcha con Gemini
    const captchaCode = await solveCaptcha(captchaBuffer);
    console.log(`Captcha resuelto: ${captchaCode}`);

    // 3. Descargar factura
    const invoiceRes = await downloadInvoice(client, num_matricula, captchaCode);

    if (!invoiceRes.success || !invoiceRes.pdfBuffer) {
      console.error(`Error al descargar factura: ${invoiceRes.error}`);
      res.status(400).send({ 
        success: false, 
        message: 'No se pudo descargar la factura. Verifique la matrícula o intente más tarde.',
        error: invoiceRes.error 
      });
      return;
    }
    console.log('Factura descargada exitosamente.');

    // 4. Analizar PDF con Gemini
    const data = await analyzeInvoicePdf(invoiceRes.pdfBuffer);
    console.log('Factura analizada por Gemini.');

    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;

    res.status(200).send({
      success: true,
      data,
      execution_time_ms: executionTimeMs
    });

  } catch (error: any) {
    console.error('Error general en analyzeInvoice:', error);
    res.status(500).send({ 
      success: false, 
      message: 'Ocurrió un error interno al procesar la factura.',
      error: error.message 
    });
  }
});
