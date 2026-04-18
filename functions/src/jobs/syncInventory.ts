import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Collections } from '../services/firestore';
import { DeyeApi } from '../services/deyeApi';
import { HuaweiApi } from '../services/huaweiApi';
import { GrowattApi } from '../services/growattApi';

export async function runSyncInventory() {
  console.log('Iniciando sincronización de inventario...');
  const batch = Collections.plants.firestore.batch();
  let hasChanges = false;

  // --- 1. Sincronizar Deye ---
  try {
    const deyePlantsRes = await DeyeApi.getPlants();
    const deyePlants = deyePlantsRes.stationList || deyePlantsRes.data?.list || [];
    for (const p of deyePlants) {
      const plantId = `deye_${p.id}`;
      batch.set(Collections.plants.doc(plantId), {
        original_plant_id: String(p.id),
        brand: 'deye',
        name: p.name || 'Planta Deye',
        location: p.locationAddress || p.location || '',
        installed_capacity_kw: p.installedCapacity || p.capacity || 0,
        created_at: new Date()
      }, { merge: true });
      hasChanges = true;

      // Dispositivos Deye
      const deyeDevicesRes = await DeyeApi.getDevices(String(p.id));
      const deyeDevices = deyeDevicesRes.deviceList || deyeDevicesRes.data?.list || [];
      for (const d of deyeDevices) {
        const deviceId = `deye_${d.device_sn}`;
        batch.set(Collections.devices.doc(deviceId), {
          plant_id: plantId,
          original_id: d.device_sn,
          brand: 'deye',
          type: d.device_type === 1 ? 'inverter' : 'microinverter',
          model: d.device_model || '',
          last_sync_metadata: new Date()
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error('Error sincronizando Deye:', error);
  }

  // --- 2. Sincronizar Huawei ---
  try {
    const huaweiPlantsRes = await HuaweiApi.getPlants();
    const huaweiPlants = huaweiPlantsRes.data || [];
    for (const p of huaweiPlants) {
      const plantId = `huawei_${p.stationCode}`;
      batch.set(Collections.plants.doc(plantId), {
        original_plant_id: p.stationCode,
        brand: 'huawei',
        name: p.stationName || 'Planta Huawei',
        location: p.stationAddress || '',
        installed_capacity_kw: p.capacity || 0,
        created_at: new Date()
      }, { merge: true });
      hasChanges = true;

      // Dispositivos Huawei
      const huaweiDevicesRes = await HuaweiApi.getDevices(p.stationCode);
      const huaweiDevices = huaweiDevicesRes.data || [];
      for (const d of huaweiDevices) {
        const deviceId = `huawei_${d.id}`;
        batch.set(Collections.devices.doc(deviceId), {
          plant_id: plantId,
          original_id: String(d.id),
          brand: 'huawei',
          type: 'inverter',
          model: d.devName || '',
          last_sync_metadata: new Date()
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error('Error sincronizando Huawei:', error);
  }

  // --- 3. Sincronizar Growatt ---
  try {
    const growattPlantsRes = await GrowattApi.getPlants();
    const growattPlants = growattPlantsRes.data?.plants || [];
    for (const p of growattPlants) {
      const plantId = `growatt_${p.plantId}`;
      batch.set(Collections.plants.doc(plantId), {
        original_plant_id: String(p.plantId),
        brand: 'growatt',
        name: p.plantName || 'Planta Growatt',
        location: p.city || '',
        installed_capacity_kw: p.nominalPower || 0,
        created_at: new Date()
      }, { merge: true });
      hasChanges = true;

      // Dispositivos Growatt
      const growattDevicesRes = await GrowattApi.getDevices(p.plantId);
      const growattDevices = growattDevicesRes.data?.devices || [];
      for (const d of growattDevices) {
        const deviceId = `growatt_${d.deviceSn}`;
        batch.set(Collections.devices.doc(deviceId), {
          plant_id: plantId,
          original_id: d.deviceSn,
          brand: 'growatt',
          type: 'inverter',
          model: d.deviceType || '',
          last_sync_metadata: new Date()
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error('Error sincronizando Growatt:', error);
  }

  if (hasChanges) {
    try {
      await batch.commit();
      console.log('Sincronización de inventario completada exitosamente.');
    } catch (error) {
      console.error('Error al guardar en Firestore:', error);
    }
  } else {
    console.log('Sincronización terminada sin datos nuevos para escribir.');
  }
}

// Exportamos el Cron job (diario a las 2am)
export const syncInventoryCron = onSchedule('0 2 * * *', async (event) => {
  await runSyncInventory();
});
