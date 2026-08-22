"use client";

import { useEffect, useState } from "react";
import CreatorGuard from "../../../../components/CreatorGuard";

type PaymentSetting = {
  id: number;
  payment_method: string;
  qr_url: string | null;
  account_name: string | null;
  account_number: string | null;
  updated_at: string;
};

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<
    PaymentSetting[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] =
    useState<number | null>(null);

  const [uploadingId, setUploadingId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/creator/payment-settings",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Could not load payment settings."
        );
      }

      setSettings(result.settings ?? []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not load payment settings."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateSetting(
    id: number,
    field: keyof PaymentSetting,
    value: string
  ) {
    setSettings((current) =>
      current.map((setting) =>
        setting.id === id
          ? {
              ...setting,
              [field]: value,
            }
          : setting
      )
    );
  }

  async function uploadQr(
    setting: PaymentSetting,
    file: File
  ) {
    try {
      setUploadingId(setting.id);
      setMessage("");
      setError("");

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "payment_method",
        setting.payment_method
      );

      const response = await fetch(
        "/api/creator/payment-settings",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Could not upload QR image."
        );
      }

      setSettings((current) =>
        current.map((item) =>
          item.id === setting.id
            ? {
                ...item,
                qr_url: result.qr_url,
              }
            : item
        )
      );

      setMessage(
        `${setting.payment_method} QR image uploaded successfully.`
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not upload QR image."
      );
    } finally {
      setUploadingId(null);
    }
  }

  async function saveSetting(
    setting: PaymentSetting
  ) {
    try {
      setSavingId(setting.id);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/creator/payment-settings",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: setting.id,
            payment_method:
              setting.payment_method,
            qr_url: setting.qr_url,
            account_name:
              setting.account_name,
            account_number:
              setting.account_number,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Could not save payment settings."
        );
      }

      setMessage(
        `${setting.payment_method} settings saved successfully.`
      );

      await loadSettings();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not save payment settings."
      );
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await fetch(
          "/api/creator/payment-settings",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Could not load payment settings."
          );
        }

        setSettings(result.settings ?? []);
      } catch (error) {
        if (cancelled) return;

        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not load payment settings."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CreatorGuard>
      <main className="min-h-screen bg-black text-white px-4 py-24">
        <div className="max-w-4xl mx-auto">

          {/* Header */}

          <div className="mb-8">

            <a
              href="/creator"
              className="text-gray-400 hover:text-yellow-400 transition text-sm"
            >
              ← Back to Creator Studio
            </a>

            <h1 className="text-4xl font-bold text-yellow-400 mt-6">
              ⚙️ Manual Payment Settings
            </h1>

            <p className="text-gray-400 mt-2">
              Manage the payment QR codes and account
              information shown to readers.
            </p>

          </div>

          {/* Messages */}

          {error && (
            <div className="mb-6 bg-red-950 border border-red-500 text-red-300 rounded-xl p-4">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 bg-green-950 border border-green-500 text-green-300 rounded-xl p-4">
              {message}
            </div>
          )}

          {/* Loading */}

          {loading ? (

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-gray-400">
              Loading payment settings...
            </div>

          ) : (

            <div className="space-y-6">

              {settings.map((setting) => (

                <div
                  key={setting.id}
                  className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-6"
                >

                  {/* Payment method */}

                  <div className="mb-6">

                    <h2 className="text-2xl font-bold text-yellow-400">
                      💳 {setting.payment_method}
                    </h2>

                    <p className="text-gray-500 text-sm mt-1">
                      Payment information shown to readers.
                    </p>

                  </div>

                  {/* QR */}

                  <div className="mb-6">

                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      QR Code
                    </label>

                    {setting.qr_url && (

                      <div className="mb-4">

                        <div className="bg-white rounded-xl p-4 w-fit">

                          <img
                            src={setting.qr_url}
                            alt={`${setting.payment_method} QR Code`}
                            className="w-56 h-56 object-contain"
                          />

                        </div>

                      </div>

                    )}

                    <label
                      className={`inline-flex items-center justify-center px-5 py-3 rounded-xl font-bold transition cursor-pointer ${
                        uploadingId === setting.id
                          ? "bg-zinc-700 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >

                      {uploadingId === setting.id
                        ? "Uploading..."
                        : "📤 Change QR Image"}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={
                          uploadingId === setting.id
                        }
                        onChange={(e) => {
                          const file =
                            e.target.files?.[0];

                          if (!file) return;

                          uploadQr(
                            setting,
                            file
                          );

                          e.target.value = "";
                        }}
                      />

                    </label>

                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, or WEBP. Maximum 5 MB.
                    </p>

                  </div>

                  {/* Account name */}

                  <div className="mb-4">

                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Name
                    </label>

                    <input
                      type="text"
                      value={
                        setting.account_name ?? ""
                      }
                      onChange={(e) =>
                        updateSetting(
                          setting.id,
                          "account_name",
                          e.target.value
                        )
                      }
                      placeholder="Optional"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder:text-gray-600 outline-none focus:border-yellow-500 transition"
                    />

                  </div>

                  {/* Account number */}

                  <div className="mb-6">

                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Number
                    </label>

                    <input
                      type="text"
                      value={
                        setting.account_number ?? ""
                      }
                      onChange={(e) =>
                        updateSetting(
                          setting.id,
                          "account_number",
                          e.target.value
                        )
                      }
                      placeholder="Optional"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder:text-gray-600 outline-none focus:border-yellow-500 transition"
                    />

                  </div>

                  {/* Save */}

                  <div className="flex justify-end">

                    <button
                      type="button"
                      onClick={() =>
                        saveSetting(setting)
                      }
                      disabled={
                        savingId === setting.id
                      }
                      className="px-6 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
                    >
                      {savingId === setting.id
                        ? "Saving..."
                        : "💾 Save Changes"}
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>
      </main>
    </CreatorGuard>
  );
}