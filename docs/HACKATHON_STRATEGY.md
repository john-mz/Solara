# Analisis estrategico y resumen ejecutivo - TINKU Hackathon 2026

> [!NOTE]
> Este documento sintetiza la documentacion oficial del reto y propone una estrategia de ejecucion orientada a demo, impacto y viabilidad en hackathon.
> Si algo aqui contradice `README_TINKU_Hackathon.md`, `problem/` o `resources/`, prevalece la documentacion oficial.

---

## 1. ENTENDIMIENTO DEL PROBLEMA

### El problema en terminos simples

Techos Rentables instala paneles solares para +200 clientes corporativos. Cada instalacion usa dispositivos (inversores/microinversores) de marcas diferentes (Growatt, Huawei, Hoymiles, Deye, SRNE). Cada marca tiene su propia plataforma de monitoreo con login, formato y nomenclatura distintos. Hoy, supervisar todo esto se hace **a mano**: un operador entra a cada plataforma, mira los datos, los copia a Excel, calcula metricas, y genera reportes. Esto consume **130+ horas/mes** y es imposible detectar fallas rapido.

### El "Core Pain" real (no lo obvio)

> [!IMPORTANT]
> El dolor real **NO es solo "unificar datos"**. El core pain es que **la empresa no puede escalar sin colapsar operativamente**. Cada nuevo cliente que entra multiplica proporcionalmente el trabajo manual. Techos Rentables esta atrapada: su propio exito comercial (mas clientes) genera mas caos operativo.

El dolor mas profundo tiene 3 capas:

1. **Capa operativa**: 130 horas/mes tiradas a la basura en copiar-pegar datos entre plataformas
2. **Capa de riesgo financiero**: No detectar una falla a tiempo = penalizaciones contractuales + lucro cesante. Un inversor offline una semana puede costar miles de dolares
3. **Capa estrategica**: Estan OBLIGADOS a usar la misma marca en cada instalacion (para que el cliente vea todo en una app) -> no pueden optimizar costos mezclando marcas -> pierden competitividad comercial

### Que evaluan REALMENTE los jueces?

Los jueces son de **Techos Rentables, The Tribu, y la UCC**. Quieren ver:

- **Entendiste que este es un problema REAL de negocio?** No es un ejercicio academico. El patrocinador principal (Techos Rentables) tiene este dolor HOY
- **Tu demo se siente como un producto que podrian usar el lunes?** No como un proyecto de clase
- **Usaste los datos reales del middleware?** Tienen un API real que le da credibilidad a tu proyecto
- **Entiendes la urgencia?** Deteccion en <5 minutos, no "eventualmente"

---

## 2. ANALISIS DE LA RUBRICA (CRITICO)

La rubrica tiene **6 criterios**, cada uno vale 1, 3 o 5 puntos por jurado. Hay **3 jurados**. Maximo: **90 puntos**.

> [!CAUTION]
> No existe un criterio mas importante que otro. Sacar 5 en 3 criterios pero 1 en los otros 3 = 18 puntos. Sacar 3 en los 6 = 18 puntos. **La estrategia ganadora es ser consistente: apuntar a 5 en los 6 criterios.**

### Criterio 1: Impacto y Resolucion del Problema (max 15 pts de 90)

| Que miran | Como optimizar | Error que quita puntos |
|-----------|---------------|----------------------|
| Entendiste el problema de verdad? | Demostrar en el pitch que entiendes las 3 capas (operativa, financiera, estrategica) | Quedarse en la superficie: "unificamos datos" sin explicar POR QUE importa |
| Tu solucion lo ataca de verdad? | Mostrar impacto cuantificable: "reduce 130h -> 2h/mes" | Construir algo cool que no soluciona el problema real |
| Resuelve la fragmentacion multi-marca? | Mostrar datos REALES de Growatt, Huawei y Deye unificados | Mockear datos que podrian ser reales |

**Accion concreta**: En la demo, mostrar un antes/despues. "Hoy, generar un reporte de este cliente toma 40 min. Con nuestra solucion: 2 clicks, 3 segundos."

### Criterio 2: Innovacion y Creatividad (max 15 pts)

