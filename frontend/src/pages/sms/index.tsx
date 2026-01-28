import { useEffect, useMemo, useState } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";

type SmsProvider = "twilio" | "africas_talking" | "custom";

type SmsSettings = {
  enabled: boolean;
  provider: SmsProvider;
  senderId: string;
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  testPhone: string;
  testMessage: string;
};

const STORAGE_KEY = "smsSettings";

const defaultSettings: SmsSettings = {
  enabled: false,
  provider: "custom",
  senderId: "",
  baseUrl: "",
  apiKey: "",
  apiSecret: "",
  testPhone: "",
  testMessage: "Hello from SMS settings test.",
};

function safeParseSettings(raw: string | null): SmsSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...(parsed as Partial<SmsSettings>) };
  } catch {
    return null;
  }
}

export default function SmsSettingsPage() {
  const [settings, setSettings] = useState<SmsSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = safeParseSettings(window.localStorage.getItem(STORAGE_KEY));
    if (saved) setSettings(saved);
  }, []);

  const canTest = useMemo(() => {
    return (
      settings.enabled &&
      Boolean(settings.testPhone.trim()) &&
      Boolean(settings.testMessage.trim())
    );
  }, [settings.enabled, settings.testPhone, settings.testMessage]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      alert("SMS settings saved");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    if (!canTest) {
      alert("Enable SMS and enter test phone/message");
      return;
    }

    // Design-only: integrate with backend/provider later.
    alert(
      `Test SMS queued\nTo: ${settings.testPhone}\nMessage: ${settings.testMessage}`,
    );
  };

  return (
    <AdminDashboardLayout>
      <DashboardCard title="SMS Settings">
        <div className="tw-max-w-3xl tw-space-y-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-p-4 tw-border tw-border-gray-200 tw-rounded-lg">
            <div>
              <div className="tw-font-semibold">Enable SMS</div>
              <div className="tw-text-sm tw-text-gray-600">
                Turn on/off sending SMS notifications.
              </div>
            </div>
            <label className="tw-inline-flex tw-items-center tw-cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) =>
                  setSettings({ ...settings, enabled: e.target.checked })
                }
                className="tw-sr-only"
              />
              <div
                className={
                  "tw-w-11 tw-h-6 tw-rounded-full tw-transition-colors " +
                  (settings.enabled ? "tw-bg-blue-600" : "tw-bg-gray-300")
                }
              >
                <div
                  className={
                    "tw-w-5 tw-h-5 tw-bg-white tw-rounded-full tw-shadow tw-transform tw-transition-transform tw-m-0.5 " +
                    (settings.enabled ? "tw-translate-x-5" : "tw-translate-x-0")
                  }
                />
              </div>
            </label>
          </div>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Provider
              </label>
              <select
                value={settings.provider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    provider: e.target.value as SmsProvider,
                  })
                }
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              >
                <option value="custom">Custom HTTP</option>
                <option value="twilio">Twilio</option>
                <option value="africas_talking">Africa's Talking</option>
              </select>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Sender ID
              </label>
              <input
                type="text"
                value={settings.senderId}
                onChange={(e) =>
                  setSettings({ ...settings, senderId: e.target.value })
                }
                placeholder="e.g. MyShop"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              />
            </div>

            <div className="md:tw-col-span-2">
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                Base URL
              </label>
              <input
                type="text"
                value={settings.baseUrl}
                onChange={(e) =>
                  setSettings({ ...settings, baseUrl: e.target.value })
                }
                placeholder="https://api.smsgateway.example/send"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              />
              <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
                Optional for now. This page currently stores settings only.
              </div>
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                API Key
              </label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings({ ...settings, apiKey: e.target.value })
                }
                placeholder="Enter API key"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                API Secret
              </label>
              <input
                type="password"
                value={settings.apiSecret}
                onChange={(e) =>
                  setSettings({ ...settings, apiSecret: e.target.value })
                }
                placeholder="Enter API secret"
                className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
            <div className="tw-font-semibold tw-mb-3">Test SMS</div>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                  Test Phone
                </label>
                <input
                  type="text"
                  value={settings.testPhone}
                  onChange={(e) =>
                    setSettings({ ...settings, testPhone: e.target.value })
                  }
                  placeholder="e.g. +2557xxxxxxxx"
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                />
              </div>

              <div className="md:tw-col-span-2">
                <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
                  Message
                </label>
                <textarea
                  value={settings.testMessage}
                  onChange={(e) =>
                    setSettings({ ...settings, testMessage: e.target.value })
                  }
                  rows={3}
                  className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-focus:outline-none tw-focus:ring-2 tw-focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="tw-flex tw-justify-end tw-mt-4">
              <button
                onClick={handleTest}
                disabled={!canTest}
                className="tw-px-4 tw-py-2 tw-bg-indigo-600 tw-text-white tw-rounded-md hover:tw-bg-indigo-700 disabled:tw-opacity-50"
              >
                Send Test
              </button>
            </div>
          </div>

          <div className="tw-flex tw-justify-end tw-gap-2">
            <button
              onClick={() => {
                setSettings(defaultSettings);
                window.localStorage.removeItem(STORAGE_KEY);
              }}
              className="tw-px-4 tw-py-2 tw-bg-gray-200 tw-text-gray-700 tw-rounded-md hover:tw-bg-gray-300"
              disabled={isSaving}
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-700 disabled:tw-opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </DashboardCard>
    </AdminDashboardLayout>
  );
}
