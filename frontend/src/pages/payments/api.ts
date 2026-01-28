import { Column } from "src/components/ui/ServerSideDatatable";

export type ReadPayment = {
    id: number;
    ref: string;
    amount: number;
    status: string;
    user_name: string;
    store: string;
    created_at: string;
    updated_at: string;
};

export async function fetchPayments({ page, pageSize }: { page: number; pageSize: number }) {
    // Replace with your actual API call
    const res = await fetch(`/api/payments?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error("Failed to fetch payments");
    return res.json();
}

export const columns: Column<ReadPayment>[] = [
    { key: "id", label: "ID" },
    { key: "ref", label: "Reference" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "user_name", label: "User Name" },
    { key: "store", label: "Store Name" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
];
