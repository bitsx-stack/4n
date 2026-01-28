import { useEffect, useRef, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import { Modal } from "src/components/ui/Modal";
import { Column, ServerSideDataTable } from "src/components/ui/ServerSideDatatable";

import { columns, fetchPayments, ReadPayment} from "./api";

export default function PaymentsPage() {
  const tableRefKey = useRef<number>(0);
  const [selectedPayment, setSelectedPayment] = useState<ReadPayment | null>(
    null,
  );
  const [error, setError] = useState<string>("");

  const load = async () => {
    await fetchPayments({ page: 1, pageSize: 10 });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatedColumns: Column<ReadPayment>[] = [
    ...columns,
    {
      key: "actions" as keyof ReadPayment, // or use 'as any' if "actions" is not in ReadPayment
      label: "Actions",
      render: (_value: unknown, row: ReadPayment) => (
        <div className="tw-flex tw-gap-2">
          {/* Add payment actions here if needed */}
        </div>
      ),
    } as unknown as Column<ReadPayment>,
  ];

  return (
    <AdminDashboardLayout>
      <DashboardCard title="Payments">
        <ServerSideDataTable
          key={tableRefKey.current}
          columns={updatedColumns}
          fetchData={fetchPayments}
        />
      </DashboardCard>
    </AdminDashboardLayout>
  );
}