| Que miran | Como optimizar | Error que quita puntos |
|-----------|---------------|----------------------|
| Tu enfoque aporta algo fresco? | No solo un dashboard. Agregar algo inesperado: alertas inteligentes, prediccion, analisis de CO2 | Hacer "otro dashboard de metricas" sin diferenciacion |
| Hay uso creativo de tecnologia? | Usar IA para normalizacion automatica de nomenclatura entre marcas o para alertas predictivas | Usar IA por usarla, sin que aporte valor real al problema |

**Accion concreta**: Incluir al menos UN feature que haga decir a los jueces "eso no me lo esperaba". Ej: un chat IA que responda "como va la planta del cliente X este mes?" en lenguaje natural.

### Criterio 3: Experiencia UX/UI (max 15 pts)

| Que miran | Como optimizar | Error que quita puntos |
|-----------|---------------|----------------------|
| Se siente clara e intuitiva? | Diseno limpio, jerarquia visual clara, colores con significado (rojo=alarma, verde=ok) | Interfaz con 50 botones y tablas infinitas |
| Esta cuidada? | Micro-animaciones, transiciones suaves, modo oscuro, tipografia profesional | UI que parece template de Bootstrap sin personalizar |
| Pensaron en el usuario real? | El usuario es un OPERADOR de Techos Rentables, no un developer. Simplificar | Interfaz tecnica con JSON en pantalla |

**Accion concreta**: Invertir tiempo en un "hero dashboard" con numeros grandes, graficos limpios y colores semaforo. Primera impresion > funcionalidad profunda.

### Criterio 4: Viabilidad Tecnica (max 15 pts)

| Que miran | Como optimizar | Error que quita puntos |
|-----------|---------------|----------------------|
| Se podria llevar a produccion? | Usar el middleware REAL con datos REALES. Codigo limpio. README con instrucciones claras | Demo con datos hardcodeados que se ve fake |
| La arquitectura tiene sentido? | Explicar en el pitch: "consumimos 3 APIs reales via middleware, normalizamos y mostramos" | Arquitectura sobreingenieria con microservicios para un MVP |

**Accion concreta**: Que el proyecto corra con `npm run dev` y se vea data real fluyendo. README impecable en el repo.

### Criterio 5: Escalabilidad de Negocio (max 15 pts)

| Que miran | Como optimizar | Error que quita puntos |
|-----------|---------------|----------------------|
| Podria ser un producto que otros paguen? | Mencionar que hay ~5,000+ empresas solares en Latam con el mismo problema | Pensar solo en Techos Rentables |
| Tiene pinta de SaaS? | Mostrar multi-tenancy: "cada empresa solar tendria su cuenta" | Solucion monolitica para un solo cliente |

**Accion concreta**: Un slide en el pitch: "TAM: 5,000+ empresas solares en Latam. El sector crece 25% anual. Todas tienen el mismo problema de fragmentacion de marcas."

### Criterio 6: Presentacion y Pitch (max 15 pts)

| Que miran | Como optimizar | Error que quita puntos |
|-----------|---------------|----------------------|
| Cuentan bien su historia? | Estructura: Problema -> Dolor -> Solucion -> Demo -> Impacto -> Vision | Empezar con "usamos React, Node..." (a nadie le importa el stack) |
| 5 minutos bien usados? | Ensayar 3+ veces con cronometro. Terminar en 4:45. | Pasarse del tiempo = pitch cortado = catastrofe |

**Accion concreta**: Asignar a UN integrante como presentador principal. Los otros dos apoyan con demo en vivo.

---

## 3. ENFOQUE GANADOR

### Enfoque A: "Dashboard de Monitoreo en Tiempo Real"
Un dashboard que centraliza los datos de los 3 proveedores (Growatt, Huawei, Deye) en una vista unificada con alertas.

| Pros | Contras |
|------|---------|
| Ataca el problema central directamente | Es lo que muchos equipos van a hacer |
| Facil de demo-ear | Si no se diferencia, queda generico |
| Factible en 18h | Los jueces veran varios dashboards similares |

### Enfoque B: "Plataforma de Inteligencia Operativa con IA"
Mas alla del dashboard: un sistema que no solo muestra datos sino que los analiza, detecta anomalias, genera reportes automaticos y predice fallas.

| Pros | Contras |
|------|---------|
| Se diferencia del simple dashboard | Riesgo de prometer mas de lo que se entrega |
| Toca todos los pain points del problema | La IA puede fallar en demo |
| Genera efecto "wow" en jueces | Mas complejo de implementar |

