import { useEffect, useRef, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import {
  Column,
  ServerSideDataTable,
} from "src/components/ui/ServerSideDatatable";

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
          <button
            className="tw-text-xs tw-text-blue-600 hover:tw-underline"
            onClick={() => setSelectedTransfer(row)}
          >
            View
          </button>
        </div>
      ),
    } as Column<ReadTransfer>,
  ];

  return (
    <AdminDashboardLayout>
      <DashboardCard title="Stock Transfers">
        <ServerSideDataTable
          key={tableRefKey.current}
          columns={updatedColumns}
          fetchData={fetchTransfers}
        />
      </DashboardCard>

      {selectedTransfer && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-6 tw-max-w-md tw-w-full">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
              <h3 className="tw-text-lg tw-font-bold">
                Transfer #{selectedTransfer.id}
              </h3>
              <button
                className="tw-text-gray-500 hover:tw-text-gray-800 tw-text-xl"
                onClick={() => setSelectedTransfer(null)}
              >
                ✕
              </button>
            </div>
            <div className="tw-space-y-2 tw-text-sm">
              <p>
                <span className="tw-font-semibold">Status:</span>{" "}
                <span className="tw-capitalize">{selectedTransfer.status}</span>
              </p>
              <p>
                <span className="tw-font-semibold">Brand:</span>{" "}
                {selectedTransfer.brand}
              </p>
              <p>
                <span className="tw-font-semibold">Model:</span>{" "}
                {selectedTransfer.model}
              </p>
              <p>
                <span className="tw-font-semibold">Storage:</span>{" "}
                {selectedTransfer.storage}
              </p>
              <p>
                <span className="tw-font-semibold">Requested Qty:</span>{" "}
                {selectedTransfer.requested_quantity}
              </p>
              <p>
                <span className="tw-font-semibold">Transferred Qty:</span>{" "}
                {selectedTransfer.moved_quantity}
              </p>
              <p>
                <span className="tw-font-semibold">Source:</span>{" "}
                {selectedTransfer.source_store_name}
              </p>
              <p>
                <span className="tw-font-semibold">Destination:</span>{" "}
                {selectedTransfer.destination_store_name}
              </p>
              {selectedTransfer.notes && (
                <p>
                  <span className="tw-font-semibold">Notes:</span>{" "}
                  {selectedTransfer.notes}
                </p>
              )}
              <p>
                <span className="tw-font-semibold">Created:</span>{" "}
                {new Date(selectedTransfer.created_at).toLocaleString()}
              </p>
              <p>
                <span className="tw-font-semibold">Updated:</span>{" "}
                {new Date(selectedTransfer.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
