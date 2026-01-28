import { useEffect, useState, useRef } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import { ServerSideDataTable } from "src/components/ui/ServerSideDatatable";
import { columns, fetchTypes, createType, updateType, deleteType } from "./api";
import { Modal } from "src/components/ui/Modal";
import DataTableActions from "src/components/ui/DataTableActions";

interface Type {
  id: string;
  name: string;
}


export default function TypesPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Omit<Type, "id">>({ name: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const tableRefKey = useRef<number>(0);

  const load = async () => {
    await fetchTypes({ page: 1, pageSize: 10 });
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setFormData({ name: "" });
    setEditingId(null);
    setError("");
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditClick = (row: Type) => {
    setFormData({ name: row.name });
    setEditingId(row.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (row: Type) => {
    if (window.confirm(`Are you sure you want to delete "${row.name}"?`)) {
      try {
        setIsLoading(true);
        await deleteType(row.id);
        tableRefKey.current += 1;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete type");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewClick = (row: Type) => {
    setFormData({ name: row.name });
    setEditingId(row.id);
    // Open in view mode if needed, or just show the details in modal
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        // Update existing type
        await updateType(editingId, formData);
      } else {
        // Create new type
        await createType(formData);
      }
      setIsModalOpen(false);
      resetForm();
      tableRefKey.current += 1;
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save type");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the columns to use the new handlers
  const updatedColumns = columns.map((col) => {
    if (col.key === "actions") {
      return {
        ...col,
        render: (_value: any, row: Type) => (
          <DataTableActions
            row={row}
            onView={() => handleViewClick(row)}
            onEdit={() => handleEditClick(row)}
            onDelete={() => handleDeleteClick(row)}
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
        title={editingId ? "Edit Type" : "Create New Type"}
      >
        <form onSubmit={handleSubmit} className="tw-space-y-4">
          {error && (
            <div className="tw-p-3 tw-bg-red-100 tw-text-red-700 tw-rounded">
              {error}
            </div>
          )}

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Type Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="Enter type name"
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              disabled={isLoading}
            />
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
              {isLoading ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <DashboardCard title="Types Page">
        <div className="tw-mb-4">
          <button
            onClick={handleOpenModal}
            className="tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded-lg hover:tw-bg-green-600"
          >
            + Add New Type
          </button>
        </div>

        <ServerSideDataTable
          key={tableRefKey.current}
          columns={updatedColumns as any}
          fetchData={fetchTypes}
          title="Types"
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
