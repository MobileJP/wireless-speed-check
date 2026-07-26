"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function SettingsContent() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refreshStatus() {
    const res = await fetch("/api/auth/status");
    const data = await res.json();
    setConnected(data.connected);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStatus();
    const error = searchParams.get("error");
    const wasConnected = searchParams.get("connected");
    if (error) setNotice(`Couldn't connect: ${error}`);
    else if (wasConnected) setNotice("Connected to Google Sheets.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function disconnect() {
    await fetch("/api/auth/disconnect", { method: "POST" });
    refreshStatus();
  }

  async function clearAllData() {
    if (!confirm("Delete all rooms and scans on this device? This can't be undone.")) return;
    await fetch("/api/data/clear", { method: "POST" });
    setNotice("All local data cleared.");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {notice && (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{notice}</p>
      )}

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-medium">Google Sheets</h2>
        <p className="mb-3 text-sm text-slate-600">
          {connected === null
            ? "Checking..."
            : connected
              ? "Connected — scans can be synced to your sheet."
              : "Not connected yet."}
        </p>
        {connected ? (
          <button
            onClick={disconnect}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium"
          >
            Disconnect
          </button>
        ) : (
          <a
            href="/api/auth/connect"
            className="inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Connect Google Sheets
          </a>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-medium">Local data</h2>
        <p className="mb-3 text-sm text-slate-600">
          Rooms and scans are stored on this machine, not in the cloud, until synced.
        </p>
        <button
          onClick={clearAllData}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700"
        >
          Clear all data
        </button>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
      <SettingsContent />
    </Suspense>
  );
}