### Enfoque C: "Sistema de Reportes Automatizados + Compliance"
Enfocarse en el dolor mas cuantificable: las 130 horas/mes en reportes manuales. Generar reportes automaticos con validacion contractual.

| Pros | Contras |
|------|---------|
| Impacto cuantificable inmediato (130h->2h) | Menos sexy visualmente |
| Diferente a lo que haran otros equipos | Menos "wow" en demo |
| Valor de negocio clarisimo | Puede verse como una "feature" y no un producto |

### Recomendacion: Enfoque B con piso del Enfoque A

> [!TIP]
> **Construir el dashboard (Enfoque A) como base visual, pero coronarlo con la capa de inteligencia (Enfoque B) como diferenciador.** Incluir generacion de reportes (Enfoque C) como feature secundaria.

**Justificacion**: El dashboard es el piso necesario para demo-ear cualquier cosa. Pero lo que suele diferenciar una hackathon es el "wow factor", y eso viene de la capa de IA/inteligencia. La clave es que la IA sea real pero acotada: no predecir fallas con ML complejo, sino usar un LLM para:
- Chat conversacional sobre la operacion ("como va el cliente Acme hoy?")
- Deteccion de anomalias simple (comparacion con umbrales)
- Generacion automatica de resumenes en lenguaje natural

---

## 4. IDEA DE PROYECTO

### SolarHub - Command Center Operativo para Energia Solar

**Tagline**: *"De 5 plataformas y 130 horas de caos -> 1 pantalla y 0 minutos de esfuerzo manual"*

#### Que es?
Un **centro de comando unificado** para operadores de empresas de energia solar que:

1. **Unifica** datos de Growatt, Huawei y Deye en un solo dashboard en tiempo real
2. **Alerta** automaticamente cuando un dispositivo falla o baja su rendimiento (<5 min)
3. **Analiza** con IA: un asistente conversacional que responde preguntas sobre la operacion
4. **Reporta** automaticamente: genera resumenes mensuales por cliente con datos reales

#### Que la hace destacar?

- **No es "solo un dashboard"**: es un Command Center con IA conversacional. Los jueces van a ver muchos dashboards; pocos tendran un chat que responda "que clientes tienen problemas ahora mismo?" con datos reales
- **Datos reales del middleware**: cada numero en pantalla viene del API real
- **UX pensada para no-tecnicos**: interfaz tipo "mission control" con semaforos, alertas sonoras y diseno premium
- **Historia clara**: "De 130 horas de trabajo manual a cero. De enterarse de una falla en semanas a detectarla en 5 minutos."

#### Que la hace demo-able en 18 horas?

- El middleware ya resuelve la autenticacion -> solo consumir APIs
- El dashboard es visual -> impacta rapido
- El chat IA usa un LLM via API (Gemini/OpenAI) -> no se entrena nada
- Las alertas son logica de comparacion simple (valor < umbral = alerta)

#### Que la hace memorable?

- **Momento "wow" de demo**: mostrar el chat IA respondiendo preguntas sobre plantas solares con datos reales
- **Momento emocional del pitch**: "130 horas al mes. Eso son 3 semanas y media de trabajo. Imagina que podria hacer su equipo con ese tiempo de vuelta"
- **Visual impactante**: dashboard tipo "sala de control de NASA" con modo oscuro, mapas y metricas en tiempo real

---

## 5. MVP ULTRA ENFOCADO (CRITICO)

### Que construir (solo esto)

| Feature | Tiempo estimado | Justifica puntos en... |
|---------|----------------|----------------------|
| **Dashboard principal** con vista unificada de todas las plantas (3 proveedores) | 4-5 horas | UX/UI, Impacto, Viabilidad |
| **Tarjetas de estado por planta**: semaforo, kWh actual, uptime | 2-3 horas | Impacto, UX/UI |
| **Sistema de alertas visuales**: lista de alertas con prioridad cuando un dispositivo esta offline o bajo rendimiento | 2-3 horas | Impacto, Innovacion |
| **Chat IA** (1 prompt bien hecho con contexto de las plantas): preguntas en lenguaje natural sobre la operacion | 2-3 horas | Innovacion, Creatividad |
| **Vista detalle de planta**: KPIs del dispositivo, grafico de generacion | 2-3 horas | UX/UI, Viabilidad |
| **Pulido visual**: animaciones, modo oscuro, responsive | 2-3 horas | UX/UI |

