import { useEffect, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import api from "src/utils/api";

interface SubMenu {
  id: number;
  menu_id: number;
  name: string;
  label: string;
  icon: string | null;
  path: string;
  access: string;
  sort_order: number;
}

interface Menu {
  id: number;
  name: string;
  label: string;
  icon: string | null;
  path: string;
  sort_order: number;
  submenus: SubMenu[];
}

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Menu form
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: "",
    label: "",
    icon: "",
    path: "",
    sort_order: 0,
  });

  // SubMenu form
  const [subMenuModalOpen, setSubMenuModalOpen] = useState(false);
  const [editingSubMenu, setEditingSubMenu] = useState<SubMenu | null>(null);
  const [parentMenuId, setParentMenuId] = useState<number | null>(null);
  const [subMenuForm, setSubMenuForm] = useState({
    name: "",
    label: "",
    icon: "",
    path: "",
    access: "read,open,create,edit,update,delete",
    sort_order: 0,
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await api.get("/menus");
      setMenus(res.data);
    } catch (e) {
      console.error("Failed to fetch menus:", e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Menu CRUD ──────────────────────────────────────────────
  const openCreateMenu = () => {
    setEditingMenu(null);
    setMenuForm({
      name: "",
      label: "",
      icon: "",
      path: "",
      sort_order: menus.length,
    });
    setMenuModalOpen(true);
  };

  const openEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setMenuForm({
      name: menu.name,
      label: menu.label,
      icon: menu.icon || "",
      path: menu.path,
      sort_order: menu.sort_order,
    });
    setMenuModalOpen(true);
  };

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      if (editingMenu) {
        await api.put(`/menus/${editingMenu.id}`, menuForm);
      } else {
        await api.post("/menus", menuForm);
      }
      setMenuModalOpen(false);
      fetchMenus();
    } catch (e) {
      console.error("Failed to save menu:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenu = async (menuId: number) => {
    if (!window.confirm("Delete this menu and all its submenus?")) return;
    try {
      await api.delete(`/menus/${menuId}`);
      fetchMenus();
    } catch (e) {
      console.error("Failed to delete menu:", e);
    }
  };

  // ─── SubMenu CRUD ──────────────────────────────────────────
  const openCreateSubMenu = (menuId: number) => {
    setEditingSubMenu(null);
    setParentMenuId(menuId);
    const parent = menus.find((m) => m.id === menuId);
    setSubMenuForm({
      name: "",
      label: "",
      icon: "",
      path: "",
      access: "read,open,create,edit,update,delete",
      sort_order: parent?.submenus.length || 0,
    });
    setSubMenuModalOpen(true);
  };

  const openEditSubMenu = (sub: SubMenu) => {
    setEditingSubMenu(sub);
    setParentMenuId(sub.menu_id);
    setSubMenuForm({
      name: sub.name,
      label: sub.label,
      icon: sub.icon || "",
      path: sub.path,
      access: sub.access,
      sort_order: sub.sort_order,
    });
    setSubMenuModalOpen(true);
  };

  const handleSaveSubMenu = async () => {
    if (!parentMenuId) return;
    setSaving(true);
    try {
      if (editingSubMenu) {
        await api.put(`/menus/submenus/${editingSubMenu.id}`, subMenuForm);
      } else {
        await api.post("/menus/submenus", {
          ...subMenuForm,
          menu_id: parentMenuId,
        });
      }
      setSubMenuModalOpen(false);
      fetchMenus();
    } catch (e) {
      console.error("Failed to save submenu:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubMenu = async (subId: number) => {
    if (!window.confirm("Delete this submenu?")) return;
    try {
      await api.delete(`/menus/submenus/${subId}`);
      fetchMenus();
    } catch (e) {
      console.error("Failed to delete submenu:", e);
    }
  };

  return (
    <AdminDashboardLayout>
      <DashboardCard title="Menu Management">
        <div className="tw-flex tw-items-center tw-justify-end tw-mb-4">
          <button
            onClick={openCreateMenu}
            className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-lg hover:tw-bg-blue-700 tw-transition-colors tw-text-sm"
          >
            + Add Menu
          </button>
        </div>

        {loading ? (
          <div className="tw-flex tw-justify-center tw-py-12">
            <div className="tw-animate-spin tw-rounded-full tw-h-8 tw-w-8 tw-border-b-2 tw-border-blue-600"></div>
          </div>
        ) : menus.length === 0 ? (
          <div className="tw-text-center tw-py-12 tw-text-gray-400">
            No menus yet. Click "+ Add Menu" to get started.
          </div>
        ) : (
          <div className="tw-space-y-3">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden tw-bg-white"
              >
                {/* Menu Row */}
                <div className="tw-bg-gray-50 tw-px-4 tw-py-3 tw-flex tw-items-center tw-justify-between">
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <span className="tw-text-lg">{menu.icon || "📄"}</span>
                    <span className="tw-font-semibold tw-text-gray-800">
                      {menu.label}
                    </span>
                    <span className="tw-text-xs tw-text-gray-400 tw-bg-gray-200 tw-px-2 tw-py-0.5 tw-rounded">
                      {menu.name}
                    </span>
                    <span className="tw-text-xs tw-text-gray-400">
                      {menu.path}
                    </span>
                  </div>
                  <div className="tw-flex tw-gap-2">
                    <button
                      onClick={() => openCreateSubMenu(menu.id)}
                      className="tw-text-xs tw-px-2 tw-py-1 tw-bg-green-100 tw-text-green-700 tw-rounded hover:tw-bg-green-200"
                    >
                      + SubMenu
                    </button>
                    <button
                      onClick={() => openEditMenu(menu)}
                      className="tw-text-xs tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-700 tw-rounded hover:tw-bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="tw-text-xs tw-px-2 tw-py-1 tw-bg-red-100 tw-text-red-700 tw-rounded hover:tw-bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* SubMenus */}
                {menu.submenus.length > 0 && (
                  <div className="tw-divide-y tw-divide-gray-100">
                    {menu.submenus.map((sub) => (
                      <div
                        key={sub.id}
                        className="tw-px-4 tw-py-2 tw-pl-12 tw-flex tw-items-center tw-justify-between"
                      >
                        <div className="tw-flex tw-items-center tw-gap-3">
                          <span>{sub.icon || "📄"}</span>
                          <span className="tw-text-sm tw-font-medium tw-text-gray-700">
                            {sub.label}
                          </span>
                          <span className="tw-text-xs tw-text-gray-400 tw-bg-gray-100 tw-px-2 tw-py-0.5 tw-rounded">
                            {sub.name}
                          </span>
                          <span className="tw-text-xs tw-text-gray-400">
                            {sub.path}
                          </span>
                          <span className="tw-text-xs tw-text-blue-500 tw-bg-blue-50 tw-px-2 tw-py-0.5 tw-rounded">
                            {sub.access}
                          </span>
                        </div>
                        <div className="tw-flex tw-gap-2">
                          <button
                            onClick={() => openEditSubMenu(sub)}
                            className="tw-text-xs tw-px-2 tw-py-1 tw-bg-blue-100 tw-text-blue-700 tw-rounded hover:tw-bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSubMenu(sub.id)}
                            className="tw-text-xs tw-px-2 tw-py-1 tw-bg-red-100 tw-text-red-700 tw-rounded hover:tw-bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* ─── Menu Modal ──────────────────────────────────── */}
      {menuModalOpen && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-6 tw-w-full tw-max-w-md tw-mx-4">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
              <h3 className="tw-text-lg tw-font-bold">
                {editingMenu ? "Edit Menu" : "Create Menu"}
              </h3>
              <button
                className="tw-text-gray-500 hover:tw-text-gray-800 tw-text-xl"
                onClick={() => setMenuModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="tw-space-y-3">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Name (key) *
                </label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, name: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="e.g. dashboard, billing, inventory"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Label *
                </label>
                <input
                  type="text"
                  value={menuForm.label}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, label: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="e.g. Dashboard, Billing"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={menuForm.icon}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, icon: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="📊"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Path *
                </label>
                <input
                  type="text"
                  value={menuForm.path}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, path: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="/dashboard"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={menuForm.sort_order}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      sort_order: Number(e.target.value),
                    })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                />
              </div>
            </div>
            <div className="tw-flex tw-gap-2 tw-justify-end tw-mt-6">
              <button
                onClick={() => setMenuModalOpen(false)}
                className="tw-px-4 tw-py-2 tw-bg-gray-200 tw-text-gray-700 tw-rounded-md hover:tw-bg-gray-300 tw-text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMenu}
                disabled={
                  saving || !menuForm.name || !menuForm.label || !menuForm.path
                }
                className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 disabled:tw-bg-blue-300 tw-text-sm"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SubMenu Modal ───────────────────────────────── */}
      {subMenuModalOpen && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-6 tw-w-full tw-max-w-md tw-mx-4">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
              <h3 className="tw-text-lg tw-font-bold">
                {editingSubMenu ? "Edit SubMenu" : "Create SubMenu"}
              </h3>
              <button
                className="tw-text-gray-500 hover:tw-text-gray-800 tw-text-xl"
                onClick={() => setSubMenuModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="tw-space-y-3">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Name (key) *
                </label>
                <input
                  type="text"
                  value={subMenuForm.name}
                  onChange={(e) =>
                    setSubMenuForm({ ...subMenuForm, name: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="e.g. sales, stock, customers"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Label *
                </label>
                <input
                  type="text"
                  value={subMenuForm.label}
                  onChange={(e) =>
                    setSubMenuForm({ ...subMenuForm, label: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="e.g. Sales, Stock Taking"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={subMenuForm.icon}
                  onChange={(e) =>
                    setSubMenuForm({ ...subMenuForm, icon: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="🧾"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Path *
                </label>
                <input
                  type="text"
                  value={subMenuForm.path}
                  onChange={(e) =>
                    setSubMenuForm({ ...subMenuForm, path: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="/billing/sales"
                />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Access (comma-separated)
                </label>
                <input
                  type="text"
                  value={subMenuForm.access}
                  onChange={(e) =>
                    setSubMenuForm({ ...subMenuForm, access: e.target.value })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                  placeholder="read,open,create,edit,update,delete"
                />
                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                  Default: read,open,create,edit,update,delete
                </p>
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={subMenuForm.sort_order}
                  onChange={(e) =>
                    setSubMenuForm({
                      ...subMenuForm,
                      sort_order: Number(e.target.value),
                    })
                  }
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-sm"
                />
              </div>
            </div>
            <div className="tw-flex tw-gap-2 tw-justify-end tw-mt-6">
              <button
                onClick={() => setSubMenuModalOpen(false)}
                className="tw-px-4 tw-py-2 tw-bg-gray-200 tw-text-gray-700 tw-rounded-md hover:tw-bg-gray-300 tw-text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubMenu}
                disabled={
                  saving ||
                  !subMenuForm.name ||
                  !subMenuForm.label ||
                  !subMenuForm.path
                }
                className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 disabled:tw-bg-blue-300 tw-text-sm"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
