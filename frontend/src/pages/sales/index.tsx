import { useRef, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import {
  Column,
  ServerSideDataTable,
} from "src/components/ui/ServerSideDatatable";
import api from "src/utils/api";
import { columns, fetchSales, ReadSale } from "./api";

export default function SalesPage() {
  const tableRefKey = useRef(0);
  const [selectedSale, setSelectedSale] = useState<ReadSale | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const viewReceipt = (sale: ReadSale) => {
    if (sale.receipt_url) {
      // Build absolute URL via the axios baseURL
      const base = (api.defaults.baseURL || "").replace(/\/$/, "");
      setReceiptUrl(`${base}/sales/${sale.id}/receipt`);
      setShowReceiptModal(true);
    }
  };

  const updatedColumns: Column<ReadSale>[] = [
    ...columns,
    {
      key: "actions" as keyof ReadSale,
      label: "Actions",
      render: (_value: unknown, row: ReadSale) => (
        <div className="tw-flex tw-gap-2">
          <button
            className="tw-text-xs tw-text-blue-600 hover:tw-underline"
            onClick={() => setSelectedSale(row)}
          >
            View
          </button>
          {row.receipt_url && (
            <button
              className="tw-text-xs tw-text-green-600 hover:tw-underline"
              onClick={() => viewReceipt(row)}
            >
              Receipt
            </button>
          )}
        </div>
      ),
    } as Column<ReadSale>,
  ];

  return (
    <AdminDashboardLayout>
      <DashboardCard title="Sales">
        <ServerSideDataTable
          key={tableRefKey.current}
          columns={updatedColumns}
          fetchData={fetchSales}
        />
      </DashboardCard>

      {/* ──── Sale Detail Modal ──── */}
      {selectedSale && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-6 tw-max-w-lg tw-w-full tw-max-h-[90vh] tw-overflow-y-auto">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
              <h3 className="tw-text-lg tw-font-bold">
                Sale #{selectedSale.id}
              </h3>
              <button
                className="tw-text-gray-500 hover:tw-text-gray-800 tw-text-xl"
                onClick={() => setSelectedSale(null)}
              >
                ✕
              </button>
            </div>
            <div className="tw-space-y-2 tw-text-sm">
              <p>
                <span className="tw-font-semibold">Status:</span>{" "}
                <span
                  className={`tw-capitalize tw-font-semibold ${
                    selectedSale.status === "completed"
                      ? "tw-text-green-600"
                      : "tw-text-gray-500"
                  }`}
                >
                  {selectedSale.status}
                </span>
              </p>

              <hr className="tw-my-2" />
              <p className="tw-font-semibold tw-text-gray-700">📱 Item</p>
              <p>
                <span className="tw-font-semibold">IMEI:</span>{" "}
                {selectedSale.imei_code}
              </p>
              <p>
                <span className="tw-font-semibold">Brand:</span>{" "}
                {selectedSale.brand}
              </p>
              <p>
                <span className="tw-font-semibold">Model:</span>{" "}
                {selectedSale.model}
              </p>
              <p>
                <span className="tw-font-semibold">Storage:</span>{" "}
                {selectedSale.storage || "N/A"}
              </p>
              <p>
                <span className="tw-font-semibold">Amount:</span>{" "}
                {Number(selectedSale.amount).toLocaleString()}
              </p>

              <hr className="tw-my-2" />
              <p className="tw-font-semibold tw-text-gray-700">👤 Customer</p>
              <p>
                <span className="tw-font-semibold">Name:</span>{" "}
                {selectedSale.customer_name}
              </p>
              <p>
                <span className="tw-font-semibold">Phone:</span>{" "}
                {selectedSale.customer_phone}
              </p>
              {selectedSale.customer_secondary_phone && (
                <p>
                  <span className="tw-font-semibold">Alt Phone:</span>{" "}
                  {selectedSale.customer_secondary_phone}
                </p>
              )}

              {selectedSale.next_of_kin_name && (
                <>
                  <hr className="tw-my-2" />
                  <p className="tw-font-semibold tw-text-gray-700">
                    👨‍👩‍👧 Next of Kin
                  </p>
                  <p>
                    <span className="tw-font-semibold">Name:</span>{" "}
                    {selectedSale.next_of_kin_name}
                  </p>
                  <p>
                    <span className="tw-font-semibold">Relationship:</span>{" "}
                    {selectedSale.next_of_kin_relationship}
                  </p>
                  <p>
                    <span className="tw-font-semibold">Phone:</span>{" "}
                    {selectedSale.next_of_kin_phone}
                  </p>
                  {selectedSale.next_of_kin_secondary_phone && (
                    <p>
                      <span className="tw-font-semibold">Alt Phone:</span>{" "}
                      {selectedSale.next_of_kin_secondary_phone}
                    </p>
                  )}
                </>
              )}

              <hr className="tw-my-2" />
              <p>
                <span className="tw-font-semibold">Store:</span>{" "}
                {selectedSale.store_name}
              </p>
              {selectedSale.seller_name && (
                <p>
                  <span className="tw-font-semibold">Seller:</span>{" "}
                  {selectedSale.seller_name}
                </p>
              )}
              {selectedSale.notes && (
                <p>
                  <span className="tw-font-semibold">Notes:</span>{" "}
                  {selectedSale.notes}
                </p>
              )}
              <p>
                <span className="tw-font-semibold">Date:</span>{" "}
                {new Date(selectedSale.created_at).toLocaleString()}
              </p>

              {selectedSale.receipt_url && (
                <button
                  className="tw-mt-2 tw-text-sm tw-text-blue-600 hover:tw-underline"
                  onClick={() => viewReceipt(selectedSale)}
                >
                  📎 View Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──── Receipt Image Modal ──── */}
      {showReceiptModal && receiptUrl && (
        <div className="tw-fixed tw-inset-0 tw-bg-black/60 tw-flex tw-items-center tw-justify-center tw-z-[60]">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-4 tw-max-w-2xl tw-w-full tw-max-h-[90vh] tw-overflow-y-auto">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
              <h3 className="tw-text-lg tw-font-bold">Receipt</h3>
              <button
                className="tw-text-gray-500 hover:tw-text-gray-800 tw-text-xl"
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceiptUrl(null);
                }}
              >
                ✕
              </button>
            </div>
            <img
              src={receiptUrl}
              alt="Receipt"
              className="tw-w-full tw-rounded-lg tw-border"
            />
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
