import DataTableActions from "src/components/ui/DataTableActions";
import { Column, FetchParams } from "src/components/ui/ServerSideDatatable";
import api from "src/utils/api";

export interface Client {
    id: string;
    name: string;
    tin?: string | null;
    vrn?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    longitude?: number | null;
    latitude?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    status?: string | null;
}

type ClientWithActions = Client & { actions?: string };

interface ServerResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

export const fetchClients = async (
    params: FetchParams
): Promise<ServerResponse<Client>> => {
    const res = await api.get("/clients", {
        params: {
            page: params.page,
            pageSize: params.pageSize,
            search: params.search || "",
        },
    });

    console.log("Fetched clients:", res.data);
    return res.data;
};

export const createClient = async (
    data: Omit<Client, "id">
): Promise<Client> => {
    const res = await api.post("/clients", data);
    return res.data;
};

export const updateClient = async (
    id: string,
    data: Omit<Client, "id">
): Promise<Client> => {
    const res = await api.put(`/clients/${id}`, data);
    return res.data;
};

export const deleteClient = async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
};

export const fetchClientById = async (id: string): Promise<Client> => {
    const res = await api.get(`/clients/${id}`);
    return res.data;
};

export const columns: Column<ClientWithActions>[] = [
    { key: "id", label: "S/N", sortable: true, filterable: false },
    { key: "name", label: "Name", sortable: true, filterable: false },
    { key: "phone", label: "Phone", sortable: true, filterable: false },
    { key: "email", label: "Email", sortable: true, filterable: false },
    { key: "status", label: "Status", sortable: true, filterable: false },
    {
        key: "actions",
        label: "Actions",
        render: (_value: any, row: Client) => (
            <DataTableActions
        row= { row }
        onView={(r) => console.log("View", r.name)}
onEdit = {(r) => console.log("Edit", r.name)}
onDelete = {(r) => console.log("Delete", r.id)}
      />
    ),
  },
];