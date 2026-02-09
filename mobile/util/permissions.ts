import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/util/api";

const PERMS_CACHE_KEY = "user_permissions_cache";

let cachedPermissions: Map<string, boolean> = new Map();
let cachedUserId: number | null = null;

/**
 * Preload all permissions for a user. Call on login and app restore.
 */
export async function preloadPermissions(userId: number): Promise<void> {
    cachedPermissions.clear();
    cachedUserId = userId;

    try {
        const res = await api.get(`/menus/permissions/user/${userId}`);
        const perms: Array<{
            menu_name: string;
            submenu_name: string | null;
            permission: string;
        }> = res.data;

        for (const p of perms) {
            const key = `${p.menu_name}-${p.submenu_name || ""}-${p.permission}`.toLowerCase();
            cachedPermissions.set(key, true);
        }

        // Persist for offline
        const serialized = JSON.stringify(Array.from(cachedPermissions.entries()));
        await AsyncStorage.setItem(PERMS_CACHE_KEY, serialized);
    } catch (e) {
        console.error("Failed to preload permissions:", e);
        // Try loading from cache
        try {
            const cached = await AsyncStorage.getItem(PERMS_CACHE_KEY);
            if (cached) {
                cachedPermissions = new Map(JSON.parse(cached));
            }
        } catch { }
    }
}

/**
 * Check permission synchronously (after preloadPermissions).
 * Format: "menu_name-submenu_name-permission"
 * 
 * Usage:
 *   can("inventory-stock-read")
 *   can("billing-sales-create")
 */
export function can(permissionString: string): boolean {
    if (!cachedUserId) return false;
    return cachedPermissions.get(permissionString.toLowerCase()) ?? false;
}

export async function clearPermissionCache(): Promise<void> {
    cachedPermissions.clear();
    cachedUserId = null;
    await AsyncStorage.removeItem(PERMS_CACHE_KEY);
}

