import React from 'react';

export default function ReportsAnalytics() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Business Reports & Net Profit Analysis</h2>
        <p className="text-sm text-slate-500">Overview of sales, net profit, packing metrics, and data export.</p>
      </div>

      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-2">Local Data Backup & Restore</h3>
        <p className="text-xs text-slate-500 mb-4">Keep your order records safe by exporting database backups or Excel files regularly.</p>
        <button onClick={() => alert('Firebase real-time sync is already active across all devices!')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800">
          Sync Status: Active (Firebase Cloud)
        </button>
      </div>
    </div>
  );
}