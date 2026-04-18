import { onRequest } from 'firebase-functions/v2/https';
import { Collections } from '../services/firestore';
import * as admin from 'firebase-admin';

export const seedMockData = onRequest(async (req, res) => {
  // Aceptamos POST o GET para mayor facilidad de prueba en el navegador o shell
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const batch = Collections.plants.firestore.batch();
    console.log('Generando datos mockeados en Firestore...');

    // 1. Crear Plantas Mock
    const plants = [
      { id: 'mock_deye_1', original_plant_id: '1001', brand: 'deye', name: 'Planta Piloto Deye', location: 'Bogotá', installed_capacity_kw: 10, created_at: new Date() },
      { id: 'mock_huawei_1', original_plant_id: '1002', brand: 'huawei', name: 'Planta Piloto Huawei', location: 'Medellín', installed_capacity_kw: 15, created_at: new Date() },
      { id: 'mock_growatt_1', original_plant_id: '1003', brand: 'growatt', name: 'Planta Piloto Growatt', location: 'Cali', installed_capacity_kw: 8, created_at: new Date() }
    ];

    for (const p of plants) {
      batch.set(Collections.plants.doc(p.id), p);
    }

    // 2. Crear Dispositivos Mock
    const devices = [
      { id: 'mock_dev_deye_1', plant_id: 'mock_deye_1', original_id: 'SN_DEYE_001', brand: 'deye', type: 'inverter', model: 'SUN-10K', last_sync_metadata: new Date() },
      { id: 'mock_dev_huawei_1', plant_id: 'mock_huawei_1', original_id: 'SN_HUA_001', brand: 'huawei', type: 'inverter', model: 'SUN2000-15KTL', last_sync_metadata: new Date() },
      { id: 'mock_dev_growatt_1', plant_id: 'mock_growatt_1', original_id: 'SN_GRO_001', brand: 'growatt', type: 'inverter', model: 'MIN 8000TL', last_sync_metadata: new Date() }
    ];

    for (const d of devices) {
      batch.set(Collections.devices.doc(d.id), d);
    }

    await batch.commit();

    // 3. Crear Telemetría Mock (Histórico reciente)
    // Usaremos un batch nuevo porque podríamos tener varios registros
    const telemetryBatch = Collections.devices.firestore.batch();
    const now = new Date();
    
    for (const d of devices) {
      // Generar 30 registros de telemetría para la última hora (1 cada 2 minutos)
      for (let i = 0; i < 30; i++) {
        const time = new Date(now.getTime() - (i * 2 * 60000));
        const telemetryId = `${d.id}_${time.getTime()}`;
        const telemetryRef = Collections.devices.doc(d.id).collection('telemetry').doc(telemetryId);
        
        telemetryBatch.set(telemetryRef, {
          timestamp: admin.firestore.Timestamp.fromDate(time),
          kpis: {
            energy_today_kwh: Math.max(0, (30 - i) * 0.5), // Energía simulada en incremento
            voltage_ac: 120 + (Math.random() * 4 - 2), // Alrededor de 120V +/- 2V
            current_ac: 15 + (Math.random() * 2 - 1),
            frequency_hz: 60 + (Math.random() * 0.2 - 0.1), // Alrededor de 60Hz
            status: 'ONLINE'
          }
        });
      }
      
      // Agregar un registro de ALARMA reciente para propósitos de demostración
      const alarmRef = Collections.alarms.doc();
      telemetryBatch.set(alarmRef, {
        plant_id: d.plant_id,
        device_id: d.id,
        rule_type: 'VOLTAGE_OUT_OF_RANGE',
        description: `El voltaje superó el umbral permitido (135V)`,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(now.getTime() - 15 * 60000)), // Hace 15 minutos
        value: 135,
        resolved: false
      });
    }

    await telemetryBatch.commit();

    // 4. Crear Resúmenes Diarios Mock (Daily Summaries)
    const summaryBatch = Collections.dailySummaries.firestore.batch();
    const todayStr = now.toISOString().split('T')[0];

    for (const p of plants) {
      const summaryId = `${p.id}_${todayStr}`;
      
      // Datos arbitrarios de demostración alineados con la capacidad de la planta
      const totalEnergy = p.installed_capacity_kw * 4.5; // ~4.5 horas de sol pico
      
      summaryBatch.set(Collections.dailySummaries.doc(summaryId), {
        plant_id: p.id,
        date: todayStr,
        total_energy_kwh: totalEnergy,
        avg_uptime_percent: 99.5,
        co2_mitigated_tons: (totalEnergy * 0.4) / 1000,
        financial_savings: totalEnergy * 500, // asumiendo 500 COP / kWh
        computed_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await summaryBatch.commit();

    console.log('Datos mockeados insertados correctamente.');
    res.status(200).send({ success: true, message: 'Datos mockeados generados en Firestore exitosamente.' });
  } catch (error: any) {
    console.error('Error generando mock data:', error);
    res.status(500).send({ success: false, message: error.message });
  }
});
