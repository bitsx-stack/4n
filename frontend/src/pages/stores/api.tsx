import DataTableActions from "../../components/ui/DataTableActions";
import { Column, FetchParams } from "../../components/ui/ServerSideDatatable";
import api from "../../utils/api";

// Mirrors backend schemas/store.py
export interface CreateStore {
  name: string;
  type: string;
  client_id: number;
}

export interface ReadStore {
  id: number;
  name: string;
  type: string;
  client_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type StoreWithActions = ReadStore & { actions?: string };

export interface ClientLite {
  id: number;
  name: string;
}

interface ServerResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const applySearchSortPaginate = (
  stores: ReadStore[],
  params: FetchParams,
): ServerResponse<ReadStore> => {
  const search = (params.search || "").trim().toLowerCase();

  let filtered = stores;
  if (search) {
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.type.toLowerCase().includes(search) ||
        String(s.client_id).includes(search),
    );
  }

  // Basic sort support
  if (params.sortBy) {
    const key = params.sortBy as keyof ReadStore;
    const dir = params.sortOrder === "desc" ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      const av = a[key] as any;
      const bv = b[key] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  const total = filtered.length;
  const start = (params.page - 1) * params.pageSize;
  const data = filtered.slice(start, start + params.pageSize);

  return { data, total, page: params.page, pageSize: params.pageSize };
};

export const fetchStores = async (
  params: FetchParams,
  client_id?: number | null,
): Promise<ServerResponse<ReadStore>> => {
  if (!client_id) {
    return { data: [], total: 0, page: params.page, pageSize: params.pageSize };
  }

  // Backend: GET /api/stores/{company_id}
  const res = await api.get(`/stores/${client_id}`);
  const list: ReadStore[] = res.data?.data ?? res.data ?? [];

  return applySearchSortPaginate(list, params);
};

export const createStore = async (data: CreateStore): Promise<ReadStore> => {
  // Backend: POST /api/stores/
  const res = await api.post("/stores", data);
  return res.data;
};

export const fetchAllClientsLite = async (): Promise<ClientLite[]> => {
  // Backend: GET /api/clients/
  const res = await api.get("/clients");
  const list: any[] = res.data?.data ?? res.data ?? [];

  return list
    .map((c) => ({ id: Number(c.id), name: String(c.name) }))
    .filter((c) => Number.isFinite(c.id) && c.name);
};

export const columns: Column<StoreWithActions>[] = [
  { key: "id", label: "S/N", sortable: true, filterable: false },
  { key: "name", label: "Name", sortable: true, filterable: false },
  { key: "type", label: "Type", sortable: true, filterable: false },
  { key: "client_id", label: "Client", sortable: true, filterable: false },
  { key: "is_active", label: "Active", sortable: true, filterable: false },
  { key: "created_at", label: "Created", sortable: true, filterable: false },
  { key: "updated_at", label: "Updated", sortable: true, filterable: false },
  {
    key: "actions",
    label: "Actions",
    render: (_value: unknown, row: ReadStore) => (
      <DataTableActions
        row={row}
        onView={(r: ReadStore) => console.log("View", r.id)}
        onEdit={(r: ReadStore) => console.log("Edit", r.id)}
        onDelete={(r: ReadStore) => console.log("Delete", r.id)}
      />
    ),
  },
];
