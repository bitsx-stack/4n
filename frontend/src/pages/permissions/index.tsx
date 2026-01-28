import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import {
  FetchParams,
  ServerSideDataTable,
} from "src/components/ui/ServerSideDatatable";
import api from "src/utils/api";
import { useCallback } from "react";

const columns = [
  { key: "id", label: "ID", sortable: true, filterable: false },
  { key: "name", label: "Name", sortable: true },
  { key: "module", label: "Module", sortable: true },
  {
    key: "created_at",
    label: "Created At",
    sortable: true,
    filterable: false,
    render: (v: string) => new Date(v).toLocaleString(),
  },
  {
    key: "updated_at",
    label: "Updated At",
    sortable: true,
    filterable: false,
    render: (v: string) => new Date(v).toLocaleString(),
  },
];

export default function PermissionsPage() {
  const fetchData = useCallback(async (params: FetchParams) => {
    const { page, pageSize, search, sortBy, sortOrder, filters } = params;
    const query = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      ...(search ? { search } : {}),
      ...(sortBy ? { sort_by: sortBy } : {}),
      ...(sortOrder ? { sort_order: sortOrder } : {}),
      ...((filters || {}) as Record<string, string>),
    }).toString();
    const res = await api.get(`/permissions?${query}`);

    return {
      data: res.data.data || res.data,
      total: res.data.total || res.data.data?.length || 0,
      page: res.data.page || page,
      pageSize: res.data.pageSize || pageSize,
    };
  }, []);

  return (
    <AdminDashboardLayout>
      <DashboardCard title="Permissions">
        <ServerSideDataTable columns={columns} fetchData={fetchData} />
      </DashboardCard>
    </AdminDashboardLayout>
  );
}
