import type { AlarmDoc, AlarmType } from "@/lib/types";

export type ResolutionChannel = "remote" | "call_client" | "send_technician";

export type AlarmSolution = {
  title: string;
  description: string;
  channel: ResolutionChannel;
  channelLabel: string;
  steps: string[];
  estimatedTime: string;
};

const SOLUTIONS: Record<AlarmType, (alarm: AlarmDoc) => AlarmSolution> = {
  DEVICE_OFFLINE: (alarm) => {
    const minutesOffline = Math.round(
      (Date.now() - alarm.created_at.toMillis()) / 60_000
    );

    if (minutesOffline < 30) {
      return {
        title: "Reinicio remoto del dispositivo",
        description:
          "El dispositivo lleva poco tiempo offline. Es probable que sea un problema temporal de conectividad o un reinicio automático del inversor.",
        channel: "remote",
        channelLabel: "Solución remota",
        steps: [
          "Verificar en la plataforma del fabricante si el dispositivo responde al ping",
          "Intentar reinicio remoto desde la plataforma del proveedor (Deye/Huawei/Growatt)",
          "Revisar si hay un corte de energía reportado en la zona",
          "Esperar 5 minutos y verificar si reconecta automáticamente",
        ],
        estimatedTime: "5–15 min",
      };
    }

    if (minutesOffline < 240) {
      return {
        title: "Contactar al cliente para verificación física",
        description:
          "El dispositivo lleva más de 30 minutos offline. Puede ser un corte de energía local, un breaker desconectado o pérdida de señal WiFi/4G.",
        channel: "call_client",
        channelLabel: "Llamar al cliente",
        steps: [
          "Llamar al cliente y preguntar si hay energía eléctrica en la instalación",
          "Pedir al cliente que verifique si el breaker del inversor está encendido (ON)",
          "Verificar que el router/modem WiFi esté funcionando",
          "Si el inversor tiene pantalla, pedir que lea el código de estado",
          "Si todo lo anterior está bien, programar visita técnica",
        ],
        estimatedTime: "15–30 min",
      };
    }

    return {
      title: "Enviar técnico — posible falla de hardware",
      description:
        "El dispositivo lleva más de 4 horas offline. Es probable que haya una falla física que requiere inspección presencial.",
      channel: "send_technician",
      channelLabel: "Enviar técnico",
      steps: [
        "Programar visita técnica en las próximas 24 horas",
        "Llevar equipo de diagnóstico y repuestos de conectividad",
        "Revisar cableado, fusibles y conexiones del inversor",
        "Verificar señal de comunicación (WiFi/4G/Ethernet)",
        "Si el inversor no enciende, evaluar reemplazo bajo garantía",
      ],
      estimatedTime: "Visita de 1–3 horas",
    };
  },

  VOLTAGE_OUT_OF_RANGE: (alarm) => {
    const reading = alarm.details?.reading_value;
    const threshold = alarm.details?.threshold_value;
    const deviation = reading && threshold ? Math.abs(reading - threshold) : 0;

    if (deviation < 10) {
      return {
        title: "Monitorear — desviación menor de voltaje",
        description:
          "La desviación de voltaje es leve y puede deberse a fluctuaciones normales de la red eléctrica local. Se recomienda monitorear.",
        channel: "remote",
        channelLabel: "Solución remota",
        steps: [
          "Verificar si la desviación es puntual o persistente (revisar últimas 10 lecturas)",
          "Consultar con el operador de red local si hay mantenimiento programado",
          "Si persiste más de 2 horas, escalar a llamada al cliente",
        ],
        estimatedTime: "Monitoreo de 1–2 horas",
      };
    }

    return {
      title: "Contactar al cliente — verificar red eléctrica",
      description: `Se detectó un voltaje de ${reading ?? "?"}V (umbral: ${threshold ?? "?"}V). Esto puede indicar un problema en la red eléctrica local o una falla interna del inversor.`,
      channel: "call_client",
      channelLabel: "Llamar al cliente",
      steps: [
        "Llamar al cliente y preguntar si otros equipos eléctricos funcionan normalmente",
        "Verificar si hay variaciones de voltaje perceptibles (luces parpadeando, etc.)",
        "Pedir al cliente que revise el tablero de distribución",
        "Si el problema es de la red local, reportar al operador de red",
        "Si es interno del inversor, programar visita técnica",
      ],
      estimatedTime: "15–30 min + posible visita",
    };
  },

  FREQUENCY_OUT_OF_RANGE: (alarm) => {
    const reading = alarm.details?.reading_value;

    return {
      title: "Verificar estabilidad de red eléctrica",
      description: `Frecuencia detectada: ${reading ?? "?"}Hz (rango aceptable: 54–66Hz, estándar: 60Hz). Las desviaciones de frecuencia generalmente son causadas por inestabilidad en la red eléctrica y no por el inversor.`,
      channel: "call_client",
      channelLabel: "Llamar al cliente",
      steps: [
        "Verificar si otros inversores en la misma planta muestran la misma desviación",
        "Si es generalizado: es un problema de la red eléctrica — contactar al operador de red",
        "Si es solo un inversor: pedir al cliente que apague y encienda el inversor (ciclo de potencia)",
        "Monitorear durante 1 hora tras el reinicio",
        "Si persiste en un solo inversor, programar visita técnica — posible falla interna",
      ],
      estimatedTime: "30 min de monitoreo",
    };
  },

  LOW_GENERATION: () => {
    return {
      title: "Diagnóstico de baja generación",
      description:
        "La generación está más del 20% por debajo del promedio histórico. Antes de tomar acción, se debe descartar condiciones climáticas adversas.",
      channel: "remote",
      channelLabel: "Solución remota",
      steps: [
        "Verificar condiciones climáticas del día (nublado, lluvia) — si es un día nublado, es esperado",
        "Comparar con otros inversores de la misma planta: ¿todos tienen baja generación o solo uno?",
        "Si es generalizado → clima, no requiere acción",
        "Si es solo un dispositivo → posible panel sucio, sombreado parcial o falla de microinversor",
        "Si persiste en día soleado, llamar al cliente para inspección visual de los paneles",
        "Verificar si hay sombras nuevas (construcción vecina, árbol crecido)",
      ],
      estimatedTime: "Análisis de 15 min + posible llamada",
    };
  },
};

export function getAlarmSolution(alarm: AlarmDoc): AlarmSolution {
  const solver = SOLUTIONS[alarm.type];
  return solver(alarm);
}

export function channelColorClass(channel: ResolutionChannel): string {
  switch (channel) {
    case "remote":
      return "border border-emerald-900/50 bg-emerald-100 text-emerald-950 shadow-sm dark:border-emerald-400/60 dark:bg-emerald-950 dark:text-emerald-50";
    case "call_client":
      return "border border-amber-900/50 bg-amber-100 text-amber-950 shadow-sm dark:border-amber-400/60 dark:bg-amber-950 dark:text-amber-50";
    case "send_technician":
      return "border border-red-800/55 bg-red-100 text-red-950 shadow-sm dark:border-red-400/55 dark:bg-red-950 dark:text-red-50";
  }
}
