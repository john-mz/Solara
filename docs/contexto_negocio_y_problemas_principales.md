# Knowledge Base — Techos Rentables
> Este documento provee contexto operacional completo para agentes de IA. Toda respuesta generada debe estar alineada con la información aquí definida.

---

## EMPRESA

**Techos Rentables** opera y monitorea más de **200 proyectos de generación solar distribuida**. Cada proyecto tiene compromisos contractuales con métricas medibles y penalizaciones económicas por incumplimiento.

---

## COMPROMISOS CONTRACTUALES POR CLIENTE

Cada contrato establece umbrales mínimos en estas métricas. El agente debe conocerlas y ser capaz de calcularlas, reportarlas y validarlas:

| Métrica | Unidad | Descripción |
|---|---|---|
| Energía generada | kWh | Producción eléctrica real del sistema |
| Dinero ahorrado | COP / USD | Valor económico del kWh generado vs. tarifa de red |
| Uptime | % | Porcentaje de tiempo que el sistema operó sin interrupciones |
| Performance Ratio (PR) | % | Eficiencia real vs. capacidad teórica del sistema |
| CO₂ mitigado | Toneladas | Equivalente ambiental de la energía generada |

---

## HARDWARE EN OPERACIÓN

Los sistemas instalados usan dos tipos de dispositivos que actúan como **sensores IoT**:

- **Inversor:** centraliza 10–50 paneles solares. Un cliente típico tiene 2–3 inversores.
- **Microinversor:** se instala en cada panel individual. Un cliente puede tener 10 o más.

Ambos dispositivos reportan datos en tiempo real: energía producida, voltaje, frecuencia, temperatura y estado de conexión.

**Marcas activas:** Hoymiles, Growatt, SRNE, Huawei (y otras en incorporación continua).

Cada marca opera en su **propia plataforma de monitoreo independiente**, con API, formato de datos y autenticación propios. No existe un estándar común entre fabricantes.

---

## PROBLEMA CENTRAL

Techos Rentables no puede supervisar en tiempo real el estado de cientos de dispositivos distribuidos en múltiples plataformas heterogéneas. Esto genera:

1. **Fragmentación de datos:** no existe vista unificada del estado operativo completo.
2. **Trabajo manual excesivo:** consolidar datos de un cliente toma ~40 min. Con 200+ clientes: **130+ horas/persona/mes**.
3. **Detección tardía de fallas:** los equipos pueden fallar y permanecer sin atención por días o semanas. El requisito crítico es detectar fallas en **menos de 5 minutos**.
4. **Riesgo contractual:** la detección tardía genera penalizaciones económicas y lucro cesante.
5. **Imposibilidad de escalar:** más proyectos requieren más personal en proporción directa.

---

## FALLAS OPERATIVAS — DEFINICIÓN Y UMBRALES

El agente debe detectar, clasificar y alertar las siguientes fallas. Cada falla tiene una condición técnica exacta y un mensaje de alerta estandarizado.

---

### FALLA 1 — Dispositivo desconectado
- **Condición:** El dispositivo no reporta datos por más de **5 minutos** desde su última lectura válida.
- **Causas posibles:** falla de red, corte de energía, falla de hardware, problema de firmware.
- **Severidad:** Crítica. Implica pérdida total de generación en ese dispositivo.
- **Mensaje de alerta:** `Dispositivo desconectado`
- **Datos a registrar:** timestamp del último dato válido, ID del dispositivo, proyecto, cliente.

---

### FALLA 2 — Generación anormalmente baja
- **Condición:** La generación actual es **más del 20% inferior** al promedio histórico del dispositivo para condiciones climáticas equivalentes (misma franja horaria, irradiancia similar).
- **Causas posibles:** degradación de paneles, suciedad acumulada, sombra parcial, falla de microinversor.
- **Consideración:** contextualizar con datos climáticos antes de emitir alerta. Un día nublado legítimo no debe generar falso positivo.
- **Severidad:** Alta.
- **Mensaje de alerta:** `Generacion de energia baja`
- **Datos a registrar:** generación actual, promedio histórico, delta porcentual, condición climática, duración del evento.

---

### FALLA 3 — Voltaje fuera de especificación
- **Condición:** El voltaje de salida se desvía **más del ±10%** respecto al valor nominal del sistema según especificación del fabricante.
- **Causas posibles:** fluctuaciones en la red eléctrica local, falla interna del inversor, desconexión de paneles, variación de carga.
- **Severidad:** Alta. Puede activar protección automática del inversor y generar downtime.
- **Mensaje de alerta:** `Voltaje fuera del rango`
- **Datos a registrar:** voltaje medido, voltaje nominal, porcentaje de desviación.

---

### FALLA 4 — Frecuencia fuera de rango
- **Condición:** La frecuencia de la corriente alterna se desvía **más del 10%** del estándar. Rango aceptable: **54 Hz – 66 Hz**. Estándar de referencia en Colombia: **60 Hz**.
- **Causas posibles:** inestabilidad en la red eléctrica local, falla interna del inversor.
- **Severidad:** Media-alta. Puede causar desconexión automática por protección de frecuencia.
- **Mensaje de alerta:** `Frecuencia desviada. Verificar equipo`
- **Datos a registrar:** frecuencia medida, frecuencia estándar (60 Hz), desviación porcentual.

---

## REGLAS DE OPERACIÓN PARA EL AGENTE

1. Toda falla debe detectarse en un intervalo máximo de **5 minutos** desde que ocurre.
2. Cada alerta debe incluir: tipo de falla, mensaje estandarizado, ID del dispositivo, proyecto, cliente y timestamp.
3. Los reportes de cliente deben unificar datos de todas las plataformas asociadas a ese cliente, independientemente de la marca del equipo.
4. Los datos reportados deben ser actuales y auditables (con trazabilidad de fuente y timestamp).
5. El agente debe soportar la incorporación de nuevas marcas y proyectos sin cambios estructurales en su lógica.
6. Las métricas contractuales deben poder validarse tanto en tiempo real como de forma retrospectiva (auditorías mensuales y anuales).

---

## RESTRICCIONES DEL ENTORNO

- Cada fabricante expone datos mediante su propia plataforma (sin API estándar común).
- Los dispositivos reportan en intervalos variables según marca y configuración.
- Un mismo cliente puede tener dispositivos de múltiples marcas en el mismo proyecto.
- No existe actualmente ninguna vista consolidada del estado operativo global.

---

## MÉTRICAS DE REFERENCIA

| Indicador | Valor |
|---|---|
| Clientes activos | 200+ |
| Tiempo máximo de detección de falla | < 5 minutos |
| Tiempo actual de detección (sin sistema) | Días o semanas |
| Horas/mes de trabajo manual | 130+ |
| Tiempo por informe manual por cliente | ~40 minutos |
| Plataformas de monitoreo activas | 4+ (Hoymiles, Growatt, SRNE, Huawei) |
