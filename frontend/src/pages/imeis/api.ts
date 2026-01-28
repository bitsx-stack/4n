// import api from "src/utils/api";

// export interface Store {
//     id: number;
//     name: string;
//     client_id?: number | null;
// }

// export interface Imei {
//     id: number;
//     code: string;
//     brand: string;
//     model: string;
//     // Legacy field (some old payloads used `storage`).
//     storage?: string | null;
//     // Current backend field.
//     storage_size?: string | null;
//     // Inventory lives in many-to-many stores relationship.
//     stores?: Store[];
//     // Legacy field (older UI assumed a single store id).
//     store_id?: string | number;
//     created_at?: string;
//     updated_at?: string;
// }

// export const normalizeStorageValue = (value?: string | null): string | undefined => {
//     if (!value || typeof value !== "string") return undefined;
//     const cleaned = value.trim();
//     if (!cleaned) return undefined;

//     // Canonicalize: remove spaces, upper-case ("32 GB" -> "32GB")
//     return cleaned.replace(/\s+/g, "").toUpperCase();
// };

// const normalizeStorageFromImei = (imei: Imei): string | undefined => {
//     const fromField = normalizeStorageValue(imei.storage_size ?? imei.storage);
//     if (fromField) return fromField;

//     // Fallback: storage embedded in model (e.g. "iPhone 13 128GB").
//     const modelMatch = String(imei.model || "").match(/\b(32|64|128|256|512)\s*(GB|TB)\b/i);
//     if (!modelMatch) return undefined;
//     return `${modelMatch[1]}${modelMatch[2]}`.toUpperCase();
// };

// export interface ImeiInventoryItem {
//     brand: string;
//     model: string;
//     quantity: number;
//     imeis: Imei[];
// }

// // Fetch all IMEIs
// export const fetchAllImeis = async (): Promise<Imei[]> => {
//     const res = await api.get("/imeis");
//     return res.data.data || res.data;
// };

// export const getStorageOptions = async (): Promise<{ id?: number; name: string }[]> => {
//     try {
//         const res = await api.get("/imeis/storage-options");
//         const list = res.data?.data ?? res.data ?? [];
//         return list.map((l: any) => ({ id: l.id, name: String(l.name) }));
//     } catch (err) {
//         console.error("Failed to load storage options", err);
//         return [];
//     }
// };

// // Get IMEIs grouped by brand and model
// export const fetchImeisInventory = async (
//     brand?: string,
//     model?: string,
//     store_id?: string,
//     storage?: string
// ): Promise<ImeiInventoryItem[]> => {
//     try {
//         let allImeis: Imei[] = [];

//         // If a store is selected, ask the backend for IMEIs in that store
//         // to avoid client-side mismatches with the many-to-many relation.
//         if (store_id) {
//             try {
//                 const res = await api.get(`/imeis/stores/${store_id}`);
//                 allImeis = res.data?.data ?? res.data ?? [];
//             } catch (err) {
//                 console.error("Failed to fetch IMEIs for store", store_id, err);
//                 // fallback to fetching all IMEIs
//                 allImeis = await fetchAllImeis();
//             }
//         } else {
//             allImeis = await fetchAllImeis();
//         }

//         // Filter by brand, model, and store if provided
//         let filtered = allImeis;
//         if (brand) {
//             filtered = filtered.filter((imei) =>
//                 imei.brand.toLowerCase().includes(brand.toLowerCase())
//             );
//         }
//         if (model) {
//             filtered = filtered.filter((imei) =>
//                 imei.model.toLowerCase().includes(model.toLowerCase())
//             );
//         }

//         if (storage) {
//             const wanted = normalizeStorageValue(storage);
//             if (wanted) {
//                 filtered = filtered.filter(
//                     (imei) => normalizeStorageFromImei(imei) === wanted
//                 );
//             }
//         }

