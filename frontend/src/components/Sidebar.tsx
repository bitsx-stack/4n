import { useState } from "react";
import { FaTags, FaLayerGroup, FaBarcode } from "react-icons/fa";
import { Link } from "react-router";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: MenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcon = <FaTags className="tw-text-xl tw-text-primary" />;
const categoryIcon = <FaLayerGroup className="tw-text-xl tw-text-secondary" />;
const barcodeIcon = <FaBarcode className="tw-text-xl tw-text-accent" />;

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/dashboard" },
    {
      id: "billing",
      label: "Billing",
      icon: "💳",
      path: "/billing",
      children: [
        {
          id: "sales",
          label: "Sales",
          icon: "🧾",
          path: "/billing/sales",
        },

        {
          id: "returns",
          label: "Returns",
          icon: "↩️",
          path: "/billing/returns",
        },
        {
          id: "creditors",
          label: "Creditors",
          icon: "👥",
          path: "/billing/creditors",
        },
        {
          id: "debtors",
          label: "Debtors",
          icon: "🧾",
          path: "/billing/debtors",
        },
      ],
    },
    {
      id: "users",
      label: "Users",
      icon: "👥",
      path: "/users",
      children: [
        {
          id: "customers",
          label: "Customers",
          icon: "🛒",
          path: "/users/customers",
        },
        {
          id: "user_list",
          label: "User List",
          icon: "📃",
          path: "/users/list",
        },
        {
          id: "user_roles",
          label: "User Roles",
          icon: "🔐",
          path: "/users/roles",
        },
        {
          id: "user_activity",
          label: "User Activity",
          icon: "🕵️",
          path: "/users/activity",
        },
        {
          id: "user_permissions",
          label: "User Permissions",
          icon: "✅",
          path: "/users/permissions",
        },
      ],
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: "📦",
      path: "/inventory",
      children: [
        {
          id: "stock-taking",
          label: "Stock Taking",
          icon: barcodeIcon,
          path: "/inventory/stock-taking",
        },

        {
          id: "stock",
          label: "Stocks",
          icon: "📋",
          path: "/inventory/stock",
        },

        {
          id: "transfers",
          label: "Stock Transfers",
          icon: "🔄",
          path: "/inventory/transfers",
        },
      ],
    },
    {
      id: "purchases",
      label: "Purchases",
      icon: "🛒",
      path: "/purchases",
      children: [
        {
          id: "list",
          label: "Purchase Orders",
          icon: "📝",
          path: "/purchases/list",
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      path: "/settings",
      children: [
        {
          id: "types",
          label: "Types",
          icon: typeIcon,
          path: "/settings/types",
        },
        {
          id: "categories",
          label: "Categories",
          icon: categoryIcon,
          path: "/settings/categories",
        },
        {
          id: "companies",
          label: "Companies",
          icon: "🏢",
          path: "/settings/companies",
        },
        { id: "stores", label: "Stores", icon: "🏬", path: "/settings/stores" },
        {
          id: "vendors",
          label: "Vendors",
          icon: "🚚",
          path: "/settings/vendors",
        },
        { id: "sms", label: "SMS Settings", icon: "📱", path: "/settings/sms" },
      ],
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

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
          <h2 className="tw-text-2xl tw-font-bold tw-text-primary">
            Admin Panel
          </h2>
        </div>

        <nav className="tw-p-4 tw-overflow-y-auto tw-h-[calc(100vh-5rem)]">
          {menuItems.map((item) => (
            <div key={item.id} className="tw-mb-2">
              <button
                onClick={() => item.children && toggleExpand(item.id)}
                className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-text-secondary hover:tw-bg-gray-50 tw-rounded-lg tw-transition-colors"
              >
                <div className="tw-flex tw-items-center tw-gap-3">
                  <span className="tw-text-xl">{item.icon}</span>
                  <span className="tw-font-medium">{item.label}</span>
                </div>
                {item.children && (
                  <span
                    className={`tw-transition-transform ${expandedItems.includes(item.id) ? "tw-rotate-90" : ""}`}
                  >
                    ›
                  </span>
                )}
              </button>

              {/* Nested Items */}
              {item.children && expandedItems.includes(item.id) && (
                <div className="tw-ml-4 tw-mt-2 tw-space-y-1">
                  {item.children.map((child) => (
                    <Link
                      to={child.path}
                      key={child.id}
                      className="tw-w-full tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-2 tw-text-secondary-light hover:tw-bg-gray-50 tw-rounded-lg tw-transition-colors tw-text-sm"
                    >
                      <span>{child.icon}</span>
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
