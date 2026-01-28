import { useEffect, useState, useRef } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import { ServerSideDataTable } from "src/components/ui/ServerSideDatatable";
import {
  columns,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchAllCategoryTypes,
  CategoryType,
} from "./api";
import { Modal } from "src/components/ui/Modal";
import DataTableActions from "src/components/ui/DataTableActions";
import Select from "react-select";

interface Category {
  id: string;
  name: string;
  categorytype_id: string;
}

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Omit<Category, "id">>({
    name: "",
    categorytype_id: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const tableRefKey = useRef<number>(0);

  const load = async () => {
    await fetchCategories({ page: 1, pageSize: 10 });
  };

  const loadCategoryTypes = async () => {
    try {
      const types = await fetchAllCategoryTypes();
      setCategoryTypes(types);
    } catch (err) {
      console.error("Failed to load category types", err);
    }
  };

  useEffect(() => {
    load();
    loadCategoryTypes();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", categorytype_id: "" });
    setEditingId(null);
    setError("");
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditClick = (row: Category) => {
    setFormData({ name: row.name, categorytype_id: row.categorytype_id });
    setEditingId(row.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (row: Category) => {
    if (window.confirm(`Are you sure you want to delete "${row.name}"?`)) {
      try {
        setIsLoading(true);
        await deleteCategory(row.id);
        tableRefKey.current += 1;
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to delete category");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleViewClick = (row: Category) => {
    setFormData({ name: row.name, categorytype_id: row.categorytype_id });
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

    if (!formData.categorytype_id || formData.categorytype_id === "") {
      setError("Category Type is required");
      return;
    }

    try {
      setIsLoading(true);
      if (editingId) {
        // Update existing category
        await updateCategory(editingId, formData);
      } else {
        // Create new category
        await createCategory(formData);
      }
      setIsModalOpen(false);
      resetForm();
      tableRefKey.current += 1;
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save category");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the columns to use the new handlers
  const updatedColumns = columns.map((col) => {
    if (col.key === "actions") {
      return {
        ...col,
        render: (_value: any, row: Category) => (
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
        title={editingId ? "Edit Category" : "Create New Category"}
      >
        <form onSubmit={handleSubmit} className="tw-space-y-4">
          {error && (
            <div className="tw-p-3 tw-bg-red-100 tw-text-red-700 tw-rounded">
              {error}
            </div>
          )}

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter category name"
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Category Type
            </label>
            <Select
              options={categoryTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
              value={
                formData.categorytype_id
                  ? {
                      value: formData.categorytype_id,
                      label: categoryTypes.find(
                        (t) => t.id === formData.categorytype_id,
                      )?.name,
                    }
                  : null
              }
              onChange={(option) =>
                setFormData({
                  ...formData,
                  categorytype_id: option?.value || "",
                })
              }
              isClearable
              isSearchable
              isDisabled={isLoading}
              placeholder="Search and select a Category Type"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#d1d5db",
                  "&:hover": { borderColor: "#d1d5db" },
                  boxShadow: "none",
                }),
              }}
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

      <DashboardCard title="Categories Page">
        <div className="tw-mb-4">
          <button
            onClick={handleOpenModal}
            className="tw-px-4 tw-py-2 tw-bg-green-500 tw-text-white tw-rounded-lg hover:tw-bg-green-600"
          >
            + Add New Category
          </button>
        </div>

        <ServerSideDataTable
          key={tableRefKey.current}
          columns={updatedColumns as any}
          fetchData={fetchCategories}
          title="Categories"
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