### Que NO construir

- **Autenticacion/login real**: nadie va a evaluar si tiene login. Asume que ya estas logueado
- **CRUD de usuarios o administracion**: cero valor para la demo
- **Backend complejo con base de datos relacional**: usa el middleware directamente desde el frontend o un simple API proxy
- **Integracion con notificaciones reales** (SMS, email, WhatsApp): simularlo en la UI
- **Reportes PDF descargables**: mostrar el reporte en pantalla, no perder horas con generacion de PDF
- **Sistema de roles y permisos**: no aporta puntos
- **Cobertura automatizada extensa**: en hackathon vale mas una demo confiable que una suite amplia
- **Docker, CI/CD, infraestructura compleja**: `npm run dev` es suficiente para el MVP

### Que simular/mockear inteligentemente

| Feature | Como mockearlo | Nivel de credibilidad |
|---------|---------------|---------------------|
| **Alertas en tiempo real** | Polling cada 30 seg al middleware + comparacion con umbrales hardcodeados -> mostrar badge de notificacion | Muy creible |
| **Notificaciones push** | Toast/popup en la UI cuando se detecta anomalia | Muy creible |
| **Historicos/graficos de tendencia** | Guardar ultimas N lecturas en memoria/localStorage y graficar | Creible |
| **Reportes mensuales** | Generar el texto con el LLM basado en los datos actuales, mostrar en pantalla como si fuera un reporte | Muy creible |
| **Mapa de ubicaciones** | Ubicaciones aproximadas hardcodeadas + mapa interactivo | Totalmente creible |
| **Multi-tenancy** | Un dropdown de "empresa" que sea decorativo | Creible |

### Que debe ser real si o si

> [!WARNING]
> Si estas cosas son fake, el proyecto pierde credibilidad instantaneamente ante los jueces:

1. **Datos del middleware**: CADA numero en el dashboard debe venir del API real (`techos.thetribu.dev`). Si un juez pregunta "esos datos son reales?" y la respuesta es "si, vienen del middleware en vivo", eso vale oro
2. **Unificacion multi-proveedor**: Mostrar datos de Growatt, Huawei y Deye en la MISMA pantalla. Esto es el CORE del reto
3. **Deteccion de dispositivos offline**: Si un dispositivo real esta offline, el sistema debe mostrarlo en rojo. No simular alarmas; detectar alarmas reales
4. **El chat IA**: Si prometes IA, debe funcionar en vivo. Mejor un prompt simple que funcione perfecto que un sistema complejo que falle

---

## 6. STACK TECNOLOGICO

### Stack actual del repo

El repositorio ya esta alineado alrededor de este stack:

- **Next.js 16.2.x** con **App Router**
- **React 19.2.x** y **React Compiler** activado en `next.config.ts`
- **TypeScript 5**
- **Tailwind CSS v4** con `@tailwindcss/postcss`
- **shadcn/ui** configurado con estilo **`radix-maia`**
- **Hugeicons** como libreria de iconos (`@hugeicons/react`)
- **next/font** para tipografia

### Frontend - **Next.js 16 + React 19**

**Por que tiene sentido para este proyecto?**
- App Router y RSC permiten escalar bien una UI tipo dashboard
- API Routes integradas -> no necesitan servidor aparte
- `reactCompiler: true` ya esta habilitado, asi que el repo queda alineado con la direccion moderna del stack
- Tailwind v4 + shadcn aceleran mucho el armado de una interfaz consistente
- Vercel deploy gratuito en 2 minutos

> [!NOTE]
> Dado que este repo ya existe sobre Next.js 16, no conviene plantear migraciones de stack durante la hackathon salvo que haya un bloqueo real.

### Backend - **API Routes de Next.js** (NO backend separado)

**Por que?**
- Las API Routes actuan como proxy al middleware -> la API key no se expone en el frontend
- Zero configuracion adicional
- Misma codebase, mismo deploy
- Evita problemas de CORS

```text
Frontend -> /api/plants (Next.js API Route) -> techos.thetribu.dev (middleware) -> API real del proveedor
```

### Base de datos - **NO usar** (o Supabase si es estrictamente necesario)

**Por que no?**
- Los datos vienen del middleware en tiempo real
- Para cache, usar `localStorage` o variables en memoria
- Para almacenar configuracion de alertas: un simple JSON local alcanza para el MVP
- Una BD agrega complejidad sin aportar puntos

