import { useEffect, useRef, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import DataTableActions from "src/components/ui/DataTableActions";
import { Modal } from "src/components/ui/Modal";
import { ServerSideDataTable } from "src/components/ui/ServerSideDatatable";

import {
  CreateVendor,
  ReadVendor,
  columns,
  createVendor,
  fetchVendors,
} from "./api";

export default function VendorsPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const tableRefKey = useRef<number>(0);

  const [formData, setFormData] = useState<CreateVendor>({
    name: "",
    code: "",
    phone: "",
    tin: "",
    email: "",
  });

  const load = async () => {
    await fetchVendors({ page: 1, pageSize: 10 });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setError("");
    setFormData({ name: "", code: "", phone: "", tin: "", email: "" });
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) return setError("Name is required");
    if (!formData.code.trim()) return setError("Code is required");
    if (!formData.phone.trim()) return setError("Phone is required");
    if (!formData.tin.trim()) return setError("TIN is required");
    if (!formData.email.trim()) return setError("Email is required");

    try {
      setIsLoading(true);
      await createVendor(formData);
      setIsModalOpen(false);
      resetForm();
      tableRefKey.current += 1;
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create vendor");
    } finally {
      setIsLoading(false);
    }
  };

  const updatedColumns = columns.map((col) => {
    if (col.key === "actions") {
      return {
        ...col,
        render: (_value: unknown, row: ReadVendor) => (
          <DataTableActions
            row={row}
            onView={() => console.log("View", row.id)}
            onEdit={() => alert("Edit vendor is not available yet")}
            onDelete={() => alert("Delete vendor is not available yet")}
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
        title="Create New Vendor"
      >
        <form onSubmit={handleSubmit} className="tw-space-y-4">
          {error && (
            <div className="tw-p-3 tw-bg-red-100 tw-text-red-700 tw-rounded">
              {error}
            </div>
          )}

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter vendor name"
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Enter vendor code"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter phone"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                TIN
              </label>
              <input
                type="text"
                value={formData.tin}
                onChange={(e) =>
                  setFormData({ ...formData, tin: e.target.value })
                }
                placeholder="Enter TIN"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
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

      <DashboardCard title="Vendors">
        <div className="tw-mb-4">
          <button
            onClick={handleOpenModal}
            className="tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded-lg hover:tw-bg-green-600"
          >
            + Add New Vendor
          </button>
        </div>

        <ServerSideDataTable
          key={tableRefKey.current}
          columns={updatedColumns as any}
          fetchData={fetchVendors}
          title="Vendors"
          onRowSelect={(selected) => console.log("Selected:", selected)}
          actions={(selected) => (
            <button className="tw-px-4 tw-py-2 tw-bg-danger tw-text-white tw-rounded-lg">
              Delete {selected.length}
            </button>
          )}
        />
      </DashboardCard>
    </AdminDashboardLayout>
  );
}
