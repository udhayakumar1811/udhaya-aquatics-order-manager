import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function CustomerHistory() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      // Extract unique customers from orders
      const customerMap = new Map();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.mobileNumber && !customerMap.has(data.mobileNumber)) {
          customerMap.set(data.mobileNumber, {
            name: data.customerName,
            mobile: data.mobileNumber,
            address: data.fullAddress,
            city: data.city,
            pincode: data.pincode
          });
        }
      });
      setCustomers(Array.from(customerMap.values()));
    });
    return () => unsubscribe();
  }, []);

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(customers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "Udhaya_Aquatics_Customers.xlsx");
  };

  // Import from Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      try {
        for (let row of data) {
          await addDoc(collection(db, "orders"), {
            customerName: row.name || row.CustomerName || 'Unknown',
            mobileNumber: String(row.mobile || row.MobileNumber || ''),
            fullAddress: row.address || row.FullAddress || '',
            city: row.city || row.City || '',
            pincode: row.pincode || row.Pincode || '',
            fishVarietyName: 'Imported Customer',
            revenueTotal: 0,
            netProfit: 0,
            orderStatus: 'Imported',
            createdAt: new Date()
          });
        }
        alert('Customers imported successfully to Firebase!');
      } catch (err) {
        console.error(err);
        alert('Error importing file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer History ({customers.length})</h2>
          <p className="text-sm text-slate-500">Manage customer lists, export or import via Excel.</p>
        </div>
        <div className="flex gap-3">
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition">
            Import Excel (.xlsx)
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
          <button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            Export Excel (.xlsx)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider">
              <th className="p-3">Customer Name</th>
              <th className="p-3">Mobile Number</th>
              <th className="p-3">Address</th>
              <th className="p-3">City</th>
              <th className="p-3">PIN Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {customers.length > 0 ? (
              customers.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">{c.name}</td>
                  <td className="p-3 text-slate-600">{c.mobile}</td>
                  <td className="p-3 text-slate-600">{c.address}</td>
                  <td className="p-3 text-slate-600">{c.city}</td>
                  <td className="p-3 text-slate-600">{c.pincode}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-400">No customer records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}