**Si necesitan persistencia** (ej: historial de alertas): Supabase con tablas minimas. Setup en 5 minutos, cliente JS con zero config.

### APIs e IA

| Servicio | Uso | Setup time |
|----------|-----|-----------|
| **Middleware TINKU** (`techos.thetribu.dev`) | Datos de plantas solares reales (Growatt, Huawei, Deye) | Ya listo |
| **Google Gemini API** (o OpenAI GPT-4o-mini) | Chat IA conversacional sobre la operacion | 10 min con API key |
| **Recharts** o **Chart.js** | Graficos de generacion, tendencias | npm install, 0 config |
| **Leaflet** o **Mapbox** | Mapa de ubicaciones de plantas | CDN, 0 config |

> [!TIP]
> **Gemini 2.0 Flash** es ideal aqui: rapido, barato, y suficiente para interpretar datos de plantas solares y generar respuestas en espanol. El prompt debe incluir los datos actuales como contexto.

### UI y tooling del repo

| Libreria / herramienta | Estado | Para que |
|----------|----------|----------------|
| **shadcn/ui** | Ya configurado | Base de componentes reutilizables y consistente con Tailwind v4 |
| **Hugeicons** | Ya instalado | Iconos modernos sin agregar otra libreria |
| **next/font** | Ya usado | Tipografia optimizada sin carga manual |
| **Tailwind CSS v4** | Ya configurado | Estilos rapidos, tokens y customizacion del sistema visual |

### Librerias opcionales si hacen falta

| Libreria | Cuando tendria sentido agregarla | Costo |
|----------|----------------------------|-------|
| **Framer Motion** | Si realmente necesitan micro-animaciones premium en cards, contadores o transiciones | Bajo |
| **Sonner** | Si quieren toasts elegantes para alertas del dashboard | Bajo |
| **Recharts** o **Chart.js** | Si la vista de detalle necesita graficos reales y no alcanza con barras/cards simples | Bajo |

### Deploy recomendado - **Vercel**

- `git push` -> deploy automatico
- URL publica en segundos
- SSL automatico
- Zero configuracion
- Variables de entorno desde el panel (API key segura)

### Herramientas de productividad

| Herramienta | Para que |
|------------|----------|
| **Cursor** (sponsor del evento) | Coding asistido por IA |
| **v0.dev** | Generar componentes UI rapido con prompts |
| **GitHub Copilot** | Autocompletar codigo |

---

## 7. DIFERENCIACION (CLAVE PARA GANAR)

### Como generar efecto "wow" rapidamente

#### 1. El "Command Center" visual
En lugar de un dashboard plano, disenar la pantalla principal como un **centro de control tipo NASA/SpaceX**:
- Fondo oscuro (`#0a0a1a`)
- Gradientes sutiles en azul/morado para cards
- Metricas grandes con animacion numerica (contadores que suben)
- Un "orbe" o circulo central que pulsa indicando el estado general del sistema (verde = todo ok, rojo = hay alertas)
- Grid asimetrico con cards de diferentes tamanos

**Tiempo**: 2-3 horas de CSS bien invertidas. **Impacto**: los jueces lo ven en los primeros 3 segundos de la demo.

#### 2. Chat IA que "habla solar"
No usar un chatbot generico. Disenar un prompt que haga al LLM responder como un **analista de operaciones solar**:

```text
Eres SolarHub AI, el asistente de operaciones de una empresa de energia solar.
Tienes acceso a datos en tiempo real de {N} plantas solares.
Responde siempre en espanol, de forma concisa y accionable.
Cuando detectes anomalias, sugiere acciones concretas.
```

**Momento wow en la demo**: el presentador abre el chat y pregunta "Cuales son las plantas con problemas ahora mismo?" y el chat lista los dispositivos offline con recomendaciones.

#### 3. Audio/sonido de alerta
Cuando se detecta un dispositivo offline durante la demo, que suene un **sonido sutil** de alerta. Los jueces lo van a notar inmediatamente. Muy facil de implementar (1 linea de JS con `new Audio()`), altisimo impacto sensorial.

### Detalles visuales de alto impacto y bajo esfuerzo

