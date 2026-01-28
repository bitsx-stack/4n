import { Column, FetchParams } from "src/components/ui/ServerSideDatatable";
import DataTableActions from "src/components/ui/DataTableActions";
import api from "src/utils/api";

export interface CategoryType {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  categorytype_id: string;
  category_type?: CategoryType;
}

type CategoryWithActions = Category & { actions?: string };

interface ServerResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const fetchCategories = async (
  params: FetchParams,
): Promise<ServerResponse<Category>> => {
  const res = await api.get("/categories", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || "",
    },
  });

  return res.data;
};

// Create a new category
export const createCategory = async (
  data: Omit<Category, "id">,
): Promise<Category> => {
  const res = await api.post("/categories", data);
  return res.data;
};

// Update an existing category
export const updateCategory = async (
  id: string,
  data: Omit<Category, "id">,
): Promise<Category> => {
  const res = await api.put(`/categories/${id}`, data);
  return res.data;
};

// Delete a category
export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
};

// Get a single category by ID
export const fetchCategoryById = async (id: string): Promise<Category> => {
  const res = await api.get(`/categories/${id}`);
  return res.data;
};

// Fetch all category types
export const fetchAllCategoryTypes = async (): Promise<CategoryType[]> => {
  const res = await api.get("/category-types", {
    params: {
      page: 1,
      pageSize: 1000,
    },
  });
  return res.data.data;
};

export const columns: Column<CategoryWithActions>[] = [
  { key: "id", label: "S/N", sortable: true, filterable: false },
  { key: "name", label: "Name", sortable: true, filterable: false },
  {
    key: "categorytype_id",
    label: "Category Type",
    sortable: true,
    filterable: false,
    render: (_value: any, row: Category) => row.category_type?.name || "N/A",
  },

  {
    key: "actions",
    label: "Actions",
    render: (_value: any, row: Category) => (
      <DataTableActions
        row={row}
        onView={(r) => {
          console.log("View", r.name);
        }}
        onEdit={(r) => console.log("Edit", r.name)}
        onDelete={(r) => alert("Delete")}
      />
    ),
  },
];
