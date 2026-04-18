# Documentación de Endpoints Útiles

## Introducción
Esta documentación consolida los endpoints requeridos para obtener la información de las plantas, dispositivos, datos en tiempo real y datos históricos de generación de energía desde los distintos proveedores a través del middleware unificado de TINKU.

**URL Base:** `https://techos.thetribu.dev`  
**Header de Autenticación:** `Authorization: tk_TU_API_KEY`  

---

## 1. Listado de Plantas (Stations/Plants)

Permite obtener los identificadores y detalles básicos de las instalaciones de cada cliente.

### DeyeCloud (`deye`)
- **Endpoint:** `GET /deye/v1.0/plant/list`
- **Parámetros (Query):** `page_no`, `page_size`

### Huawei FusionSolar (`huawei`)
- **Endpoint:** `POST /huawei/thirdData/getStationList`
- **Body (JSON):** `{}` (Retorna el listado de plantas disponibles para el usuario)

### Growatt (`growatt`)
- **Endpoint:** `GET /growatt/v1/plant/list`
- **Parámetros (Query):** `page` (Opcional, para paginación)

---

## 2. Listado de Dispositivos (Inversores y Microinversores)

Permite obtener la lista de equipos registrados bajo cada planta o estación.

### DeyeCloud (`deye`)
- **Endpoint:** `POST /deye/v1.0/device/list` *(Conforme a la guía técnica)*
- **Body (JSON):** `{"page": 1, "size": 10}` (Y parámetros adicionales como `plant_id` dependiendo del filtrado deseado)

### Huawei FusionSolar (`huawei`)
- **Endpoint:** `POST /huawei/thirdData/getDevList`
- **Body (JSON):** `{ "stationCodes": "CODIGO_DE_LA_PLANTA" }`

### Growatt (`growatt`)
- **Endpoint:** `GET /growatt/v1/device/list`
- **Parámetros (Query):** `plantId`

---

## 3. Datos en Tiempo Real (Métricas de Desempeño y Estado)

Estos endpoints son vitales para monitorizar el estado operativo y poder generar alarmas en caso de que variables como frecuencia, voltaje o estado se salgan de control o marquen desconexión.

### DeyeCloud (`deye`)
- **Endpoint:** `GET /deye/v1.0/device/real_time_data`
- **Parámetros:** `device_sn`
- **Mapeo de KPIs:**
  - **Generación:** `today_energy` (kWh)
  - **Voltaje:** `v_ac1`
  - **Corriente:** `i_ac1`
  - **Frecuencia:** `f_ac`
  - **Estado Operativo:** `work_status` (normal, fault, offline)

### Huawei FusionSolar (`huawei`)
- **Endpoint:** `POST /huawei/thirdData/getDevRealKpi`
- **Body (JSON):** `{ "devIds": "ID_DEL_DISPOSITIVO" }`
- **Mapeo de KPIs:**
  - **Generación:** `day_cap` (kWh)
  - **Voltaje:** `u_a`, `u_b`, `u_c` (AC)
  - **Corriente:** `i_a`, `i_b`, `i_c` (AC)
  - **Frecuencia:** `grid_freq`
  - **Estado Operativo:** `status` (0: Offline, 1: Online, 2: Fault)

### Growatt (`growatt`)
- **Endpoint:** `GET /growatt/v1/device/inverter/data`
- **Parámetros:** `deviceSn`
- **Mapeo de KPIs:**
  - **Generación:** `eToday` (kWh)
  - **Voltaje:** `vac1` (AC)
  - **Corriente:** `iac1` (AC)
  - **Frecuencia:** `fac`
  - **Estado Operativo:** `status` (0: Waiting, 1: Normal, 3: Fault)

---

## 4. Consolidación y Relación de Datos (Preparación para Cloud Functions)

Para automatizar la obtención de datos y crear el sistema de gestión de alarmas (tiempo de respuesta < 5 minutos) y generación de reportes, las Cloud Functions deberán seguir este flujo:

1. **Sincronización de Inventario (Programada y Manual):**
   - **Diaria (02:00 AM):** Consultar el listado de plantas y sus respectivos dispositivos para mantener una base de datos propia en Firestore con su `slug` (proveedor) y `id` actualizados.
   - **Manual (Endpoint HTTP):** Permitir a técnicos o administradores ejecutar una función en demanda cuando instalan un nuevo dispositivo, para que el sistema lo registre sin tener que esperar a la sincronización nocturna.
   
2. **Polling en Tiempo Real (Ejecución cada 2 min):**
   - Iterar sobre la lista consolidada de dispositivos y realizar las peticiones a los endpoints en tiempo real según corresponda a cada marca.
   
3. **Normalización del Modelo de Datos:**
   - La función en Cloud debe mapear las respuestas fragmentadas a un objeto JSON estándar:
     ```json
     {
       "device_id": "STRING",
       "brand": "deye | huawei | growatt",
       "plant_id": "STRING",
       "timestamp": "ISO_DATE",
       "kpis": {
         "energy_today_kwh": 12.5,
         "voltage_ac": 120.5,
         "current_ac": 5.2,
         "frequency_hz": 60.0,
         "status": "ONLINE" // (Mapeado desde los valores enteros/strings de cada API a ONLINE/OFFLINE/ERROR)
       }
     }
     ```

4. **Reglas de Alarma Inmediata (Condiciones Operacionales):**
   - **Frecuencia fuera de rango:** `frequency_hz` < 54 o > 66.
   - **Voltaje fuera de especificación:** `voltage_ac` sale del rango aceptable ±10% (ej. 120V o 220V según la planta).
   - **Dispositivos offline:** `status == OFFLINE`.
   - **Generación anormalmente baja:** Comparación contra el histórico.