//         // Group by brand and model
//         const grouped = new Map<string, ImeiInventoryItem>();
//         filtered.forEach((imei) => {
//             const key = `${imei.brand}_${imei.model}`;
//             if (!grouped.has(key)) {
//                 grouped.set(key, {
//                     brand: imei.brand,
//                     model: imei.model,
//                     quantity: 0,
//                     imeis: [],
//                 });
//             }
//             const item = grouped.get(key)!;
//             item.quantity += 1;
//             item.imeis.push(imei);
//         });

//         return Array.from(grouped.values()).sort((a, b) =>
//             a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)
//         );
//     } catch (error) {
//         console.error("Error fetching IMEIs inventory:", error);
//         return [];
//     }
// };

// // Get unique brands
// export const getUniqueBrands = async (): Promise<string[]> => {
//     const allImeis = await fetchAllImeis();
//     const brands = new Set(allImeis.map((imei) => imei.brand));
//     return Array.from(brands).sort();
// };

// // Get unique models for a brand
// export const getModelsForBrand = async (brand: string): Promise<string[]> => {
//     const allImeis = await fetchAllImeis();
//     const models = new Set(
//         allImeis
//             .filter((imei) => imei.brand.toLowerCase() === brand.toLowerCase())
//             .map((imei) => imei.model)
//     );
//     return Array.from(models).sort();
// };

// // Get unique stores
// export const getUniqueStores = async (): Promise<Store[]> => {
//     try {
//         const res = await api.get("/stores");
//         return res.data.data || res.data || [];
//     } catch (error) {
//         console.error("Error fetching stores:", error);
//         return [];
//     }
// };

// // Create a new IMEI
// export const createImei = async (
//     data: Omit<Imei, "id" | "created_at" | "updated_at">
// ): Promise<Imei> => {
//     const res = await api.post("/imeis", data);
//     return res.data;
// };

// // Delete an IMEI
// export const deleteImei = async (id: string): Promise<void> => {
//     await api.delete(`/imeis/${id}`);
// };

// import api from "src/utils/api";

// export interface Store {
//     id: number;
//     name: string;
//     client_id?: number | null;
// }
// let allImeis: Imei[] = [];

// // If a store is selected, ask the backend for IMEIs in that store
// // to avoid client-side mismatches with the many-to-many relation.
// if (store_id) {
//     try {
//         const res = await api.get(`/imeis/stores/${store_id}`);
//         allImeis = res.data?.data ?? res.data ?? [];
//     } catch (err) {
//         console.error("Failed to fetch IMEIs for store", store_id, err);
//         // fallback to fetching all IMEIs
//         allImeis = await fetchAllImeis();
//     }
// } else {
//     allImeis = await fetchAllImeis();
// }
// export interface Imei {
//     id: number;
//     code: string;
//     brand: string;
//     model: string;
//     // Legacy field (some old payloads used `storage`).
//     storage?: string | null;
//     // Current backend field.
//     storage_size?: string | null;
//     // Inventory lives in many-to-many stores relationship.
//     stores?: Store[];
//     // Legacy field (older UI assumed a single store id).
//         // When we fetched by store from backend, `allImeis` already contains only
//         // the IMEIs for that store, so no extra filtering is required here.
//         // If store_id is not provided, we may still filter by other fields below.
//     // Fallback: storage embedded in model (e.g. "iPhone 13 128GB").
//     const modelMatch = String(imei.model || "").match(/\b(32|64|128|256|512)\s*(GB|TB)\b/i);
// if (!modelMatch) return undefined;
// return `${modelMatch[1]}${modelMatch[2]}`.toUpperCase();
// };

// export interface ImeiInventoryItem {
//     brand: string;
//     model: string;
//     quantity: number;
//     imeis: Imei[];
// }

// // Fetch all IMEIs
// export const fetchAllImeis = async (): Promise<Imei[]> => {
//     const res = await api.get("/imeis");
//     return res.data.data || res.data;
// };

// export const getStorageOptions = async (): Promise<{ id?: number; name: string }[]> => {
//     try {
//         const res = await api.get('/imeis/storage-options');
//         const list = res.data?.data ?? res.data ?? [];
//         // normalize backend shapes into {id?, name}
//         return list.map((l: any) => ({ id: l.id, name: String(l.name) }));
//     } catch (err) {
//         console.error('Failed to load storage options', err);
//         return [];
//     }
// };

