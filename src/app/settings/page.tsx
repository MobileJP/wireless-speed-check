"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notice, setNotice] = useState<string | null>(null);

  async function clearAllData() {
    if (!confirm("Delete all rooms and scans from the database? This can't be undone.")) return;
    await fetch("/api/data/clear", { method: "POST" });
    setNotice("All data cleared.");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {notice && (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{notice}</p>
      )}

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-medium">Data</h2>
        <p className="mb-3 text-sm text-slate-600">
          Rooms and scans are stored in your Postgres database. Use Export CSV on the
          History page to get a copy of everything.
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
