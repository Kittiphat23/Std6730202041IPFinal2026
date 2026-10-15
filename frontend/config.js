import { Platform } from 'react-native';

// Set backend URL according to platform:
// Web can use localhost; Native device can use machine IP (10.64.125.32)
export const API_BASE_URL_THONGPHUM =
  Platform.OS === 'web'
    ? 'http://localhost:5000'
    : 'http://10.64.125.32:5000';
