import { Column, FetchParams } from "src/components/ui/ServerSideDatatable";
import api from "src/utils/api";

export type PurchaseStatus = "pending" | "completed";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface ReadPurchase {
  id: number;

  vendor_name: string

  brand_name: string

  model_name: string

  store_name: string

  company_name: string

  storage_size: string

  quantity: number;
  status: PurchaseStatus

  total_price: number;
  paid_amount: number;
  payment_status: PaymentStatus;

  created_at?: string;
  updated_at?: string;
}

interface ServerResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const applySearchSortPaginate = (
  rows: ReadPurchase[],
  params: FetchParams,
): ServerResponse<ReadPurchase> => {
  const search = (params.search || "").trim().toLowerCase();

  let filtered = rows;
  if (search) {
    filtered = filtered.filter((p) => {
      const haystack = [
        p.vendor_name,
        p.brand_name,
        p.model_name,
        p.store_name,
        p.company_name,
        p.storage_size,
        p.status,
        p.payment_status,
        String(p.id ?? ""),
        String(p.quantity ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  if (params.sortBy) {
    const key = params.sortBy as keyof ReadPurchase;
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

export const fetchPurchases = async (
  params: FetchParams,
): Promise<ServerResponse<ReadPurchase>> => {
  // Backend: GET /api/purchases
  const res = await api.get("/purchases");
  const list: ReadPurchase[] = res.data?.data ?? res.data ?? [];
  return applySearchSortPaginate(list, params);
};

export const updatePurchaseStatus = async (
  purchaseId: number,
  status: PurchaseStatus,
): Promise<ReadPurchase> => {
  // Backend: PUT /api/purchases/{id}/status
  const res = await api.put(`/purchases/${purchaseId}/status`, { status });
  return res.data;
};

export const updatePurchasePayment = async (
  purchaseId: number,
  payload: {
    total_price?: number;
    paid_amount?: number;
    payment_status?: PaymentStatus;
  },
): Promise<ReadPurchase> => {
  // Backend: PUT /api/purchases/{id}/payment
  const res = await api.put(`/purchases/${purchaseId}/payment`, payload);
  return res.data;
};

export const columns: Column<ReadPurchase>[] = [
  { key: "id", label: "S/N", sortable: true, filterable: false },
  {
    key: "vendor_name",
    label: "Vendor",
    sortable: true,
    filterable: false,
    render: (_v, row) => row.vendor_name || "-",
  },
  {
    key: "brand_name",
    label: "Brand",
    sortable: true,
    filterable: false,
    render: (_v, row) => row.brand_name || "-",
  },
  {
    key: "model_name",
    label: "Model",
    sortable: true,
    filterable: false,
    render: (_v, row) => row.model_name || "-",
  },
  {
    key: "storage_size",
    label: "Storage",
    sortable: true,
    filterable: false,
    render: (_v, row) => row.storage_size || "-",
  },
  {
    key: "company_name",
    label: "Company",
    sortable: true,
    filterable: false,
    render: (_v, row) => row.company_name || "-",
  },
  {
    key: "store_name",
    label: "Store",
    sortable: true,
    filterable: false,
    render: (_v, row) => row.store_name || "-",
  },
  { key: "quantity", label: "Qty", sortable: true, filterable: false },
  {
    key: "status",
    label: "Status",
    sortable: true,
    filterable: false,
    render: (_v, row) => String(row.status || "-").toUpperCase(),
  },
  {
    key: "total_price",
    label: "Total Price",
    sortable: true,
    filterable: false,
    render: (_v, row) =>
      typeof row.total_price === "number"
        ? row.total_price.toLocaleString()
        : "-",
  },
  {
    key: "paid_amount",
    label: "Paid",
    sortable: true,
    filterable: false,
    render: (_v, row) =>
      typeof row.paid_amount === "number"
        ? row.paid_amount.toLocaleString()
        : "-",
  },
  {
    key: "payment_status",
    label: "Payment",
    sortable: true,
    filterable: false,
    render: (_v, row) => String(row.payment_status || "-").toUpperCase(),
  },
];