// // Get IMEIs grouped by brand and model
// export const fetchImeisInventory = async (
//     brand?: string,
//     model?: string,
//     store_id?: string,
//     storage?: string
// ): Promise<ImeiInventoryItem[]> => {
//     try {
//         const allImeis = await fetchAllImeis();

//         // Filter by brand, model, and store if provided
//         let filtered = allImeis;
//         if (brand) {
//             filtered = filtered.filter((imei) =>
//                 imei.brand.toLowerCase().includes(brand.toLowerCase())
//             );
//         }
//         if (model) {
//             filtered = filtered.filter((imei) =>
//                 imei.model.toLowerCase().includes(model.toLowerCase())
//             );
//         }
//         if (store_id) {
//             const wantedStoreId = String(store_id);
//             console.debug("IMEI inventory filter: wantedStoreId=", wantedStoreId);
//             filtered = filtered.filter((imei) => {
//                 // Prefer many-to-many stores list.
//                 if (Array.isArray(imei.stores) && imei.stores.length > 0) {
//                     // show a brief sample for debugging
//                     // eslint-disable-next-line no-console
//                     console.debug("IMEI stores sample:", imei.stores.slice(0, 2).map(s => ({ id: s.id, name: s.name })));
//                     return imei.stores.some((s) => String(s.id) === wantedStoreId);
//                 }
//                 // Back-compat single store field.
//                 if (imei.store_id != null) {
//                     return String(imei.store_id) === wantedStoreId;
//                 }
//                 return false;
//             });
//         }

//         if (storage) {
//             const wanted = normalizeStorageValue(storage);
//             if (wanted) {
//                 filtered = filtered.filter(
//                     (imei) => normalizeStorageFromImei(imei) === wanted
//                 );
//             }
//         }

//         // Group by brand and model
//         const grouped = new Map<string, ImeiInventoryItem>();
//         filtered.forEach((imei) => {
//             const key = `${imei.brand}_${imei.model}`;
//             if (!grouped.has(key)) {
//                 grouped.set(key, {
//                     brand: imei.brand,
//                     model: imei.model,
//                     quantity: 0,
//                     imeis: [],
//                 });
//             }
//             const item = grouped.get(key)!;
//             item.quantity += 1;
//             item.imeis.push(imei);
//         });

//         return Array.from(grouped.values()).sort((a, b) =>
//             a.brand.localeCompare(b.brand) ||
//             a.model.localeCompare(b.model)
//         );
//     } catch (error) {
//         console.error("Error fetching IMEIs inventory:", error);
//         return [];
//     }
// };

// // Get unique brands
// export const getUniqueBrands = async (): Promise<string[]> => {
//     const allImeis = await fetchAllImeis();
//     const brands = new Set(allImeis.map((imei) => imei.brand));
//     return Array.from(brands).sort();
// };

// // Get unique models for a brand
// export const getModelsForBrand = async (brand: string): Promise<string[]> => {
//     const allImeis = await fetchAllImeis();
//     const models = new Set(
//         allImeis
//             .filter((imei) => imei.brand.toLowerCase() === brand.toLowerCase())
//             .map((imei) => imei.model)
//     );
//     return Array.from(models).sort();
// };

// // Get unique stores
// export const getUniqueStores = async (): Promise<Store[]> => {
//     try {
//         const res = await api.get("/stores");
//         return res.data.data || res.data || [];
//     } catch (error) {
//         console.error("Error fetching stores:", error);
//         return [];
//     }
// };

// // Create a new IMEI
// export const createImei = async (data: Omit<Imei, 'id' | 'created_at' | 'updated_at'>): Promise<Imei> => {
//     const res = await api.post("/imeis", data);
//     return res.data;
// };

// // Delete an IMEI
// export const deleteImei = async (id: string): Promise<void> => {
//     await api.delete(`/imeis/${id}`);
// };

// // Named re-exports to satisfy TS imports
// export { normalizeStorageValue };
export {}