| Detalle | Esfuerzo | Impacto visual |
|---------|----------|---------------|
| Modo oscuro con gradientes glassmorphism | 30 min | Muy alto |
| Counters animados (numeros que "cuentan" hasta el valor real) | 20 min | Alto |
| Loading skeletons en lugar de spinners | 15 min | Alto |
| Badges de alerta con animacion de "pulse" | 10 min | Alto |
| Favicon y titulo de pestana personalizado | 5 min | Medio |
| Tooltip en hover con detalles del dispositivo | 15 min | Medio |
| Transiciones de pagina con fade-in | 10 min | Medio |

### Storytelling que haga memorable el proyecto

**La historia NO es tecnica. Es humana.**

> *"Imagina que eres el operador de Techos Rentables. Llegas el lunes a las 8am. Tienes 200 clientes. Cada uno tiene entre 5 y 15 dispositivos. Necesitas saber si alguno fallo durante el fin de semana. Tu proceso? Abrir 5 plataformas diferentes. Revisar cientos de dispositivos uno por uno. Copiar datos a Excel. Rezar para no equivocarte."*
>
> *"Con SolarHub, llegas el lunes, abres UNA pantalla, y en 3 segundos sabes exactamente que paso. Si algo fallo, ya hay una alerta con la accion recomendada. Tu reporte mensual se genera solo. Esas 130 horas que perdias cada mes... ahora son tuyas."*

---

## 8. PLAN DE EJECUCION (18 HORAS)

> [!IMPORTANT]
> **Equipo de 3 personas**.
> Roles sugeridos:
> - **Persona A - Frontend Lead**: dashboard, componentes, UX/UI, pulido visual
> - **Persona B - Integracion + Data**: APIs del middleware, normalizacion de datos, logica de alertas
> - **Persona C - IA + Features + Pitch**: chat IA, reportes, storytelling, preparacion del pitch

### Horas 0-2: Decisiones criticas (todos juntos)

- [ ] **[30 min]** Leer juntos: problema, contexto operacional, rubrica, guia tecnica
- [ ] **[15 min]** Definir la frase del problema: *"Unificar el monitoreo de +200 plantas solares multi-marca en un solo command center con IA"*
- [ ] **[15 min]** Validar acceso al middleware con la API key del equipo (hacer un `curl` de prueba a cada proveedor)
- [ ] **[30 min]** Setup del proyecto: `npx create-next-app`, estructura de carpetas, deploy a Vercel, repo en GitHub
- [ ] **[30 min]** Explorar las APIs reales: entender que datos devuelve cada proveedor, que campos usar, que normalizar

**Entregable hora 2**: proyecto corriendo en local + Vercel con "Hello World". Las tres personas saben que datos devuelve cada API.

### Horas 3-8: Construccion core

**Persona A - Frontend Lead**:
- [ ] **[H3-4]** Sistema de diseno: colores, tipografia, layout base (sidebar + main), modo oscuro
- [ ] **[H5-6]** Dashboard principal: grid de cards con metricas macro (total plantas, total dispositivos, dispositivos online/offline, kWh total)
- [ ] **[H7-8]** Tarjetas individuales de plantas: semaforo, nombre del cliente, marca, kWh actual, estado

**Persona B - Integracion + Data**:
- [ ] **[H3-4]** Capa de API Routes: proxy al middleware para cada proveedor (`/api/growatt`, `/api/huawei`, `/api/deye`)
- [ ] **[H5-6]** Normalizacion de datos: crear un schema unificado `{ plantId, clientName, brand, devices: [{ id, status, power, voltage }] }`
- [ ] **[H7-8]** Logica de alertas: comparar KPIs con umbrales -> generar lista de alertas

**Persona C - IA + Features**:
- [ ] **[H3-4]** Integrar Gemini/OpenAI API: endpoint `/api/chat` que reciba pregunta + contexto de plantas
- [ ] **[H5-6]** Disenar el prompt del asistente IA con datos reales de las plantas como contexto
- [ ] **[H7-8]** Panel de alertas en la UI: lista de alertas con prioridad, timestamp, accion sugerida

**Entregable hora 8**: dashboard funcional con datos reales de 3 proveedores. Alertas basicas. Chat IA respondiendo preguntas.

### Horas 9-14: Pulido + features clave

