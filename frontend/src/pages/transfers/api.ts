import { Column } from "src/components/ui/ServerSideDatatable";

export type ReadTransfer = {
    id: number;
    ref: string;
    type: string;
    quantity: number;
    user_name: string;
    source_store: string;
    destination_store: string;
    status: string;
    created_at: string;
    updated_at: string;
};

export async function fetchTransfers({ page, pageSize }: { page: number; pageSize: number }) {
    // Replace with your actual API call
    const res = await fetch(`/api/transfers?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error("Failed to fetch transfers");
    return res.json();
}

export const columns: Column<ReadTransfer>[] = [
    { key: "id", label: "ID" },
    { key: "ref", label: "Reference" },
    { key: "type", label: "Type" },
    { key: "quantity", label: "Quantity" },
    { key: "status", label: "Status" },
    { key: "user_name", label: "User Name" },
    { key: "source_store", label: "Source Store" },
    { key: "destination_store", label: "Destination Store" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
];
