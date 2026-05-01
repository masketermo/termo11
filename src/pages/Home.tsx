import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../lib/firebase";
import { Product, SiteSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Phone, Mail, Instagram, MessageCircle, ChevronRight, Truck, ShieldCheck, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const orderSectionRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const productsRef = ref(db, "products");
    const settingsRef = ref(db, "settings");

    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedProducts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setProducts(loadedProducts);
        if (loadedProducts.length > 0 && !selectedProduct) {
          setSelectedProduct(loadedProducts[0]);
        }
      }
    });

    onValue(settingsRef, (snapshot) => {
      setSettings(snapshot.val());
    });
  }, []);

  const scrollToOrder = (product: Product) => {
    setSelectedProduct(product);
    orderSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    
    try {
      const ordersRef = ref(db, "orders");
      const newOrderRef = push(ordersRef);
      
      await set(newOrderRef, {
        ...formData,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        totalPrice: selectedProduct.price,
        status: "pending",
        createdAt: Date.now(),
      });

      setSuccess(true);
      setFormData({ customerName: "", phone: "", email: "", address: "", city: "", district: "" });
      setTimeout(() => setSuccess(false), 8000);
    } catch (error) {
      console.error(error);
      alert("Sipariş oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] font-sans text-slate-900 selection:bg-indigo-100">
      {/* Announcement Bar */}
      <AnimatePresence>
        {settings?.announcementActive && (
          <div className="bg-slate-900 py-1.5 relative overflow-hidden">
            <motion.div
              animate={{ x: [0, -1000] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex gap-20 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400/90 px-10"
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <span key={i} className="flex items-center gap-3">
                  <div className="h-1 w-1 rounded-full bg-white" />
                  {settings.announcement}
                  <div className="h-1 w-1 rounded-full bg-white" />
                </span>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-black text-xl italic leading-none">T</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">
              {settings?.title || "Termo Maske"}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <a href="#features" className="hover:text-indigo-600 transition-colors">Özellikler</a>
              <a href="#products" className="hover:text-indigo-600 transition-colors">Paketler</a>
              <a href="#order" className="hover:text-indigo-600 transition-colors">Sipariş</a>
            </div>
            <a
              href={`https://wa.me/${settings?.whatsapp}`}
              className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-5 py-2.5 text-[11px] font-bold text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp Destek</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-40 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-indigo-50/50 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-indigo-600 text-[9px] font-black text-white uppercase tracking-widest">Yeni Nesil</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">2026 Termal Seri</div>
              </div>
              <h2 className="mb-8 text-6xl font-black leading-[0.9] text-slate-900 md:text-8xl tracking-tighter">
                {settings?.bannerTitle || "Geleceğin Konforunu Bugünden Giyin"}
              </h2>
              <p className="mb-12 max-w-lg text-lg font-medium leading-relaxed text-slate-500">
                {settings?.bannerSubtitle || "Isı dengeleyici nano kumaş teknolojisi ile üretilen Termo Maske, her ortamda ideal sıcaklığı korumanız için tasarlandı."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <button
                  onClick={() => orderSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center justify-center gap-4 rounded-2xl bg-slate-900 px-10 py-6 text-sm font-black text-white transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/20 active:scale-95 group"
                >
                  HEMEN SİPARİŞ VER
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <div className="flex items-center gap-4 px-2">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                    <div className="h-2 w-2 rounded-full bg-indigo-200" />
                    <div className="h-2 w-2 rounded-full bg-indigo-200" />
                    <div className="h-2 w-2 rounded-full bg-indigo-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yüksek Müşteri Memnuniyeti</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="relative aspect-square overflow-hidden rounded-[4rem] border border-white bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]">
                {settings?.heroImage ? (
                  <img src={settings.heroImage} alt="Hero" className="h-full w-full object-cover" />
                ) : products[0]?.image ? (
                  <img src={products[0].image} alt="Main" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-50"><ShoppingCart className="h-24 w-24 text-slate-200" /></div>
                )}
                {/* Floating Price Tag */}
                <div className="absolute bottom-10 right-10 rounded-3xl bg-white/90 backdrop-blur-xl border border-white p-6 shadow-2xl">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Başlayan Fiyatlarla</p>
                  <p className="text-3xl font-black text-slate-900">{formatCurrency(products[0]?.price || 0)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-4">Mühendislik</h3>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Detaylarda Gizli Mükemmellik</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 rounded-[3rem] bg-slate-50 p-10 flex flex-col justify-between border border-slate-100 hover:border-indigo-100 transition-colors">
              <div>
                <div className="mb-6 h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Akıllı Isı Dengeleme</h4>
                <p className="max-w-md text-slate-500 font-medium">Vücut ısınızı hapseden veya tahliye eden mikro gözenekli doku ile her mevsim konfor.</p>
              </div>
              <div className="mt-12 h-64 overflow-hidden rounded-3xl group">
                <img src={products[0]?.image} className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" />
              </div>
            </div>
            
            <div className="flex flex-col gap-8">
              <div className="flex-1 rounded-[3rem] bg-slate-900 p-10 text-white flex flex-col justify-between border border-slate-800 shadow-2xl shadow-slate-200">
                <h4 className="text-2xl font-black italic">Ultra Hafif Tasarım</h4>
                <div className="mt-8 flex items-baseline gap-2">
                  <span className="text-6xl font-black text-indigo-400">12</span>
                  <span className="text-xl font-bold text-slate-500 uppercase tracking-widest">Gram</span>
                </div>
              </div>
              <div className="flex-1 rounded-[3rem] bg-indigo-600 p-10 text-white flex flex-col justify-between shadow-2xl shadow-indigo-200">
                <Truck className="h-10 w-10 text-white/50" />
                <h4 className="text-2xl font-black">24 Saatte<br />Kapınızda</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Product Selection */}
      <section id="products" className="py-32">
        <div className="mx-auto max-w-7xl px-6 text-center mb-20 px-6">
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-4">Paket Seçimi</h3>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">İhtiyacınıza Özel Avantaj Setleri</h2>
        </div>

        <div className="mx-auto max-w-7xl px-6 grid gap-8 md:grid-cols-3">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedProduct(product)}
              className={cn(
                "group relative cursor-pointer rounded-[3.5rem] border-2 p-1 transition-all duration-500",
                selectedProduct?.id === product.id ? "border-indigo-600 bg-slate-900 text-white shadow-2xl" : "border-slate-100 bg-white hover:border-slate-300"
              )}
            >
              <div className="p-10">
                <div className="mb-8 aspect-square overflow-hidden rounded-[2.5rem] bg-slate-50">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                
                <h4 className="text-2xl font-black tracking-tight">{product.name}</h4>
                <p className={cn("mt-4 text-xs font-bold leading-relaxed line-clamp-2", selectedProduct?.id === product.id ? "text-slate-400" : "text-slate-500")}>
                  {product.description}
                </p>
                
                <div className="mt-12 flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter">{formatCurrency(product.price)}</span>
                  {product.oldPrice && (
                    <span className={cn("text-sm line-through font-bold", selectedProduct?.id === product.id ? "text-slate-600" : "text-slate-300")}>
                      {formatCurrency(product.oldPrice)}
                    </span>
                  )}
                </div>

                <div className={cn(
                  "mt-8 flex w-full items-center justify-center gap-3 rounded-2xl py-4.5 text-xs font-black uppercase tracking-[0.1em] transition-all",
                  selectedProduct?.id === product.id ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-900 group-hover:bg-slate-100"
                )}>
                  {selectedProduct?.id === product.id ? <CheckCircle2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  {selectedProduct?.id === product.id ? "Şu An Seçili" : "Bu Paketi Seç"}
                </div>
              </div>
              
              {idx === 1 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-6 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">En Çok Tercih Edilen</div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Order Experience Section */}
      <section id="order" ref={orderSectionRef} className="py-32 bg-slate-900 border-t border-white/5 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 relative">
          <div className="absolute top-0 right-0 -z-0 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
          
          <div className="grid gap-20 lg:grid-cols-2 relative z-10">
            <div>
              <div className="sticky top-32">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-6">Son İşlem</h3>
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight mb-12 italic">Kapıda Ödeme Avantajıyla Güvenli Sipariş</h2>
                
                <div className="space-y-4">
                  {[
                    "Kargonuzu teslim alırken nakit veya kartla ödeyin.",
                    "Hafta sonu dahil tüm Türkiye'ye gönderim.",
                    "Sürpriz kargo ücreti yok, fiyatlar nettir.",
                    "Herhangi bir sorun için 7/24 WhatsApp hattı."
                  ].map(text => (
                    <div key={text} className="flex items-center gap-5 p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <p className="font-bold text-slate-300 text-sm tracking-tight">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[4rem] bg-white p-8 md:p-14 shadow-3xl shadow-slate-950/50">
                {success ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-24 text-center">
                    <div className="mx-auto mb-10 h-24 w-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-100">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h4 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 italic">Harika! Siparişiniz Yolunda.</h4>
                    <p className="text-slate-500 font-bold leading-relaxed max-w-sm mx-auto">Tebrikler, teknoloji dolu konfor paketiniz hazırlanıyor. Müşteri temsilcimiz onay için kısa süre içinde sizi arayacaktır.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="grid gap-8">
                    {selectedProduct && (
                      <div className="flex items-center gap-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                         <img src={selectedProduct.image} className="h-16 w-16 rounded-2xl object-cover shadow-lg" />
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seçili Paket</p>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">{selectedProduct.name}</h4>
                         </div>
                         <div className="ml-auto text-right">
                            <p className="text-xl font-black text-indigo-600">{formatCurrency(selectedProduct.price)}</p>
                         </div>
                      </div>
                    )}

                    <div className="grid gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="relative">
                          <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Ad Soyad</label>
                          <input required className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                        </div>
                        <div className="relative">
                          <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">İletişim No</label>
                          <input required type="tel" placeholder="05XX XXX XX XX" className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                      </div>
                      
                      <div className="relative">
                        <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Teslimat Adresi (Mahalle, Cadde, No)</label>
                        <textarea required rows={3} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="relative">
                          <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Şehir</label>
                          <input required className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                        </div>
                        <div className="relative">
                          <label className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">İlçe</label>
                          <input required className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4.5 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedProduct}
                      className="mt-4 flex w-full items-center justify-center gap-4 rounded-[2rem] bg-indigo-600 py-6 text-sm font-black text-white transition-all hover:bg-slate-900 shadow-[0_20px_50px_-10px_rgba(79,70,229,0.5)] active:scale-95 disabled:opacity-50 group"
                    >
                      {loading ? "GÖNDERİLİYOR..." : "SİPARİŞİ TAMAMLA"}
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                    <div className="flex items-center justify-center gap-4 opacity-50 grayscale transition-all hover:grayscale-0">
                      <ShieldCheck className="h-6 w-6 text-indigo-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">KVKK Uyumlu Güvenli Sipariş Hattı</p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social / Info Footer */}
      <footer className="bg-white py-24 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-8 uppercase italic">{settings?.title || "Termo Maske"}</h1>
            <div className="flex gap-10 mb-12">
               <Instagram className="h-6 w-6 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer" />
               <MessageCircle className="h-6 w-6 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer" />
               <Mail className="h-6 w-6 text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer" />
            </div>
            <div className="max-w-2xl text-slate-400 font-medium text-xs leading-relaxed space-y-4">
               <p>{settings?.footerText || `© ${new Date().getFullYear()} TERMO MASKE ŞTİ. TÜM HAKLARI SAKLIDIR.`}</p>
               <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 uppercase tracking-widest text-[9px] font-black">
                  <a href="#" className="hover:text-indigo-600 transition-colors">Mesafeli Satış</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Gizlilik Politikası</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Kullanım Koşulları</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Hakkımızda</a>
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
