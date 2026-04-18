import { config } from '../config/env';
import { fetchWithBackoff } from '../utils/fetchWithBackoff';

const BASE_URL = `${config.API_BASE_URL}/deye`;

export const DeyeApi = {
  async getPlants(pageNo = 1, pageSize = 100) {
    const response = await fetchWithBackoff<any>({
      method: 'GET',
      url: `${BASE_URL}/v1.0/plant/list`,
      params: { page_no: pageNo, page_size: pageSize },
      headers: { Authorization: config.API_KEY }
    });
    return response.data;
  },

  async getDevices(plantId: string) {
    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url: `${BASE_URL}/v1.0/device/list`,
      data: { page: 1, size: 100 },
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  async getRealTimeData(deviceSn: string) {
    const response = await fetchWithBackoff<any>({
      method: 'GET',
      url: `${BASE_URL}/v1.0/device/real_time_data`,
      params: { device_sn: deviceSn },
      headers: { Authorization: config.API_KEY }
    });
    return response.data;
  }
};
