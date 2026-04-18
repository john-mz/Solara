# Estimación de Costos de Cloud Functions (Abril 2026)

Este documento detalla el análisis de costos estimados para la operación de las Cloud Functions del proyecto Techos Rentables en Google Cloud Platform (GCP/Firebase), utilizando los precios vigentes de **Abril 2026**.

## 1. Resumen de Funciones y Frecuencia

| Función | Tipo | Frecuencia / Gatillo | Memoria | Invocaciones/Mes |
| :--- | :--- | :--- | :--- | :--- |
| `pollDeyeTelemetry` | Job (Cron) | Cada minuto (`* * * * *`) | 256 MiB | 43,200 |
| `pollHuaweiTelemetry` | Job (Cron) | Cada minuto (`* * * * *`) | 256 MiB | 43,200 |
| `pollGrowattTelemetry` | Job (Cron) | Cada minuto (`* * * * *`) | 256 MiB | 43,200 |
| `syncInventoryCron` | Job (Cron) | Diario (2:00 AM) | 512 MiB | 30 |
| `aggregateDailySummaries` | Job (Cron) | Diario (11:55 PM) | 512 MiB | 30 |
| `analyzeInvoice` | HTTPS | Bajo demanda (POST) | 1024 MiB | Variable (Est. 1,000) |
| `plantChatAgent` | HTTPS | Bajo demanda (POST) | 1024 MiB | Variable (Est. 10,000) |

## 2. Estimación de Consumo de Recursos (Cómputo)

Basado en el nivel gratuito de Firebase/GCP (Spark/Blaze free tier):
- **Invocaciones:** Primeros 2 millones gratis.
- **GB-Segundos:** Primeros 400,000 gratis.
- **GHz-Segundos:** Primeros 200,000 gratis.

### Cálculo Estimado (Mensual)

| Concepto | Invocaciones | Tiempo Promedio | Memoria (GB) | GB-Segundos | GHz-Segundos (vCPU) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Polling (3 marcas) | 129,600 | 2.0s | 0.25 | 64,800 | 51,840 |
| Sincronización/Agreg. | 60 | 10.0s | 0.50 | 300 | 240 |
| Análisis Factura | 1,000 | 30.0s | 1.00 | 30,000 | 30,000 |
| Chat Agent | 10,000 | 15.0s | 1.00 | 150,000 | 150,000 |
| **TOTAL** | **140,660** | - | - | **245,100** | **232,080** |

**Resultado Cómputo:**
- **Invocaciones:** $140,660 < 2,000,000$ (Costo: **$0.00**)
- **GB-Segundos:** $245,100 < 400,000$ (Costo: **$0.00**)
- **GHz-Segundos:** $232,080 > 200,000$. Excedente: $32,080$.
- **Costo Excedente GHz-s:** $32,080 \times \$0.0000100 = \mathbf{\$0.32}$

## 3. Costos de APIs de IA (Gemini 3 Flash Preview)

Las funciones `analyzeInvoice` y `plantChatAgent` consumen tokens del modelo `gemini-3-flash-preview`.

Precios vigentes (2026):
- **Input (Texto):** $0.50 por 1 millón de tokens.
- **Output:** $3.00 por 1 millón de tokens.

| Función | Tokens In (Est) | Tokens Out (Est) | Invocaciones | Costo Total (Est) |
| :--- | :--- | :--- | :--- | :--- |
| Análisis Factura | 6,000 | 500 | 1,000 | $4.50 |
| Chat Agent | 2,000 | 200 | 10,000 | $16.00 |
| **TOTAL IA** | - | - | - | **$20.50** |

## 4. Otros Costos

- **Cloud Scheduler:** 5 trabajos activos. Primeros 3 gratis, luego $0.10 c/u. Costo: **$0.20**.
- **Almacenamiento (Artifact Registry):** ~ $0.10 (por imágenes de contenedores de las funciones).
- **Networking:** Depende del volumen de salida de datos (salida a internet para APIs de inversores). Estimado: **$0.10**.

## 5. Gran Total Estimado

| Categoría | Costo Mensual (USD) |
| :--- | :--- |
| Cómputo (Cloud Functions) | $0.32 |
| Inteligencia Artificial (Gemini 3) | $20.50 |
| Servicios Auxiliares (Scheduler, Registry) | $0.30 |
| Networking | $0.10 |
| **TOTAL ESTIMADO** | **$21.22** |

---

### Notas y Observaciones:
1. **Modelo de IA:** Se utiliza `gemini-3-flash-preview` con precios actualizados a 2026. Este modelo es más potente pero tiene un costo superior a sus predecesores de la serie 1.x.
2. **Uso de IA:** El componente más variable es el Chat Agent ($16.00/mes para 10k mensajes). Se recomienda implementar caché de respuestas o usar el modelo de fallback `gemini-2.5-flash` en tareas menos críticas si se desea reducir costos.
3. **Escalabilidad:** Los cron jobs de polling son constantes. El costo de cómputo se mantiene bajo el nivel gratuito para este volumen.
4. **Monitoreo:** Se sugiere configurar alertas de presupuesto en Google Cloud Console para evitar sorpresas por uso imprevisto de las APIs de IA.
