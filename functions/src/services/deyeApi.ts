import { config } from '../config/env';
import { fetchWithBackoff } from '../utils/fetchWithBackoff';

const BASE_URL = `${config.API_BASE_URL}/deye`;

export const DeyeApi = {
  async getPlants(pageNo = 1, pageSize = 100) {
    const url = `${BASE_URL}/v1.0/station/list`;
    const data = { page: pageNo, size: pageSize };
    console.log(`[DeyeApi] Query: POST ${url} | Payload:`, JSON.stringify(data));
    
    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url,
      data,
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  async getDevices(plantId: string) {
    const url = `${BASE_URL}/v1.0/station/device`;
    const data = { page: 1, size: 100, stationIds: [Number(plantId)] };
    console.log(`[DeyeApi] Query: POST ${url} | Payload:`, JSON.stringify(data));

    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url,
      data,
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  async getRealTimeData(deviceSn: string) {
    const url = `${BASE_URL}/v1.0/device/latest`;
    const data = { deviceList: [deviceSn] };
    console.log(`[DeyeApi] Query: POST ${url} | Payload:`, JSON.stringify(data));

    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url,
      data,
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  }
};
