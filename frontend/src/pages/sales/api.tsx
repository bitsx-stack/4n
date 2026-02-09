import { Column } from "src/components/ui/ServerSideDatatable";
import api from "src/utils/api";

export type ReadSale = {
  id: number;
  store_id: number;
  store_name: string;
  imei_code: string;
  brand: string;
  model: string;
  storage: string;
  amount: number;
  notes: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_secondary_phone: string;
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_phone: string;
  next_of_kin_secondary_phone: string;
  receipt_url: string;
  seller_id: number | null;
  seller_name: string;
  created_at: string;
  updated_at: string;
};

export async function fetchSales({
  page,
  pageSize,
  filters,
}: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, string>;
}) {
  const params: Record<string, string | number> = { page, pageSize };
  if (filters?.status) {
    params.status = filters.status;
  }
  const res = await api.get("/sales/", { params });
  return res.data;
}

export const columns: Column<ReadSale>[] = [
  { key: "id", label: "ID" },
  {
    key: "status",
    label: "Status",
    filterable: true,
    filterType: "select",
    filterOptions: [
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
    render: (value: string) => {
      const colors: Record<string, string> = {
        completed: "tw-bg-green-100 tw-text-green-800",
        cancelled: "tw-bg-gray-100 tw-text-gray-800",
      };
      return (
        <span
          className={`tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-semibold tw-capitalize ${colors[value] ?? "tw-bg-gray-100"}`}
        >
          {value}
        </span>
      );
    },
  },
  { key: "customer_name", label: "Customer" },
  { key: "customer_phone", label: "Phone" },
  { key: "imei_code", label: "IMEI" },
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "storage", label: "Storage" },
  {
    key: "amount",
    label: "Amount",
    render: (value: number) =>
      value != null ? Number(value).toLocaleString() : "",
  },
  { key: "store_name", label: "Store" },
  {
    key: "created_at",
    label: "Date",
    render: (value: string) =>
      value ? new Date(value).toLocaleDateString() : "",
  },
];
