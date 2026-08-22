import { Suspense, lazy, useState } from 'react';
import Navbar from './components/Navbar';
import Modal from './components/Modal';
import OrderForm from './components/OrderForm';
import OrderDetailView from './components/OrderDetailView';
import ShippingSticker from './components/ShippingSticker';
import Login from './components/Login';
import { useAuth } from './context/AuthContext';

const Dashboard = lazy(() => import('./components/Dashboard'));
const NewOrder = lazy(() => import('./components/NewOrder'));
const OrdersList = lazy(() => import('./components/OrdersList'));
const CustomerHistory = lazy(() => import('./components/CustomerHistory'));
const ProductsCombos = lazy(() => import('./components/ProductsCombos'));
const ReportsAnalytics = lazy(() => import('./components/ReportsAnalytics'));

function TabLoading() {
  return <div className="text-center py-16 text-slate-400 text-sm">Loading...</div>;
}

export default function App() {
  const { user, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [stickerOrder, setStickerOrder] = useState(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="p-6 max-w-7xl mx-auto">
        <Suspense fallback={<TabLoading />}>
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'new-order' && <NewOrder setActiveTab={setActiveTab} />}
          {activeTab === 'orders-list' && (
            <OrdersList
              onEditOrder={setEditingOrder}
              onViewOrder={setViewingOrder}
              onOpenSticker={setStickerOrder}
            />
          )}
          {activeTab === 'customer-history' && <CustomerHistory />}
          {activeTab === 'products-combos' && <ProductsCombos />}
          {activeTab === 'reports-analytics' && <ReportsAnalytics />}
        </Suspense>
      </main>

      {editingOrder && (
        <Modal title={`Edit Order ${editingOrder.orderId || ''}`} onClose={() => setEditingOrder(null)}>
          <OrderForm mode="edit" initialOrder={editingOrder} onDone={() => setEditingOrder(null)} onCancel={() => setEditingOrder(null)} />
        </Modal>
      )}

      {viewingOrder && (
        <Modal title="Order Details" onClose={() => setViewingOrder(null)}>
          <OrderDetailView order={viewingOrder} />
        </Modal>
      )}

      {stickerOrder && (
        <Modal title="Shipping Sticker" onClose={() => setStickerOrder(null)} widthClass="max-w-md">
          <ShippingSticker order={stickerOrder} />
        </Modal>
      )}
    </div>
  );
}
