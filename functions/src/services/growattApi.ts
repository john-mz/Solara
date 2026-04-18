import { config } from '../config/env';
import { fetchWithBackoff } from '../utils/fetchWithBackoff';

const BASE_URL = `${config.API_BASE_URL}/growatt`;

export const GrowattApi = {
  async getPlants() {
    const url = `${BASE_URL}/v1/plant/list`;
    console.log(`[GrowattApi] Query: GET ${url}`);
    
    const response = await fetchWithBackoff<any>({
      method: 'GET',
      url,
      headers: { Authorization: config.API_KEY }
    });
    return response.data;
  },

  async getDevices(plantId: string) {
    const url = `${BASE_URL}/v1/device/list`;
    const params = { plant_id: plantId };
    console.log(`[GrowattApi] Query: GET ${url} | Params:`, JSON.stringify(params));

    const response = await fetchWithBackoff<any>({
      method: 'GET',
      url,
      params,
      headers: { Authorization: config.API_KEY }
    });
    return response.data;
  },

  async getRealTimeData(plantId: string) {
    const url = `${BASE_URL}/v1/plant/data`;
    const params = { plant_id: plantId };
    console.log(`[GrowattApi] Query: GET ${url} | Params:`, JSON.stringify(params));

    const response = await fetchWithBackoff<any>({
      method: 'GET',
      url,
      params,
      headers: { Authorization: config.API_KEY }
    });
    return response.data;
  }
};
