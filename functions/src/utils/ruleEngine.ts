import { Collections } from '../services/firestore';
import { config } from '../config/env';
import * as admin from 'firebase-admin';

export interface TelemetryData {
  energy_today_kwh: number;
  voltage_ac: number;
  current_ac: number;
  frequency_hz: number;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
}

/**
 * Evalúa las reglas de negocio sobre la telemetría entrante y genera/resuelve alarmas si es necesario.
 * Tiempo de reacción: Menos de 5 minutos, ya que se corre dentro del ciclo del Polling.
 */
export async function evaluateRulesAndStore(
  deviceId: string,
  plantId: string,
  telemetry: TelemetryData
) {
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  
  // 1. Guardar la telemetría en la sub-colección del dispositivo
  const deviceRef = Collections.devices.doc(deviceId);
  await deviceRef.collection('telemetry').add({
    timestamp,
    kpis: telemetry
  });

  // 2. Actualizar la última fecha de lectura en el dispositivo principal
  await deviceRef.update({ last_telemetry_at: timestamp });

  // 3. Evaluar Reglas de Negocio
  const batch = Collections.alarms.firestore.batch();
  const alarmsQuery = await Collections.alarms
    .where('device_id', '==', deviceId)
    .where('status', '==', 'ACTIVE')
    .get();

  const activeAlarms = alarmsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  const checkAndCreateAlarm = (condition: boolean, type: string, severity: string, details: any) => {
    const existingAlarm = activeAlarms.find(a => a.type === type);
    
    if (condition && !existingAlarm) {
      // Crear nueva alarma
      const newAlarmRef = Collections.alarms.doc();
      batch.set(newAlarmRef, {
        device_id: deviceId,
        plant_id: plantId,
        type,
        severity,
        status: 'ACTIVE',
        created_at: timestamp,
        resolved_at: null,
        details
      });
    } else if (!condition && existingAlarm) {
      // Resolver alarma existente
      const alarmRef = Collections.alarms.doc(existingAlarm.id);
      batch.update(alarmRef, {
        status: 'RESOLVED',
        resolved_at: timestamp
      });
    }
  };

  // Regla 1: Dispositivo Offline
  checkAndCreateAlarm(
    telemetry.status === 'OFFLINE' || telemetry.status === 'ERROR',
    'DEVICE_OFFLINE',
    'CRITICAL',
    { status_detected: telemetry.status }
  );

  // Regla 2: Frecuencia fuera de rango
  const isFreqOutOfRange = telemetry.frequency_hz < config.THRESHOLDS.FREQUENCY_MIN_HZ || 
                           telemetry.frequency_hz > config.THRESHOLDS.FREQUENCY_MAX_HZ;
  checkAndCreateAlarm(
    isFreqOutOfRange && telemetry.status === 'ONLINE',
    'FREQUENCY_OUT_OF_RANGE',
    'CRITICAL',
    { reading_value: telemetry.frequency_hz, allowed_range: `${config.THRESHOLDS.FREQUENCY_MIN_HZ}-${config.THRESHOLDS.FREQUENCY_MAX_HZ} Hz` }
  );

  // Regla 3: Voltaje fuera de especificación
  const isVoltOutOfRange = telemetry.voltage_ac < config.THRESHOLDS.VOLTAGE_MIN_V || 
                           telemetry.voltage_ac > config.THRESHOLDS.VOLTAGE_MAX_V;
  checkAndCreateAlarm(
    isVoltOutOfRange && telemetry.status === 'ONLINE',
    'VOLTAGE_OUT_OF_RANGE',
    'WARNING',
    { reading_value: telemetry.voltage_ac, allowed_range: `${config.THRESHOLDS.VOLTAGE_MIN_V}-${config.THRESHOLDS.VOLTAGE_MAX_V} V` }
  );

  // Regla 4: Baja generación - (Simplificado para el hackathon. Lo ideal sería comparar contra histórico)
  checkAndCreateAlarm(
    telemetry.energy_today_kwh === 0 && telemetry.status === 'ONLINE' && new Date().getHours() > 10,
    'LOW_GENERATION',
    'WARNING',
    { reading_value: telemetry.energy_today_kwh, explanation: 'Generación nula en pleno día' }
  );

  await batch.commit();
}
