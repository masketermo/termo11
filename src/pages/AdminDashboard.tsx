import React, { useState, useEffect, cloneElement } from "react";
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
  Eye
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
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xl italic">T</div>
            <div>
              <h1 className="text-sm font-black leading-tight uppercase">Termo Maske</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Yönetim Paneli</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <NavItem to="/admin" icon={<LayoutDashboard />} label="Dashboard" end />
            <NavItem to="/admin/orders" icon={<ShoppingBag />} label="Sipariş Takibi" />
            <NavItem to="/admin/products" icon={<Package />} label="Ürün Yönetimi" />
            <NavItem to="/admin/settings" icon={<Settings />} label="Site Ayarları" />
          </nav>

          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">
            {location.pathname === '/admin' ? 'Genel Bakış' : 
             location.pathname === '/admin/orders' ? 'Siparişler' :
             location.pathname === '/admin/products' ? 'Ürünler' : 'Ayarlar'}
          </h2>
          <div className="flex gap-4">
            <Link to="/admin/products" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              + Yeni Ürün Ekle
            </Link>
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
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
        isActive ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
      {label}
    </Link>
  );
}

function Overview() {
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0 });

  useEffect(() => {
    onValue(ref(db, "orders"), (s) => setStats(prev => ({ ...prev, orders: s.exists() ? Object.keys(s.val()).length : 0 })));
    onValue(ref(db, "products"), (s) => setStats(prev => ({ ...prev, products: s.exists() ? Object.keys(s.val()).length : 0 })));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black">Genel Bakış</h2>
        <p className="text-stone-400">Mağazanızın durumunu buradan takip edebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Toplam Sipariş" value={stats.orders} icon={<ShoppingBag />} color="emerald" />
        <StatCard label="Aktif Ürün" value={stats.products} icon={<Package />} color="blue" />
        <StatCard label="Bugünkü Trafik" value="1.2k" icon={<Eye />} color="orange" />
      </div>

      <div className="rounded-[2rem] border border-stone-200 bg-white p-8">
        <h3 className="mb-6 text-xl font-bold">Hızlı İşlemler</h3>
        <div className="flex gap-4">
          <Link to="/admin/products" className="flex items-center gap-2 rounded-2xl bg-stone-100 px-6 py-4 font-bold transition-colors hover:bg-stone-200">
            <Plus className="h-5 w-5" /> Yeni Ürün Ekle
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-2 rounded-2xl bg-stone-100 px-6 py-4 font-bold transition-colors hover:bg-stone-200">
            <Settings className="h-5 w-5" /> Siteyi Düzenle
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colors = {
    emerald: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl", colors[color as keyof typeof colors])}>
        {cloneElement(icon, { className: "h-6 w-6" })}
      </div>
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
    </div>
  );
}

function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Sipariş Yönetimi</h2>
        <p className="text-sm text-slate-500">Gelen tüm siparişleri buradan yönetebilirsiniz.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100">
              <th className="px-8 py-4">Müşteri</th>
              <th className="px-6 py-4">Ürün</th>
              <th className="px-6 py-4">Tutar</th>
              <th className="px-6 py-4">Durum</th>
              <th className="px-8 py-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-semibold text-slate-900">{order.customerName}</p>
                  <p className="text-xs text-slate-400">{order.phone}</p>
                </td>
                <td className="px-6 py-5 font-medium text-slate-700">{order.productName}</td>
                <td className="px-6 py-5 font-bold text-indigo-600">{formatCurrency(order.totalPrice)}</td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    order.status === 'pending' ? "bg-amber-100 text-amber-700" :
                    order.status === 'shipped' ? "bg-blue-100 text-blue-700" :
                    order.status === 'delivered' ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {order.status === 'pending' && <Clock className="h-3 w-3" />}
                    {order.status === 'shipped' && <Truck className="h-3 w-3" />}
                    {order.status === 'delivered' && <CheckCircle className="h-3 w-3" />}
                    {order.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                    {order.status === 'pending' ? "Hazırlanıyor" :
                     order.status === 'shipped' ? "Kargoda" :
                     order.status === 'delivered' ? "Teslim Edildi" : "İptal"}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => updateStatus(order.id, 'shipped')} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Truck className="h-5 w-5" /></button>
                    <button onClick={() => updateStatus(order.id, 'delivered')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><CheckCircle className="h-5 w-5" /></button>
                    <button onClick={() => deleteOrder(order.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
    if (confirm("Ürünü silmek istediğinize emin misiniz?")) {
      remove(ref(db, `products/${id}`));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ürün Yönetimi</h2>
          <p className="text-sm text-slate-500">Ürünlerinizi, fiyatlarınızı ve görsellerinizi güncelleyin.</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> Yeni Ürün
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-square bg-slate-50">
              <img src={p.image} className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-900 line-clamp-1">{p.name}</h3>
              <p className="text-xl font-black text-indigo-600 mt-1">{formatCurrency(p.price)}</p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-50 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Edit className="h-3.5 w-3.5" /> Düzenle
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="flex items-center justify-center rounded-lg bg-red-50 p-2.5 text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h3 className="text-xl font-bold text-slate-800">{product ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h3>
          
          <div className="space-y-4">
            <div className={cn(
              "relative aspect-video rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 transition-colors hover:border-indigo-300",
              formData.image && "border-none"
            )}>
              {formData.image ? (
                <img src={formData.image} className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Package className="h-8 w-8" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Görsel Seçin</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ürün Başlığı</label>
              <input
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Açıklama</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fiyat (₺)</label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={formData.price || ""}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Eski Fiyat (₺)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={formData.oldPrice || ""}
                  onChange={e => setFormData({ ...formData, oldPrice: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">Vazgeç</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">Kaydet</button>
          </div>
        </form>
      </div>
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
    brandColor: "#4f46e5",
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
    alert("Ayarlar başarıyla güncellendi.");
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black italic uppercase">Site Mimarisi</h2>
          <p className="text-stone-400">Marka kimliğini ve sayfa metinlerini tek noktadan yönetin.</p>
        </div>
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center p-2 border border-slate-100">
             <div className="h-full w-full rounded-lg" style={{ backgroundColor: settings.brandColor || '#4f46e5' }} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-4xl space-y-8">
        {/* Branding & Logo */}
        <div className="rounded-[2.5rem] border border-stone-200 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-4 italic">Branding (Marka)</h3>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 block mb-2">Kurumsal Logo (PNG/SVG Tavsiye Edilir)</label>
              <div className="relative group h-24 rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                {settings.logo ? (
                  <img src={settings.logo} className="h-12 object-contain" />
                ) : (
                  <span className="text-slate-300 font-bold">Logo Yok</span>
                )}
                <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} />
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Logo Güncelle</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 block mb-2">Marka Rengi</label>
              <div className="flex gap-4">
                <input
                  type="color"
                  className="h-24 w-24 cursor-pointer rounded-2xl border-2 border-slate-100 bg-slate-50 p-1"
                  value={settings.brandColor || '#4f46e5'}
                  onChange={e => setSettings({ ...settings, brandColor: e.target.value })}
                />
                <input
                  className="flex-1 rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all h-24"
                  value={settings.brandColor || '#4f46e5'}
                  onChange={e => setSettings({ ...settings, brandColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Announcement Bar Settings */}
        <div className="rounded-[2.5rem] border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Üst Duyuru Barı</h3>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, announcementActive: !settings.announcementActive })}
              className={cn(
                "h-7 w-14 rounded-full transition-all relative",
                settings.announcementActive ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white transition-all shadow-sm",
                settings.announcementActive ? "left-8" : "left-1"
              )} />
            </button>
          </div>
          
          <div className="grid gap-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Duyuru Metni (Kayar Yazı)</label>
            <input
              className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
              value={settings.announcement}
              onChange={e => setSettings({ ...settings, announcement: e.target.value })}
            />
          </div>
        </div>

        {/* Page Content Editor */}
        <div className="rounded-[3rem] border border-slate-200 bg-white p-10 shadow-sm space-y-12">
           <h3 className="text-lg font-black uppercase italic tracking-widest text-slate-900 border-b-2 border-indigo-600 inline-block pb-1">Sayfa İçerik Editörü</h3>
           
           {/* Hero */}
           <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <p className="text-xs font-black text-indigo-600 italic">01. ANA GİRİŞ (HERO)</p>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Büyük Başlık</label>
                  <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all" value={settings.bannerTitle} onChange={e => setSettings({ ...settings, bannerTitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Açıklama</label>
                  <textarea rows={3} className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all" value={settings.bannerSubtitle} onChange={e => setSettings({ ...settings, bannerSubtitle: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Hero Görseli</label>
                <div className="relative group aspect-square rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                  {settings.heroImage ? (
                    <img src={settings.heroImage} className="h-full w-full object-cover" />
                  ) : (
                    <Eye className="h-10 w-10 text-slate-200" />
                  )}
                  <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'heroImage')} />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Görsel Seç</span>
                  </label>
                </div>
              </div>
           </div>

           {/* Features */}
           <div className="pt-8 border-t border-slate-100 space-y-6">
              <p className="text-xs font-black text-indigo-600 italic">02. ÖZELLİKLER BÖLÜMÜ</p>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Bölüm Üst Yazı</label>
                  <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all" value={settings.featuresSubtitle} onChange={e => setSettings({ ...settings, featuresSubtitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Ana Başlık</label>
                  <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all" value={settings.featuresTitle} onChange={e => setSettings({ ...settings, featuresTitle: e.target.value })} />
                </div>
              </div>
           </div>

           {/* Products */}
           <div className="pt-8 border-t border-slate-100 space-y-6">
              <p className="text-xs font-black text-indigo-600 italic">03. ÜRÜN/PAKET SEÇİMİ</p>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Bölüm Üst Yazı</label>
                  <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all" value={settings.productsSubtitle} onChange={e => setSettings({ ...settings, productsSubtitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Ana Başlık</label>
                  <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all" value={settings.productsTitle} onChange={e => setSettings({ ...settings, productsTitle: e.target.value })} />
                </div>
              </div>
           </div>

           {/* Order */}
           <div className="pt-8 border-t border-slate-100 space-y-6">
              <p className="text-xs font-black text-indigo-600 italic">04. SİPARİŞ FORMU</p>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Bölüm Üst Yazı</label>
                  <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all" value={settings.orderSubtitle} onChange={e => setSettings({ ...settings, orderSubtitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Ana Başlık</label>
                  <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all" value={settings.orderTitle} onChange={e => setSettings({ ...settings, orderTitle: e.target.value })} />
                </div>
              </div>
           </div>
        </div>

        {/* Global Settings */}
        <div className="rounded-[2.5rem] border border-stone-200 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-4">İletişim Bilgileri</h3>
          <div className="grid gap-6">
             <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 block mb-2">Firma / Marka Adı</label>
              <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-stone-900 focus:bg-white transition-all" value={settings.title} onChange={e => setSettings({ ...settings, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 block mb-2">İletişim Tel</label>
                <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-stone-900 focus:bg-white transition-all" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 block mb-2">WhatsApp No</label>
                <input className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-stone-900 focus:bg-white transition-all" value={settings.whatsapp} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1 block mb-2">Alt Bilgi (Footer)</label>
              <textarea className="w-full rounded-2xl border-2 border-stone-50 bg-stone-50 p-4 font-bold text-sm focus:border-stone-900 focus:bg-white transition-all" value={settings.footerText} onChange={e => setSettings({ ...settings, footerText: e.target.value })} />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full rounded-3xl bg-slate-900 py-6 text-sm font-black text-white hover:bg-indigo-600 transition-all shadow-2xl active:scale-[0.98]">
          AYARLARI SİTEYE UYGULA
        </button>
      </form>
    </div>
  );
}
