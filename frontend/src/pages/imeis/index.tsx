import { useEffect, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import { Modal } from "src/components/ui/Modal";
import {
  fetchImeisInventory,
  getUniqueBrands,
  getModelsForBrand,
  getUniqueStores,
  ImeiInventoryItem,
  Imei,
  Store,
  getStorageOptions,
  normalizeStorageValue,
} from "./api2";
import { Copy } from "lucide-react";
import api from "src/utils/api";

export default function ImeiInventoryPage() {
  const [inventory, setInventory] = useState<ImeiInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storageOptions, setStorageOptions] = useState<
    {
      label: string;
      value: string;
    }[]
  >([]);

  // Filter state
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedStorage, setSelectedStorage] = useState<string>("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedImeis, setSelectedImeis] = useState<Imei[]>([]);
  const [copiedCode, setCopiedCode] = useState<string>("");

  const loadData = async () => {
    setIsLoading(true);
    try {
     
      const rawUser = await api.get("/auth/me/clients");
      let clientId: number | null = null;
      if (rawUser) {
        try {
          clientId = rawUser.data[0]?.id || null;
            
        } catch (e) {
          clientId = null;
        }
      }

      const [data, brandList, storeList] = await Promise.all([
        fetchImeisInventory(
          selectedBrand || undefined,
          selectedModel || undefined,
          selectedStore || undefined,
          selectedStorage || undefined,
        ),
        getUniqueBrands(),
        getUniqueStores(clientId),
      ]);
      setInventory(data);
      setBrands(brandList);
      setStores(storeList);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load storage options once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const opts = await getStorageOptions();
        if (!mounted) return;
        const mapped = opts
          .map((o) => ({
            label: o.name,
            value: normalizeStorageValue(o.name) || o.name,
          }))
          .filter((o) => o.value);
        setStorageOptions(mapped);
      } catch (e) {
        console.error("Failed to load storage options", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load models when brand changes
  useEffect(() => {
    const loadModels = async () => {
      if (selectedBrand) {
        const modelList = await getModelsForBrand(selectedBrand);
        setModels(modelList);
      } else {
        setModels([]);
        setSelectedModel(""); // Reset model filter when brand is cleared
      }
    };
    loadModels();
  }, [selectedBrand]);

  useEffect(() => {
    loadData();
  }, [selectedBrand, selectedModel, selectedStore, selectedStorage]);

  const handleViewImeis = (item: ImeiInventoryItem) => {
    setSelectedImeis(item.imeis);
    setIsModalOpen(true);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <AdminDashboardLayout>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`IMEI Codes (Total: ${selectedImeis.length})`}
      >
        <div className="tw-space-y-2 tw-max-h-96 tw-overflow-y-auto">
          {selectedImeis.length === 0 ? (
            <p className="tw-text-gray-500">No IMEI codes found</p>
          ) : (
            selectedImeis.map((imei) => (
              <div
                key={imei.id}
                className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded tw-border tw-border-gray-200 hover:tw-bg-gray-100"
              >
                <span className="tw-font-mono tw-text-sm">{imei.code}</span>
                <button
                  onClick={() => copyToClipboard(imei.code)}
                  className="tw-p-1 hover:tw-bg-gray-200 tw-rounded transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedCode === imei.code ? (
                    <span className="tw-text-green-600 tw-text-xs">
                      Copied!
                    </span>
                  ) : (
                    <Copy size={16} className="tw-text-gray-600" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      <DashboardCard title="IMEI Inventory">
        {/* Filters */}
        <div className="tw-mb-6 tw-space-y-4">
          <div className="tw-flex tw-items-center tw-gap-2 tw-justify-between">
            <h3 className="tw-text-lg tw-font-semibold">Filters</h3>
            {(selectedBrand ||
              selectedModel ||
              selectedStore ||
              selectedStorage) && (
              <button
                onClick={() => {
                  setSelectedBrand("");
                  setSelectedModel("");
                  setSelectedStore("");
                  setSelectedStorage("");
                }}
                className="tw-px-3 tw-py-1 tw-bg-gray-200 tw-text-gray-700 tw-rounded tw-text-sm hover:tw-bg-gray-300"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Filter by Store{" "}
                {selectedStore && <span className="tw-text-blue-600">✓</span>}
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={String(store.id)}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Filter by Storage{" "}
                {selectedStorage && <span className="tw-text-blue-600">✓</span>}
              </label>
              <select
                value={selectedStorage}
                onChange={(e) => setSelectedStorage(e.target.value)}
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">All Storage</option>
                {storageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Filter by Brand{" "}
                {selectedBrand && <span className="tw-text-blue-600">✓</span>}
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Filter by Model{" "}
                {selectedModel && <span className="tw-text-blue-600">✓</span>}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                disabled={isLoading || !selectedBrand || models.length === 0}
              >
                <option value="">
                  {selectedBrand ? "All Models" : "Select a brand first"}
                </option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        {isLoading ? (
          <div className="tw-text-center tw-py-8">
            <p className="tw-text-gray-500">Loading inventory...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="tw-text-center tw-py-8">
            <p className="tw-text-gray-500">No items found</p>
          </div>
        ) : (
          <div className="tw-overflow-x-auto">
            <table className="tw-w-full tw-border-collapse">
              <thead>
                <tr className="tw-bg-gray-100 tw-border-b-2 tw-border-gray-300">
                  <th className="tw-px-4 tw-py-3 tw-text-left tw-font-semibold tw-text-gray-700">
                    Brand
                  </th>
                  <th className="tw-px-4 tw-py-3 tw-text-left tw-font-semibold tw-text-gray-700">
                    Model
                  </th>
                  <th className="tw-px-4 tw-py-3 tw-text-center tw-font-semibold tw-text-gray-700">
                    Total Quantity
                  </th>
                  <th className="tw-px-4 tw-py-3 tw-text-center tw-font-semibold tw-text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => (
                  <tr
                    key={`${item.brand}_${item.model}`}
                    className={`tw-border-b tw-border-gray-200 hover:tw-bg-gray-50 ${
                      idx % 2 === 0 ? "tw-bg-white" : "tw-bg-gray-50"
                    }`}
                  >
                    <td className="tw-px-4 tw-py-4 tw-font-medium">
                      {item.brand}
                    </td>
                    <td className="tw-px-4 tw-py-4">{item.model}</td>
                    <td className="tw-px-4 tw-py-4 tw-text-center">
                      <span className="tw-inline-flex tw-items-center tw-justify-center tw-w-8 tw-h-8 tw-bg-blue-100 tw-text-blue-700 tw-rounded-full tw-font-semibold">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="tw-px-4 tw-py-4 tw-text-center">
                      <button
                        onClick={() => handleViewImeis(item)}
                        className="tw-px-4 tw-py-2 tw-bg-secondary tw-text-white tw-rounded hover:tw-bg-secondary-dark tw-text-sm font-medium"
                      >
                        View IMEIs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {inventory.length > 0 && (
          <div className="tw-mt-6 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
            <div className="tw-grid tw-grid-cols-3 tw-gap-4">
              <div>
                <p className="tw-text-sm tw-text-gray-600">Unique Items</p>
                <p className="tw-text-2xl tw-font-bold tw-text-blue-700">
                  {inventory.length}
                </p>
              </div>
              <div>
                <p className="tw-text-sm tw-text-gray-600">Total IMEIs</p>
                <p className="tw-text-2xl tw-font-bold tw-text-blue-700">
                  {inventory.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
              <div>
                <p className="tw-text-sm tw-text-gray-600">Unique Brands</p>
                <p className="tw-text-2xl tw-font-bold tw-text-blue-700">
                  {new Set(inventory.map((item) => item.brand)).size}
                </p>
              </div>
            </div>
          </div>
        )}
      </DashboardCard>
    </AdminDashboardLayout>
  );
}
