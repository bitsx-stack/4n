import { useEffect, useRef, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import { Modal } from "src/components/ui/Modal";
import { ServerSideDataTable } from "src/components/ui/ServerSideDatatable";

import {
  columns,
  fetchPurchases,
  PaymentStatus,
  ReadPurchase,
  updatePurchasePayment,
  updatePurchaseStatus,
} from "./api";

export default function PurchasesPage() {
  const tableRefKey = useRef<number>(0);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<ReadPurchase | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const [paymentForm, setPaymentForm] = useState<{
    total_price: string;
    paid_amount: string;
    payment_status: PaymentStatus;
  }>({ total_price: "0", paid_amount: "0", payment_status: "unpaid" });

  const load = async () => {
    await fetchPurchases({ page: 1, pageSize: 10 });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPaymentModal = (row: ReadPurchase) => {
    setError("");
    setSelectedPurchase(row);
    setPaymentForm({
      total_price: String(row.total_price ?? 0),
      paid_amount: String(row.paid_amount ?? 0),
      payment_status: (row.payment_status as PaymentStatus) || "unpaid",
    });
    setIsPaymentModalOpen(true);
  };

  const updatedColumns = [
    ...columns,
    {
      key: "actions",
      label: "Actions",
      render: (_value: unknown, row: ReadPurchase) => (
        <div className="tw-flex tw-gap-2">
          {String(row.status).toLowerCase() === "pending" ? (
            <button
              className="tw-px-3 tw-py-1 tw-bg-blue-600 tw-text-white tw-rounded hover:tw-bg-blue-700"
              onClick={async () => {
                try {
                  await updatePurchaseStatus(row.id, "completed");
                  tableRefKey.current += 1;
                } catch (e: any) {
                  alert(e?.response?.data?.detail || "Failed to update status");
                }
              }}
            >
              Mark Completed
            </button>
          ) : (
            <span className="tw-text-green-700 tw-font-semibold">
              Completed
            </span>
          )}

          <button
            className="tw-px-3 tw-py-1 tw-bg-gray-200 tw-text-gray-800 tw-rounded hover:tw-bg-gray-300"
            onClick={() => openPaymentModal(row)}
          >
            Payment
          </button>
        </div>
      ),
    },
  ] as any;

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedPurchase) return;

    const total = Number(paymentForm.total_price);
    const paid = Number(paymentForm.paid_amount);
    if (Number.isNaN(total) || total < 0)
      return setError("Invalid total price");
    if (Number.isNaN(paid) || paid < 0) return setError("Invalid paid amount");

    try {
      setIsSaving(true);
      await updatePurchasePayment(selectedPurchase.id, {
        total_price: total,
        paid_amount: paid,
        payment_status: paymentForm.payment_status,
      });
      setIsPaymentModalOpen(false);
      setSelectedPurchase(null);
      tableRefKey.current += 1;
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to update payment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPurchase(null);
          setError("");
        }}
        title="Update Purchase Payment"
      >
        <form onSubmit={handleSavePayment} className="tw-space-y-4">
          {error && (
            <div className="tw-p-3 tw-bg-red-100 tw-text-red-700 tw-rounded">
              {error}
            </div>
          )}

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Total Price
            </label>
            <input
              type="number"
              value={paymentForm.total_price}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, total_price: e.target.value })
              }
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md"
              disabled={isSaving}
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Paid Amount
            </label>
            <input
              type="number"
              value={paymentForm.paid_amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, paid_amount: e.target.value })
              }
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md"
              disabled={isSaving}
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
              Payment Status
            </label>
            <select
              value={paymentForm.payment_status}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  payment_status: e.target.value as PaymentStatus,
                })
              }
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md"
              disabled={isSaving}
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="tw-flex tw-gap-2 tw-justify-end">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="tw-px-4 tw-py-2 tw-bg-gray-300 tw-text-gray-700 tw-rounded-md hover:tw-bg-gray-400"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 disabled:tw-bg-blue-300"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <DashboardCard title="Purchases">
        <ServerSideDataTable
          key={tableRefKey.current}
          columns={updatedColumns}
          fetchData={fetchPurchases}
          title="Purchases"
          onRowSelect={(selected) => console.log("Selected:", selected)}
        />
      </DashboardCard>
    </AdminDashboardLayout>
  );
}
