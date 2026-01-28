import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get the Expo dev server host IP (works automatically with physical devices)
const getApiUrl = () => {
    const debuggerHost = Constants.expoConfig?.hostUri ?? (Constants.manifest as any)?.debuggerHost;
    if (debuggerHost) {
        const host = debuggerHost.split(':')[0];
        console.log('🌐 API Host detected:', host);
        return `http://${host}:8000/api`;
    }
    // Fallback - replace with your actual IP if needed
    return 'http://10.225.205.23:8000/api';
};

const API_BASE_URL = getApiUrl();
console.log('🔗 API Base URL:', API_BASE_URL);

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            // Debug logging
            if (__DEV__) {
                console.log('📡 API Request:', config.method?.toUpperCase(), (config.baseURL ?? '') + config.url);
                console.log('📦 Request Data:', config.data);
            }
        } catch (error) {
            console.error('Error retrieving token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        if (__DEV__) {
            console.log('✅ API Response:', response.status, response.data);
        }
        return response;
    },
    async (error) => {
        if (__DEV__) {
            console.error('❌ API Error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url,
            });
        }
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('auth_token');
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth endpoints
export const authApi = {
    login: async (phone: string, password: string) => {
        const formBody = `username=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`;

        console.log("Sending login request:", formBody);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formBody,
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("Login error:", data);
            throw new Error(data.detail || "Login failed");
        }

        return data;  // Returns { access_token: "...", token_type: "bearer" }
    },


    me: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user");
        }

        return response.json();
    },
};

// Store endpoints
export const storeApi = {
    getAll: () => api.get('/stores'),
    getById: (id: number) => api.get(`/stores/${id}`),
};

// Vendor endpoints
export const vendorApi = {
    getAll: () => api.get('/vendors'),
};

// Brand endpoints
export const brandApi = {
    getAll: () => api.get('/brands'),
    getById: (id: number) => api.get(`/brands/${id}`),
    create: (name: string) => api.post('/brands', { name }),
};

// Model endpoints
export const modelApi = {
    getAll: () => api.get('/models'),
    getById: (id: number) => api.get(`/models/${id}`),
    getByBrandId: (brandId: number) => api.get(`/models/brand/${brandId}`),
    create: (name: string, brandId: number) =>
        api.post('/models', { name, brand_id: brandId }),
};

// IMEI/Product endpoints
export const imeiApi = {
    getAll: () => api.get('/imeis'),
    getByCode: (code: string) => api.get(`/imeis/code/${code}`),
    getById: (id: number) => api.get(`/imeis/id/${id}`),
    getByStoreId: (storeId: number) => api.get(`/imeis/stores/${storeId}`),
    getStorageOptions: () => api.get('/imeis/storage-options'),
    create: (data: {
        code: string;
        vendor_id?: number | null;
        brand: string;
        model: string;
        storage_size?: string | null;
        store_id: number;
    }) => api.post('/imeis', data),

    // Check if IMEI already exists
    checkExists: (code: string) => api.get(`/imeis/check/${code}`),
};

// Purchase endpoints (batch of scanned IMEIs)
export const purchasesApi = {
    getAll: () => api.get('/purchases'),
    create: (data: {
        vendor_id: number;
        brand_id: number;
        model_id: number;
        store_id: number;
        imei_codes: string[];
        storage_size?: string | null;
        status?: 'pending' | 'completed';
        total_price?: number;
        paid_amount?: number;
        payment_status?: 'unpaid' | 'partial' | 'paid';
    }) => api.post('/purchases', data),
    updateStatus: (purchaseId: number, status: 'pending' | 'completed') =>
        api.put(`/purchases/${purchaseId}/status`, { status }),
    updatePayment: (purchaseId: number, data: {
        total_price?: number;
        paid_amount?: number;
        payment_status?: 'unpaid' | 'partial' | 'paid';
    }) => api.put(`/purchases/${purchaseId}/payment`, data),
};

// Stock/Scan endpoints - for saving scanned items
export const stockApi = {
    // Save a scanned IMEI to stock
    saveScannedItem: (data: {
        imei_code: string;
        brand_id: number;
        model_id: number;
        store_id: number;
        user_id: number;
    }) => api.post('/stock/scan', data),

    // Get stock by store
    getByStore: (storeId: number) => api.get(`/stock/store/${storeId}`),

    // Get all stock
    getAll: () => api.get('/stock'),

    // Get stock summary
    getSummary: (storeId: number) => api.get(`/stock/summary/${storeId}`),
};

// Transaction endpoints
export const transactionApi = {
    create: (data: {
        ref: string;
        type: string;
        quantity: number;
        amount: number;
        status: string;
        user_id: number;
        imei_code: string;
        store_id: number;
        brand_id?: number;
        model_id?: number;
        size: string;
    }) => api.post('/transactions', data),

    getAll: () => api.get('/transactions'),

    getByStore: (storeId: number) => api.get(`/transactions/store/${storeId}`),

    getByUser: (userId: number) => api.get(`/transactions/user/${userId}`),
};


export const companiesApi = {
    getAll: () => api.get('/clients'),
    getById: (id: number) => api.get(`/clients/${id}`),
};

export const storesApi = {
    getStoresByCompany: (companyId: number) => api.get(`/stores?client_id=${companyId}`),
    getById: (id: number) => api.get(`/stores/${id}`),
};

// Category Types & Categories (used as Brand/Model dropdowns)
const extractPaginatedData = <T>(payload: any): T[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload.data)) return payload.data as T[];
    return [];
};

export const categoryTypeApi = {
    list: (params?: { page?: number; pageSize?: number; search?: string | null }) =>
        api.get('/category-types', { params }),
    listAll: async (search?: string) => {
        const res = await api.get('/category-types', {
            params: { page: 1, pageSize: 1000, search: search || null },
        });
        return extractPaginatedData<CategoryType>(res.data);
    },
};

export const categoryApi = {
    list: (params?: { page?: number; pageSize?: number; search?: string | null }) =>
        api.get('/categories', { params }),
    listAll: async (search?: string) => {
        const res = await api.get('/categories', {
            params: { page: 1, pageSize: 2000, search: search || null },
        });
        return extractPaginatedData<Category>(res.data);
    },
    listByType: async (typeID: number) => {
        const res = await api.get(`/categories/type/${typeID}`, {
            params: { page: 1, pageSize: 2000 },
        });
        return extractPaginatedData<Category>(res.data);
    },

     listByTypeName: async (name: string) => {
        const res = await api.get(`/categories/typename/${name}`, {
            params: { page: 1, pageSize: 2000 },
        });
        return extractPaginatedData<Category>(res.data);
    }
};

// Types for the API responses
export interface Store {
    id: number;
    name: string;
    location?: string;
}

export interface Brand {
    id: number;
    name: string;
}

export interface Model {
    id: number;
    name: string;
    brand_id: number;
}

export interface CategoryType {
    id: number;
    name: string;
}

export interface Category {
    id: number;
    name: string;
    categorytype_id: number;
}

export interface IMEI {
    id: number;
    code: string;
    vendor_id?: number | null;
    brand: string;
    model: string;
    storage_size?: string | null;
    created_at: string;
}

export interface User {
    id: number;
    username: string;
    phone: string;
    role: string;
}