**Persona A - Frontend Lead**:
- [ ] **[H9-10]** Vista detalle de planta: grafico de generacion (Recharts), lista de dispositivos con estado
- [ ] **[H11-12]** Micro-animaciones: counters animados, transiciones, loading skeletons, pulse en alertas
- [ ] **[H13-14]** Responsive check, ajustes de UX, mapa de ubicaciones (si hay tiempo)

**Persona B - Integracion + Data**:
- [ ] **[H9-10]** Polling automatico: actualizacion de datos cada 30-60 segundos. Cache de responses
- [ ] **[H11-12]** Edge cases: manejo de errores del middleware, estados de carga, datos vacios
- [ ] **[H13-14]** Generacion de resumen/reporte por planta (datos formateados para el LLM)

**Persona C - IA + Features + Pitch**:
- [ ] **[H9-10]** Mejorar respuestas del chat IA: iterar prompts, agregar analisis comparativo
- [ ] **[H11-12]** Empezar el pitch: estructura, script, storytelling, slides (max 10)
- [ ] **[H13-14]** Vista de reportes automaticos: el LLM genera un "reporte mensual" con los datos actuales

**Entregable hora 14**: producto pulido. Chat IA refinado. Primer borrador del pitch listo.

### Horas 15-18: Demo + pitch + estabilidad

> [!CAUTION]
> **Congelar features a la hora 15.** A partir de aqui, no se agrega nada nuevo. Solo se arregla lo roto y se pule.

**Todos**:
- [ ] **[H15]** Code freeze. Deploy final a Vercel. Verificar que todo funciona en la URL publica
- [ ] **[H15-16]** Ensayo 1 del pitch con cronometro (5 minutos exactos)
- [ ] **[H16-17]** Corregir cualquier bug de demo. Preparar datos/escenarios para la presentacion
- [ ] **[H17]** Ensayo 2 del pitch. Ajustar timing. Preparar respuestas a preguntas tipicas de jueces
- [ ] **[H17-18]** Ensayo 3 final. README del repo actualizado. Verificar estabilidad
- [ ] **[H18]** Pitch time

---

## 9. DEMO Y PITCH

### Estructura del pitch (5 minutos exactos)

| Tiempo | Seccion | Que decir | Que mostrar |
|--------|---------|-----------|-------------|
| 0:00-0:40 | **El dolor** | "Techos Rentables gestiona 200+ plantas solares. Hoy, supervisarlas requiere entrar a 5 plataformas diferentes. Un reporte de un solo cliente toma 40 minutos. Al mes son 130 horas de trabajo manual. Y cuando un equipo falla... pueden pasar semanas sin que nadie lo note." | Slide con numeros impactantes. Quizas un visual de las 5 plataformas fragmentadas |
| 0:40-1:10 | **El costo real** | "130 horas son 16 dias de trabajo. Cada falla no detectada cuesta dinero real: penalizaciones contractuales, lucro cesante, clientes insatisfechos. Y lo peor: no pueden crecer sin contratar mas gente que haga lo mismo." | Slide con el costo en $ y tiempo |
| 1:10-1:30 | **La solucion** | "Presentamos SolarHub: el Command Center que unifica todas las plataformas de energia solar en una sola pantalla inteligente." | Transicion al dashboard en vivo |
| 1:30-3:30 | **Demo en vivo** | Mostrar: (1) dashboard con datos reales de 3 proveedores, (2) alertas de dispositivos con problemas, (3) chat IA respondiendo "que plantas tienen problemas?", (4) vista detalle de una planta | Demo en vivo en la URL de Vercel |
| 3:30-4:15 | **Impacto + Escalabilidad** | "De 130 horas a 0. De semanas para detectar una falla a menos de 5 minutos. Y esto no es solo para Techos Rentables: hay 5,000+ empresas solares en Latam con el mismo problema." | Slide con antes/despues + TAM |
| 4:15-4:45 | **Cierre** | "SolarHub: de 5 plataformas y 130 horas de caos a una pantalla y cero esfuerzo manual. Gracias." | Logo + tagline |

### Que mostrar primero?
El **dashboard con datos reales**. No slides de arquitectura. El juez necesita ver el producto funcionando lo antes posible.

### Que evitar decir?
- "Usamos React con Next.js y Tailwind..." -> a los jueces no les importa el stack
- "No nos dio tiempo de..." -> nunca mencionar lo que falta
- "Esto es solo un prototipo..." -> presentarlo con confianza como producto
- "Si tuvieramos mas tiempo..." -> focus en lo que SI tiene

