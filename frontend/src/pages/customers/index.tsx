import { useRef, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import {
  Column,
  ServerSideDataTable,
} from "src/components/ui/ServerSideDatatable";
import { columns, fetchCustomers, ReadCustomer, sendSms } from "./api";

export default function CustomersPage() {
  const tableRefKey = useRef(0);

  // Detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<ReadCustomer | null>(
    null,
  );

  // SMS modal
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsTargets, setSmsTargets] = useState<ReadCustomer[]>([]);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);

  // ── Open SMS modal for selected rows ──────────────────────────
  const openSmsForSelection = (rows: ReadCustomer[]) => {
    if (rows.length === 0) {
      alert("Select at least one customer first.");
      return;
    }
    setSmsTargets(rows);
    setSmsMessage("");
    setSmsResult(null);
    setShowSmsModal(true);
  };

  // ── Open SMS modal for a single customer ──────────────────────
  const openSmsForOne = (c: ReadCustomer) => {
    setSmsTargets([c]);
    setSmsMessage("");
    setSmsResult(null);
    setShowSmsModal(true);
  };

  // ── Send SMS ──────────────────────────────────────────────────
  const handleSendSms = async () => {
    if (!smsMessage.trim()) {
      alert("Enter a message.");
      return;
    }
    setSmsSending(true);
    try {
      // Collect all unique phones (primary + secondary if exists)
      const phones = Array.from(
        new Set(
          smsTargets.flatMap((c) =>
            [c.customer_phone, c.customer_secondary_phone].filter(Boolean),
          ),
        ),
      );
      const result = await sendSms(phones, smsMessage);
      setSmsResult({ sent: result.sent, failed: result.failed });
    } catch (err: any) {
      alert(err?.friendlyMessage || "Failed to send SMS");
    } finally {
      setSmsSending(false);
    }
  };

  // ── Table columns with actions ────────────────────────────────
  const actionColumns: Column<ReadCustomer>[] = [
    ...columns,
    {
      key: "customer_phone" as keyof ReadCustomer,
      label: "Actions",
      render: (_value: unknown, row: ReadCustomer) => (
        <div className="tw-flex tw-gap-2">
          <button
            className="tw-text-xs tw-text-blue-600 hover:tw-underline"
            onClick={() => setSelectedCustomer(row)}
          >
            View
          </button>
          <button
            className="tw-text-xs tw-text-green-600 hover:tw-underline"
            onClick={() => openSmsForOne(row)}
          >
            SMS
          </button>
        </div>
      ),
    } as Column<ReadCustomer>,
  ];

  return (
    <AdminDashboardLayout>
      <DashboardCard title="Customers">
        <ServerSideDataTable
          key={tableRefKey.current}
          columns={actionColumns}
          fetchData={fetchCustomers}
          onRowSelect={(rows) => setSmsTargets(rows as ReadCustomer[])}
          actions={(selectedRows) => (
            <button
              className="tw-flex tw-items-center tw-gap-1 tw-px-3 tw-py-1.5 tw-bg-green-600 tw-text-white tw-rounded-lg tw-text-sm hover:tw-bg-green-700 disabled:tw-opacity-50"
              disabled={selectedRows.length === 0}
              onClick={() =>
                openSmsForSelection(selectedRows as ReadCustomer[])
              }
            >
              📱 Send SMS ({selectedRows.length})
            </button>
          )}
        />
      </DashboardCard>

      {/* ── Detail Modal ─────────────────────────────────────────── */}
      {selectedCustomer && (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-mx-4 tw-max-h-[85vh] tw-overflow-y-auto">
            <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b">
              <h3 className="tw-text-lg tw-font-bold">Customer Details</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="tw-text-gray-400 hover:tw-text-gray-600 tw-text-2xl tw-leading-none"
              >
                ×
              </button>
            </div>
            <div className="tw-p-6 tw-space-y-3 tw-text-sm">
              <Row label="Name" value={selectedCustomer.customer_name} />
              <Row label="Phone" value={selectedCustomer.customer_phone} />
              <Row
                label="Alt Phone"
                value={selectedCustomer.customer_secondary_phone}
              />
              <Row
                label="Total Purchases"
                value={String(selectedCustomer.total_purchases)}
              />
              <Row
                label="Total Spent"
                value={Number(selectedCustomer.total_amount).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}
              />
              <Row
                label="Last Purchase"
                value={
                  selectedCustomer.last_purchase
                    ? new Date(
                        selectedCustomer.last_purchase,
                      ).toLocaleDateString()
                    : "—"
                }
              />
              <div className="tw-border-t tw-pt-3 tw-mt-3">
                <h4 className="tw-font-semibold tw-mb-2">Next of Kin</h4>
                <Row label="Name" value={selectedCustomer.next_of_kin_name} />
                <Row
                  label="Relationship"
                  value={selectedCustomer.next_of_kin_relationship}
                />
                <Row label="Phone" value={selectedCustomer.next_of_kin_phone} />
              </div>
            </div>
            <div className="tw-flex tw-justify-end tw-gap-2 tw-px-6 tw-py-4 tw-border-t">
              <button
                className="tw-px-4 tw-py-2 tw-text-sm tw-bg-green-600 tw-text-white tw-rounded-lg hover:tw-bg-green-700"
                onClick={() => {
                  openSmsForOne(selectedCustomer);
                  setSelectedCustomer(null);
                }}
              >
                📱 Send SMS
              </button>
              <button
                className="tw-px-4 tw-py-2 tw-text-sm tw-bg-gray-200 tw-rounded-lg hover:tw-bg-gray-300"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMS Modal ────────────────────────────────────────────── */}
      {showSmsModal && (
        <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-mx-4 tw-max-h-[85vh] tw-overflow-y-auto">
            <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b">
              <h3 className="tw-text-lg tw-font-bold">
                Send SMS to {smsTargets.length} customer
                {smsTargets.length > 1 ? "s" : ""}
              </h3>
              <button
                onClick={() => setShowSmsModal(false)}
                className="tw-text-gray-400 hover:tw-text-gray-600 tw-text-2xl tw-leading-none"
              >
                ×
              </button>
            </div>

            <div className="tw-p-6 tw-space-y-4">
              {/* Recipients list */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Recipients
                </label>
                <div className="tw-max-h-32 tw-overflow-y-auto tw-border tw-rounded-lg tw-p-2 tw-space-y-1">
                  {smsTargets.map((c, i) => (
                    <div
                      key={i}
                      className="tw-flex tw-items-center tw-justify-between tw-text-sm tw-px-2 tw-py-1 tw-bg-gray-50 tw-rounded"
                    >
                      <span className="tw-font-medium">{c.customer_name}</span>
                      <span className="tw-text-gray-500">
                        {c.customer_phone}
                        {c.customer_secondary_phone
                          ? `, ${c.customer_secondary_phone}`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message input */}
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="tw-w-full tw-border tw-rounded-lg tw-p-3 tw-text-sm focus:tw-ring-2 focus:tw-ring-green-500 focus:tw-border-green-500"
                  placeholder="Type your message here…"
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  maxLength={480}
                />
                <div className="tw-text-xs tw-text-gray-400 tw-text-right">
                  {smsMessage.length}/480
                </div>
              </div>

              {/* Result */}
              {smsResult && (
                <div
                  className={`tw-p-3 tw-rounded-lg tw-text-sm ${
                    smsResult.failed > 0
                      ? "tw-bg-yellow-50 tw-text-yellow-800"
                      : "tw-bg-green-50 tw-text-green-800"
                  }`}
                >
                  ✅ Sent: {smsResult.sent}
                  {smsResult.failed > 0 && (
                    <> &nbsp;|&nbsp; ❌ Failed: {smsResult.failed}</>
                  )}
                </div>
              )}
            </div>

            <div className="tw-flex tw-justify-end tw-gap-2 tw-px-6 tw-py-4 tw-border-t">
              <button
                className="tw-px-4 tw-py-2 tw-text-sm tw-bg-gray-200 tw-rounded-lg hover:tw-bg-gray-300"
                onClick={() => setShowSmsModal(false)}
              >
                Close
              </button>
              <button
                className="tw-px-4 tw-py-2 tw-text-sm tw-bg-green-600 tw-text-white tw-rounded-lg hover:tw-bg-green-700 disabled:tw-opacity-50"
                disabled={smsSending || !smsMessage.trim()}
                onClick={handleSendSms}
              >
                {smsSending ? "Sending…" : "Send SMS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}

/** Simple label/value row for the detail modal. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="tw-flex tw-justify-between">
      <span className="tw-text-gray-500">{label}</span>
      <span className="tw-font-medium">{value || "—"}</span>
    </div>
  );
}
