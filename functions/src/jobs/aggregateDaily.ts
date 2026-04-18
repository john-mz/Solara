import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Collections } from '../services/firestore';
import * as admin from 'firebase-admin';

export const aggregateDailySummaries = onSchedule('55 23 * * *', async (event) => {
  console.log('Iniciando agregación diaria...');
  
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // "2026-04-17"
  
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const plantsQuery = await Collections.plants.get();
  const batch = Collections.dailySummaries.firestore.batch();

  for (const plantDoc of plantsQuery.docs) {
    let totalEnergyKwh = 0;
    let totalUptimeRecords = 0;
    let totalOnlineRecords = 0;

    // Buscar dispositivos de esta planta
    const devicesQuery = await Collections.devices.where('plant_id', '==', plantDoc.id).get();

    for (const deviceDoc of devicesQuery.docs) {
      // Buscar telemetría de hoy para este dispositivo
      const telemetryQuery = await Collections.devices.doc(deviceDoc.id)
        .collection('telemetry')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
        .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
        .get();

      // Encontrar el último registro del día para obtener la energía total generada por ese dispositivo hoy
      if (!telemetryQuery.empty) {
        // Ordenamos por timestamp para obtener el último
        const sortedDocs = telemetryQuery.docs.sort((a, b) => b.data().timestamp.toMillis() - a.data().timestamp.toMillis());
        const lastRecord = sortedDocs[0].data();
        totalEnergyKwh += lastRecord.kpis.energy_today_kwh || 0;

        // Calcular Uptime de las muestras del día
        for (const record of telemetryQuery.docs) {
          totalUptimeRecords++;
          if (record.data().kpis.status === 'ONLINE') {
            totalOnlineRecords++;
          }
        }
      }
    }

    const avgUptimePercent = totalUptimeRecords > 0 ? (totalOnlineRecords / totalUptimeRecords) * 100 : 0;
    // Cálculos arbitrarios de negocio para el hackathon (ej. 0.4 kg CO2 por kWh, $500 COP por kWh)
    const co2MitigatedTons = (totalEnergyKwh * 0.4) / 1000;
    const financialSavings = totalEnergyKwh * 500;

    const summaryId = `${plantDoc.id}_${dateString}`;
    batch.set(Collections.dailySummaries.doc(summaryId), {
      plant_id: plantDoc.id,
      date: dateString,
      total_energy_kwh: totalEnergyKwh,
      avg_uptime_percent: avgUptimePercent,
      co2_mitigated_tons: co2MitigatedTons,
      financial_savings: financialSavings,
      computed_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
  console.log(`Agregación diaria completada para ${plantsQuery.size} plantas.`);
});
