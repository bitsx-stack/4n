import { Column, FetchParams } from "src/components/ui/ServerSideDatatable";
import DataTableActions from "src/components/ui/DataTableActions";
import api from "src/utils/api";

interface Type  {
  id: string;
  name: string;
}

type TypeWithActions = Type & { actions?: string };

interface ServerResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}


export const fetchTypes = async (params: FetchParams): Promise<ServerResponse<Type>> => {
  const res = await api.get("/category-types", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || ""
    },
  });

  return res.data; 
};




// Create a new type
export const createType = async (data: Omit<Type, 'id'>): Promise<Type> => {
  const res = await api.post("/category-types", data);
  return res.data;
};

// Update an existing type
export const updateType = async (id: string, data: Omit<Type, 'id'>): Promise<Type> => {
  const res = await api.put(`/category-types/${id}`, data);
  return res.data;
};

// Delete a type
export const deleteType = async (id: string): Promise<void> => {
  await api.delete(`/category-types/${id}`);
};

// Get a single type by ID
export const fetchTypeById = async (id: string): Promise<Type> => {
  const res = await api.get(`/category-types/${id}`);
  return res.data;
};

export const columns: Column<TypeWithActions>[] = [
  { key: "id", label: "S/N", sortable: true, filterable: false },

  { key: "name", label: "Name", sortable: true, filterable: false },
 
  
  {
    key: 'actions',
    label: 'Actions',
    render: (_value:any, row: Type) => (
      <DataTableActions
        row={row}
        onView={(r) => {
          console.log("View", r.name)
          
        }}
        onEdit={(r) => console.log("Edit", r.name)}
        onDelete={(r) => alert("Delete")}
       />
    ),
  },
];