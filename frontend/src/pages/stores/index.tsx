import { useEffect, useMemo, useRef, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import DataTableActions from "src/components/ui/DataTableActions";
import { Modal } from "src/components/ui/Modal";
import { ServerSideDataTable } from "src/components/ui/ServerSideDatatable";
import {
  ClientLite,
  CreateStore,
  ReadStore,
  columns,
  createStore,
  fetchAllClientsLite,
  fetchStores,
} from "./api";

export default function StorePage() {
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");

  const clientNameById = useMemo(() => {
    const map = new Map<number, string>();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const tableRefKey = useRef<number>(0);

  const [formData, setFormData] = useState<CreateStore>({
    name: "",
    type: "",
    client_id: 0,
  });

  const loadClients = async () => {
    try {
      const list = await fetchAllClientsLite();
      setClients(list);
    } catch (err) {
      console.error("Failed to load clients", err);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const resetForm = () => {
    setError("");
    setFormData({
      name: "",
      type: "",
      client_id: typeof selectedClientId === "number" ? selectedClientId : 0,
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.type.trim()) {
      setError("Type is required");
      return;
    }
    if (!formData.client_id || formData.client_id <= 0) {
      setError("Client is required");
      return;
    }

    try {
      setIsLoading(true);
      await createStore(formData);
      setIsModalOpen(false);
      resetForm();
      tableRefKey.current += 1;
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create store");
    } finally {
      setIsLoading(false);
    }
  };

  const updatedColumns = columns.map((col) => {
    if (col.key === "client_id") {
      return {
        ...col,
        label: "Client",
        render: (_value: unknown, row: ReadStore) =>
          clientNameById.get(row.client_id) ?? String(row.client_id),
      };
    }
    if (col.key === "actions") {
      return {
        ...col,
        render: (_value: unknown, row: ReadStore) => (
          <DataTableActions
            row={row}
            onView={() => console.log("View", row.id)}
            onEdit={() => alert("Edit endpoint not implemented yet")}
            onDelete={() => alert("Delete endpoint not implemented yet")}
          />
        ),
      };
    }
    return col;
  });

  return (
    <AdminDashboardLayout>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Create New Store"
      >
        <form onSubmit={handleSubmit} className="tw-space-y-4">
          {error && (
            <div className="tw-p-3 tw-bg-red-100 tw-text-red-700 tw-rounded">
              {error}
            </div>
          )}

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Store Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter store name"
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Store Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Select type</option>
              <option value="warehouse">Warehouse</option>
              <option value="shop">Shop</option>
            </select>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Client
            </label>
            <select
              value={formData.client_id || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  client_id: e.target.value ? Number(e.target.value) : 0,
                })
              }
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="tw-flex tw-gap-2 tw-justify-end">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="tw-px-4 tw-py-2 tw-bg-gray-300 tw-text-gray-700 tw-rounded-md hover:tw-bg-gray-400"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tw-px-4 tw-py-2 tw-bg-blue-500 tw-text-white tw-rounded-md hover:tw-bg-blue-600 disabled:tw-bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <DashboardCard title="Stores">
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-end tw-gap-3 tw-mb-4">
          <div className="tw-flex-1">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Filter by Client
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : "";
                setSelectedClientId(val);
                tableRefKey.current += 1;
              }}
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
            >
              <option value="">Select client to view stores</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenModal}
            className="tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded-lg hover:tw-bg-green-600"
            disabled={!selectedClientId}
            title={!selectedClientId ? "Select a client first" : ""}
          >
            + Add New Store
          </button>
        </div>

        {!selectedClientId ? (
          <div className="tw-p-6 tw-text-gray-600 tw-bg-gray-50 tw-rounded">
            Select a client to load stores.
          </div>
        ) : (
          <ServerSideDataTable
            key={tableRefKey.current}
            columns={updatedColumns as any}
            fetchData={(params) =>
              fetchStores(
                params,
                typeof selectedClientId === "number" ? selectedClientId : null,
              )
            }
            title="Stores"
            onRowSelect={(selected) => console.log("Selected:", selected)}
          />
        )}
      </DashboardCard>
    </AdminDashboardLayout>
  );
}
