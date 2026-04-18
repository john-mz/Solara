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
      
      // Normalización de datos Deye a nuestro modelo
      const kpis = res.data; // asumiendo que los datos vienen en res.data
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
    } catch (error) {
      console.error(`Error al procesar telemetría del dispositivo Deye ${device.original_id}:`, error);
      // No detenemos el bucle, continuamos con el siguiente dispositivo
    }
  }
});
