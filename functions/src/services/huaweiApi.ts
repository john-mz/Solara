import { config } from '../config/env';
import { fetchWithBackoff } from '../utils/fetchWithBackoff';

const BASE_URL = `${config.API_BASE_URL}/huawei`;

export const HuaweiApi = {
  async getPlants() {
    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url: `${BASE_URL}/thirdData/getStationList`,
      data: {},
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  async getDevices(stationCode: string) {
    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url: `${BASE_URL}/thirdData/getDevList`,
      data: { stationCodes: stationCode },
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  async getRealTimeData(deviceId: string) {
    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url: `${BASE_URL}/thirdData/getDevRealKpi`,
      data: { devIds: deviceId },
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  }
};
