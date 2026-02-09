import { useEffect, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import api from "src/utils/api";

interface User {
  id: number;
  phone: string;
  fullname: string;
  role: string;
  is_active: boolean;
}

interface SubMenu {
  id: number;
  name: string;
  label: string;
  icon: string | null;
  path: string;
  access: string;
}

interface Menu {
  id: number;
  name: string;
  label: string;
  icon: string | null;
  path: string;
  submenus: SubMenu[];
}

export default function UserPermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPerms, setUserPerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Add user form
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");
  const [userForm, setUserForm] = useState({
    phone: "",
    fullname: "",
    password: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchMenus();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/all");
      setUsers(res.data ?? []);
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await api.get("/menus");
      setMenus(res.data);
    } catch (e) {
      console.error("Failed to fetch menus:", e);
    }
  };

  const fetchUserPerms = async (userId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/menus/permissions/user/${userId}`);
      const permSet = new Set<string>();
      for (const p of res.data) {
        const key = `${p.menu_id}-${p.submenu_id ?? "null"}-${p.permission}`;
        permSet.add(key);
      }
      setUserPerms(permSet);
    } catch (e) {
      console.error("Failed to fetch user permissions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    fetchUserPerms(user.id);
  };

  const permKey = (
    menuId: number,
    submenuId: number | null,
    permission: string,
  ) => `${menuId}-${submenuId ?? "null"}-${permission}`;

  const hasPerm = (
    menuId: number,
    submenuId: number | null,
    permission: string,
  ) => userPerms.has(permKey(menuId, submenuId, permission));

  const togglePerm = async (
    menuId: number,
    submenuId: number | null,
    permission: string,
  ) => {
    if (!selectedUser) return;
    setSaving(true);
    const key = permKey(menuId, submenuId, permission);
    const isAssigned = userPerms.has(key);

    try {
      if (isAssigned) {
        await api.post("/menus/permissions/remove", {
          user_id: selectedUser.id,
          menu_id: menuId,
          submenu_id: submenuId,
          permission,
        });
        setUserPerms((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        await api.post("/menus/permissions/assign", {
          user_id: selectedUser.id,
          menu_id: menuId,
          submenu_id: submenuId,
          permission,
        });
        setUserPerms((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to toggle permission:", e);
    } finally {
      setSaving(false);
    }
  };

  const getAccessList = (access: string): string[] =>
    access.split(",").map((a) => a.trim().toLowerCase());

  const toggleAll = async (
    menuId: number,
    submenuId: number | null,
    accessList: string[],
    allChecked: boolean,
  ) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      for (const perm of accessList) {
        const key = permKey(menuId, submenuId, perm);
        if (allChecked && userPerms.has(key)) {
          await api.post("/menus/permissions/remove", {
            user_id: selectedUser.id,
            menu_id: menuId,
            submenu_id: submenuId,
            permission: perm,
          });
        } else if (!allChecked && !userPerms.has(key)) {
          await api.post("/menus/permissions/assign", {
            user_id: selectedUser.id,
            menu_id: menuId,
            submenu_id: submenuId,
            permission: perm,
          });
        }
      }
      await fetchUserPerms(selectedUser.id);
    } catch (e) {
      console.error("Failed to toggle permissions:", e);
    } finally {
      setSaving(false);
    }
  };

  // Toggle all permissions for entire menu (all submenus)
  const toggleMenuAll = async (menu: Menu, allChecked: boolean) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      for (const sub of menu.submenus) {
        const accessList = getAccessList(sub.access);
        for (const perm of accessList) {
          const key = permKey(menu.id, sub.id, perm);
          if (allChecked && userPerms.has(key)) {
            await api.post("/menus/permissions/remove", {
              user_id: selectedUser.id,
              menu_id: menu.id,
              submenu_id: sub.id,
              permission: perm,
            });
          } else if (!allChecked && !userPerms.has(key)) {
            await api.post("/menus/permissions/assign", {
              user_id: selectedUser.id,
              menu_id: menu.id,
              submenu_id: sub.id,
              permission: perm,
            });
          }
        }
      }
      await fetchUserPerms(selectedUser.id);
    } catch (e) {
      console.error("Failed to toggle menu permissions:", e);
    } finally {
      setSaving(false);
    }
  };

  const isMenuAllChecked = (menu: Menu): boolean => {
    return menu.submenus.every((sub) => {
      const accessList = getAccessList(sub.access);
      return accessList.every((p) => hasPerm(menu.id, sub.id, p));
    });
  };

  // ─── Add User ────────────────────────────────────────────
  const openAddUser = () => {
    setUserForm({ phone: "", fullname: "", password: "" });
    setUserError("");
    setUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    setUserSaving(true);
    setUserError("");
    try {
      await api.post("/users", userForm);
      setUserModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      setUserError(e?.response?.data?.detail || "Failed to create user");
    } finally {
      setUserSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm),
  );

  return (
    <AdminDashboardLayout>
      <DashboardCard title="User Permissions">
        <div className="tw-flex tw-gap-6 tw-min-h-[600px]">
          {/* ── User List ─────────────────────────────── */}
          <div className="tw-w-72 tw-border-r tw-border-gray-200 tw-pr-4 tw-flex-shrink-0">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <h3 className="tw-text-sm tw-font-semibold tw-text-gray-600 tw-uppercase">
                Users
              </h3>
              <button
                onClick={openAddUser}
                className="tw-text-xs tw-px-2 tw-py-1 tw-bg-blue-600 tw-text-white tw-rounded hover:tw-bg-blue-700"
              >
                + Add
              </button>
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-mb-3 tw-text-sm"
            />
            <div className="tw-space-y-1 tw-max-h-[500px] tw-overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="tw-text-center tw-py-4 tw-text-gray-400 tw-text-sm">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`tw-w-full tw-text-left tw-px-3 tw-py-2 tw-rounded-lg tw-text-sm tw-transition-colors ${
                      selectedUser?.id === user.id
                        ? "tw-bg-blue-100 tw-text-blue-800 tw-font-semibold"
                        : "hover:tw-bg-gray-50 tw-text-gray-700"
                    }`}
                  >
                    <div className="tw-flex tw-items-center tw-justify-between">
                      <div>
                        <div className="tw-font-medium">{user.fullname}</div>
                        <div className="tw-text-xs tw-text-gray-500">
                          {user.phone}
                        </div>
                      </div>
                      <span
                        className={`tw-text-xs tw-px-1.5 tw-py-0.5 tw-rounded ${
                          user.is_active
                            ? "tw-bg-green-100 tw-text-green-700"
                            : "tw-bg-red-100 tw-text-red-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Permissions ───────────────────────────── */}
          <div className="tw-flex-1 tw-overflow-y-auto">
            {!selectedUser ? (
              <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-text-gray-400">
                <div className="tw-text-center">
                  <div className="tw-text-4xl tw-mb-2">👈</div>
                  <p>Select a user to manage permissions</p>
                </div>
              </div>
            ) : loading ? (
              <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
                <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b-2 tw-border-blue-600"></div>
              </div>
            ) : (
              <div>
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                  <h3 className="tw-text-lg tw-font-semibold">
                    Permissions for:{" "}
                    <span className="tw-text-blue-600">
                      {selectedUser.fullname}
                    </span>
                    <span className="tw-text-sm tw-text-gray-400 tw-ml-2">
                      ({selectedUser.phone})
                    </span>
                  </h3>
                  {saving && (
                    <span className="tw-text-sm tw-text-gray-500 tw-animate-pulse">
                      Saving...
                    </span>
                  )}
                </div>

                <div className="tw-space-y-4">
                  {menus.map((menu) => {
                    const menuAllChecked = isMenuAllChecked(menu);

                    return (
                      <div
                        key={menu.id}
                        className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden tw-bg-white"
                      >
                        {/* Menu Header */}
                        <div className="tw-bg-gray-50 tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between">
                          <div className="tw-flex tw-items-center tw-gap-2">
                            <span className="tw-text-lg">
                              {menu.icon || "📄"}
                            </span>
                            <span className="tw-font-semibold tw-text-gray-800">
                              {menu.label}
                            </span>
                          </div>
                          {menu.submenus.length > 0 && (
                            <button
                              onClick={() =>
                                toggleMenuAll(menu, menuAllChecked)
                              }
                              className={`tw-text-xs tw-px-3 tw-py-1 tw-rounded tw-transition-colors ${
                                menuAllChecked
                                  ? "tw-bg-red-100 tw-text-red-700 hover:tw-bg-red-200"
                                  : "tw-bg-green-100 tw-text-green-700 hover:tw-bg-green-200"
                              }`}
                              disabled={saving}
                            >
                              {menuAllChecked ? "Revoke All" : "Grant All"}
                            </button>
                          )}
                        </div>

                        {/* SubMenus with checkboxes */}
                        {menu.submenus.length > 0 && (
                          <div className="tw-divide-y tw-divide-gray-100">
                            {menu.submenus.map((sub) => {
                              const accessList = getAccessList(sub.access);
                              const allChecked = accessList.every((p) =>
                                hasPerm(menu.id, sub.id, p),
                              );

                              return (
                                <div
                                  key={sub.id}
                                  className="tw-px-4 tw-py-3 tw-pl-10"
                                >
                                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                                    <div className="tw-flex tw-items-center tw-gap-2">
                                      <span className="tw-text-sm">
                                        {sub.icon || "📄"}
                                      </span>
                                      <span className="tw-font-medium tw-text-gray-700 tw-text-sm">
                                        {sub.label}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        toggleAll(
                                          menu.id,
                                          sub.id,
                                          accessList,
                                          allChecked,
                                        )
                                      }
                                      className="tw-text-xs tw-text-blue-600 hover:tw-underline"
                                      disabled={saving}
                                    >
                                      {allChecked ? "Uncheck All" : "Check All"}
                                    </button>
                                  </div>
                                  <div className="tw-flex tw-flex-wrap tw-gap-3">
                                    {accessList.map((perm) => (
                                      <label
                                        key={perm}
                                        className="tw-flex tw-items-center tw-gap-1.5 tw-cursor-pointer tw-text-sm"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={hasPerm(
                                            menu.id,
                                            sub.id,
                                            perm,
                                          )}
                                          onChange={() =>
                                            togglePerm(menu.id, sub.id, perm)
                                          }
                                          disabled={saving}
                                          className="tw-w-4 tw-h-4 tw-accent-blue-600"
                                        />
                                        <span className="tw-capitalize">
                                          {perm}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardCard>

      {/* ─── Add User Modal ──────────────────────────────── */}
      {userModalOpen && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-6 tw-w-full tw-max-w-md tw-mx-4">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
              <h3 className="tw-text-lg tw-font-bold">Add User</h3>
              <button
                className="tw-text-gray-500 hover:tw-text-gray-800 tw-text-xl"
                onClick={() => setUserModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {userError && (
              <div className="tw-bg-red-50 tw-text-red-700 tw-px-3 tw-py-2 tw-rounded-md tw-text-sm tw-mb-3">
                {userError}
              </div>
            )}

            <div className="tw-space-y-3">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userForm.fullname}
                  onChange={(e) =>
                    setUserForm({ ...userForm, fullname: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Phone *
                </label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) =>
                    setUserForm({ ...userForm, phone: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="0712345678"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="tw-flex tw-gap-2 tw-justify-end tw-mt-6">
              <button
                onClick={() => setUserModalOpen(false)}
                className="tw-px-4 tw-py-2 tw-bg-gray-200 tw-text-gray-700 tw-rounded-md hover:tw-bg-gray-300 tw-text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={
                  userSaving ||
                  !userForm.fullname ||
                  !userForm.phone ||
                  !userForm.password
                }
                className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 disabled:tw-bg-blue-300 tw-text-sm"
              >
                {userSaving ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
