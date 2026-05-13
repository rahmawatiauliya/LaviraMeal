import axios from 'axios';
import { Platform } from 'react-native';

// Konfigurasi URL API
// Gunakan IP laptop (10.61.4.10) agar bisa diakses dari device fisik maupun emulator
const DEV_BASE_URL = Platform.select({
    android: 'http://10.15.1.200/project_lavirameal/api/',
    ios: 'http://10.15.1.200/project_lavirameal/api/',
    default: 'http://10.15.1.200/project_lavirameal/api/',
});

// NOTE: Pastikan laptop dan HP berada dalam jaringan WiFi yang sama jika menggunakan device fisik.




// NOTE: User perlu menyesuaikan URL ini sesuai setup server PHP mereka
// IP yang digunakan saat ini: 10.61.4.10

export const API_URL = DEV_BASE_URL;

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tambahkan interceptor untuk debugging
apiClient.interceptors.request.use(request => {
    console.log('Starting Request', JSON.stringify(request.url, null, 2));
    return request;
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        console.log('API Error:', error.response?.status, error.config?.url);
        return Promise.reject(error);
    }
);

export default apiClient;
