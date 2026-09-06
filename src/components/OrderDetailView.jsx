import { useState } from 'react';

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

  const handleWhatsAppShare = () => {
    const phone = order.whatsappNumber || order.phone || order.mobileNumber || '';
    // Format phone number (remove non-numeric characters)
    const cleanPhone = phone.replace(/\D/g, '');
    
    let itemsText = '';
    if (order.items && order.items.length > 0) {
      itemsText = order.items.map((item, idx) => 
        `\n${idx + 1}. *${item.varietyName}* (${item.itemType}) - Qty: ${item.qty} - ₹${item.sellingPrice}`
      ).join('');
    }

    const message = `Hello *${order.customerName || 'Customer'}*! 👋\n` +
      `Thank you for your order with *Udhaya Aquatics*! 🐟\n\n` +
      `📦 *Order ID:* ${order.orderId || order.id?.slice(0, 6)}\n` +
      `📅 *Date:* ${order.date || '—'}\n` +
      `🚚 *Courier:* ${order.courierPartner || '—'} (${order.trackingId || 'Pending'})\n` +
      `📦 *Box Type:* ${order.boxType || order.boxChoice || '—'}\n` +
      `-----------------------------------\n` +
      `🛒 *Ordered Items:*${itemsText}\n` +
      `-----------------------------------\n` +
      `💰 *Total Amount:* ₹${order.revenueTotal || order.billTotal || 0}\n` +
      `💳 *Payment Status:* ${order.paymentStatus || 'Paid'}\n\n` +
      `For any queries, feel free to contact us. Have a great day! ✨`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <p className="text-xs text-slate-400">Order ID</p>
          <p className="font-bold text-blue-600 text-lg">{order.orderId || order.id?.slice(0, 6)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleWhatsAppShare}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>💬 Share WhatsApp Invoice</span>
          </button>
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