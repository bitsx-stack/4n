import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import api from "src/utils/api";

interface SubMenuItem {
  id: number;
  name: string;
  label: string;
  icon: string | null;
  path: string;
  access: string;
  sort_order: number;
}

interface MenuItem {
  id: number;
  name: string;
  label: string;
  icon: string | null;
  path: string;
  sort_order: number;
  children: SubMenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchUserMenu();
  }, []);

  // Auto-expand the menu that contains the current path
  useEffect(() => {
    const currentMenu = menuItems.find((m) =>
      m.children?.some((c) => location.pathname.startsWith(c.path)),
    );
    if (currentMenu && !expandedItems.includes(currentMenu.id)) {
      setExpandedItems((prev) => [...prev, currentMenu.id]);
    }
  }, [location.pathname, menuItems]);

  const fetchUserMenu = async () => {
    try {
      const user = localStorage.getItem("user");
      if (!user) return;
      const { id: userId } = JSON.parse(user);

      // Try loading user-specific menu first
      const res = await api.get(`/menus/permissions/user/${userId}/menu`);

      if (res.data && res.data.length > 0) {
        setMenuItems(res.data);
      } else {
        // Fallback: load all menus (for admin or when no permissions assigned yet)
        const allMenus = await api.get("/menus");
        const formatted = allMenus.data.map((m: any) => ({
          ...m,
          children: m.submenus || [],
        }));
        setMenuItems(formatted);
      }
    } catch (e) {
      console.error("Failed to load menu:", e);
      // Fallback: load all menus
      try {
        const allMenus = await api.get("/menus");
        const formatted = allMenus.data.map((m: any) => ({
          ...m,
          children: m.submenus || [],
        }));
        setMenuItems(formatted);
      } catch {
        setMenuItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-z-40 lg:tw-hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          tw-fixed lg:tw-sticky tw-top-0 tw-left-0 tw-h-screen tw-w-64 
          tw-bg-white tw-border-r tw-border-gray-200 tw-z-50
          tw-transform tw-transition-transform tw-duration-300
          ${isOpen ? "tw-translate-x-0" : "-tw-translate-x-full lg:tw-translate-x-0"}
        `}
      >
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <h2 className="tw-text-2xl tw-font-bold tw-text-primary">X-WING</h2>
        </div>

        <nav className="tw-p-4 tw-overflow-y-auto tw-h-[calc(100vh-5rem)]">
          {loading ? (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
              <div className="tw-animate-spin tw-rounded-full tw-h-6 tw-w-6 tw-border-b-2 tw-border-primary"></div>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="tw-text-center tw-py-8 tw-text-gray-400 tw-text-sm">
              No menu items available
            </div>
          ) : (
            menuItems.map((item) => (
              <div key={item.id} className="tw-mb-1">
                {item.children && item.children.length > 0 ? (
                  /* ── Parent with children ─────────────────── */
                  <>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-rounded-lg tw-transition-colors ${
                        expandedItems.includes(item.id)
                          ? "tw-bg-gray-100 tw-text-primary"
                          : "tw-text-secondary hover:tw-bg-gray-50"
                      }`}
                    >
                      <div className="tw-flex tw-items-center tw-gap-3">
                        <span className="tw-text-xl">{item.icon || "📄"}</span>
                        <span className="tw-font-medium">{item.label}</span>
                      </div>
                      <span
                        className={`tw-transition-transform tw-duration-200 ${
                          expandedItems.includes(item.id) ? "tw-rotate-90" : ""
                        }`}
                      >
                        ›
                      </span>
                    </button>

                    {expandedItems.includes(item.id) && (
                      <div className="tw-ml-4 tw-mt-1 tw-space-y-1 tw-border-l-2 tw-border-gray-100 tw-pl-2">
                        {item.children.map((child) => (
                          <Link
                            to={child.path}
                            key={child.id}
                            onClick={onClose}
                            className={`tw-w-full tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-2 tw-rounded-lg tw-transition-colors tw-text-sm ${
                              isActive(child.path)
                                ? "tw-bg-primary tw-bg-opacity-10 tw-text-primary tw-font-semibold"
                                : "tw-text-secondary-light hover:tw-bg-gray-50"
                            }`}
                          >
                            <span>{child.icon || "📄"}</span>
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Single item (no children) ────────────── */
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`tw-w-full tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 tw-rounded-lg tw-transition-colors ${
                      isActive(item.path)
                        ? "tw-bg-primary tw-bg-opacity-10 tw-text-primary tw-font-semibold"
                        : "tw-text-secondary hover:tw-bg-gray-50"
                    }`}
                  >
                    <span className="tw-text-xl">{item.icon || "📄"}</span>
                    <span className="tw-font-medium">{item.label}</span>
                  </Link>
                )}
              </div>
            ))
          )}
        </nav>
      </aside>
    </>
  );
}
