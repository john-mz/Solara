# Documentación Detallada de Cloud Functions
> *Nota de Planificación: Este documento se moverá a `functions/README.md` (o `docs/documentacion_funciones.md`) una vez que el directorio de funciones sea inicializado.*

Este documento detalla las especificaciones técnicas y el comportamiento de las Cloud Functions implementadas para el proyecto Techos Rentables.

## 1. Funciones de Sincronización de Inventario

El inventario (Plantas y Dispositivos) se sincroniza desde las APIs de Deye, Huawei y Growatt.

### `syncInventory`
- **Tipo:** Cloud Function programada (Pub/Sub - Cron)
- **Frecuencia:** Diaria a las 02:00 AM (Zona horaria configurable, ej. `America/Bogota`).
- **Descripción:** Llama a los endpoints de listar plantas y listar dispositivos de cada uno de los proveedores, y realiza un Upsert en las colecciones `plants` y `devices` de Firestore. Mantiene actualizado el registro de qué dispositivos están instalados.

### `syncInventoryManual`
- **Tipo:** HTTP Callable Function (REST Endpoint)
- **Descripción:** Ejecuta la misma lógica de `syncInventory` pero bajo demanda. 
- **Casos de Uso:** Utilizado por técnicos o administradores cuando se instala una nueva planta o se cambia un dispositivo, permitiendo que el sistema conozca el nuevo hardware de inmediato sin tener que esperar hasta las 02:00 AM del día siguiente.

---

## 2. Funciones de Polling (Telemetría en Tiempo Real)

Estas funciones son responsables de garantizar el SLA de < 5 minutos para detección de fallas, iterando sobre los dispositivos activos y consultando su telemetría.

### `pollDeyeTelemetry`
- **Tipo:** Pub/Sub (Cron)
- **Frecuencia:** Cada 2 minutos.
- **Flujo:** 
  1. Lee Firestore buscando documentos en `devices` donde `brand == 'deye'`.
  2. Consulta la API de DeyeCloud (`GET /deye/v1.0/device/real_time_data`).
  3. Guarda los resultados mapeados en `devices/{device_id}/telemetry`.
  4. Llama al motor de reglas (RuleEngine) para evaluar variables críticas. Si el dispositivo está Offline, o sus Hz/Volts están fuera de rango, registra un documento en la colección `alarms`.

### `pollHuaweiTelemetry`
- **Tipo:** Pub/Sub (Cron)
- **Frecuencia:** Cada 2 minutos.
- **Flujo:** Similar a Deye, pero utilizando la API de Huawei FusionSolar (`POST /huawei/thirdData/getDevRealKpi`).

### `pollGrowattTelemetry`
- **Tipo:** Pub/Sub (Cron)
- **Frecuencia:** Cada 2 minutos.
- **Flujo:** Similar a los anteriores, invocando la API de Growatt Server (`GET /growatt/v1/device/inverter/data`).

---

## 3. Funciones de Consolidación

### `aggregateDailySummaries`
- **Tipo:** Pub/Sub (Cron)
- **Frecuencia:** Diaria a las 23:55 PM.
- **Flujo:**
  1. Itera sobre las Plantas registradas.
  2. Lee la sub-colección `telemetry` del día actual para los dispositivos de cada planta.
  3. Calcula el total de energía producida (`total_energy_kwh`), el tiempo en línea (`avg_uptime_percent`) y las estimaciones financieras.
  4. Almacena el resultado en la colección `daily_summaries`.
- **Beneficio:** Evita cuellos de botella y exceso de lectura en Firestore al momento de generar el reporte mensual consolidado, ya que solo se deben consultar ~30 documentos por planta (1 por cada día) en lugar de decenas de miles de telemetrías crudas.