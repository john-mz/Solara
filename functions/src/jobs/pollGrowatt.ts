import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Collections } from '../services/firestore';
import { GrowattApi } from '../services/growattApi';
import { evaluateRulesAndStore, TelemetryData } from '../utils/ruleEngine';

export const pollGrowattTelemetry = onSchedule('*/2 * * * *', async (event) => {
  console.log('Iniciando polling de telemetría para Growatt...');
  
  const devicesQuery = await Collections.devices.where('brand', '==', 'growatt').get();
  
  if (devicesQuery.empty) {
    console.log('No hay dispositivos Growatt registrados.');
    return;
  }

  for (const doc of devicesQuery.docs) {
    const device = doc.data();
    try {
      const res = await GrowattApi.getRealTimeData(device.original_id);
      
      const kpis = res.data;
      let status: 'ONLINE' | 'OFFLINE' | 'ERROR' = 'ONLINE';
      
      // 0: Waiting/Offline, 1: Normal, 3: Fault
      if (kpis?.status === 0) status = 'OFFLINE';
      else if (kpis?.status === 3) status = 'ERROR';

      const telemetry: TelemetryData = {
        energy_today_kwh: Number(kpis?.eToday) || 0,
        voltage_ac: Number(kpis?.vac1) || 0,
        current_ac: Number(kpis?.iac1) || 0,
        frequency_hz: Number(kpis?.fac) || 0,
        status
      };

      await evaluateRulesAndStore(doc.id, device.plant_id, telemetry);
    } catch (error) {
      console.error(`Error al procesar telemetría del dispositivo Growatt ${device.original_id}:`, error);
    }
  }
});
