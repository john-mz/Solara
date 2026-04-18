import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Collections } from '../services/firestore';
import { HuaweiApi } from '../services/huaweiApi';
import { evaluateRulesAndStore, TelemetryData } from '../utils/ruleEngine';

export const pollHuaweiTelemetry = onSchedule('*/2 * * * *', async (event) => {
  console.log('Iniciando polling de telemetría para Huawei...');
  
  const devicesQuery = await Collections.devices.where('brand', '==', 'huawei').get();
  
  if (devicesQuery.empty) {
    console.log('No hay dispositivos Huawei registrados.');
    return;
  }

  for (const doc of devicesQuery.docs) {
    const device = doc.data();
    try {
      const res = await HuaweiApi.getRealTimeData(device.original_id);
      
      const kpis = res.data;
      let status: 'ONLINE' | 'OFFLINE' | 'ERROR' = 'ONLINE';
      
      // 0: Offline, 1: Online, 2: Fault, etc (según documentación simulada)
      if (kpis?.status === 0) status = 'OFFLINE';
      else if (kpis?.status === 2) status = 'ERROR';

      const telemetry: TelemetryData = {
        energy_today_kwh: Number(kpis?.day_cap) || 0,
        voltage_ac: Number(kpis?.u_a || kpis?.pv1_u) || 0,
        current_ac: Number(kpis?.i_a || kpis?.pv1_i) || 0,
        frequency_hz: Number(kpis?.grid_freq) || 0,
        status
      };

      await evaluateRulesAndStore(doc.id, device.plant_id, telemetry);
    } catch (error) {
      console.error(`Error al procesar telemetría del dispositivo Huawei ${device.original_id}:`, error);
    }
  }
});
