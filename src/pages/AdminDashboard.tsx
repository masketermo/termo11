import React, { useState, useEffect, cloneElement, useMemo } from "react";
import { motion } from "motion/react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { ref, onValue, set, remove, push, update } from "firebase/database";
import { Product, Order, SiteSettings } from "../types";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Clock, 
  Truck, 
  XCircle,
  Eye,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Filter,
  Download,
  Calendar,
  Layers
} from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        navigate("/login-admin");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = () => {
    signOut(auth);
    navigate("/login-admin");
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold">Yükleniyor...</div>;

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-80 border-r border-slate-100 bg-white flex flex-col z-30 shadow-2xl shadow-slate-200/10">
        <div className="flex h-full flex-col p-10">
          <div className="mb-14 flex items-center gap-5">
            <div className="h-14 w-14 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-white font-black text-2xl italic shadow-2xl">M</div>
            <div>
              <h1 className="text-base font-black leading-none uppercase tracking-tighter text-slate-900 italic">Termo Admin</h1>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.3em] mt-1">ENGINE v5.0 LUX</p>
            </div>
          </div>

          <nav className="flex-1 space-y-3">
            <NavItem to="/admin" icon={<LayoutDashboard />} label="Dashboard Analiz" end />
            <NavItem to="/admin/orders" icon={<ShoppingBag />} label="Lojistik Havuzu" />
            <NavItem to="/admin/products" icon={<Package />} label="Envanter Sistemi" />
            <NavItem to="/admin/settings" icon={<Settings />} label="Sistem Ayarları" />
          </nav>

          <div className="pt-10 border-t border-slate-50">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-5 rounded-[1.5rem] px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              GÜVENLİ ÇIKIŞ
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-80 flex-1 flex flex-col min-h-screen">
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-12 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">
            {location.pathname === '/admin' ? 'Data Ops Center' : 
             location.pathname === '/admin/orders' ? 'Shipment Logistics' :
             location.pathname === '/admin/products' ? 'Inventory Grid' : 'System Core'}
          </h2>
          <div className="flex gap-4">
             <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center bg-slate-50">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             </div>
          </div>
        </header>

        <div className="p-8">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="orders" element={<OrdersManager />} />
            <Route path="products" element={<ProductsManager />} />
            <Route path="settings" element={<SettingsManager />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-5 rounded-[1.25rem] px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group",
        isActive ? "bg-slate-900 text-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)]" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {cloneElement(icon as React.ReactElement, { className: cn("h-5 w-5 transition-transform group-hover:scale-110", isActive && "text-indigo-400") })}
      {label}
      {isActive && (
        <motion.div layoutId="nav-pill" className="absolute left-0 w-1.5 h-full bg-indigo-500 rounded-r-full" />
      )}
    </Link>
  );
}

