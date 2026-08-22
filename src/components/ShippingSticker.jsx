
export default function ShippingSticker({ order }) {
  if (!order) return null;

  const handlePrint = () => window.print();

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #sticker-print-area, #sticker-print-area * { visibility: visible; }
          #sticker-print-area { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      <div id="sticker-print-area" className="border-2 border-dashed border-slate-400 rounded-lg p-5 bg-white text-slate-900">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2 mb-3">
          <div>
            <p className="font-extrabold text-lg leading-tight">UDHAYA AQUATICS</p>
            <p className="text-[10px] text-slate-500">Live Fish & Aquarium Shipping</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Order</p>
            <p className="font-bold text-blue-700">{order.orderId || order.id?.slice(0, 6)}</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Ship To</p>
          <p className="font-bold text-base">{order.customerName}</p>
          <p className="text-sm">{order.address || order.fullAddress}</p>
          <p className="text-sm">{order.city}, {order.state} - {order.pincode}</p>
          <p className="text-sm font-semibold">📱 {order.phone || order.mobileNumber}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-2">
          <p><span className="font-semibold">Courier:</span> {order.courierPartner || '—'}</p>
          <p><span className="font-semibold">Tracking:</span> {order.trackingId || '—'}</p>
          <p><span className="font-semibold">Box:</span> {order.boxType || order.boxChoice || '—'}</p>
          <p><span className="font-semibold">Oxygen:</span> {order.oxygenFilled ? 'Yes' : 'No'} | <span className="font-semibold">Double Bag:</span> {order.doubleBag ? 'Yes' : 'No'}</p>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-200 text-xs">
          <p className="font-semibold">Contents:</p>
          <p className="text-slate-600">{order.itemsSummary || (order.items && order.items.map((i) => `${i.varietyName} (${i.qty})`).join(', '))}</p>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">⚠ LIVE FISH — HANDLE WITH CARE — THIS SIDE UP</p>
      </div>

      <button
        onClick={handlePrint}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg shadow-sm transition-all print:hidden"
      >
        🖨️ Print Sticker
      </button>
    </div>
  );
}
