import { Column } from "src/components/ui/ServerSideDatatable";
import api from "src/utils/api";

export type ReadCustomer = {
  customer_name: string;
  customer_phone: string;
  customer_secondary_phone: string;
  next_of_kin_name: string;
  next_of_kin_relationship: string;
  next_of_kin_phone: string;
  total_purchases: number;
  total_amount: number;
  last_purchase: string | null;
};

export async function fetchCustomers({
  page,
  pageSize,
  search,
}: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, string>;
}) {
  const params: Record<string, string | number> = { page, pageSize };
  if (search) params.search = search;
  const res = await api.get("/customers/", { params });
  return res.data;
}

export async function sendSms(phones: string[], message: string) {
  const res = await api.post("/customers/sms", { phones, message });
  return res.data;
}

export const columns: Column<ReadCustomer>[] = [
  { key: "customer_name", label: "Customer Name" },
  { key: "customer_phone", label: "Phone" },
  { key: "customer_secondary_phone", label: "Alt Phone" },
  {
    key: "total_purchases",
    label: "Purchases",
    render: (value: number) => (
      <span className="tw-font-semibold">{value}</span>
    ),
  },
  {
    key: "total_amount",
    label: "Total Spent",
    render: (value: number) => (
      <span className="tw-font-semibold">
        {Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    ),
  },
  {
    key: "last_purchase",
    label: "Last Purchase",
    render: (value: string | null) =>
      value ? new Date(value).toLocaleDateString() : "—",
  },
  { key: "next_of_kin_name", label: "Next of Kin" },
  { key: "next_of_kin_phone", label: "Kin Phone" },
];
