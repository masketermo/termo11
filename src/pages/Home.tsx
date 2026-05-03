import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../lib/firebase";
import { Product, SiteSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart, Phone, Mail, Instagram, MessageCircle,
  Truck, ShieldCheck, Star, ArrowRight,
  CheckCircle2, Package, Award, Droplet, Sun, Leaf, Sparkles,
  Users, ThumbsUp, StarHalf, MapPin, Home as HomeIcon, Building2,
  ChevronRight, Zap, Microscope
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
  required,
  icon: Icon,
  ...props
}: { label: string; required?: boolean; icon?: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-600">
        {label} {required && <span style={{ color: "#fb79a0" }}>*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="h-4 w-4 text-slate-400" />
          </div>
        )}
        <input
          {...props}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 transition-all focus:border-[#fb79a0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#fb79a0]/10",
            Icon && "pl-10"
          )}
        />
      </div>
    </div>
  );
}

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
  const orderFormRef = useRef<HTMLDivElement>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    neighborhood: "",
    postalCode: "",
    doorNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);

  const allReviews = [
    { id: 1, name: "Ayşe Y.", rating: 5, text: "Cildim gerçekten parladı! 2 hafta içinde farkı gördüm. Gözeneklerim çok daha küçük görünüyor.", days: 3, verified: true, location: "İstanbul" },
    { id: 2, name: "Mehmet D.", rating: 5, text: "Sivilcelerim söndü, cildim pürüzsüzleşti. Kesinlikle tavsiye ederim.", days: 5, verified: true, location: "Ankara" },
    { id: 3, name: "Zeynep K.", rating: 4, text: "Gözeneklerim küçüldü, cildim çok daha canlı görünüyor.", days: 7, verified: true, location: "İzmir" },
    { id: 4, name: "Can Ö.", rating: 5, text: "İlk kullanımdan itibaren fark ettim. Cildim nem dengesini buldu.", days: 2, verified: true, location: "Bursa" },
    { id: 5, name: "Elif D.", rating: 5, text: "10 gündür kullanıyorum, cilt tonum eşitlendi ve parlaklık geldi.", days: 10, verified: true, location: "Antalya" },
    { id: 6, name: "Burak Y.", rating: 4, text: "Siyah noktalarım azaldı, cildim çok daha temiz hissediyorum.", days: 14, verified: false, location: "Kocaeli" },
    { id: 7, name: "Selin A.", rating: 5, text: "Hassas cildim var ama bu maske hiç tahriş yapmadı. Çok memnunum!", days: 20, verified: true, location: "İstanbul" },
    { id: 8, name: "Mert C.", rating: 5, text: "Cildimdeki kızarıklıklar azaldı, daha sağlıklı görünüyor.", days: 6, verified: true, location: "Ankara" },
    { id: 9, name: "Deniz Y.", rating: 4, text: "Güzel bir ürün, düzenli kullanımda etkisini gösteriyor.", days: 30, verified: true, location: "İzmir" },
    { id: 10, name: "Aslı K.", rating: 5, text: "Maskeden sonra cildim ipek gibi oluyor. Makyaj altına çok iyi hazırlık yapıyor.", days: 4, verified: true, location: "Muğla" },
    { id: 11, name: "Emre Ş.", rating: 5, text: "Erkek cildinde de harika çalışıyor. Tıraş sonrası tahrişi azalttı.", days: 12, verified: false, location: "Eskişehir" },
    { id: 12, name: "Burcu T.", rating: 5, text: "C vitamini sayesinde lekelerim açılmaya başladı. Çok mutluyum!", days: 18, verified: true, location: "İstanbul" },
  ];

  useEffect(() => {
    let unsubProducts: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    try {
      const productsRef = ref(db, "products");
      const settingsRef = ref(db, "settings");
      unsubProducts = onValue(productsRef, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const loaded = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
            setProducts(loaded);
            setSelectedProduct((prev) => prev ?? loaded[0] ?? null);
          }
        } catch (err) { console.error("Products parse error:", err); }
      }, (error) => { console.error("Firebase products read error:", error); setFirebaseError(true); });
      unsubSettings = onValue(settingsRef, (snapshot) => {
        try { setSettings(snapshot.val()); } catch (err) { console.error("Settings parse error:", err); }
      }, (error) => { console.error("Firebase settings read error:", error); });
    } catch (err) { console.error("Firebase initialization error:", err); setFirebaseError(true); }
    return () => { if (unsubProducts) unsubProducts(); if (unsubSettings) unsubSettings(); };
  }, []);

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
        paymentMethod: "kapidaOdeme",
        createdAt: Date.now(),
      });
      setSuccess(true);
      setFormData({ customerName: "", phone: "", email: "", address: "", city: "", district: "", neighborhood: "", postalCode: "", doorNumber: "" });
      setTimeout(() => setSuccess(false), 8000);
    } catch (error) {
      console.error(error);
      alert("Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const brandColor = "#fb79a0";
  const bgColor = "#f7e4e7";
  const avgRating = (allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length).toFixed(1);

  return (
    <div
      className="min-h-screen font-sans text-slate-900 antialiased"
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Announcement Bar ─────────────────────────────────────────────── */}
      <div className="overflow-hidden py-2 relative" style={{ backgroundColor: brandColor }}>
        <style>{`
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee 28s linear infinite;
          }
          .marquee-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="marquee-track">
          {[
            "✨ Şişkinlik, Yorgunluk, Stres… Hepsine Tek Çözüm!",
            "❄️ Göz Altı Şişliklerine 10 Dakikalık Çözüm!",
            "🔥 Bugüne Özel İndirimi Kaçırmayın!",
            "🚚💸 Kapıda Ödeme Kolaylığı",
            "✨ Şişkinlik, Yorgunluk, Stres… Hepsine Tek Çözüm!",
            "❄️ Göz Altı Şişliklerine 10 Dakikalık Çözüm!",
            "🔥 Bugüne Özel İndirimi Kaçırmayın!",
            "🚚💸 Kapıda Ödeme Kolaylığı",
          ].map((text, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-8 text-[11px] font-semibold uppercase tracking-wider text-white whitespace-nowrap">
              <span className="inline-block h-1 w-1 rounded-full bg-white/50" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-black/5 backdrop-blur-xl bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: brandColor }}>
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-800">
              {settings?.title || "GlowMask"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {settings?.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700"
              >
                <MessageCircle className="h-3 w-3" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <button
              onClick={() => orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="flex items-center gap-1 rounded-full px-4 py-1.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingCart className="h-3 w-3" />
              Sipariş Ver
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-8 md:py-12"
        style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}CC 100%)` }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left – copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="mb-4 text-4xl font-black leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Yeni <span className="text-white/90">GlowMask</span><br />Maske
              </h1>

              <div className="space-y-3 mb-5">
                {[
                  { icon: Zap, title: "Gözenekleri Derinlemesine Temizler", desc: "Yağ ve kiri arındırır, gözenek görünümünü azaltır." },
                  { icon: Droplet, title: "Derin Nemlendirme", desc: "Hyaluronik asit ile cildi nemlendirir ve besler." },
                  { icon: Sun, title: "Cildi Aydınlatır", desc: "C vitamini ile renk tonunu eşitler ve parlaklık verir." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{title}</p>
                      <p className="text-xs text-white/70">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-2">
                <FeaturePill icon={Truck} label="Aynı Gün Kargo" />
                <FeaturePill icon={ShieldCheck} label="Kapıda Ödeme" />
                <FeaturePill icon={Package} label="30 Gün İade" />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => orderFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition-all hover:scale-105 shadow-lg"
                >
                  HEMEN SİPARİŞ VER
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-white">4.9/5</span>
                  <span className="text-xs text-white/60">(8.400+ yorum)</span>
                  <span className="ml-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">%25 İNDİRİM</span>
                </div>
              </div>
            </motion.div>

            {/* Right – image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative lg:ml-auto lg:max-w-md"
            >
              <div className="relative overflow-hidden rounded-2xl aspect-square shadow-xl">
                {settings?.heroImage ? (
                  <img src={settings.heroImage} alt="Gülümseyen model" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-white/20 backdrop-blur-sm">
                    <div className="rounded-full bg-white/30 p-4 mb-3">
                      <Sparkles className="h-12 w-12 text-white" />
                    </div>
                    <p className="text-white font-semibold text-sm">Maske Uygulaması</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Before-After / Science Section ───────────────────────────────── */}
      <section className="py-8 md:py-12" style={{ backgroundColor: bgColor }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: brandColor }}>
              Zararsız ve Etkili Olduğu Kanıtlandı
            </h2>
          </div>

          <div className="grid gap-8 md:gap-12 lg:grid-cols-2 lg:items-center">
            {/* Before-After */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  key: "before",
                  img: settings?.beforeImage,
                  alt: "Önce",
                  label: "ÖNCE",
                  fallbackBg: "from-rose-100 to-slate-200",
                  fallbackIcon: null,
                  fallbackText: "Sivilce & Pürüzlü Cilt",
                  fallbackColor: "text-rose-600",
                },
                {
                  key: "after",
                  img: settings?.afterImage,
                  alt: "Sonra",
                  label: "SONRA",
                  fallbackBg: "from-emerald-100 to-slate-100",
                  fallbackIcon: <Sparkles className="h-6 w-6" style={{ color: brandColor }} />,
                  fallbackText: "Pürüzsüz & Temiz",
                  fallbackColor: "",
                },
              ].map(({ key, img, alt, label, fallbackBg, fallbackIcon, fallbackText, fallbackColor }) => (
                <div key={key} className="rounded-xl overflow-hidden bg-slate-100 shadow">
                  <div className={`aspect-[3/4] bg-gradient-to-br ${fallbackBg} flex items-center justify-center`}>
                    {img ? (
                      <img src={img} alt={alt} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <div className={`w-20 h-20 mx-auto rounded-full mb-3 flex items-center justify-center ${key === "before" ? "bg-rose-200/50" : "bg-emerald-200/50"}`}>
                          {fallbackIcon}
                        </div>
                        <p className={`text-xs font-semibold ${fallbackColor}`} style={key === "after" ? { color: brandColor } : {}}>{fallbackText}</p>
                      </div>
                    )}
                  </div>
                  <div className="py-2 text-center" style={{ backgroundColor: brandColor + "15" }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: brandColor }}>{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scientific proof */}
            <div className="space-y-4">
              <p className="text-base md:text-lg font-bold text-slate-900">
                Yapılan çalışmalar, <span style={{ color: brandColor }}>GlowMask Maske</span>'nin cildi tahriş etmeden etkili bir şekilde yenilediğini ve pürüzsüzleştirdiğini doğrulamaktadır.
              </p>

              <div className="flex items-center gap-4 rounded-xl p-3 border" style={{ backgroundColor: brandColor + "08", borderColor: brandColor + "20" }}>
                <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: brandColor + "20" }}>
                  <Microscope className="h-7 w-7" style={{ color: brandColor }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Mikroskop altında pürüzsüz cilt hücresi</p>
                  <p className="text-xs text-slate-500">Dermatolojik olarak test edilmiştir</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Leaf className="h-4 w-4" style={{ color: brandColor }} /> Doğal Formül
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Kil", "Aloe Vera", "Hyaluronik Asit", "C Vitamini", "Yeşil Çay", "Niasinamid"].map((ing) => (
                    <span key={ing} className="rounded-full px-2.5 py-1 text-[10px] font-medium border" style={{ backgroundColor: brandColor + "10", borderColor: brandColor + "20", color: brandColor }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews & Products Section ───────────────────────────────────── */}
      <section className="py-6 md:py-8" style={{ backgroundColor: brandColor + "06" }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">

          {/* Section header */}
          <div className="text-center mb-5">
            <p className="text-xs font-semibold mb-1 tracking-wider" style={{ color: brandColor }}>PSİKOLOJİK ETKİ</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mb-1">
              Cilt Pürüzleri Sosyal Kaygıyı Artırıyor
            </h2>
            <p className="text-base md:text-lg font-bold" style={{ color: brandColor }}>
              Pürüzsüz Cilt ile Güveninizi Geri Kazanın
            </p>
            <p className="max-w-2xl mx-auto text-xs md:text-sm text-slate-600 mt-2 leading-relaxed">
              Cilt sağlığı sadece fiziksel değil, psikolojik bir süreçtir. Yapılan araştırmalar, pürüzsüz ve nemli bir cildin sosyal ortamlarda özgüveni %84'e kadar artırdığını kanıtlıyor. GlowMask ile her güne daha güvenli başlayın.
            </p>
            <div className="inline-block mt-3 rounded-full px-3 py-1" style={{ backgroundColor: brandColor + "15" }}>
              <span className="text-xs font-bold" style={{ color: brandColor }}>1 Ayda Cilt Değişimi İmkanı</span>
            </div>
          </div>

          {/* Reviews header row */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-base font-bold text-slate-900">{avgRating}</span>
              </div>
              <p className="text-xs text-slate-500"><span className="font-bold text-slate-900">12,000+</span> müşteri yorumu</p>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: brandColor }}>
              <Users className="h-3 w-3" />
              <span className="font-semibold">98% Mutlu Müşteri</span>
            </div>
          </div>

          {/* Reviews grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4">
            {allReviews.map((review) => (
              <div
                key={review.id}
                className={cn(
                  "bg-white rounded-xl p-3 shadow-sm border border-slate-100",
                  review.id > 3 && !showAllReviews ? "hidden md:block" : "block"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ backgroundColor: brandColor }}>
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{review.name}</p>
                    <div className="flex items-center gap-1">
                      <StarRating rating={review.rating} />
                      <span className="text-[9px] text-slate-400">{review.days} gün</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">"{review.text}"</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1" style={{ color: brandColor }}>
                    <ThumbsUp className="h-2.5 w-2.5" />
                    <span className="text-[9px] font-semibold">Faydalı</span>
                  </div>
                  {review.verified && (
                    <span className="text-[8px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">✓ Doğrulandı</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show more/less — mobile only */}
          <div className="text-center md:hidden mb-8">
            {!showAllReviews ? (
              <button
                onClick={() => setShowAllReviews(true)}
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                Devamını Göster ({allReviews.length - 3} yorum daha)
                <ChevronRight className="h-3 w-3" />
              </button>
            ) : (
              <button
                onClick={() => setShowAllReviews(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"
              >
                Az Göster
              </button>
            )}
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg md:text-xl font-black text-center text-slate-900 mb-5">
              {settings?.productsTitle || "Paketleri İncele"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, idx) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <div
                    key={product.id}
                    className={cn(
                      "relative rounded-xl p-4 text-center border transition-all cursor-pointer",
                      isSelected ? "shadow-md scale-[1.01]" : "bg-white border-slate-100 shadow-sm"
                    )}
                    style={isSelected ? { borderColor: brandColor, backgroundColor: brandColor + "02" } : {}}
                    onClick={() => setSelectedProduct(product)}
                  >
                    {idx === 1 && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold text-white whitespace-nowrap" style={{ backgroundColor: brandColor }}>
                        En Popüler
                      </div>
                    )}
                    <div className="mx-auto mb-2 h-16 w-16 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{product.name}</h4>
                    <div className="my-2">
                      <span className="text-xl font-black" style={isSelected ? { color: brandColor } : {}}>
                        {formatCurrency(product.price)}
                      </span>
                      {product.oldPrice && (
                        <>
                          <span className="text-xs text-slate-400 line-through ml-1">{formatCurrency(product.oldPrice)}</span>
                          <span className="ml-1 inline-block rounded-full px-1 py-0.5 text-[8px] font-bold text-white" style={{ backgroundColor: brandColor }}>
                            -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); scrollToOrder(product); }}
                      className="w-full rounded-lg py-2 text-xs font-bold text-white transition-all active:scale-95"
                      style={{ backgroundColor: brandColor }}
                    >
                      {isSelected ? "✓ Seçildi" : "Seç"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Order Form ───────────────────────────────────────────────────── */}
      <section className="py-8 md:py-12" style={{ backgroundColor: bgColor }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Kapıda Ödeme</h2>
            <p className="text-sm text-slate-500 mt-1">Formu doldurun, 3 gün içinde kapınıza gelsin!</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
            {/* Left – info */}
            <div className="order-2 lg:order-1 space-y-4">
              <div className="rounded-xl border border-slate-100 p-5" style={{ backgroundColor: brandColor + "04" }}>
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" style={{ color: brandColor }} />
                  Teslimat Bilgileri
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">✓ Kapıda ödeme imkanı</li>
                  <li className="flex items-center gap-2">✓ 3 iş günü içinde teslimat</li>
                  <li className="flex items-center gap-2">✓ Kargoyu kontrol edip ödeyin</li>
                  <li className="flex items-center gap-2">✓ 14:00'a kadar siparişler aynı gün kargoda</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-100 p-5 bg-white">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" style={{ color: brandColor }} />
                  Neden Kapıda Ödeme?
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  Online alışverişlerinizde güvenli ödeme yöntemi. Ürününüzü teslim aldıktan sonra ödemenizi yaparsınız.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  <span>Kredi kartı bilgileriniz paylaşılmaz</span>
                </div>
              </div>
            </div>

            {/* Right – form */}
            <div
              ref={orderFormRef}
              className="order-1 lg:order-2 rounded-xl border border-slate-200 bg-white p-5 shadow-lg"
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-10 text-center"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: brandColor + "15" }}>
                      <CheckCircle2 className="h-8 w-8" style={{ color: brandColor }} />
                    </div>
                    <h3 className="mb-2 text-xl font-black text-slate-900">Siparişiniz Alındı!</h3>
                    <p className="text-sm text-slate-500">
                      Siparişiniz sisteme işlendi. En kısa sürede size ulaşacağız. Kapıda ödeme için hazır olun!
                    </p>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                    {/* Selected product preview */}
                    {selectedProduct ? (
                      <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3" style={{ backgroundColor: brandColor + "04" }}>
                        <div className="h-12 w-12 shrink-0 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: brandColor + "15" }}>
                          {selectedProduct.image ? (
                            <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5" style={{ color: brandColor }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: brandColor }}>Seçilen Paket</p>
                          <p className="truncate font-bold text-slate-900 text-sm">{selectedProduct.name}</p>
                          <p className="text-base font-black" style={{ color: brandColor }}>{formatCurrency(selectedProduct.price)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-center">
                        <p className="text-xs font-semibold text-rose-500">Lütfen bir paket seçin</p>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField label="Ad Soyad" required placeholder="Adınız Soyadınız" icon={Users} value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                      <InputField label="Telefon" required type="tel" placeholder="05XX XXX XX XX" icon={Phone} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    <InputField label="E-posta" required type="email" placeholder="ad@ornek.com" icon={Mail} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField label="İl / Şehir" required placeholder="İstanbul" icon={MapPin} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                      <InputField label="İlçe" required placeholder="Kadıköy" icon={Building2} value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField label="Mahalle" placeholder="Mahalle adı" icon={HomeIcon} value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} />
                      <InputField label="Posta Kodu" placeholder="34000" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InputField label="Adres" required placeholder="Cadde, sokak" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                      <InputField label="Kapı No" required placeholder="Apartman, daire no" value={formData.doorNumber} onChange={(e) => setFormData({ ...formData, doorNumber: e.target.value })} />
                    </div>

                    <div className="rounded-lg p-3 text-center border" style={{ backgroundColor: brandColor + "08", borderColor: brandColor + "20" }}>
                      <p className="text-sm font-semibold" style={{ color: brandColor }}>💳 Kapıda Ödeme</p>
                      <p className="text-xs text-slate-500 mt-0.5">Siparişiniz kapınıza geldiğinde ödemenizi nakit veya kart ile yapabilirsiniz.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedProduct}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
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
                          <ShoppingCart className="h-4 w-4" />
                          Siparişi Tamamla
                        </>
                      )}
                    </button>

                    <p className="text-center text-[10px] text-slate-400">
                      🔒 Tüm bilgileriniz 256-bit SSL ile şifrelenir
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-6" style={{ backgroundColor: brandColor + "04" }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: brandColor }}>
                <Leaf className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-black text-slate-800">{settings?.title || "GlowMask"}</span>
            </div>

            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/masketermo/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://wa.me/905434352256" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href="mailto:masketermo@gmail.com" className="text-slate-400 hover:text-slate-600 transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              {settings?.footerText || `© ${new Date().getFullYear()} ${settings?.title || "GlowMask"}. Tüm hakları saklıdır.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}