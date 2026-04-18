# Solara ☀️

Plataforma de monitoreo solar unificado para [Techos Rentables](https://techosrentables.com). Consolida datos de **200+ proyectos solares** de múltiples marcas (Deye, Huawei, Growatt) en un solo dashboard, detecta fallas en **menos de 5 minutos** y elimina las **130+ horas/mes** de trabajo manual en generación de reportes.

Proyecto desarrollado durante **[TINKU Hackathon 2026](https://hackathon.thetribu.dev/)** — The Tribu × Universidad Cooperativa de Colombia.

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Roles de acceso

La app tiene dos modos de acceso desde la pantalla de login:

| Rol | Cómo ingresar | Qué ve |
|-----|---------------|--------|
| **Negocio (Admin)** | Botón "Continuar con Google" | 4 vistas: Alarmas, Plantas, Dispositivos, Reportes |
| **Cliente** | Código de instalación (ver tabla abajo) | Dashboard de su planta con métricas por día, 2 semanas, mes o año |

### Instalaciones de prueba

| Código | Nombre | Marca | Capacidad | Ubicación |
|--------|--------|-------|-----------|-----------|
| `2725961` | Motel Olafo | Growatt | 100 kW | Cartago, Colombia |
| `10339310` | Hacienda Aranjuez | Growatt | 85.8 kW | Candelaria, Colombia |
| `10367329` | Pecuaria San Miguel | Growatt | 85.4 kW | Santander de Quilichao, Colombia |
| `1364618` | SSFV Cámara y Comercio Florencia | Growatt | 50 kW | Florencia, Colombia |
| `2148833` | Piscicola Ermita | Growatt | 50 kW | Viterbo, Colombia |
| `10095856` | Graficas y Empaques | Growatt | 42.2 kW | Dosquebradas, Colombia |
| `NE=33685734` | Gómez Velázquez | Huawei | 40 kW | Cartago, Valle del Cauca |
| `1543188` | SSFV Plaza Campesina | Growatt | 30 kW | Cartago, Colombia |
| `122825` | J&G | Deye | 19.9 kW | La Unión, Valle del Cauca |
| `148520` | Hacienda San Miguel | Deye | 16 kW | El Vergel |

> Los códigos con prefijo `NE=` corresponden a instalaciones Huawei.

## Qué resuelve

| Problema | Antes | Con Solara |
|----------|-------|------------|
| Generar informe de un cliente | ~40 min manuales | Automático e instantáneo |
| Detectar falla en un equipo | Días o semanas | < 5 minutos |
| Ver estado de todas las marcas | Entrar a 4+ plataformas distintas | 1 sola vista unificada |
| Horas/mes de trabajo repetitivo | 130+ horas | 0 |

## Vistas del admin

- **Alarmas** — Alarmas activas en tiempo real con filtros: todas, críticas, offline >5min, por planta
- **Plantas** — Listado con filtro por marca y toggle de SLA comprometido
- **Dispositivos** — Búsqueda de planta → tabla de dispositivos → panel con telemetría en tiempo real
- **Reportes** — Rankings mensuales: generación total, CO₂ mitigado, cumplimiento contractual, desviaciones de frecuencia

## Vista del cliente

Dashboard con 4 métricas contractuales seleccionables por rango temporal (día / 2 semanas / mes / año):

- Energía generada (kWh) y dinero ahorrado (COP)
- Uptime (%)
- Performance Ratio (%)
- CO₂ mitigado (toneladas)

## Arquitectura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  APIs de     │────▶│  Cloud Functions  │────▶│  Firestore   │
│  fabricantes │     │  (polling <2min)  │     │  (data layer)│
│  Deye/Huawei │     │  + Rule Engine    │     └──────┬───────┘
│  /Growatt    │     │  + Agregación     │            │
└─────────────┘     └──────────────────┘            │
                                                     ▼
                                              ┌─────────────┐
                                              │   Next.js    │
                                              │   Frontend   │
                                              │   (Vercel)   │
                                              └─────────────┘
```

**Flujo de datos:**
1. Cloud Functions consultan las APIs de cada fabricante cada 2 minutos
2. Los datos se normalizan a un esquema unificado y se guardan en Firestore
3. El rule engine evalúa cada lectura y genera alarmas automáticas (voltaje, frecuencia, offline, baja generación)
4. Al final del día, una función consolida resúmenes diarios para reportes instantáneos
5. El frontend consume Firestore en tiempo real (refresh cada 60s)

## Stack

- **Frontend:** Next.js 16 · React 19 · Tailwind CSS 4 · Framer Motion · Recharts · shadcn/ui
- **Backend:** Firebase Cloud Functions · Firestore
- **Auth:** Firebase Authentication (Google) + acceso por código de planta
- **Deploy:** Vercel (frontend) · Firebase (functions)

## Equipo

**Ojala hubiera pasado a la utp** — TINKU Hackathon 2026

- Juan David Gaitán Díaz
- John Stiven Muñoz Sabogal
- Camilo Agudelo Jaramillo

## Licencia

MIT — ver [LICENSE](./LICENSE).
