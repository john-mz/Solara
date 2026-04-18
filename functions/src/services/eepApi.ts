/**
 * eepApi.ts
 * Servicio para interactuar con el portal de copias de factura de la EEP.
 * URL base: https://energia.eep.com.co/copiafactura/
 */
import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://energia.eep.com.co/copiafactura';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Resultado de iniciar sesión y obtener el captcha */
export interface CaptchaSession {
  /** Instancia de axios con la cookie de sesión activa */
  client: AxiosInstance;
  /** Bytes de la imagen del captcha (PNG) */
  captchaBuffer: Buffer;
}

/**
 * Abre una sesión HTTP contra el portal EEP y descarga la imagen del captcha.
 * Mantiene la cookie PHPSESSID entre peticiones igual que lo hace el script Python.
 */
export async function getSessionAndCaptcha(): Promise<CaptchaSession> {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'User-Agent': USER_AGENT,
      Referer: `${BASE_URL}/index.php`,
    },
    withCredentials: true,
  });

  // Interceptor para propagar Set-Cookie entre peticiones
  let cookieHeader = '';
  client.interceptors.response.use((response) => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      cookieHeader = setCookie
        .map((c: string) => c.split(';')[0])
        .join('; ');
    }
    return response;
  });
  client.interceptors.request.use((reqConfig) => {
    if (cookieHeader) {
      reqConfig.headers = reqConfig.headers ?? {};
      reqConfig.headers['Cookie'] = cookieHeader;
    }
    return reqConfig;
  });

  // 1. Iniciar sesión para generar la cookie
  await client.get('/index.php');

  // 2. Descargar imagen del captcha
  const captchaRes = await client.get(
    '/CaptchaSecurityImages.php?width=300&height=60&characters=5',
    { responseType: 'arraybuffer' }
  );

  return {
    client,
    captchaBuffer: Buffer.from(captchaRes.data),
  };
}

/** Resultado de intentar descargar la factura */
export interface InvoiceResult {
  /** true si se obtuvo un PDF */
  success: boolean;
  /** Bytes del PDF (solo cuando success = true) */
  pdfBuffer?: Buffer;
  /** Mensaje de error (solo cuando success = false) */
  error?: string;
}

/**
 * Envía el número de matrícula y el código del captcha al portal EEP
 * y devuelve el PDF de la factura si la combinación es válida.
 */
export async function downloadInvoice(
  client: AxiosInstance,
  numMatricula: string,
  captchaCode: string
): Promise<InvoiceResult> {
  const params = new URLSearchParams({
    num_cuenta: numMatricula,
    security_code: captchaCode,
    btEnvia: '',
  });

  const response = await client.post('/procesar_factura.php', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'arraybuffer',
  });

  const contentType: string = response.headers['content-type'] ?? '';

  if (response.status === 200 && contentType.includes('application/x-download')) {
    return {
      success: true,
      pdfBuffer: Buffer.from(response.data),
    };
  }

  return {
    success: false,
    error: `EEP respondió con Content-Type inesperado: "${contentType}". Matrícula o captcha incorrectos.`,
  };
}
