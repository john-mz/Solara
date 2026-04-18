# Esquemas y Colecciones de Firestore

Para soportar el modelo de negocio de Techos Rentables, gestionar los dispositivos de múltiples marcas y almacenar los datos de telemetría y alarmas en tiempo real, se propone el siguiente diseño de base de datos en Firestore.

La estructura se centra en las **Plantas** como entidad principal, ya que es el nivel más alto de agrupación que proveen las APIs de los fabricantes.

---

## 1. Colección: `plants` (Plantas / Estaciones)
Una planta solar agrupa múltiples dispositivos (inversores/microinversores) y representa una instalación física.

- **Document ID:** Generado automáticamente (o el ID unificado de la planta).
- **Campos:**
  - `original_plant_id` (String): ID de la planta en la plataforma original del proveedor.
  - `brand` (String): Marca o plataforma de origen (`"deye"`, `"huawei"`, `"growatt"`).
  - `name` (String): Nombre de la planta (ej. "Planta Sede Norte").
  - `location` (String): Ubicación o dirección de la planta (si la API lo provee).
  - `installed_capacity_kw` (Number): Capacidad total instalada en kW.
  - `contract_commitments` (Map): *Datos ingresados manualmente por Techos Rentables para validación.*
    - `expected_energy_kwh_month` (Number): Energía mínima esperada por mes.
    - `expected_uptime_percent` (Number): SLA de disponibilidad (ej. 99.5).
    - `target_pr` (Number): Performance Ratio objetivo.
  - `created_at` (Timestamp).

---

## 2. Colección: `devices` (Dispositivos)
Almacena el inventario unificado de dispositivos (inversores y microinversores), vinculados a su respectiva planta.

- **Document ID:** Generado automáticamente (o `deviceSn` / identificador único global).
- **Campos:**
  - `plant_id` (Reference o String): ID de la planta a la que pertenece (referencia a la colección `plants`).
  - `original_id` (String): El ID original en la plataforma del proveedor (`device_sn`, `devIds`, etc.).
  - `brand` (String): Marca del proveedor (`"deye"`, `"huawei"`, `"growatt"`).
  - `type` (String): Tipo de dispositivo (`"inverter"`, `"microinverter"`).
  - `model` (String): Modelo del dispositivo (si está disponible).
  - `last_sync_metadata` (Timestamp): Fecha de la última vez que se actualizaron los datos estáticos de este dispositivo.
  - `last_telemetry_at` (Timestamp): Timestamp de la última lectura de datos en tiempo real recibida.

### 2.1. Sub-colección: `telemetry` (Datos en Tiempo Real)
Ruta: `devices/{device_id}/telemetry`
Almacena las lecturas periódicas (ej. cada 4 minutos) de cada dispositivo. **Nota:** Se recomienda configurar políticas de TTL (Time-To-Live) en Firestore para eliminar documentos antiguos automáticamente (ej. mantener solo 3 meses de alta granularidad) y conservar solo los datos agregados.

- **Document ID:** Generado automáticamente o basado en el Timestamp de la lectura.
- **Campos:**
  - `timestamp` (Timestamp): Momento exacto de la lectura.
  - `kpis` (Map):
    - `energy_today_kwh` (Number): Generación acumulada en el día.
    - `voltage_ac` (Number): Voltaje AC en Voltios.
    - `current_ac` (Number): Corriente AC en Amperios.
    - `frequency_hz` (Number): Frecuencia en Hertz.
    - `status` (String): Estado normalizado (`"ONLINE"`, `"OFFLINE"`, `"ERROR"`).

---

## 3. Colección: `alarms` (Alarmas e Incidencias)
Registra cualquier anomalía detectada al evaluar las reglas de negocio sobre la telemetría entrante. Permite a Techos Rentables tener una respuesta proactiva < 5 minutos.

- **Document ID:** Generado automáticamente.
- **Campos:**
  - `device_id` (Reference o String): ID del dispositivo afectado.
  - `plant_id` (Reference o String): ID de la planta afectada.
  - `type` (String): Tipo de alarma. Posibles valores:
    - `"FREQUENCY_OUT_OF_RANGE"`
    - `"VOLTAGE_OUT_OF_RANGE"`
    - `"DEVICE_OFFLINE"`
    - `"LOW_GENERATION"`
  - `severity` (String): Nivel de criticidad (`"CRITICAL"`, `"WARNING"`).
  - `status` (String): Estado actual de la alarma (`"ACTIVE"`, `"ACKNOWLEDGED"`, `"RESOLVED"`).
  - `created_at` (Timestamp): Momento en que se detectó la falla.
  - `resolved_at` (Timestamp): Momento en que se resolvió (null si sigue activa).
  - `details` (Map): Contexto del error. Ejemplo:
    - `reading_value` (Number): Valor leído que disparó la alarma (ej. 53.5 Hz).
    - `threshold_value` (Number): Valor límite permitido (ej. 54.0 Hz).

---

## 4. Colección: `daily_summaries` (Resúmenes Diarios / Históricos)
Consolidado diario por planta para facilitar la generación rápida de reportes mensuales sin tener que procesar la sub-colección de telemetría completa.

- **Document ID:** Composición de `plant_id` y `YYYY-MM-DD`.
- **Campos:**
  - `plant_id` (Reference o String): ID de la planta.
  - `date` (String): Fecha en formato `YYYY-MM-DD`.
  - `total_energy_kwh` (Number): Suma de la energía generada ese día por todos sus dispositivos.
  - `avg_uptime_percent` (Number): Porcentaje de tiempo promedio que los dispositivos estuvieron "ONLINE".
  - `co2_mitigated_tons` (Number): Cálculo de CO2 mitigado en el día.
  - `financial_savings` (Number): Dinero ahorrado calculado ese día.
  - `computed_at` (Timestamp).

---

## Resumen del Flujo de Datos con este Esquema

1. **Sincronización:** Una Cloud Function consulta periódicamente el listado de plantas y dispositivos en las APIs (Deye, Huawei, Growatt) y actualiza las colecciones `plants` y `devices`.
2. **Polling (< 5 min):** Otra Cloud Function itera sobre los `devices`, obtiene los datos en tiempo real, escribe un documento en `devices/{device_id}/telemetry` y actualiza `last_telemetry_at`.
3. **Reglas:** Durante el Polling, la misma función evalúa las métricas. Si alguna está fuera de rango, crea/actualiza un documento en la colección `alarms`.
4. **Agrupación:** Al finalizar el día, una función consolida los datos de `telemetry` y crea un registro en `daily_summaries` para que los reportes de rendimiento y facturación sean inmediatos.