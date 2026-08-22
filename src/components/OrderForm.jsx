import { useState } from 'react';
import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { generateOrderId } from '../utils/generateOrderId';
import { validateOrderForm, hasErrors } from '../utils/validation';
import { useToast } from '../context/ToastContext';

const emptyItem = () => ({
  itemType: 'Fish Variety',
  varietyName: '',
  sellingUnit: 'Pair (பேர்)',
  qty: 1,
  costPrice: 0,
  sellingPrice: 0,
});

export default function OrderForm({ mode = 'create', initialOrder = null, onDone, onCancel }) {
  const { showToast } = useToast();

  const [items, setItems] = useState(
    initialOrder?.items?.length ? initialOrder.items.map((i) => ({ ...i })) : [emptyItem()]
  );

  const [formData, setFormData] = useState({
    customerName: initialOrder?.customerName || '',
    mobileNumber: initialOrder?.mobileNumber || initialOrder?.phone || '',
    whatsappNumber: initialOrder?.whatsappNumber || '',
    fullAddress: initialOrder?.fullAddress || initialOrder?.address || '',
    city: initialOrder?.city || '',
    state: initialOrder?.state || 'Tamil Nadu',
    pincode: initialOrder?.pincode || '',
    shippingCharged: initialOrder?.shippingCharged ?? 0,
    actualCourier: initialOrder?.actualCourier ?? 0,
    packingBoxCost: initialOrder?.packingBoxCost ?? 0,
    courierPartner: initialOrder?.courierPartner || 'Professional Courier',
    trackingId: initialOrder?.trackingId || '',
    paymentMode: initialOrder?.paymentMode || 'UPI General',
    paymentStatus: initialOrder?.paymentStatus || 'Paid',
    orderStatus: initialOrder?.orderStatus || initialOrder?.status || 'Pending',
    boxChoice: initialOrder?.boxChoice || initialOrder?.boxType || 'Thermocol',
    oxygenFilled: initialOrder?.oxygenFilled ?? true,
    doubleBag: initialOrder?.doubleBag ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [name]: value };
    setItems(newItems);
  };

  const addFishItem = () => setItems([...items, emptyItem()]);
  const addComboItem = () =>
    setItems([...items, { ...emptyItem(), itemType: 'Combo / Offer Pack' }]);

  const removeItem = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const itemsRevenue = items.reduce((sum, item) => sum + Number(item.sellingPrice || 0) * Number(item.qty || 0), 0);
  const itemsCost = items.reduce((sum, item) => sum + Number(item.costPrice || 0) * Number(item.qty || 0), 0);
  const revenueTotal = itemsRevenue + Number(formData.shippingCharged || 0);
  const totalExpenses = itemsCost + Number(formData.actualCourier || 0) + Number(formData.packingBoxCost || 0);
  const netProfit = revenueTotal - totalExpenses;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateOrderForm(formData, items);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      const itemsSummary = items.map((i) => `${i.varietyName} (${i.qty})`).join(', ');
      const payload = {
        ...formData,
        mobileNumber: formData.mobileNumber.trim(),
        items,
        itemsSummary,
        revenueTotal,
        billTotal: revenueTotal,
        totalExpenses,
        netProfit,
        status: formData.orderStatus,
        boxType: formData.boxChoice,
        phone: formData.mobileNumber.trim(),
        address: formData.fullAddress,
      };

      if (mode === 'edit' && initialOrder?.id) {
        await updateDoc(doc(db, 'orders', initialOrder.id), payload);
        showToast('Order updated successfully.', 'success');
      } else {
        const orderId = await generateOrderId();
        await addDoc(collection(db, 'orders'), {
          ...payload,
          orderId,
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp(),
        });
        showToast(`Order ${orderId} registered successfully.`, 'success');
      }
      onDone && onDone();
    } catch (error) {
      console.error('Error saving order: ', error);
      showToast('Could not save the order. Please check your connection and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">1. CUSTOMER DETAILS (MANDATORY)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
            <input type="text" name="customerName" value={formData.customerName} onChange={handleFieldChange} placeholder="e.g. Kumar" className="w-full p-2 border rounded text-sm bg-white" />
            {errors.customerName && <p className="text-[11px] text-rose-600 mt-1">{errors.customerName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number *</label>
            <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleFieldChange} placeholder="e.g. 9876543210" className="w-full p-2 border rounded text-sm bg-white" />
            {errors.mobileNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.mobileNumber}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">WhatsApp Number</label>
            <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleFieldChange} placeholder="Same as mobile or different" className="w-full p-2 border rounded text-sm bg-white" />
            {errors.whatsappNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.whatsappNumber}</p>}
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Full Address *</label>
            <input type="text" name="fullAddress" value={formData.fullAddress} onChange={handleFieldChange} placeholder="Door No, Street Name, Landmark" className="w-full p-2 border rounded text-sm bg-white" />
            {errors.fullAddress && <p className="text-[11px] text-rose-600 mt-1">{errors.fullAddress}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">City / District *</label>
            <input type="text" name="city" value={formData.city} onChange={handleFieldChange} placeholder="e.g. Madurai" className="w-full p-2 border rounded text-sm bg-white" />
            {errors.city && <p className="text-[11px] text-rose-600 mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">State *</label>
            <input type="text" name="state" value={formData.state} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white" />
            {errors.state && <p className="text-[11px] text-rose-600 mt-1">{errors.state}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">PIN Code *</label>
            <input type="text" inputMode="numeric" name="pincode" value={formData.pincode} onChange={handleFieldChange} placeholder="e.g. 625001" className="w-full p-2 border rounded text-sm bg-white" />
            {errors.pincode && <p className="text-[11px] text-rose-600 mt-1">{errors.pincode}</p>}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-700 text-sm">2. ORDER ITEMS & PRODUCTION COST</h3>
          <div className="flex gap-2">
            <button type="button" onClick={addFishItem} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-lg text-xs font-semibold border border-blue-200 cursor-pointer">
              + Add Fish
            </button>
            <button type="button" onClick={addComboItem} className="bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1 rounded-lg text-xs font-semibold border border-purple-200 cursor-pointer">
              ✨ + Add Combo
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-slate-200 relative">
              <div className="flex justify-between items-center mb-2">
                <span className={`inline-block text-white text-[10px] font-bold px-2 py-0.5 rounded ${item.itemType === 'Combo / Offer Pack' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  ITEM #{index + 1} [{item.itemType.toUpperCase()}]
                </span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="text-rose-500 text-xs font-semibold hover:underline cursor-pointer">
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Item Type</label>
                  <select name="itemType" value={item.itemType} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border rounded text-sm bg-white">
                    <option value="Fish Variety">Fish Variety</option>
                    <option value="Combo / Offer Pack">Combo / Offer Pack</option>
                    <option value="Plants & Live Feeds">Plants & Live Feeds</option>
                    <option value="Aquarium Accessories">Aquarium Accessories</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Variety Name *</label>
                  <input type="text" name="varietyName" value={item.varietyName} onChange={(e) => handleItemChange(index, e)} placeholder="e.g. Full Red Guppy" className="w-full p-2 border rounded text-sm bg-white" />
                  {errors.items?.[index]?.varietyName && <p className="text-[11px] text-rose-600 mt-1">{errors.items[index].varietyName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Selling Unit</label>
                  <select name="sellingUnit" value={item.sellingUnit} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border rounded text-sm bg-white">
                    <option value="Pair (பேர்)">Pair (பேர்)</option>
                    <option value="Trio (ட்ரியோ - 1M+2F)">Trio (ட்ரியோ - 1M+2F)</option>
                    <option value="Male Only (ஆண்)">Male Only (ஆண்)</option>
                    <option value="Female Only (பெண்)">Female Only (பெண்)</option>
                    <option value="Piece / Set (எண்ணிக்கை)">Piece / Set (எண்ணிக்கை)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                  <input type="number" name="qty" min="1" value={item.qty} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border rounded text-sm bg-white" />
                  {errors.items?.[index]?.qty && <p className="text-[11px] text-rose-600 mt-1">{errors.items[index].qty}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-red-600 mb-1">Cost Price (₹)</label>
                  <input type="number" name="costPrice" min="0" value={item.costPrice} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border rounded text-sm bg-white" />
                  {errors.items?.[index]?.costPrice && <p className="text-[11px] text-rose-600 mt-1">{errors.items[index].costPrice}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-emerald-600 mb-1">Selling Price (₹)</label>
                  <input type="number" name="sellingPrice" min="0" value={item.sellingPrice} onChange={(e) => handleItemChange(index, e)} className="w-full p-2 border rounded text-sm bg-white" />
                  {errors.items?.[index]?.sellingPrice && <p className="text-[11px] text-rose-600 mt-1">{errors.items[index].sellingPrice}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">3. SHIPPING CHARGES & PACKING EXPENSES</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Shipping Charge Collected (₹)</label>
            <input type="number" min="0" name="shippingCharged" value={formData.shippingCharged} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Actual Courier Expense (₹)</label>
            <input type="number" min="0" name="actualCourier" value={formData.actualCourier} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Packing Box Expense (₹)</label>
            <input type="number" min="0" name="packingBoxCost" value={formData.packingBoxCost} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Courier Service Partner</label>
            <select name="courierPartner" value={formData.courierPartner} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white">
              <option value="Professional Courier">Professional Courier</option>
              <option value="ST Courier">ST Courier</option>
              <option value="DTDC Courier">DTDC Courier</option>
              <option value="Anchal">Anchal</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">Courier Tracking Number / ID</label>
            <input type="text" name="trackingId" value={formData.trackingId} onChange={handleFieldChange} placeholder="e.g. DT12345678IN" className="w-full p-2 border rounded text-sm bg-white" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">4. PAYMENT & ORDER PROGRESS STATUS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Payment Mode</label>
            <select name="paymentMode" value={formData.paymentMode} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white">
              <option value="UPI General">UPI General</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Payment Status</label>
            <select name="paymentStatus" value={formData.paymentStatus} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white">
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Order Status</label>
            <select name="orderStatus" value={formData.orderStatus} onChange={handleFieldChange} className="w-full p-2 border rounded text-sm bg-white">
              <option value="Pending">Pending</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">5. PACKING BOX CHOICE</h3>
        <div className="flex flex-wrap gap-6 items-center">
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer bg-white ${formData.boxChoice === 'Thermocol' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-300'}`}>
            <input type="radio" name="boxChoice" value="Thermocol" checked={formData.boxChoice === 'Thermocol'} onChange={handleFieldChange} />
            <span className="text-sm font-medium">📦 Thermocol</span>
          </label>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer bg-white ${formData.boxChoice === 'Cardboard' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-300'}`}>
            <input type="radio" name="boxChoice" value="Cardboard" checked={formData.boxChoice === 'Cardboard'} onChange={handleFieldChange} />
            <span className="text-sm font-medium">📦 Cardboard</span>
          </label>

          <div className="flex items-center gap-6 ml-auto">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" name="oxygenFilled" checked={formData.oxygenFilled} onChange={handleFieldChange} className="w-4 h-4 rounded text-blue-600" />
              Oxygen Filled
            </label>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" name="doubleBag" checked={formData.doubleBag} onChange={handleFieldChange} className="w-4 h-4 rounded text-blue-600" />
              Double Bag
            </label>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-8">
          <div>
            <p className="text-[11px] text-slate-400">Total Revenue Collected</p>
            <p className="text-lg font-bold text-white">₹{revenueTotal}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Total Expenses</p>
            <p className="text-lg font-bold text-amber-400">₹{totalExpenses}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Estimated Net Profit (நிகர லாபம்)</p>
            <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{netProfit}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition cursor-pointer">
              Cancel
            </button>
          )}
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition shadow cursor-pointer">
            {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save & Register Order'}
          </button>
        </div>
      </div>
    </form>
  );
}
