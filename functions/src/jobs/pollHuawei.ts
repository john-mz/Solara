import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Collections } from '../services/firestore';
import { HuaweiApi } from '../services/huaweiApi';
import { evaluateRulesAndStore, TelemetryData } from '../utils/ruleEngine';

export const pollHuaweiTelemetry = onSchedule('* * * * *', async (event) => {
  console.log('Iniciando polling de telemetría para Huawei...');
  
  const devicesQuery = await Collections.devices.where('brand', '==', 'huawei').get();
  
  if (devicesQuery.empty) {
    console.log('No hay dispositivos Huawei registrados.');
    return;
  }

  for (const doc of devicesQuery.docs) {
    const device = doc.data();
    try {
      // Necesitamos devTypeId para Huawei RealTime KPI
      const res = await HuaweiApi.getRealTimeData(device.original_id, device.devTypeId || 1);
      
      const deviceData = res.data?.[0];
      const kpis = deviceData?.dataItemMap;

      if (!kpis) {
        console.warn(`No se recibieron KPIs para el dispositivo Huawei ${device.original_id}`);
        continue;
      }

      let status: 'ONLINE' | 'OFFLINE' | 'ERROR' = 'ONLINE';
      // 0: Offline/Apagado, 1: En línea, 2: Desconectado
      if (kpis.run_state === 0) status = 'OFFLINE';
      else if (kpis.run_state === 2) status = 'ERROR';

      const telemetry: TelemetryData = {
        energy_today_kwh: Number(kpis.day_cap) || 0,
        voltage_ac: Number(kpis.a_u || kpis.pv1_u) || 0,
        current_ac: Number(kpis.a_i || kpis.pv1_i) || 0,
        frequency_hz: Number(kpis.elec_freq) || 0,
        status
      };

      await evaluateRulesAndStore(doc.id, device.plant_id, telemetry);
    } catch (error) {
      console.error(`Error al procesar telemetría del dispositivo Huawei ${device.original_id}:`, error);
    }
  }
});
