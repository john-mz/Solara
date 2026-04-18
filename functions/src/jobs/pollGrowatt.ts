import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Collections } from '../services/firestore';
import { GrowattApi } from '../services/growattApi';
import { evaluateRulesAndStore, TelemetryData } from '../utils/ruleEngine';

export const pollGrowattTelemetry = onSchedule('* * * * *', async (event) => {
  console.log('Iniciando polling de telemetría para Growatt...');
  
  const plantsQuery = await Collections.plants.where('brand', '==', 'growatt').get();
  
  if (plantsQuery.empty) {
    console.log('No hay plantas Growatt registradas.');
    return;
  }

  for (const plantDoc of plantsQuery.docs) {
    const plant = plantDoc.data();
    try {
      // Usamos el ID original de la planta para obtener datos agregados
      const res = await GrowattApi.getRealTimeData(plant.original_plant_id);
      const kpis = res.data;

      if (!kpis) {
        console.warn(`No se recibieron datos para la planta Growatt ${plant.original_plant_id}`);
        continue;
      }

      // Buscar dispositivos de esta planta para actualizar su telemetría
      const devicesQuery = await Collections.devices.where('plant_id', '==', plantDoc.id).get();
      
      for (const devDoc of devicesQuery.docs) {
        let status: 'ONLINE' | 'OFFLINE' | 'ERROR' = 'ONLINE';
        // Si no hay potencia y es de día, podría estar offline (simplificación)
        if (Number(kpis.current_power) === 0 && new Date().getHours() > 6 && new Date().getHours() < 18) {
          status = 'OFFLINE';
        }

        const telemetry: TelemetryData = {
          energy_today_kwh: Number(kpis.today_energy) || 0,
          voltage_ac: 0, // plant/data no reporta AC individual
          current_ac: 0,
          frequency_hz: 0,
          status
        };

        await evaluateRulesAndStore(devDoc.id, plantDoc.id, telemetry);
      }
    } catch (error) {
      console.error(`Error al procesar telemetría de la planta Growatt ${plant.original_plant_id}:`, error);
    }
  }
});
