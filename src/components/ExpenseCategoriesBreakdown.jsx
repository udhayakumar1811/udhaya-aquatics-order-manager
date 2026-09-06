import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const CATEGORY_COLORS = {
  'Petrol / Travel': '#3b82f6',
  'Courier / Shipping': '#a855f7',
  'Stock Purchase': '#10b981',
  'Feed & Medicines': '#f59e0b',
  'Maintenance / Farm': '#06b6d4',
  'Other Expenses': '#64748b'
};

export default function ExpenseCategoriesBreakdown() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Group expenses by category
  const categoryMap = {};
  let totalOverallExpense = 0;

  expenses.forEach(exp => {
    const category = exp.category || exp.expenseCategory || 'Other Expenses';
    const amount = Number(exp.amount || 0);
    totalOverallExpense += amount;

    if (!categoryMap[category]) {
      categoryMap[category] = { totalAmount: 0, count: 0 };
    }
    categoryMap[category].totalAmount += amount;
    categoryMap[category].count += 1;
  });

  const sortedCategories = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      ...data,
      percentage: totalOverallExpense > 0 ? ((data.totalAmount / totalOverallExpense) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-sm" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Expense Categories Breakdown</h1>
          <p className="text-xs text-gray-500 mt-0.5">Analyze business expenditures categorized by Petrol, Courier, Stock Purchase, and more.</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">TOTAL EXPENSES</p>
          <p className="text-lg font-extrabold text-rose-600">₹{totalOverallExpense.toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">Loading expense analytics...</div>
      ) : sortedCategories.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">No expense records found for breakdown analysis.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Cards */}
          <div className="md:col-span-1 space-y-4">
            {sortedCategories.map((item, index) => {
              const color = CATEGORY_COLORS[item.category] || '#64748b';
              return (
                <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-xs flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">{item.count} record(s)</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-extrabold text-gray-900">₹{item.totalAmount.toLocaleString()}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-50 text-gray-600">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: color }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Table */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-800 text-xs uppercase tracking-wider">Detailed Expense Summary</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-4">CATEGORY</th>
                    <th className="py-3 px-4 text-center">TRANSACTIONS</th>
                    <th className="py-3 px-4 text-right">TOTAL SHARE (%)</th>
                    <th className="py-3 px-4 text-right">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {sortedCategories.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{item.category}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-gray-600">{item.count}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-500">{item.percentage}%</td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">₹{item.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}