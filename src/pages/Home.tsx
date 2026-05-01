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
    <div className="min-h-screen bg-[#FBFBFD] font-sans text-slate-900 selection:bg-indigo-100" style={{ '--brand-color': settings?.brandColor || '#4f46e5' } as React.CSSProperties}>
      {/* Announcement Bar */}
      <AnimatePresence>
        {settings?.announcementActive && (
          <div className="bg-slate-900 py-1.5 relative overflow-hidden">
            <motion.div
              animate={{ x: [0, -1000] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex gap-20 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.3em] text-white/90 px-10"
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

      {/* Navigation - Cleaned up */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 group cursor-pointer">
            {settings?.logo ? (
              <img src={settings.logo} alt="Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="text-white font-black text-xl italic leading-none">{settings?.title?.[0] || "T"}</span>
                </div>
                <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">
                  {settings?.title || "Termo Maske"}
                </h1>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <a
              href={`https://wa.me/${settings?.whatsapp}`}
              style={{ color: settings?.brandColor }}
              className="flex items-center gap-2 rounded-full bg-slate-50 px-5 py-2.5 text-[11px] font-bold transition-all hover:bg-slate-900 hover:text-white active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp Destek</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-32 md:pb-48 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full blur-[120px] opacity-20" style={{ backgroundColor: settings?.brandColor || '#4f46e5' }} />
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-24 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="mb-8 flex items-center gap-3">
                <div className="px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest" style={{ backgroundColor: settings?.brandColor || '#4f46e5' }}>Global Technology</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Version 4.0</div>
              </div>
              <h2 className="mb-10 text-6xl font-black leading-[0.85] text-slate-900 md:text-[6rem] tracking-tighter">
                {settings?.bannerTitle || "Geleceğin Konforunu Bugünden Giyin"}
              </h2>
              <p className="mb-14 max-w-lg text-xl font-medium leading-relaxed text-slate-500">
                {settings?.bannerSubtitle || "Isı dengeleyici nano kumaş teknolojisi ile üretilen Termo Maske, her ortamda ideal sıcaklığı korumanız için tasarlandı."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <button
                  onClick={() => orderSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center justify-center gap-4 rounded-3xl bg-slate-900 px-12 py-7 text-sm font-black text-white transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] active:scale-95 group"
                >
                  ŞİMDİ İNCELE & SİPARİŞ VER
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <div className="flex items-center gap-5">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Binlerce Memnun Müşteri</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[5rem] border border-white bg-white shadow-[0_80px_160px_-40px_rgba(0,0,0,0.2)]">
                {settings?.heroImage ? (
                  <img src={settings.heroImage} alt="Hero" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-50"><ShoppingCart className="h-32 w-32 text-slate-200" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="absolute -bottom-12 -left-12 rounded-[3.5rem] bg-white/90 backdrop-blur-2xl border border-white p-10 shadow-3xl">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter" style={{ color: settings?.brandColor }}>99%</span>
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Verim</span>
                  </div>
                  <p className="mt-2 text-[10px] font-black text-slate-900 uppercase tracking-widest">Termal Verimlilik Testi</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento Engineering Section */}
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-24 text-center">
            <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-400 mb-6">{settings?.featuresSubtitle || "Mühendislik"}</h3>
            <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none">{settings?.featuresTitle || "Detaylarda Gizli Mükemmellik"}</h2>
          </div>

          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-8 rounded-[4.5rem] bg-slate-50 p-16 flex flex-col justify-between border border-slate-100 hover:border-slate-200 transition-all group overflow-hidden">
               <div className="relative z-10">
                  <div className="mb-10 h-20 w-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center" style={{ color: settings?.brandColor }}>
                    <ShieldCheck className="h-10 w-10" />
                  </div>
                  <h4 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Akıllı Isı Dengeleme</h4>
                  <p className="max-w-md text-xl text-slate-500 font-medium leading-relaxed">Vücut ısınızı hapseden veya tahliye eden mikro gözenekli doku ile her mevsim konfor.</p>
               </div>
               <div className="mt-16 h-[400px] -mx-16 -mb-16 overflow-hidden">
                  <img src={settings?.heroImage || products[0]?.image} className="h-full w-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105" />
               </div>
            </div>
            
            <div className="md:col-span-4 flex flex-col gap-10">
              <div className="flex-1 rounded-[4.5rem] bg-slate-900 p-16 text-white flex flex-col justify-between border border-slate-800 shadow-3xl">
                <h4 className="text-3xl font-black italic tracking-tighter">Hava Transfer<br/>Teknolojisi</h4>
                <div className="mt-12 flex flex-col gap-4">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: "85%" }} className="h-full bg-indigo-500" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Optimum Geçirgenlik</p>
                </div>
              </div>
              <div className="flex-1 rounded-[4.5rem] p-16 text-white flex flex-col justify-between shadow-3xl overflow-hidden relative group" style={{ backgroundColor: settings?.brandColor || '#4f46e5' }}>
                <div className="absolute inset-0 bg-black/10 group-hover:scale-110 transition-transform duration-700" />
                <Truck className="h-14 w-14 text-white relative z-10" />
                <h4 className="text-4xl font-black relative z-10 leading-none">Aynı Gün<br />Express Kargo</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Package Selection */}
      <section className="py-40 bg-[#FBFBFD]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-24">
            <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-400 mb-6">{settings?.productsSubtitle || "Paket Seçimi"}</h3>
            <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none">{settings?.productsTitle || "İhtiyacınıza Özel Setler"}</h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.8 }}
                onClick={() => setSelectedProduct(product)}
                className={cn(
                  "group relative cursor-pointer rounded-[5rem] border-4 p-2 transition-all duration-700",
                  selectedProduct?.id === product.id ? "border-slate-900 bg-white shadow-[0_100px_80px_-40px_rgba(0,0,0,0.15)] scale-105" : "border-transparent bg-white/50 hover:bg-white hover:border-slate-200"
                )}
              >
                <div className="p-12">
                  <div className="mb-12 aspect-[4/5] overflow-hidden rounded-[3.5rem] bg-slate-50 shadow-inner">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  </div>
                  
                  <h4 className="text-4xl font-black tracking-tighter mb-4">{product.name}</h4>
                  <p className="text-sm font-bold text-slate-400 leading-relaxed line-clamp-2 mb-10">
                    {product.description}
                  </p>
                  
                  <div className="flex items-baseline gap-4 mb-10">
                    <span className="text-5xl font-black tracking-tighter" style={{ color: selectedProduct?.id === product.id ? settings?.brandColor : '#0f172a' }}>{formatCurrency(product.price)}</span>
                    {product.oldPrice && (
                      <span className="text-lg line-through font-bold text-slate-300">
                        {formatCurrency(product.oldPrice)}
                      </span>
                    )}
                  </div>

                  <button className={cn(
                    "w-full rounded-[2.5rem] py-7 text-xs font-black uppercase tracking-[0.4em] transition-all duration-500",
                    selectedProduct?.id === product.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white"
                  )}>
                    {selectedProduct?.id === product.id ? "SEÇİLDİ" : "SETİ SEÇ"}
                  </button>
                </div>
                
                {idx === 1 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-8 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">En Avantajlı</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Performance Order System */}
      <section id="order" ref={orderSectionRef} className="py-40 bg-slate-900 relative overflow-hidden" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="grid grid-cols-12 h-full gap-1">
             {Array.from({ length: 48 }).map((_, i) => (
               <div key={i} className="border-r border-white/20 h-full" />
             ))}
           </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid gap-32 lg:grid-cols-2 lg:items-start">
            <div className="lg:pt-20">
              <h3 className="text-[12px] font-black uppercase tracking-[0.8em] text-indigo-400 mb-10">{settings?.orderSubtitle || "Son İşlem"}</h3>
              <h2 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] italic mb-16">{settings?.orderTitle || "Güvenli Sipariş Hattı"}</h2>
              
              <div className="grid gap-8">
                {[
                  { title: "Sıfır Risk", desc: "Ödemeyi kapınızda, kargoyu kontrol ederek yapın.", icon: ShieldCheck },
                  { title: "Global Standart", desc: "AB standartlarında paketleme ve hijyen kontrolü.", icon: Star },
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 p-10 rounded-[3.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white mb-2 tracking-tight">{item.title}</h4>
                      <p className="font-bold text-slate-500 leading-relaxed text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[5.5rem] bg-white p-12 md:p-20 shadow-[0_120px_160px_-40px_rgba(0,0,0,0.5)]">
                {success ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-32 text-center">
                    <div className="mx-auto mb-12 h-28 w-28 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-3xl shadow-emerald-100">
                      <CheckCircle2 className="h-14 w-14" />
                    </div>
                    <h4 className="text-5xl font-black text-slate-900 tracking-tighter mb-6 italic">Emrinizi Aldık.</h4>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed max-w-sm mx-auto italic">Data sistemimize işlendi. Kurye ekiplerimiz rotayı oluşturmaya başladı.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-12">
                    {selectedProduct ? (
                      <div className="flex items-center gap-8 p-8 rounded-[3rem] bg-slate-50 border border-slate-100">
                         <div className="h-24 w-24 rounded-[1.5rem] overflow-hidden shadow-2xl shrink-0">
                            <img src={selectedProduct.image} className="h-full w-full object-cover" />
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Onaylanan Paket</p>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{selectedProduct.name}</h4>
                            <p className="mt-2 text-3xl font-black" style={{ color: settings?.brandColor }}>{formatCurrency(selectedProduct.price)}</p>
                         </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-[3rem] bg-red-50 border border-red-100 text-center">
                        <p className="text-xs font-black text-red-600 uppercase tracking-widest italic">Lütfen yukarıdan bir paket seçerek devam edin.</p>
                      </div>
                    )}

                    <div className="grid gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tam İsim</label>
                          <input required placeholder="Elon Musk" className="w-full rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 px-10 py-7 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-8 focus:ring-indigo-100/50" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Terminal No</label>
                            <input required type="tel" placeholder="05XX XXX XX XX" className="w-full rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 px-10 py-7 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-8 focus:ring-indigo-100/50" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">E-Mail</label>
                            <input required type="email" placeholder="contact@world.com" className="w-full rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 px-10 py-7 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-8 focus:ring-indigo-100/50" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Lojistik Adresi</label>
                          <textarea required rows={3} placeholder="Mahalle, cadde, kapı numarası..." className="w-full rounded-[3.5rem] border-2 border-slate-50 bg-slate-50 px-10 py-8 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-8 focus:ring-indigo-100/50" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Şehir</label>
                            <input required className="w-full rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 px-10 py-7 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-8 focus:ring-indigo-100/50" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">İlçe</label>
                            <input required className="w-full rounded-[2.5rem] border-2 border-slate-50 bg-slate-50 px-10 py-7 text-sm font-bold transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-8 focus:ring-indigo-100/50" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                          </div>
                        </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedProduct}
                      className="group relative flex w-full items-center justify-center gap-6 rounded-[3rem] bg-slate-900 py-10 text-lg font-black uppercase tracking-[0.5em] text-white transition-all hover:bg-black hover:shadow-4xl active:scale-95 disabled:opacity-50"
                      style={{ backgroundColor: settings?.brandColor || '#0f172a' }}
                    >
                      {loading ? "DATA TRANSMITTING..." : "AKTİVE ET & GÖNDER"}
                      <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-3" />
                    </button>
                    
                    <div className="text-center pt-4 opacity-50 flex items-center justify-center gap-6">
                       <div className="h-[2px] flex-1 bg-slate-100" />
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.6em]">End-to-End Encrypted Data Process</p>
                       <div className="h-[2px] flex-1 bg-slate-100" />
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-white py-32 border-t border-slate-100 text-center">
        <div className="mx-auto max-w-7xl px-6">
           {settings?.logo ? (
             <img src={settings.logo} className="h-16 mx-auto mb-16 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all pointer-events-none" />
           ) : (
             <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-16 uppercase italic opacity-20">{settings?.title || "Termo Maske"}</h1>
           )}
           
           <div className="flex justify-center gap-16 mb-20">
             <Instagram className="h-10 w-10 text-slate-200 hover:text-slate-900 transition-all cursor-pointer hover:scale-110" />
             <MessageCircle className="h-10 w-10 text-slate-200 hover:text-slate-900 transition-all cursor-pointer hover:scale-110" />
             <Mail className="h-10 w-10 text-slate-200 hover:text-slate-900 transition-all cursor-pointer hover:scale-110" />
           </div>

           <div className="max-w-3xl mx-auto border-t border-slate-100 pt-20">
              <p className="text-xs font-black text-slate-300 uppercase tracking-[1em] mb-12">
                 {settings?.footerText || `© ${new Date().getFullYear()} ${settings?.title || "TERMO MASKE"} ŞTİ. TÜM HAKLARI SAKLIDIR.`}
              </p>
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                 <a href="#" className="hover:text-slate-900 transition-colors">Mesafeli Satış</a>
                 <a href="#" className="hover:text-slate-900 transition-colors">KVKK</a>
                 <a href="#" className="hover:text-slate-900 transition-colors">Hakkımızda</a>
                 <a href="#" className="hover:text-slate-900 transition-colors">İletişim</a>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
