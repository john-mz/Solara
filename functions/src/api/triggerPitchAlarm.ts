import { onRequest } from 'firebase-functions/v2/https';
import { Collections } from '../services/firestore';
import * as admin from 'firebase-admin';

/**
 * Función exclusiva para el Pitch / Demo.
 * Crea una alarma aleatoria vinculada a un dispositivo real de la base de datos.
 * Uso: GET https://<region>-<project-id>.cloudfunctions.net/triggerPitchAlarm
 */
export const triggerPitchAlarm = onRequest(async (req, res) => {
  // Solo permitimos GET y POST para mayor facilidad de uso durante la presentación
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    console.log('Iniciando trigger de alarma para el pitch...');

    // 1. Obtener todos los dispositivos disponibles
    const devicesSnapshot = await Collections.devices.get();

    if (devicesSnapshot.empty) {
      res.status(404).send({ 
        success: false, 
        message: 'No se encontraron dispositivos en la base de datos para generar una alarma.' 
      });
      return;
    }

    // 2. Seleccionar un dispositivo aleatorio
    const randomIndex = Math.floor(Math.random() * devicesSnapshot.docs.length);
    const randomDeviceDoc = devicesSnapshot.docs[randomIndex];
    const deviceData = randomDeviceDoc.data();
    const deviceId = randomDeviceDoc.id;
    const plantId = deviceData.plant_id;

    // 3. Definir tipos de alarmas posibles (basado en ruleEngine.ts)
    const alarmTypes = [
      { 
        type: 'DEVICE_OFFLINE', 
        severity: 'CRITICAL', 
        details: { status_detected: 'OFFLINE', reason: 'Pérdida de comunicación con el inversor' } 
      },
      { 
        type: 'FREQUENCY_OUT_OF_RANGE', 
        severity: 'CRITICAL', 
        details: { reading_value: 62.5, allowed_range: '58.0-61.0 Hz' } 
      },
      { 
        type: 'VOLTAGE_OUT_OF_RANGE', 
        severity: 'WARNING', 
        details: { reading_value: 132, allowed_range: '108-128 V' } 
      },
      { 
        type: 'LOW_GENERATION', 
        severity: 'WARNING', 
        details: { reading_value: 0.05, explanation: 'Generación significativamente baja detectada durante el día' } 
      }
    ];

    const randomAlarm = alarmTypes[Math.floor(Math.random() * alarmTypes.length)];

    // 4. Crear el documento de la alarma en Firestore
    const alarmRef = Collections.alarms.doc();
    const alarmData = {
      device_id: deviceId,
      plant_id: plantId,
      type: randomAlarm.type,
      severity: randomAlarm.severity,
      status: 'ACTIVE',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      resolved_at: null,
      details: randomAlarm.details
    };

    await alarmRef.set(alarmData);

    console.log(`Alarma de tipo ${randomAlarm.type} creada para el dispositivo ${deviceId}.`);

    res.status(200).send({
      success: true,
      message: '¡Alarma creada exitosamente para el Pitch!',
      data: {
        alarmId: alarmRef.id,
        device_id: deviceId,
        type: randomAlarm.type,
        severity: randomAlarm.severity
      }
    });

  } catch (error: any) {
    console.error('Error al disparar alarma de pitch:', error);
    res.status(500).send({ 
      success: false, 
      message: 'Error interno al procesar la alarma.',
      error: error.message 
    });
  }
});
