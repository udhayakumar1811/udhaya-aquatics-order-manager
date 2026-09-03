
function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800 text-right">{value ?? '—'}</span>
    </div>
  );
}

export default function OrderDetailView({ order }) {
  if (!order) return null;
  const status = order.status || order.orderStatus || 'Pending';

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <p className="text-xs text-slate-400">Order ID</p>
          <p className="font-bold text-blue-600 text-lg">{order.orderId || order.id?.slice(0, 6)}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'Delivered'
              ? 'bg-emerald-50 text-emerald-600'
              : status === 'Shipped'
              ? 'bg-purple-50 text-purple-600'
              : status === 'Packed'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer</h4>
          <Row label="Name" value={order.customerName} />
          <Row label="Mobile" value={order.phone || order.mobileNumber} />
          <Row label="WhatsApp" value={order.whatsappNumber} />
          <Row label="Address" value={order.address || order.fullAddress} />
          <Row label="City" value={order.city} />
          <Row label="State" value={order.state} />
          <Row label="PIN Code" value={order.pincode} />
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shipping</h4>
          <Row label="Courier" value={order.courierPartner} />
          <Row label="Tracking ID" value={order.trackingId} />
          <Row label="Box" value={order.boxType || order.boxChoice} />
          <Row label="Oxygen Filled" value={order.oxygenFilled ? 'Yes' : 'No'} />
          <Row label="Double Bag" value={order.doubleBag ? 'Yes' : 'No'} />
          <Row label="Payment Mode" value={order.paymentMode} />
          <Row label="Payment Status" value={order.paymentStatus} />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Items</h4>
        <div className="border border-slate-100 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase">
                <th className="text-left py-2 px-3">Item</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-right py-2 px-3">Qty</th>
                <th className="text-right py-2 px-3">Cost</th>
                <th className="text-right py-2 px-3">Selling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(order.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="py-2 px-3 font-medium text-slate-800">{item.varietyName}</td>
                  <td className="py-2 px-3 text-slate-500">{item.itemType}</td>
                  <td className="py-2 px-3 text-right">{item.qty}</td>
                  <td className="py-2 px-3 text-right">₹{item.costPrice}</td>
                  <td className="py-2 px-3 text-right font-semibold">₹{item.sellingPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap gap-6">
        <div>
          <p className="text-[11px] text-slate-400">Revenue Total</p>
          <p className="font-bold">₹{order.revenueTotal || order.billTotal || 0}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Total Expenses</p>
          <p className="font-bold text-amber-400">₹{order.totalExpenses || 0}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Net Profit</p>
          <p className={`font-bold ${(order.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{order.netProfit || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
