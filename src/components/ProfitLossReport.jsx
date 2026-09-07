import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export default function ProfitLossReport() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Month & Year selector (Default to current month & year)
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch orders
        const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        const ordersData = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);

        // Fetch general expenses
        const expensesSnap = await getDocs(query(collection(db, 'expenses'), orderBy('createdAt', 'desc')));
        const expensesData = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExpenses(expensesData);
      } catch (err) {
        console.error("Error loading P&L data:", err);
        showToast('Could not load data for P&L report.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter orders and expenses by selected Month and Year
  const filteredOrders = orders.filter(o => {
    const orderDateStr = o.date || (o.createdAt?.toDate ? o.createdAt.toDate().toISOString().split('T')[0] : '');
    if (!orderDateStr) return false;
    const [y, m] = orderDateStr.split('-');
    return y === selectedYear && m === selectedMonth;
  });

  const filteredExpenses = expenses.filter(e => {
    const expDateStr = e.date || (e.createdAt?.toDate ? e.createdAt.toDate().toISOString().split('T')[0] : '');
    if (!expDateStr) return false;
    const [y, m] = expDateStr.split('-');
    return y === selectedYear && m === selectedMonth;
  });

  // Calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.revenueTotal || o.billTotal || 0), 0);
  const totalShippingCollected = filteredOrders.reduce((sum, o) => sum + Number(o.shippingCharged || 0), 0);
  
  const totalFishCost = filteredOrders.reduce((sum, o) => {
    const itemsCost = o.items ? o.items.reduce((iSum, item) => iSum + (Number(item.costPrice || 0) * Number(item.qty || 1)), 0) : 0;
    return sum + itemsCost;
  }, 0);

  const totalActualCourier = filteredOrders.reduce((sum, o) => sum + Number(o.actualCourier || 0), 0);
  const totalPackingBoxCost = filteredOrders.reduce((sum, o) => sum + Number(o.packingBoxCost || 0), 0);

  const totalGeneralExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || e.expenseAmount || 0), 0);

  const totalBusinessExpenses = totalFishCost + totalActualCourier + totalPackingBoxCost + totalGeneralExpenses;
  const netProfit = totalRevenue - totalBusinessExpenses;

  // Print / PDF Download handler
  const handlePrintPdf = () => {
    window.print();
  };

  const monthsList = [
    { value: '01', label: 'January (ஜனவரி)' },
    { value: '02', label: 'February (பிப்ரவரி)' },
    { value: '03', label: 'March (மார்ச்)' },
    { value: '04', label: 'April (ஏப்ரல்)' },
    { value: '05', label: 'May (மே)' },
    { value: '06', label: 'June (ஜூன்)' },
    { value: '07', label: 'July (ஜூலை)' },
    { value: '08', label: 'August (ஆகஸ்ட்)' },
    { value: '09', label: 'September (செப்டம்பர்)' },
    { value: '10', label: 'October (அக்டோபர்)' },
    { value: '11', label: 'November (நவம்பர்)' },
    { value: '12', label: 'December (டிசம்பர்)' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-sm print:p-0 print:max-w-none" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Controls Header (Hidden in Print) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monthly Profit & Loss Statement (மாதாந்திர வருமான அறிக்கை)</h1>
          <p className="text-xs text-gray-500 mt-0.5">Generate and download net profit statements including fish sales, feed costs, courier expenses, and overheads.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs bg-white font-medium"
          >
            {monthsList.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs bg-white font-medium"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          <button
            onClick={handlePrintPdf}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📥 Download / Print PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading P&L data...</div>
      ) : (
        /* Printable P&L Sheet */
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 print:shadow-none print:border-none print:p-0">
          <div className="text-center border-b border-gray-200 pb-5 space-y-1">
            <h2 className="text-2xl font-extrabold text-blue-700">UDHAYA AQUATICS</h2>
            <p className="text-xs text-gray-500">Guppy Fish Farm Management & Sales Enterprise</p>
            <h3 className="text-base font-bold text-gray-800 mt-2">
              Profit & Loss Statement for {monthsList.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </h3>
            <p className="text-[11px] text-gray-400">Total Orders Processed: {filteredOrders.length}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total Revenue (வருமானம்)</p>
              <p className="text-2xl font-extrabold text-blue-800">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Includes fish sales & shipping collected</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Total Expenses (செலவுகள்)</p>
              <p className="text-2xl font-extrabold text-amber-800">₹{totalBusinessExpenses.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Fish production, courier & farm overheads</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Net Profit (நிகர லாபம்)</p>
              <p className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                ₹{netProfit.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-500">Final hand-in profit</p>
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Detailed Financial Breakdown</h4>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4">Category Description</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr>
                    <td className="py-3 px-4 font-medium">1. Gross Sales Revenue (மீன் & பொருட்கள் விற்பனை வருமானம்)</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">₹{totalRevenue.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">2. Fish Production Cost / COGS (மீன் உற்பத்தி / வாங்கிய விலை அடக்கவிலை)</td>
                    <td className="py-3 px-4 text-right text-rose-600">- ₹{totalFishCost.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">3. Actual Courier & Shipping Expense (உண்மையான கூரியர் செலவுகள்)</td>
                    <td className="py-3 px-4 text-right text-rose-600">- ₹{totalActualCourier.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">4. Packing Box Expenses (அட்டைப் பெட்டி & பேக்கிங் செலவுகள்)</td>
                    <td className="py-3 px-4 text-right text-rose-600">- ₹{totalPackingBoxCost.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">5. General Farm Expenses (தீவனம், மருந்துகள் மற்றும் பிற பண்ணை செலவுகள்)</td>
                    <td className="py-3 px-4 text-right text-rose-600">- ₹{totalGeneralExpenses.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-bold text-sm">
                    <td className="py-3.5 px-4">NET PROFIT (மாதாந்திர நிகர லாபம்)</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400">₹{netProfit.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-between text-xs text-gray-400">
            <p>Udhaya Aquatics Automated Order Management System</p>
            <p>Report Generated on: {newDateFormatted()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function newDateFormatted() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
}