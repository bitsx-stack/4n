import { useEffect, useRef, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import { Column, ServerSideDataTable } from "src/components/ui/ServerSideDatatable";

import { columns, fetchTransfers, ReadTransfer } from "./api";

export default function TransfersPage() {
  const tableRefKey = useRef<number>(0);
  const [selectedTransfer, setSelectedTransfer] = useState<ReadTransfer | null>(
    null,
  );
  const [error, setError] = useState<string>("");

  const load = async () => {
    await fetchTransfers({ page: 1, pageSize: 10 });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatedColumns: Column<ReadTransfer>[] = [
    ...columns,
    {
      key: "actions" as keyof ReadTransfer,
      label: "Actions",
      render: (_value: unknown, row: ReadTransfer) => (
        <div className="tw-flex tw-gap-2">
          {/* Add transfer actions here if needed */}
        </div>
      ),
    } as Column<ReadTransfer>,
  ];

  return (
    <AdminDashboardLayout>
      <DashboardCard title="Transfers">
        <ServerSideDataTable
          key={tableRefKey.current}
          columns={updatedColumns}
          fetchData={fetchTransfers}
        />
      </DashboardCard>
    </AdminDashboardLayout>
  );
}
