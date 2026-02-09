import { Column } from "src/components/ui/ServerSideDatatable";
import api from "src/utils/api";

export type ReadTransfer = {
  id: number;
  source_store_name: string;
  destination_store_name: string;
  brand: string;
  model: string;
  storage: string;
  requested_quantity: number;
  moved_quantity: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export async function fetchTransfers({
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
  const res = await api.get("/stock-requests/", { params });
  return res.data;
}

export const columns: Column<ReadTransfer>[] = [
  { key: "id", label: "ID" },
  {
    key: "status",
    label: "Status",
    filterable: true,
    filterType: "select",
    filterOptions: [
      { value: "pending", label: "Pending" },
      { value: "transferred", label: "Transferred" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
      { value: "rejected", label: "Rejected" },
    ],
    render: (value: string) => {
      const colors: Record<string, string> = {
        pending: "tw-bg-yellow-100 tw-text-yellow-800",
        transferred: "tw-bg-blue-100 tw-text-blue-800",
        completed: "tw-bg-green-100 tw-text-green-800",
        cancelled: "tw-bg-gray-100 tw-text-gray-800",
        rejected: "tw-bg-red-100 tw-text-red-800",
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
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "storage", label: "Storage" },
  { key: "requested_quantity", label: "Requested" },
  { key: "moved_quantity", label: "Transferred" },
  { key: "source_store_name", label: "Source Store" },
  { key: "destination_store_name", label: "Destination Store" },
  {
    key: "created_at",
    label: "Created",
    render: (value: string) =>
      value ? new Date(value).toLocaleDateString() : "",
  },
  {
    key: "updated_at",
    label: "Updated",
    render: (value: string) =>
      value ? new Date(value).toLocaleDateString() : "",
  },
];
