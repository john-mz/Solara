import * as admin from 'firebase-admin';

// Inicializar la aplicación solo si no existe ya
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();

// Referencias fuertemente tipadas a colecciones para usarse en todo el proyecto
export const Collections = {
  plants: db.collection('plants'),
  devices: db.collection('devices'),
  alarms: db.collection('alarms'),
  dailySummaries: db.collection('daily_summaries'),
  monthlySummaries: db.collection('monthly_summaries'),
};
