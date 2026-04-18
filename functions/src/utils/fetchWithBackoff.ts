import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Función que encapsula una petición HTTP de axios con reintentos exponenciales (Backoff)
 * diseñado para mitigar errores transitorios 502/503 del middleware o los proveedores.
 */
export async function fetchWithBackoff<T>(
  config: AxiosRequestConfig,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<AxiosResponse<T>> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await axios(config);
      return response;
    } catch (error: any) {
      const status = error.response?.status;
      
      // Solo hacemos backoff para errores del servidor (5xx) o timeouts/fallas de red.
      // Errores 4xx (como 400 Bad Request o 401 Unauthorized) deben fallar inmediatamente
      // porque un reintento no los va a solucionar.
      const isRetryableError = !status || (status >= 500 && status < 600);

      if (!isRetryableError || attempt >= maxRetries - 1) {
        throw error;
      }

      attempt++;
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`[Backoff] Petición a ${config.url} falló (Status: ${status}). Reintento ${attempt}/${maxRetries} en ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Esto solo para que el linter no se queje, la lógica arriba siempre lanza un throw en el último catch
  throw new Error('Unreachable');
}
