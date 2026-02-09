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

function derivePaymentStatus(
  totalPrice: number,
  paidAmount: number,
): PaymentStatus {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= totalPrice) return "paid";
  return "partial";
}

export default function PurchasesPage() {
  const tableRefKey = useRef<number>(0);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<ReadPurchase | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  const [paymentForm, setPaymentForm] = useState<{
    total_price: string;
    paid_amount: string;
    payment_status: PaymentStatus;
  }>({ total_price: "0", paid_amount: "0", payment_status: "unpaid" });

  const refreshTable = () => {
    tableRefKey.current += 1;
    // Force re-render by using a state update
    setIsCompleting(null);
  };

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
    const total = Number(row.total_price ?? 0);
    const paid = Number(row.paid_amount ?? 0);
    setPaymentForm({
      total_price: String(total),
      paid_amount: String(paid),
      payment_status: derivePaymentStatus(total, paid),
    });
    setIsPaymentModalOpen(true);
  };

  const handleMarkCompleted = async (row: ReadPurchase) => {
    try {
      setIsCompleting(row.id);
      // Mark the purchase as completed — backend should update inventory/stock
      await updatePurchaseStatus(row.id, "completed");
      refreshTable();
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to update status and stock");
    } finally {
      setIsCompleting(null);
    }
  };

  const updatedColumns = [
    ...columns,
    {
      key: "actions",
      label: "Actions",
      render: (_value: unknown, row: ReadPurchase) => (
        <div className="tw-flex tw-gap-2 tw-items-center">
          {String(row.status).toLowerCase() === "pending" ? (
            <button
              className="tw-px-3 tw-py-1 tw-bg-blue-600 tw-text-white tw-rounded hover:tw-bg-blue-700 disabled:tw-bg-blue-300"
              disabled={isCompleting === row.id}
              onClick={() => handleMarkCompleted(row)}
            >
              {isCompleting === row.id ? "Updating..." : "Mark Completed"}
            </button>
          ) : (
            <span className="tw-text-green-700 tw-font-semibold">
              ✓ Completed
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

  // Auto-derive payment status and auto-complete status when paid_amount or total_price changes
  const handlePaymentFormChange = (
    field: "total_price" | "paid_amount",
    value: string,
  ) => {
    const updatedForm = { ...paymentForm, [field]: value };
    const total = Number(updatedForm.total_price);
    const paid = Number(updatedForm.paid_amount);

    // Prevent paid amount from exceeding total price
    if (
      field === "paid_amount" &&
      !Number.isNaN(total) &&
      !Number.isNaN(paid) &&
      paid > total
    ) {
      updatedForm.paid_amount = updatedForm.total_price;
    }

    const finalTotal = Number(updatedForm.total_price);
    const finalPaid = Number(updatedForm.paid_amount);

    if (!Number.isNaN(finalTotal) && !Number.isNaN(finalPaid)) {
      updatedForm.payment_status = derivePaymentStatus(finalTotal, finalPaid);
    }

    setPaymentForm(updatedForm);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedPurchase) return;

    const total = Number(paymentForm.total_price);
    const paid = Number(paymentForm.paid_amount);
    if (Number.isNaN(total) || total < 0)
      return setError("Invalid total price");
    if (Number.isNaN(paid) || paid < 0) return setError("Invalid paid amount");
    if (paid > total)
      return setError("Paid amount cannot be greater than total price");

    const derivedStatus = derivePaymentStatus(total, paid);

    try {
      setIsSaving(true);

      // Update the payment details
      await updatePurchasePayment(selectedPurchase.id, {
        total_price: total,
        paid_amount: paid,
        payment_status: derivedStatus,
      });

      // If fully paid, also mark the purchase as completed (updates stock/inventory)
      if (
        derivedStatus === "paid" &&
        String(selectedPurchase.status).toLowerCase() === "pending"
      ) {
        try {
          await updatePurchaseStatus(selectedPurchase.id, "completed");
        } catch {
          // Payment saved but status update failed — still close modal and refresh
        }
      }

      setIsPaymentModalOpen(false);
      setSelectedPurchase(null);
      refreshTable();
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
                handlePaymentFormChange("total_price", e.target.value)
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
                handlePaymentFormChange("paid_amount", e.target.value)
              }
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md"
              disabled={isSaving}
              min={0}
              max={Number(paymentForm.total_price) || 0}
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
              className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-bg-gray-100"
              disabled
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              Auto-calculated:{" "}
              {paymentForm.payment_status === "paid"
                ? "Fully paid — status will be marked as Completed"
                : paymentForm.payment_status === "partial"
                  ? "Partially paid"
                  : "No payment received"}
            </p>
          </div>

          <div className="tw-flex tw-gap-2 tw-justify-end">
            <button
              type="button"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setSelectedPurchase(null);
                setError("");
              }}
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
