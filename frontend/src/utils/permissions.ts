import api from './api';

let cachedPermissions: Map<string, boolean> = new Map();
let cachedUserId: number | null = null;

/**
 * Preload all permissions for a user. Call on login and app load.
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
    } catch (e) {
        console.error("Failed to preload permissions:", e);
    }
}

/**
 * Check permission synchronously (after preloadPermissions).
 * Format: "menu_name-submenu_name-permission"
 * 
 * Usage:
 *   can("inventory-stock-read")
 *   can("billing-sales-create")
 *   can("dashboard--open")  // no submenu
 */
export function can(permissionString: string): boolean {
    if (!cachedUserId) return false;
    return cachedPermissions.get(permissionString.toLowerCase()) ?? false;
}

/**
 * Async check — calls backend directly (use when cache not loaded).
 */
export async function canAsync(permissionString: string): Promise<boolean> {
    const userId = getCurrentUserId();
    if (!userId) return false;

    try {
        const res = await api.get('/menus/permissions/check', {
            params: { user_id: userId, permission_string: permissionString },
        });
        return res.data.has_permission;
    } catch {
        return false;
    }
}

export function clearPermissionCache() {
    cachedPermissions.clear();
    cachedUserId = null;
}

function getCurrentUserId(): number | null {
    try {
        const user = localStorage.getItem('user');
        if (user) {
            return JSON.parse(user).id || null;
        }
    } catch { }
    return null;
}