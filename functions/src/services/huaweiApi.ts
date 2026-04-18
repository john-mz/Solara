import { config } from '../config/env';
import { fetchWithBackoff } from '../utils/fetchWithBackoff';

const BASE_URL = `${config.API_BASE_URL}/huawei`;

export const HuaweiApi = {
  async getPlants() {
    const url = `${BASE_URL}/thirdData/stations`;
    const data = { pageNo: 1 };
    console.log(`[HuaweiApi] Query: POST ${url} | Payload:`, JSON.stringify(data));

    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url,
      data,
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  async getDevices(stationCode: string) {
    const url = `${BASE_URL}/thirdData/getDevList`;
    const data = { stationCodes: stationCode };
    console.log(`[HuaweiApi] Query: POST ${url} | Payload:`, JSON.stringify(data));

    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url,
      data,
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  async getRealTimeData(deviceId: string, devTypeId: number) {
    const url = `${BASE_URL}/thirdData/getDevRealKpi`;
    const data = { devIds: deviceId, devTypeId };
    console.log(`[HuaweiApi] Query: POST ${url} | Payload:`, JSON.stringify(data));

    const response = await fetchWithBackoff<any>({
      method: 'POST',
      url,
      data,
      headers: { Authorization: config.API_KEY, 'Content-Type': 'application/json' }
    });
    return response.data;
  }
};
