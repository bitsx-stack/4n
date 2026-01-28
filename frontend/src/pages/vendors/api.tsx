import DataTableActions from "src/components/ui/DataTableActions";
import { Column, FetchParams } from "src/components/ui/ServerSideDatatable";
import api from "src/utils/api";

// Mirrors backend models/vendor.py + schemas/vendor.py
export interface CreateVendor {
  name: string;
  code: string;
  phone: string;
  tin: string;
  email: string;
}

export interface ReadVendor {
  id: number;
  name: string;
  code: string;
  phone: string;
  tin: string;
  email: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

type VendorWithActions = ReadVendor & { actions?: string };

interface ServerResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const applySearchSortPaginate = (
  vendors: ReadVendor[],
  params: FetchParams,
): ServerResponse<ReadVendor> => {
  const search = (params.search || "").trim().toLowerCase();

  let filtered = vendors;
  if (search) {
    filtered = filtered.filter((v) => {
      const haystack = [
        v.name,
        v.code,
        v.phone,
        v.tin,
        v.email,
        String(v.id ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  if (params.sortBy) {
    const key = params.sortBy as keyof ReadVendor;
    const dir = params.sortOrder === "desc" ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      const av = a[key] as any;
      const bv = b[key] as any;
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      if (typeof av === "boolean" && typeof bv === "boolean")
        return (Number(av) - Number(bv)) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  const total = filtered.length;
  const start = (params.page - 1) * params.pageSize;
  const data = filtered.slice(start, start + params.pageSize);

  return { data, total, page: params.page, pageSize: params.pageSize };
};

export const fetchVendors = async (
  params: FetchParams,
): Promise<ServerResponse<ReadVendor>> => {
  // Backend: GET /api/vendors -> returns list
  const res = await api.get("/vendors");
  const list: ReadVendor[] = res.data?.data ?? res.data ?? [];
  return applySearchSortPaginate(list, params);
};

export const createVendor = async (data: CreateVendor): Promise<ReadVendor> => {
  // Backend: POST /api/vendors/
  const res = await api.post("/vendors", data);
  return res.data;
};

export const columns: Column<VendorWithActions>[] = [
  { key: "id", label: "S/N", sortable: true, filterable: false },
  { key: "name", label: "Name", sortable: true, filterable: false },
  { key: "code", label: "Code", sortable: true, filterable: false },
  { key: "phone", label: "Phone", sortable: true, filterable: false },
  { key: "email", label: "Email", sortable: true, filterable: false },
  { key: "tin", label: "TIN", sortable: true, filterable: false },
  {
    key: "is_active",
    label: "Active",
    sortable: true,
    filterable: false,
    render: (_value: unknown, row: ReadVendor) =>
      row.is_active == null ? "-" : row.is_active ? "Yes" : "No",
  },
  {
    key: "actions",
    label: "Actions",
    render: (_value: unknown, row: ReadVendor) => (
      <DataTableActions
        row={row}
        onView={(r: ReadVendor) => console.log("View", r.id)}
        onEdit={() => alert("Edit vendor is not available yet")}
        onDelete={() => alert("Delete vendor is not available yet")}
      />
    ),
  },
];
