import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Collections } from '../services/firestore';
import { DeyeApi } from '../services/deyeApi';
import { evaluateRulesAndStore, TelemetryData } from '../utils/ruleEngine';

export const pollDeyeTelemetry = onSchedule('*/2 * * * *', async (event) => {
  console.log('Iniciando polling de telemetría para Deye...');
  
  const devicesQuery = await Collections.devices.where('brand', '==', 'deye').get();
  
  if (devicesQuery.empty) {
    console.log('No hay dispositivos Deye registrados.');
    return;
  }

  // Iterar sobre dispositivos y solicitar telemetría
  for (const doc of devicesQuery.docs) {
    const device = doc.data();
    try {
      const res = await DeyeApi.getRealTimeData(device.original_id);

      // getRealTimeData ya retorna response.data, así que res es el body completo.
      // Los KPIs vienen en res.data según la estructura de la API de Deye.
      const kpis = res?.data;
      let status: 'ONLINE' | 'OFFLINE' | 'ERROR' = 'ONLINE';
      
      if (kpis?.work_status === 'offline') status = 'OFFLINE';
      else if (kpis?.work_status === 'fault') status = 'ERROR';

      const telemetry: TelemetryData = {
        energy_today_kwh: Number(kpis?.today_energy) || 0,
        voltage_ac: Number(kpis?.v_ac1) || 0,
        current_ac: Number(kpis?.i_ac1) || 0,
        frequency_hz: Number(kpis?.f_ac) || 0,
        status
      };

      await evaluateRulesAndStore(doc.id, device.plant_id, telemetry);
    } catch (error: any) {
      // Si el dispositivo no existe en la API (404), es probable que sea un SN de mock data.
      // Logueamos una advertencia y continuamos con el siguiente dispositivo.
      if (error?.response?.status === 404 || error?.code === 'ERR_BAD_REQUEST') {
        console.warn(
          `[WARN] Dispositivo Deye con SN "${device.original_id}" no encontrado en la API (404). ` +
          `Puede ser un SN de datos mock. Saltando...`
        );
      } else {
        console.error(`Error al procesar telemetría del dispositivo Deye ${device.original_id}:`, error);
      }
      // No detenemos el bucle, continuamos con el siguiente dispositivo
    }
  }
});