function Overview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    onValue(ref(db, "orders"), (s) => {
      if (s.exists()) {
        const data = s.val();
        setOrders(Object.keys(data).map(k => ({ id: k, ...data[k] })));
      }
    });
    onValue(ref(db, "products"), (s) => setProductsCount(s.exists() ? Object.keys(s.val()).length : 0));
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    const revenue = orders
      .filter(o => o.status === 'delivered' || o.status === 'shipped')
      .reduce((acc, current) => acc + (current.totalPrice || 0), 0);

    const successRate = total > 0 ? (delivered / (total - pending || 1)) * 100 : 0;

    return { total, pending, shipped, delivered, cancelled, revenue, successRate };
  }, [orders]);

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">OPERASYON MERKEZİ</h2>
          <p className="text-slate-400 font-bold mt-3 uppercase tracking-widest text-[10px]">Canlı Veri & Analitik Takip</p>
        </div>
        <div className="flex gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Net Ciro (Onaylı)" value={formatCurrency(stats.revenue)} icon={<DollarSign />} color="indigo" sub={`${stats.delivered} Başarılı Teslimat`} />
        <StatCard label="Bekleyen Sipariş" value={stats.pending} icon={<Clock />} color="amber" sub="Onay bekliyor" />
        <StatCard label="Kuryedeki Paket" value={stats.shipped} icon={<Truck />} color="blue" sub="Yolda olan kargolar" />
        <StatCard label="Verimlilik Skoru" value={`%${stats.successRate.toFixed(0)}`} icon={<TrendingUp />} color="emerald" sub="Teslimat/Red Oranı" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 -m-8 h-40 w-40 rounded-full bg-indigo-50/50 blur-3xl" />
           <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Layers className="h-5 w-5 text-indigo-600" /> Paket Döngü Analizi
           </h3>
           <div className="grid grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-colors">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                       <CheckCircle className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tamamlanan</span>
                 </div>
                 <p className="text-4xl font-black text-slate-900">{stats.delivered}</p>
                 <div className="mt-4 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.delivered / stats.total) * 100}%` }} className="h-full bg-emerald-500" />
                 </div>
              </div>
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-red-200 transition-colors">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                       <XCircle className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">İptal/Red</span>
                 </div>
                 <p className="text-4xl font-black text-slate-900">{stats.cancelled}</p>
                 <div className="mt-4 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.cancelled / stats.total) * 100}%` }} className="h-full bg-red-500" />
                 </div>
              </div>
           </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-slate-900 p-10 text-white shadow-2xl shadow-slate-200 flex flex-col justify-between">
           <div>
              <div className="mb-6 h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                 <TrendingUp className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black mb-4 leading-tight italic">Hızlı Komut<br/>Arayüzü</h3>
              <p className="text-slate-400 text-sm font-bold leading-relaxed mb-8">Mağaza dinamiklerini ve ürün listesini buradan güncelleyin.</p>
           </div>
           
           <div className="space-y-4">
              <Link to="/admin/products" className="flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                 <span className="font-bold text-xs uppercase tracking-widest">Envanter Ekle</span>
                 <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              </Link>
              <Link to="/admin/settings" className="flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                 <span className="font-bold text-xs uppercase tracking-widest">Sistem Yapılandır</span>
                 <Settings className="h-5 w-5 transition-transform group-hover:rotate-45" />
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }: any) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
      <div className={cn("mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", colors[color as keyof typeof colors])}>
        {cloneElement(icon, { className: "h-7 w-7" })}
      </div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      <p className="text-3xl font-black mt-2 text-slate-900 tracking-tighter">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-4 leading-none">{sub}</p>
    </div>
  );
}

