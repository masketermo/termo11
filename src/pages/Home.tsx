import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../lib/firebase";
import { Product, SiteSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart, Phone, Mail, Instagram, MessageCircle,
  ChevronRight, Truck, ShieldCheck, Star, ArrowRight,
  CheckCircle2, Zap, Package, Award, ChevronDown, Droplet, Sun, Leaf, Sparkles, Users, ThumbsUp, Clock, User, StarHalf
} from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";

// ─── Reusable sub-components ────────────────────────────────────────────────

function Badge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-current/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
      style={style}
    >
      {children}
    </span>
  );
}

function FeaturePill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-white border border-white/20">
      <Icon className="h-3.5 w-3.5 text-white/80" />
      {label}
    </div>
  );
}

function InputField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="group space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-emerald-600">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 transition-all focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-50"
      />
    </div>
  );
}

function TextAreaField({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="group space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-emerald-600">
        {label}
      </label>
      <textarea
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 transition-all focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-50 resize-none"
      />
    </div>
  );
}

// Star rating component
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
      {hasHalfStar && <StarHalf className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
      {Array.from({ length: 5 - Math.ceil(rating) }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 text-slate-300" />
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const orderSectionRef = useRef<HTMLDivElement>(null);
  const orderFormRef = useRef<HTMLDivElement>(null);

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

  // Extended reviews data - 12 reviews
  const reviews = [
    { id: 1, name: "Ayşe Yılmaz", rating: 5, text: "Cildim gerçekten parladı! 2 hafta içinde farkı gördüm. Gözeneklerim çok daha küçük görünüyor.", days: 3, verified: true, location: "İstanbul" },
    { id: 2, name: "Mehmet Demir", rating: 5, text: "Sivilcelerim söndü, cildim pürüzsüzleşti. Kesinlikle tavsiye ederim. 3. maskemi bitiriyorum.", days: 5, verified: true, location: "Ankara" },
    { id: 3, name: "Zeynep Kaya", rating: 4, text: "Gözeneklerim küçüldü, cildim çok daha canlı görünüyor. Hyaluronik asit harika bir bileşen.", days: 7, verified: true, location: "İzmir" },
    { id: 4, name: "Can Öztürk", rating: 5, text: "İlk kullanımdan itibaren fark ettim. Cildim nem dengesini buldu ve artık makyajım çok daha güzel duruyor.", days: 2, verified: true, location: "Bursa" },
    { id: 5, name: "Elif Demirtaş", rating: 5, text: "10 gündür kullanıyorum, cilt tonum eşitlendi ve parlaklık geldi. Kesinlikle tekrar alacağım!", days: 10, verified: true, location: "Antalya" },
    { id: 6, name: "Burak Yıldız", rating: 4, text: "Siyah noktalarım azaldı, cildim çok daha temiz hissediyorum. İyi ki almışım.", days: 14, verified: false, location: "Kocaeli" },
    { id: 7, name: "Selin Akçay", rating: 5, text: "Hassas cildim var ama bu maske hiç tahriş yapmadı. Çok memnunum, herkese öneririm!", days: 20, verified: true, location: "İstanbul" },
    { id: 8, name: "Mert Can", rating: 5, text: "Cildimdeki kızarıklıklar azaldı, daha sağlıklı görünüyor. Fiyatına göre çok iyi bir ürün.", days: 6, verified: true, location: "Ankara" },
    { id: 9, name: "Deniz Yılmaz", rating: 4, text: "Güzel bir ürün, düzenli kullanımda etkisini gösteriyor. 1 ay oldu hala kullanıyorum.", days: 30, verified: true, location: "İzmir" },
    { id: 10, name: "Aslı Korkmaz", rating: 5, text: "Maskeden sonra cildim ipek gibi oluyor. Makyaj altına çok iyi hazırlık yapıyor.", days: 4, verified: true, location: "Muğla" },
    { id: 11, name: "Emre Şahin", rating: 5, text: "Erkek cildinde de harika çalışıyor. Tıraş sonrası tahrişi azalttı.", days: 12, verified: false, location: "Eskişehir" },
    { id: 12, name: "Burcu Taş", rating: 5, text: "C vitamini sayesinde lekelerim açılmaya başladı. Çok mutluyum!", days: 18, verified: true, location: "İstanbul" },
  ];

  // ─── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    const productsRef = ref(db, "products");
    const settingsRef = ref(db, "settings");

    const unsubProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setProducts(loaded);
        setSelectedProduct((prev) => prev ?? loaded[0] ?? null);
      }
    });

    const unsubSettings = onValue(settingsRef, (snapshot) => {
      setSettings(snapshot.val());
    });

    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const scrollToOrder = (product: Product) => {
    setSelectedProduct(product);
    setTimeout(() => orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
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
      alert("Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const brandColor = settings?.brandColor || "#059669";
  const bgColor = settings?.bgColor || "#ffffff";

  // Calculate average rating
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen font-sans text-slate-900 antialiased selection:bg-emerald-900 selection:text-white transition-colors duration-500"
      style={{ "--brand": brandColor, "--bg": bgColor, backgroundColor: "var(--bg)" } as React.CSSProperties}
    >
      {/* ── Announcement bar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {settings?.announcementActive && settings.announcement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            style={{ backgroundColor: brandColor }}
          >
            <div className="relative overflow-hidden py-2.5">
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="flex w-max gap-0"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-6 whitespace-nowrap px-8 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70"
                  >
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    {settings.announcement}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-black/5 backdrop-blur-xl" style={{ backgroundColor: `rgba(${parseInt(bgColor.slice(1,3), 16)}, ${parseInt(bgColor.slice(3,5), 16)}, ${parseInt(bgColor.slice(5,7), 16)}, 0.9)` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              <img src={settings.logo || undefined} alt={settings.title || "Logo"} className="h-9 w-auto object-contain" />
            ) : (
              <>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: brandColor }}
                >
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-base font-black tracking-tight text-white mix-blend-difference">
                  {settings?.title || "GlowMask"}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {settings?.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white hover:text-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <button
              onClick={() => orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Sipariş Ver
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section - Prompt 1 ──────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-36" style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}CC 50%, ${brandColor}99 100%)` }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6">
          {/* White badge on dark background */}
          <div className="text-center mb-8">
            <Badge style={{ color: "white", borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.1)" }}>
              <Sparkles className="h-3 w-3" />
              Cilt Yenilemenin Yeni Formülü
            </Badge>
          </div>

          <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
            {/* Left – copy with bullet points */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
                Yeni <span className="text-white/90">GlowMask</span><br />
                Maske
              </h1>

              {/* Three bullet points with icons - white version */}
              <div className="space-y-5 mb-10">
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Gözenekleri Derinlemesine Temizler</h3>
                    <p className="text-sm text-white/70">Yağ ve kiri arındırır, gözenek görünümünü azaltır.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Derin Nemlendirme</h3>
                    <p className="text-sm text-white/70">Hyaluronik asit ile cildi nemlendirir ve besler.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Cildi Aydınlatır</h3>
                    <p className="text-sm text-white/70">C vitamini ile renk tonunu eşitler ve parlaklık verir.</p>
                  </div>
                </div>
              </div>

              {/* Trust signals - white version */}
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <FeaturePill icon={Truck} label="Aynı Gün Kargo" />
                <FeaturePill icon={ShieldCheck} label="Kapıda Ödeme" />
                <FeaturePill icon={Package} label="30 Gün İade" />
              </div>

              {/* CTA Button with rating and discount */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="group flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  HEMEN SİPARİŞ VER
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-white">4.9/5</span>
                  <span className="text-xs text-white/60">(8.400+ yorum)</span>
                  <span className="ml-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">%25 İNDİRİM</span>
                </div>
              </div>
            </motion.div>

            {/* Right – smiling model with mask (no packaging) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-3xl aspect-[4/5] shadow-2xl">
                {settings?.heroImage ? (
                  <img src={settings.heroImage || undefined} alt="Gülümseyen model" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-white/20 backdrop-blur-sm">
                    <div className="rounded-full bg-white/30 p-6 mb-4">
                      <Sparkles className="h-16 w-16 text-white" />
                    </div>
                    <p className="text-white font-semibold">Maske Uygulaması</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Before-After Section - Prompt 2 ───────────────────────────────── */}
      <section className="py-24" style={{ backgroundColor: "var(--bg)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: brandColor }}>
              Zararsız ve Etkili Olduğu Kanıtlandı
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Before-After comparison */}
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
                  <div className="aspect-[3/4] bg-gradient-to-br from-rose-100 to-slate-200 flex items-center justify-center relative">
                    {settings?.beforeImage ? (
                      <img src={settings.beforeImage} alt="Önce" className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center p-8">
                        <div className="w-24 h-24 mx-auto rounded-full bg-rose-200/50 mb-4" />
                        <p className="text-xs font-semibold text-rose-600">Sivilce & Pürüzlü Cilt</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center" style={{ backgroundColor: brandColor + "15" }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: brandColor }}>ÖNCE</span>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
                  <div className="aspect-[3/4] bg-gradient-to-br from-emerald-100 to-slate-100 flex items-center justify-center relative">
                    {settings?.afterImage ? (
                      <img src={settings.afterImage} alt="Sonra" className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center p-8">
                        <div className="w-24 h-24 mx-auto rounded-full bg-emerald-200/50 mb-4 flex items-center justify-center">
                          <Sparkles className="h-8 w-8" style={{ color: brandColor }} />
                        </div>
                        <p className="text-xs font-semibold" style={{ color: brandColor }}>Pürüzsüz & Temiz Cilt</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center" style={{ backgroundColor: brandColor + "15" }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: brandColor }}>SONRA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific proof */}
            <div>
              <p className="text-xl font-bold text-slate-900 mb-4">
                Yapılan çalışmalar, <span style={{ color: brandColor }}>GlowMask Maske</span>'nin cildi tahriş etmeden etkili bir şekilde yenilediğini ve pürüzsüzleştirdiğini doğrulamaktadır.
              </p>
              
              {/* Microscope image placeholder */}
              <div className="flex items-center gap-6 mb-6 rounded-2xl p-4 border" style={{ backgroundColor: brandColor + "08", borderColor: brandColor + "20" }}>
                <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: brandColor + "20" }}>
                  <svg className="h-10 w-10" style={{ color: brandColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M6.5 6.5l1.5 1.5M16 16l1.5 1.5M6.5 17.5L8 16M16 8l1.5-1.5" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Mikroskop altında pürüzsüz cilt hücresi</p>
                  <p className="text-xs text-slate-500">Dermatolojik olarak test edilmiştir</p>
                </div>
              </div>

              {/* Ingredient list */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Leaf className="h-4 w-4" style={{ color: brandColor }} /> Doğal Formül
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Kil", "Aloe Vera", "Hyaluronik Asit", "C Vitamini", "Yeşil Çay", "Niasinamid"].map((ing) => (
                    <span key={ing} className="rounded-full px-3 py-1.5 text-xs font-medium border" style={{ backgroundColor: brandColor + "10", borderColor: brandColor + "20", color: brandColor }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Psychological Impact & Social Proof - Prompt 3 ────────────────── */}
      <section className="py-24" style={{ backgroundColor: brandColor + "08" }}>
        <div className="mx-auto max-w-7xl px-6">
          {/* Psychological text */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold mb-2 tracking-wider" style={{ color: brandColor }}>PSİKOLOJİK ETKİ</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl mb-3">
              Cilt Pürüzleri Sosyal Kaygıyı Artırıyor
            </h2>
            <p className="text-xl font-bold" style={{ color: brandColor }}>
              Pürüzsüz Cilt ile Güveninizi Geri Kazanın
            </p>
            <div className="inline-block mt-4 rounded-full px-4 py-1.5" style={{ backgroundColor: brandColor + "20" }}>
              <span className="text-sm font-bold" style={{ color: brandColor }}>1 Ayda Cilt Değişimi İmkanı</span>
            </div>
          </div>

          {/* Reviews section - extended */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-slate-900">{avgRating}</span>
                </div>
                <p className="text-sm text-slate-500"><span className="font-bold text-slate-900">12,000+</span> müşteri yorumu</p>
              </div>
              <div className="flex items-center gap-1" style={{ color: brandColor }}>
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold">98% Mutlu Müşteri</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: brandColor }}>
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{review.name}</p>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-[10px] text-slate-400">{review.days} gün önce</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">"{review.text}"</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1" style={{ color: brandColor }}>
                      <ThumbsUp className="h-3 w-3" />
                      <span className="text-[10px] font-semibold">Faydalı</span>
                    </div>
                    {review.verified && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Doğrulandı</span>
                    )}
                    <span className="text-[10px] text-slate-400">{review.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price packages */}
          <div>
            <h3 className="text-2xl font-black text-center text-slate-900 mb-8">{settings?.productsTitle || "Paketleri İncele"}</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product, idx) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <div 
                    key={product.id}
                    className={cn(
                      "group relative rounded-2xl p-6 text-center border transition-all duration-300 cursor-pointer",
                      isSelected 
                        ? "shadow-lg scale-[1.02]" 
                        : "bg-white border-slate-100 shadow-sm hover:shadow-lg"
                    )}
                    style={isSelected ? { borderColor: brandColor, backgroundColor: brandColor + "04" } : {}}
                    onClick={() => setSelectedProduct(product)}
                  >
                    {idx === 1 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold text-white whitespace-nowrap" style={{ backgroundColor: brandColor }}>
                        En Çok Tercih Edilen
                      </div>
                    )}
                    <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <Package className={cn("h-10 w-10", isSelected ? "text-emerald-700" : "text-slate-400")} style={isSelected ? { color: brandColor } : {}} />
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">{product.name}</h4>
                    <div className="my-4">
                      <span className={cn("text-3xl font-black", isSelected ? "text-emerald-700" : "text-slate-900")} style={isSelected ? { color: brandColor } : {}}>
                        {formatCurrency(product.price)}
                      </span>
                      {product.oldPrice && (
                        <>
                          <span className="text-sm text-slate-400 line-through ml-2">
                            {formatCurrency(product.oldPrice)}
                          </span>
                          <span className="ml-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: brandColor }}>
                            - {formatCurrency(product.oldPrice - product.price)}
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToOrder(product);
                      }}
                      className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: brandColor }}
                    >
                      {isSelected ? "✓ Seçildi" : "Bu Paketi Seç"}
                    </button>
                    <p className="text-xs text-slate-400 mt-3">Kargo ücreti dahil</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Order form ───────────────────────────────────────────────────── */}
      <section
        id="order"
        ref={orderSectionRef}
        className="py-24 md:py-36"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            {/* Left – info */}
            <div className="lg:pt-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: brandColor }}>
                Sipariş
              </p>
              <h2 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                Hızlı ve Güvenli Sipariş
              </h2>
              <p className="mb-12 max-w-sm text-base leading-relaxed text-slate-500">
                Tüm siparişleriniz şifreli bağlantı ile iletilir. Ödemenizi kapıda, ürünü kontrol ettikten sonra yapabilirsiniz.
              </p>

              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, title: "Sıfır Risk", desc: "Ödemeyi kapınızda, kargoyu kontrol ederek yapın." },
                  { icon: Award, title: "Dermatolojik Onay", desc: "Uzmanlar tarafından test edilmiştir." },
                  { icon: Truck, title: "Hızlı Teslimat", desc: "14:00'a kadar siparişlerde aynı gün kargo." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 rounded-2xl border border-slate-100 p-5" style={{ backgroundColor: brandColor + "04" }}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: brandColor }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right – form */}
            <div 
              ref={orderFormRef}
              className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100 md:p-10"
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-16 text-center"
                  >
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: brandColor + "20" }}>
                      <CheckCircle2 className="h-10 w-10" style={{ color: brandColor }} />
                    </div>
                    <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900">
                      Siparişiniz Alındı!
                    </h3>
                    <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                      Siparişiniz sisteme işlendi. Kurye ekibimiz en kısa sürede sizinle iletişime geçecek.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-6">
                    {selectedProduct ? (
                      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4" style={{ backgroundColor: brandColor + "04" }}>
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl flex items-center justify-center" style={{ backgroundColor: brandColor + "15" }}>
                          {selectedProduct.image ? (
                            <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-8 w-8" style={{ color: brandColor }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: brandColor }}>
                            Seçilen Paket
                          </p>
                          <p className="truncate font-bold text-slate-900">{selectedProduct.name}</p>
                          <p className="text-lg font-black" style={{ color: brandColor }}>
                            {formatCurrency(selectedProduct.price)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-center">
                        <p className="text-xs font-semibold text-rose-500">
                          Lütfen yukarıdan bir paket seçerek devam edin.
                        </p>
                      </div>
                    )}

                    <InputField
                      label="Ad Soyad"
                      required
                      placeholder="Adınız Soyadınız"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Telefon"
                        required
                        type="tel"
                        placeholder="05XX XXX XX XX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      <InputField
                        label="E-posta"
                        required
                        type="email"
                        placeholder="ad@ornek.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <TextAreaField
                      label="Adres"
                      required
                      rows={3}
                      placeholder="Mahalle, cadde, kapı numarası…"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Şehir"
                        required
                        placeholder="İstanbul"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                      <InputField
                        label="İlçe"
                        required
                        placeholder="Kadıköy"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedProduct}
                      className="group flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ backgroundColor: brandColor }}
                    >
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Gönderiliyor…
                        </>
                      ) : (
                        <>
                          Siparişi Tamamla
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-slate-400">
                      🔒 256-bit SSL şifrelemeli güvenli bağlantı
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-10" style={{ backgroundColor: brandColor + "04" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {settings?.logo ? (
                <img src={settings.logo || undefined} alt="" className="h-8 w-auto" />
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: brandColor }}>
                    <Leaf className="h-4 w-4" />
                  </div>
                  <span className="font-black tracking-tight text-slate-900">
                    {settings?.title || "GlowMask"}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {[Instagram, MessageCircle, Mail].map((Icon, i) => (
                <button
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:text-white"
                  style={{ backgroundColor: "transparent", borderColor: brandColor + "30" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = brandColor; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9CA3AF"; }}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 border-t border-slate-100 pt-8 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-400">
              {settings?.footerText ||
                `© ${new Date().getFullYear()} ${settings?.title || "GlowMask"}. Tüm hakları saklıdır.`}
            </p>
            <nav className="flex flex-wrap gap-6">
              {["Mesafeli Satış", "KVKK", "Hakkımızda", "İletişim"].map((link) => (
                <a key={link} href="#" className="text-xs text-slate-400 transition-colors hover:text-slate-900">
                  {link}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}