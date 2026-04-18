# Documentación Detallada de Cloud Functions

Este documento detalla las especificaciones técnicas y el comportamiento de las Cloud Functions implementadas para el proyecto Techos Rentables.

> **Nota sobre Integraciones Externas:** Actualmente, el sistema utiliza datos simulados (mocks) para las integraciones con Deye, Huawei y Growatt, ya que las credenciales de producción y los accesos a las APIs no están completamente configurados en este entorno. Se recomienda usar la función `seedMockData` para inicializar el sistema con datos de prueba.

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

### `seedMockData`
- **Tipo:** Cloud Function HTTP (`onRequest`)
- **Descripción:** Pobla Firestore con datos de prueba (plantas, dispositivos, telemetría histórica y alarmas).
- **Importante:** Dado que las APIs de los proveedores (Deye, Huawei, Growatt) requieren credenciales oficiales y configuraciones de red específicas que no están completamente habilitadas para este entorno de desarrollo, **esta función es esencial para visualizar el flujo completo de la plataforma con datos realistas.**

---

## 2. Funciones de Polling (Telemetría en Tiempo Real)

Estas funciones son responsables de garantizar el SLA de < 5 minutos para detección de fallas, iterando sobre los dispositivos activos y consultando su telemetría.

### `pollDeyeTelemetry`
- **Tipo:** Pub/Sub (Cron)
- **Frecuencia:** Cada 1 minuto.
- **Flujo:** 
  1. Lee Firestore buscando documentos en `devices` donde `brand == 'deye'`.
  2. Consulta la API de DeyeCloud (`POST /v1.0/device/latest`).
  3. Extrae métricas clave del arreglo `dataList` (como `DailyActiveProduction` para energía).
  4. Guarda los resultados mapeados en `devices/{device_id}/telemetry`.
  5. Llama al motor de reglas (RuleEngine) para evaluar variables críticas. Si el dispositivo está Offline, o sus Hz/Volts están fuera de rango, registra un documento en la colección `alarms`.

### `pollHuaweiTelemetry`
- **Tipo:** Pub/Sub (Cron)
- **Frecuencia:** Cada 1 minuto.
- **Flujo:** Similar a Deye, pero utilizando la API de Huawei FusionSolar (`POST /thirdData/getDevRealKpi`), enviando el `devTypeId` almacenado durante el inventario.

### `pollGrowattTelemetry`
- **Tipo:** Pub/Sub (Cron)
- **Frecuencia:** Cada 1 minuto.
- **Flujo:** Itera sobre las plantas Growatt y consulta la API (`GET /v1/plant/data`) para obtener métricas agregadas por sitio, distribuyéndolas a los dispositivos asociados.

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

---

## 4. Instrucciones de Ejecución y Despliegue

### Requisitos Previos
- Tener instalado Node.js (versión 20 recomendada).
- Tener instalada la CLI de Firebase: `npm install -g firebase-tools`
- Haber hecho login en Firebase CLI: `firebase login`

### Variables de Entorno
Crea un archivo `.env` en la carpeta `functions/` (o configúralo en el entorno de despliegue) con las siguientes variables:
```env
API_BASE_URL="https://techos.thetribu.dev"
API_KEY="tk_TU_API_KEY"
```

### Ejecutar Localmente con el Emulador
Para probar las funciones localmente sin afectar el entorno de producción, puedes usar el emulador de Firebase:

1. Ubícate en el directorio de funciones:
   ```bash
   cd functions
   ```
2. Instala las dependencias (si no lo has hecho):
   ```bash
   npm install
   ```
3. Compila el código TypeScript:
   ```bash
   npm run build
   ```
4. Inicia el emulador:
   ```bash
   npm run serve
   ```
   *Esto levantará las Cloud Functions y te dará URLs locales (ej. `http://127.0.0.1:5001/.../syncInventoryManual`) para probar los endpoints.*

También puedes usar la Firebase Shell interactiva para gatillar tareas programadas (Cron jobs):
```bash
npm run shell
# Dentro de la shell, escribe:
> syncInventoryCron()
> pollDeyeTelemetry()
```

### Desplegar a Producción
Para desplegar las funciones a tu proyecto de Firebase configurado:

1. Asegúrate de compilar el código primero:
   ```bash
   npm run build
   ```
2. Ejecuta el comando de despliegue de Firebase (asegúrate de estar en el directorio raíz del proyecto o en `functions/`):
   ```bash
   firebase deploy --only functions
   ```
   *Nota: Es posible que Firebase te pida habilitar el plan de pago (Blaze) si utilizas peticiones externas (fetch/axios) y Cloud Functions v2.*