function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all');

  useEffect(() => {
    onValue(ref(db, "orders"), (s) => {
      const data = s.val();
      if (data) {
        const sorted = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setOrders(sorted);
      }
    });
  }, []);

  const updateStatus = (id: string, status: Order['status']) => {
    update(ref(db, `orders/${id}`), { status });
  };

  const deleteOrder = (id: string) => {
    if (confirm("Siparişi silmek istediğinize emin misiniz?")) {
      remove(ref(db, `orders/${id}`));
    }
  };

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const stats = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Lojistik & Sevkiyat</h2>
          <p className="text-slate-400 font-bold mt-2">Kargo süreçlerini ve sipariş döngüsünü buradan yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
             <Download className="h-4 w-4" /> Rapor Al
           </button>
        </div>
      </div>

      {/* Modern High-End Filters */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-3xl border border-slate-100 shadow-sm w-max">
         <FilterTab active={filter === 'all'} onClick={() => setFilter('all')} label="Tümü" count={stats.all} />
         <FilterTab active={filter === 'pending'} onClick={() => setFilter('pending')} label="Onay Bekleyen" count={stats.pending} color="amber" />
         <FilterTab active={filter === 'shipped'} onClick={() => setFilter('shipped')} label="Yolda" count={stats.shipped} color="blue" />
         <FilterTab active={filter === 'delivered'} onClick={() => setFilter('delivered')} label="Teslim Edildi" count={stats.delivered} color="emerald" />
         <FilterTab active={filter === 'cancelled'} onClick={() => setFilter('cancelled')} label="İptal" count={stats.cancelled} color="red" />
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                <th className="px-10 py-6">Müşteri / ID</th>
                <th className="px-6 py-6">Paket</th>
                <th className="px-6 py-6">Konum</th>
                <th className="px-6 py-6">Tutar</th>
                <th className="px-6 py-6">Durum</th>
                <th className="px-10 py-6 text-right">Lojistik İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-6 text-slate-200">
                       <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-slate-200" />
                       </div>
                       <p className="font-black uppercase tracking-[0.3em] text-[10px]">Aktif veri bulunamadı</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/30 transition-all">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-900 shadow-sm group-hover:shadow-indigo-100 transition-shadow">
                          {order.customerName?.[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 tracking-tight text-base leading-tight">{order.customerName}</p>
                          <p className="text-xs font-bold text-indigo-600 mt-1">{order.phone}</p>
                          <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">#{order.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-8">
                       <p className="font-bold text-slate-600 leading-tight">{order.productName}</p>
                    </td>
                    <td className="px-6 py-8">
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          <p className="font-bold text-slate-900">{order.city}</p>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 mt-1">{order.district}</p>
                    </td>
                    <td className="px-6 py-8">
                      <div className="font-black text-slate-900 bg-slate-100 px-5 py-3 rounded-2xl text-center w-max shadow-inner-sm">
                        {formatCurrency(order.totalPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-8">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <StatusAction status="shipped" icon={<Truck />} onClick={() => updateStatus(order.id, 'shipped')} current={order.status} />
                        <StatusAction status="delivered" icon={<CheckCircle />} onClick={() => updateStatus(order.id, 'delivered')} current={order.status} />
                        <StatusAction status="cancelled" icon={<XCircle />} onClick={() => updateStatus(order.id, 'cancelled')} current={order.status} />
                        <div className="h-8 w-[1px] bg-slate-100 mx-2" />
                        <button onClick={() => deleteOrder(order.id)} className="p-3.5 text-slate-300 hover:bg-red-500 hover:text-white transition-all rounded-2xl shadow-sm"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, label, count, color }: any) {
  const colors = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    red: "text-red-600",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-3",
        active ? "bg-slate-900 text-white shadow-xl scale-[1.05]" : "text-slate-400 hover:bg-slate-50"
      )}
    >
      {label}
      <span className={cn(
        "px-2.5 py-1 rounded-lg text-[9px] font-black",
        active ? "bg-white/20 text-white" : cn("bg-slate-50", color ? colors[color as keyof typeof colors] : "text-slate-400 shadow-inner")
      )}>
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const config = {
    pending: { label: "Hattaki Bekleme", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100" },
    shipped: { label: "Sevkiyat Aşamasında", icon: Truck, color: "bg-blue-50 text-blue-600 border-blue-100" },
    delivered: { label: "Müşteride", icon: CheckCircle, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    cancelled: { label: "Reddedildi", icon: XCircle, color: "bg-red-50 text-red-600 border-red-100" },
  };
  const { label, icon: Icon, color } = config[status];
  return (
    <span className={cn("inline-flex items-center gap-3 rounded-2xl border px-5 py-3 text-[10px] font-black uppercase tracking-widest shadow-sm", color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function StatusAction({ status, icon, onClick, current }: any) {
  const variants = {
    shipped: "hover:bg-blue-600 hover:text-white text-blue-500",
    delivered: "hover:bg-emerald-600 hover:text-white text-emerald-500",
    cancelled: "hover:bg-red-600 hover:text-white text-red-500",
  };
  const isActive = current === status;

  return (
    <button
      onClick={onClick}
      disabled={isActive}
      className={cn(
        "p-3.5 rounded-2xl transition-all border border-slate-50 shadow-sm",
        isActive ? "opacity-20 cursor-not-allowed bg-slate-100" : cn("bg-white hover:shadow-xl hover:-translate-y-1", variants[status as keyof typeof variants])
      )}
    >
      {cloneElement(icon, { className: "h-4 w-4" })}
    </button>
  );
}

function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    onValue(ref(db, "products"), (s) => {
      const data = s.val();
      if (data) {
        setProducts(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      }
    });
  }, []);

  const deleteProduct = (id: string) => {
    if (confirm("Ürünü envanterden kalıcı olarak silmek istediğinize emin misiniz?")) {
      remove(ref(db, `products/${id}`));
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Envanter Entegrasyonu</h2>
          <p className="text-slate-400 font-bold mt-2">Ürün paketlerini, teknik detayları ve fiyatlandırmayı yönetin.</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-4 rounded-2xl bg-slate-900 px-8 py-4 text-xs font-black text-white hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 uppercase tracking-widest"
        >
          <Plus className="h-5 w-5" /> Yeni Üretim
        </button>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="group overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
            <div className="aspect-[4/3] bg-slate-50 overflow-hidden relative">
              <img src={p.image || undefined} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                 Stok: {p.stock}
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-black text-slate-900 text-lg tracking-tight line-clamp-1 italic">{p.name}</h3>
              <div className="flex items-baseline gap-3 mt-2">
                 <p className="text-2xl font-black text-indigo-600">{formatCurrency(p.price)}</p>
                 {p.oldPrice && <p className="text-xs font-bold text-slate-300 line-through">{formatCurrency(p.oldPrice)}</p>}
              </div>
              
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest transition-all hover:bg-slate-900 hover:text-white"
                >
                  <Edit className="h-4 w-4" /> Revize Et
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="flex items-center justify-center rounded-2xl bg-red-50 p-4 text-red-600 transition-all hover:bg-red-600 hover:text-white shadow-sm shadow-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: "",
      description: "",
      price: 0,
      oldPrice: 0,
      image: "",
      stock: 100,
    }
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productsRef = ref(db, "products");
    if (product) {
      update(ref(db, `products/${product.id}`), formData);
    } else {
      push(productsRef, formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl overflow-hidden rounded-[3.5rem] bg-white shadow-3xl">
        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          <div className="flex items-center justify-between">
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Teknik Ürün Tanımı</h3>
             <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 font-black text-xs">P</div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10">
             <div className="space-y-6">
                <div className={cn(
                  "relative aspect-square rounded-[2.5rem] border-2 border-dashed border-slate-100 flex items-center justify-center overflow-hidden bg-slate-50 transition-all hover:border-indigo-400 group shadow-inner",
                  formData.image && "border-none"
                )}>
                  {formData.image ? (
                    <img src={formData.image || undefined} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <div className="h-16 w-16 rounded-3xl bg-white flex items-center justify-center shadow-sm">
                         <Package className="h-8 w-8 transition-transform group-hover:scale-110" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Medya Ekle</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2 italic">Anlık Stok Miktarı</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>
             </div>

             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">Paket Başlığı</label>
                  <input
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">Teknik Detaylar</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">Net Fiyat</label>
                    <input
                      required
                      type="number"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={formData.price || ""}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">Eski Liste</label>
                    <input
                      type="number"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-300 focus:outline-none"
                      value={formData.oldPrice || ""}
                      onChange={e => setFormData({ ...formData, oldPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>
             </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 px-8 py-6 bg-slate-50 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all">Vazgeç</button>
            <button type="submit" className="flex-1 px-8 py-6 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95">Veriyi Sisteme İşle</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function SettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>({
    title: "Termo Maske",
    description: "",
    bannerTitle: "Yeni Nesil Termo Maske Konforu",
    bannerSubtitle: "Isı dengesi sağlayan özel dokusuyla mevsim geçişlerinde en yakın dostunuz.",
    phone: "+90 5xx xxx xx xx",
    whatsapp: "905xxxxxxxx",
    footerText: "",
    announcement: "SINIRLI SÜRE! TÜM ÜRÜNLERDE KARGO BEDAVA",
    announcementActive: true,
    heroImage: "",
    logo: "",
    brandColor: "#059669",
    bgColor: "#ffffff",
    featuresTitle: "Detaylarda Gizli Mükemmellik",
    featuresSubtitle: "Mühendislik",
    productsTitle: "İhtiyacınıza Uygun Seti Seçin",
    productsSubtitle: "Paket Seçimi",
    orderTitle: "Kapıda Ödeme Avantajıyla Güvenli Sipariş",
    orderSubtitle: "Son İşlem"
  });

  useEffect(() => {
    onValue(ref(db, "settings"), (s) => {
      if (s.exists()) setSettings(s.val());
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImage' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    set(ref(db, "settings"), settings);
    alert("Sistem yapılandırması başarıyla güncellendi.");
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">SİSTEM YAPILANDIRMASI</h2>
          <p className="text-slate-400 font-bold mt-2">Mağaza kimliğini ve kullanıcı deneyimini buradan kurgulayın.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-5xl space-y-12">
        {/* Branding & Logo */}
        <div className="rounded-[3rem] border border-slate-100 bg-white p-12 shadow-sm">
          <h3 className="mb-10 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 border-b border-slate-50 pb-4 italic">01. Kurumsal Kimlik</h3>
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 block mb-3">Sistem Logosu</label>
              <div className="relative group h-32 rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-100 flex items-center justify-center transition-all hover:border-indigo-400 shadow-inner">
                {settings.logo ? (
                  <img src={settings.logo || undefined} className="h-16 object-contain" />
                ) : (
                  <span className="text-slate-200 font-black text-[10px] tracking-widest italic">LOGO_MISSING</span>
                )}
                <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} />
                  <span className="text-white text-[10px] font-black uppercase tracking-widest bg-indigo-600 px-6 py-3 rounded-2xl">Logoyu Güncelle</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 block mb-3">Marka Tema Rengi</label>
              <div className="flex gap-6">
                <input
                  type="color"
                  className="h-32 w-32 cursor-pointer rounded-3xl border-4 border-slate-50 bg-slate-50 p-3 shadow-inner"
                  value={settings.brandColor || '#059669'}
                  onChange={e => setSettings({ ...settings, brandColor: e.target.value })}
                />
                <input
                  className="flex-1 rounded-3xl border border-slate-100 bg-slate-50 p-6 font-black text-lg focus:border-slate-900 focus:bg-white focus:outline-none transition-all h-32 tracking-widest text-slate-900 uppercase"
                  value={settings.brandColor || '#059669'}
                  onChange={e => setSettings({ ...settings, brandColor: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 block mb-3">Ana Sayfa Arka Plan</label>
              <div className="flex gap-6">
                <input
                  type="color"
                  className="h-32 w-32 cursor-pointer rounded-3xl border-4 border-slate-50 bg-slate-50 p-3 shadow-inner"
                  value={settings.bgColor || '#ffffff'}
                  onChange={e => setSettings({ ...settings, bgColor: e.target.value })}
                />
                <input
                  className="flex-1 rounded-3xl border border-slate-100 bg-slate-50 p-6 font-black text-lg focus:border-slate-900 focus:bg-white focus:outline-none transition-all h-32 tracking-widest text-slate-900 uppercase"
                  value={settings.bgColor || '#ffffff'}
                  onChange={e => setSettings({ ...settings, bgColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Control Button */}
        <button type="submit" className="w-full rounded-[2.5rem] bg-slate-900 py-10 text-[10px] font-black tracking-[0.5em] text-white hover:bg-indigo-600 transition-all shadow-[0_40px_80px_-20px_rgba(79,70,229,0.3)] active:scale-[0.98] uppercase">
          Sistem Verilerini Global Olarak Uygula
        </button>

        {/* Content Slots */}
        <div className="rounded-[3rem] border border-slate-100 bg-white p-12 shadow-sm space-y-16">
           <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 border-b-4 border-indigo-600 inline-block pb-1 italic">UX & ARAYÜZ KATMANI</h3>
           
           <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-8">
                <p className="text-[10px] font-black text-indigo-600 tracking-widest uppercase italic border-l-2 border-indigo-600 pl-4 leading-none">Hero Layout Config</p>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 ml-2">Manşet Başlığı</label>
                  <input className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all shadow-inner-sm text-slate-900" value={settings.bannerTitle} onChange={e => setSettings({ ...settings, bannerTitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 ml-2">Spot Metin</label>
                  <textarea rows={4} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all shadow-inner-sm text-slate-900" value={settings.bannerSubtitle} onChange={e => setSettings({ ...settings, bannerSubtitle: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-3 ml-2 italic">Ana Vitrin Görseli</label>
                <div className="relative group aspect-square rounded-[3.5rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-100 flex items-center justify-center shadow-inner transition-all hover:border-indigo-600">
                  {settings.heroImage ? (
                    <img src={settings.heroImage || undefined} className="h-full w-full object-cover" />
                  ) : (
                    <Eye className="h-14 w-14 text-slate-100" />
                  )}
                  <label className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'heroImage')} />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest bg-indigo-600 px-8 py-4 rounded-2xl shadow-xl">Yeni Görsel Tanımla</span>
                  </label>
                </div>
              </div>
           </div>

           <div className="pt-16 border-t border-slate-50 grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <p className="text-[10px] font-black text-indigo-600 tracking-widest uppercase italic border-l-2 border-indigo-600 pl-4 leading-none">İletişim & Network</p>
                <div className="space-y-4">
                   <input className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all" placeholder="WhatsApp (905...)" value={settings.whatsapp} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} />
                   <textarea rows={4} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all" placeholder="Footer Katman Metni" value={settings.footerText} onChange={e => setSettings({ ...settings, footerText: e.target.value })} />
                </div>
              </div>
              <div className="space-y-8">
                 <p className="text-[10px] font-black text-indigo-600 tracking-widest uppercase italic border-l-2 border-indigo-600 pl-4 leading-none">Global Sloganlar</p>
                 <div className="space-y-4">
                    <input className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all" placeholder="Katalog Başlığı" value={settings.productsTitle} onChange={e => setSettings({ ...settings, productsTitle: e.target.value })} />
                    <input className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-5 font-bold text-sm focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all" placeholder="Sipariş Havuzu Başlığı" value={settings.orderTitle} onChange={e => setSettings({ ...settings, orderTitle: e.target.value })} />
                 </div>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
}
