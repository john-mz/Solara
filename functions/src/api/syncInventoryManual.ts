import { onRequest } from 'firebase-functions/v2/https';
import { runSyncInventory } from '../jobs/syncInventory';

export const syncInventoryManual = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed. Use POST.');
    return;
  }
  
  try {
    await runSyncInventory();
    res.status(200).send({ success: true, message: 'Inventario sincronizado correctamente.' });
  } catch (error: any) {
    console.error('Error en syncInventoryManual:', error);
    res.status(500).send({ success: false, message: error.message });
  }
});
