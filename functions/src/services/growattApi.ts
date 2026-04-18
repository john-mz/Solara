import { config } from '../config/env';
import { fetchWithBackoff } from '../utils/fetchWithBackoff';

const BASE_URL = `${config.API_BASE_URL}/growatt`;

export const GrowattApi = {
  async getPlants() {
    const response = await fetchWithBackoff<any>({
      method: 'GET',
      url: `${BASE_URL}/v1/plant/list`,
      headers: { Authorization: config.API_KEY }
    });
    return response.data;
  },

  async getDevices(plantId: string) {
    const response = await fetchWithBackoff<any>({
      method: 'GET',
      url: `${BASE_URL}/v1/device/list`,
      params: { plantId },
      headers: { Authorization: config.API_KEY }
    });
    return response.data;
  },

  async getRealTimeData(deviceSn: string) {
    const response = await fetchWithBackoff<any>({
      method: 'GET',
      url: `${BASE_URL}/v1/device/inverter/data`,
      params: { deviceSn },
      headers: { Authorization: config.API_KEY }
    });
    return response.data;
  }
};
