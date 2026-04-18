import { onRequest } from 'firebase-functions/v2/https';
import { Collections } from '../services/firestore';
import { getPlantChatResponse } from '../services/geminiApi';
import { Content } from '@google/generative-ai';

export const plantChatAgent = onRequest({ timeoutSeconds: 300, memory: '1GiB' }, async (req, res) => {
  // Solo permitir POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { id_plant, historial } = req.body;

  if (!id_plant || !historial || !Array.isArray(historial)) {
    res.status(400).send({ 
      success: false, 
      message: 'Faltan parámetros requeridos: id_plant (string) e historial (Content[]).' 
    });
    return;
  }

  try {
    console.log(`Iniciando chat para planta: ${id_plant}`);

    // 1. Obtener datos de la planta
    const plantDoc = await Collections.plants.doc(id_plant).get();
    if (!plantDoc.exists) {
      res.status(404).send({ success: false, message: 'La planta no existe.' });
      return;
    }
    const plantData = plantDoc.data();

    // 2. Obtener dispositivos de la planta
    const devicesSnapshot = await Collections.devices.where('plant_id', '==', id_plant).get();
    const devices = [];

    for (const devDoc of devicesSnapshot.docs) {
      const devData = devDoc.data();
      
      // 3. Obtener telemetría más reciente (hasta 20 registros)
      const telemetrySnapshot = await Collections.devices.doc(devDoc.id)
        .collection('telemetry')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      
      const telemetry = telemetrySnapshot.docs.map(t => ({
        id: t.id,
        ...t.data(),
        // Convertir Timestamp a string para que sea legible por la IA
        timestamp: t.data().timestamp?.toDate?.().toISOString() || t.data().timestamp
      }));

      devices.push({
        id: devDoc.id,
        ...devData,
        telemetry
      });
    }

    // 4. Obtener alarmas activas
    const alarmsSnapshot = await Collections.alarms
      .where('plant_id', '==', id_plant)
      .where('status', '==', 'ACTIVE')
      .get();
    
    const alarms = alarmsSnapshot.docs.map(a => ({
      id: a.id,
      ...a.data(),
      created_at: a.data().created_at?.toDate?.().toISOString() || a.data().created_at
    }));

    // 5. Construir el contexto de la planta para la IA
    const plantInfoContext = JSON.stringify({
      plant: {
        id: id_plant,
        ...plantData,
        created_at: plantData?.created_at?.toDate?.().toISOString() || plantData?.created_at
      },
      devices,
      active_alarms: alarms
    }, null, 2);

    // 6. Obtener respuesta de Gemini
    const aiResponse = await getPlantChatResponse(plantInfoContext, historial as Content[]);

    res.status(200).send({
      success: true,
      response: aiResponse
    });

  } catch (error: any) {
    console.error('Error en plantChatAgent:', error);
    res.status(500).send({ 
      success: false, 
      message: 'Ocurrió un error interno al procesar el chat.',
      error: error.message 
    });
  }
});