### Como responder preguntas de jueces

| Pregunta probable | Respuesta preparada |
|-------------------|-------------------|
| "Los datos son reales?" | "Si, cada dato viene en tiempo real del middleware oficial. Son lecturas reales de inversores Growatt, Huawei y Deye." |
| "Que pasa si se agrega una nueva marca?" | "La arquitectura de normalizacion permite agregar un nuevo proveedor creando solo un adaptador. El middleware ya facilita la autenticacion." |
| "Como manejan la escala de 200+ clientes?" | "El sistema esta disenado para consumir datos de cualquier cantidad de plantas. El polling y la cache mantienen el rendimiento. Para produccion, se migraria a WebSockets." |
| "La IA es real o simulada?" | "Es real. Usamos Gemini/GPT con un prompt especializado que recibe los datos actuales de las plantas como contexto para responder." |
| "Como lo monetizarian?" | "Modelo SaaS: suscripcion mensual por numero de plantas monitoreadas. Techos Rentables como primer cliente, luego expandir a otras empresas solares en Colombia y Latam." |

---

## 10. RIESGOS Y ERRORES A EVITAR

### Decisiones que hacen perder tiempo critico

| Riesgo | Mitigacion |
|--------|-----------|
| **Pasar 2+ horas entendiendo la API de un proveedor** | Si un proveedor no coopera en 30 min, mockearlo con data estatica del primer call exitoso y seguir |
| **Pelear con CORS** | Usar las API Routes de Next.js como proxy. NUNCA llamar al middleware desde el frontend directo |
| **Debatir el diseno en vez de construir** | Una persona define el diseno y el resto construye alrededor. Mejorar se puede, pero no eternizar decisiones |
| **Elegir un framework complejo** | Next.js o Vite. No Svelte, no Angular, no algo que nadie del equipo domine |
| **Deploy complicado** | Vercel es la opcion recomendada. Evitar Docker, AWS o servidores propios para el MVP |

### Sobreingenieria - enemigo #1

- **NO** crear una base de datos normalizada con 15 tablas
- **NO** implementar un sistema de cache con Redis
- **NO** crear un sistema de colas para procesamiento asincrono
- **NO** perseguir cobertura exhaustiva si pone en riesgo la demo
- **NO** hacer una API REST "correcta" con versionamiento
- **NO** implementar WebSockets (polling cada 30 seg es suficiente para la demo)

### Features que NO suman puntos

- Modo claro/oscuro toggle (dejarlo en oscuro y listo)
- Internacionalizacion (todo en espanol, punto)
- Exportar a CSV/Excel
- Pantalla de settings
- Animaciones complejas que toman horas
- Integracion con Slack/Discord/Telegram

### Problemas tipicos en hackathons rapidas

| Problema | Como evitarlo |
|----------|--------------|
| "Se rompio todo a las 2am y no se por que" | Commits frecuentes. Si algo funciona, commit inmediato. Nunca reescribir algo que ya funciona |
| "El middleware se cayo" | Tener un JSON de respaldo con datos capturados. Si el middleware falla, leer del JSON. En la demo nadie nota la diferencia |
| "Un integrante se bloqueo 3 horas" | Regla: 30 min es el maximo para un bloqueador. Si no cede: simplifica, mockea, o pide ayuda |
| "No ensayamos el pitch" | El pitch se empieza a preparar en la hora 11-12, no en la ultima hora. Se ensaya minimo 3 veces |
| "El presentador no sabe explicar la parte tecnica" | El que presenta es el que mejor comunica, no necesariamente el que mas sabe de codigo |
| "Intentamos agregar algo en la ultima hora y todo se rompio" | **Code freeze a la hora 15**. Despues solo arreglar bugs y pulir |
| "No funciona en el proyector" | Probar en la URL publica (Vercel) con el navegador que usaran para la demo. Verificar que funcione sin dependencias locales |

---

> [!TIP]
> ## Regla de oro final
> **Si en la hora 15 pueden abrir UNA pantalla con datos reales de 3 proveedores y el chat IA responde una pregunta relevante, quedan muy bien posicionados.** Si ademas el visual es premium y el pitch es memorable, la propuesta compite fuerte.

---

*Documento de analisis y sintesis para publicar junto al repositorio del reto TINKU Hackathon 2026.*
