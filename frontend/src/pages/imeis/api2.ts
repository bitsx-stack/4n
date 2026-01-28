import api from "src/utils/api";

export interface Store {
    id: number;
    name: string;
    client_id?: number | null;
}

export interface Imei {
    id: number;
    code: string;
    brand: string;
    model: string;
    storage?: string | null;
    storage_size?: string | null;
    stores?: Store[];
    store_id?: string | number;
    created_at?: string;
    updated_at?: string;
}

export const normalizeStorageValue = (value?: string | null): string | undefined => {
    if (!value || typeof value !== "string") return undefined;
    const cleaned = value.trim();
    if (!cleaned) return undefined;
    return cleaned.replace(/\s+/g, "").toUpperCase();
};

const normalizeStorageFromImei = (imei: Imei): string | undefined => {
    const fromField = normalizeStorageValue(imei.storage_size ?? imei.storage);
    if (fromField) return fromField;
    const modelMatch = String(imei.model || "").match(/\b(32|64|128|256|512)\s*(GB|TB)\b/i);
    if (!modelMatch) return undefined;
    return `${modelMatch[1]}${modelMatch[2]}`.toUpperCase();
};

export interface ImeiInventoryItem {
    brand: string;
    model: string;
    quantity: number;
    imeis: Imei[];
}

export const fetchAllImeis = async (): Promise<Imei[]> => {
    const res = await api.get("/imeis");
    return res.data.data || res.data;
};

export const getStorageOptions = async (): Promise<{ id?: number; name: string }[]> => {
    try {
        const res = await api.get("/imeis/storage-options");
        const list = res.data?.data ?? res.data ?? [];
        return list.map((l: any) => ({ id: l.id, name: String(l.name) }));
    } catch (err) {
        console.error("Failed to load storage options", err);
        return [];
    }
};

export const fetchImeisInventory = async (
    brand?: string,
    model?: string,
    store_id?: string,
    storage?: string
): Promise<ImeiInventoryItem[]> => {
    try {
        let allImeis: Imei[] = [];
        if (store_id) {
            try {
                const res = await api.get(`/imeis/stores/${store_id}`);
                allImeis = res.data?.data ?? res.data ?? [];
            } catch (err) {
                console.error("Failed to fetch IMEIs for store", store_id, err);
                allImeis = await fetchAllImeis();
            }
        } else {
            allImeis = await fetchAllImeis();
        }

        let filtered = allImeis;
        if (brand) {
            filtered = filtered.filter((imei) => imei.brand.toLowerCase().includes(brand.toLowerCase()));
        }
        if (model) {
            filtered = filtered.filter((imei) => imei.model.toLowerCase().includes(model.toLowerCase()));
        }
        if (storage) {
            const wanted = normalizeStorageValue(storage);
            if (wanted) filtered = filtered.filter((imei) => normalizeStorageFromImei(imei) === wanted);
        }

        const grouped = new Map<string, ImeiInventoryItem>();
        filtered.forEach((imei) => {
            const key = `${imei.brand}_${imei.model}`;
            if (!grouped.has(key)) grouped.set(key, { brand: imei.brand, model: imei.model, quantity: 0, imeis: [] });
            const item = grouped.get(key)!;
            item.quantity += 1;
            item.imeis.push(imei);
        });

        return Array.from(grouped.values()).sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
    } catch (error) {
        console.error("Error fetching IMEIs inventory:", error);
        return [];
    }
};

export const getUniqueBrands = async (): Promise<string[]> => {
    const allImeis = await fetchAllImeis();
    return Array.from(new Set(allImeis.map((i) => i.brand))).sort();
};

export const getModelsForBrand = async (brand: string): Promise<string[]> => {
    const allImeis = await fetchAllImeis();
    return Array.from(new Set(allImeis.filter((i) => i.brand.toLowerCase() === brand.toLowerCase()).map((i) => i.model))).sort();
};


export const getUniqueStores = async (clientId?: number | null): Promise<Store[]> => {
    try {
        // Use explicit paths to avoid server redirects that may drop CORS headers.
        //
        console.log('Fetching stores for clientId:', clientId);
        const url = typeof clientId === 'number' ? `/stores/${clientId}` : '/stores/';
        const res = await api.get(url);
        return res.data.data || res.data || [];
    } catch (err) {
        console.error('Error fetching stores:', err);
        return [];
    }
};

export const createImei = async (data: Omit<Imei, "id" | "created_at" | "updated_at">): Promise<Imei> => {
    const res = await api.post("/imeis", data);
    return res.data;
};

export const deleteImei = async (id: string): Promise<void> => {
    await api.delete(`/imeis/${id}`);
};


