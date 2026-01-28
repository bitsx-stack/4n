import { Column } from "src/components/ui/ServerSideDatatable";

export type Permission = {
    id: number;
    name: string;
    module: string;
    created_at: string;
    updated_at: string;
};


export async function fetchPermissions({ page, pageSize }: { page: number; pageSize: number }) {
    // Replace with your actual API call
    const res = await fetch(`/api/permissions?page=${page}&pageSize=${pageSize}`);
    if (!res.ok) throw new Error("Failed to fetch permissions");
    return res.json();
}

export const columns: Column<Permission>[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "module", label: "Module" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
];
