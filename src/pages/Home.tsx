import React, { useState, useEffect, useRef } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../lib/firebase";
import { Product, SiteSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart, Phone, Mail, Instagram, MessageCircle,
  ChevronRight, Truck, ShieldCheck, Star, ArrowRight,
  CheckCircle2, Zap, Package, Award, ChevronDown
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
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur-sm border border-white/10">
      <Icon className="h-3.5 w-3.5 text-white/60" />
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
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-slate-700">
        {label}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 transition-all focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100"
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
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 transition-colors group-focus-within:text-slate-700">
        {label}
      </label>
      <textarea
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 transition-all focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 resize-none"
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

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

  // ─── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    const productsRef = ref(db, "products");
    const settingsRef = ref(db, "settings");

    const unsubProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setProducts(loaded);
        // Only auto-select if user hasn't already chosen
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
    setTimeout(() => orderSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
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

  const brand = settings?.brandColor || "#111827";

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white"
      style={{ "--brand": brand } as React.CSSProperties}
    >
      {/* ── Announcement bar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {settings?.announcementActive && settings.announcement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-900"
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
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              <img src={settings.logo || undefined} alt={settings.title || "Logo"} className="h-9 w-auto object-contain" />
            ) : (
              <>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: brand }}
                >
                  <span className="text-sm font-black">{settings?.title?.[0] || "T"}</span>
                </div>
                <span className="text-base font-black tracking-tight">
                  {settings?.title || "Termo Maske"}
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {settings?.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <button
              onClick={() => orderSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: brand }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Sipariş Ver
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24 md:pt-28 md:pb-36">
        {/* Subtle background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-24">
            {/* Left – copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-6">
                <Badge style={{ color: brand, borderColor: brand + "33", backgroundColor: brand + "0D" }}>
                  <Zap className="h-3 w-3" />
                  Nano Kumaş Teknolojisi
                </Badge>
              </div>

              <h1 className="mb-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
                {settings?.bannerTitle || (
                  <>
                    Geleceğin<br />
                    <span style={{ color: brand }}>Konforu</span><br />
                    Bugünden
                  </>
                )}
              </h1>

              <p className="mb-10 max-w-md text-base leading-relaxed text-slate-500 md:text-lg">
                {settings?.bannerSubtitle ||
                  "Isı dengeleyici nano kumaş teknolojisi ile üretilen Termo Maske, her ortamda ideal sıcaklığı korumanız için tasarlandı."}
              </p>

              {/* Trust signals */}
              <div className="mb-10 flex flex-wrap items-center gap-3">
                <FeaturePill icon={Truck} label="Aynı Gün Kargo" />
                <FeaturePill icon={ShieldCheck} label="Kapıda Ödeme" />
                <FeaturePill icon={Package} label="30 Gün İade" />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => orderSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="group flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: brand }}
                >
                  Şimdi Sipariş Ver
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400"
                >
                  Paketleri İncele
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-4 border-t border-slate-100 pt-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`}
                      alt=""
                      className="h-8 w-8 rounded-full border-2 border-white bg-slate-100"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    <span className="text-slate-900">4.9/5</span> · 2.400+ müşteri
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right – product image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-3xl bg-slate-50 aspect-[4/5] shadow-2xl shadow-slate-200">
                {settings?.heroImage ? (
                  <img src={settings.heroImage || undefined} alt="Ürün" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingCart className="h-24 w-24 text-slate-200" />
                  </div>
                )}
              </div>

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, x: -16, y: 8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute -bottom-6 -left-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl"
              >
                <p className="text-2xl font-black text-slate-900">
                  <span style={{ color: brand }}>99%</span>
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Termal Verimlilik
                </p>
              </motion.div>

              {/* Floating badge top-right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="absolute -top-4 -right-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" style={{ color: brand }} />
                  <span className="text-[11px] font-bold text-slate-700">AB Sertifikalı</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <div className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 divide-x divide-slate-100 md:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "Kapıda Ödeme", sub: "Ürünü kontrol et, öde" },
              { icon: Truck, label: "Aynı Gün Kargo", sub: "14:00'a kadar siparişlerde" },
              { icon: Package, label: "30 Gün İade", sub: "Koşulsuz iade garantisi" },
              { icon: Award, label: "AB Sertifikası", sub: "Kalite belgeli ürün" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: brand + "15", color: brand }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features bento ───────────────────────────────────────────────── */}
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {settings?.featuresSubtitle || "Teknoloji"}
              </p>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                {settings?.featuresTitle || "Detaylarda Gizli\nMükemmellik"}
              </h2>
            </div>
            <p className="max-w-xs text-sm text-slate-500 md:text-right">
              Her bileşen, maksimum konfor ve dayanıklılık için titizlikle seçilmiştir.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            {/* Main feature */}
            <div className="group relative col-span-12 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 md:col-span-7">
              <div className="p-10">
                <div
                  className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: brand, color: "#fff" }}
                >
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900">
                  Akıllı Isı Dengeleme
                </h3>
                <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                  Vücut ısınızı hapseden veya tahliye eden mikro gözenekli doku yapısı ile
                  her mevsim ideal konfor.
                </p>
              </div>
              <div className="h-56 overflow-hidden">
                <img
                  src={settings?.heroImage || products[0]?.image || undefined}
                  alt=""
                  className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Side features */}
            <div className="col-span-12 flex flex-col gap-4 md:col-span-5">
              <div className="flex-1 rounded-3xl bg-slate-900 p-8 text-white">
                <h3 className="mb-6 text-xl font-black tracking-tight">
                  Hava Transfer Teknolojisi
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Geçirgenlik</span>
                    <span className="text-white">85%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "85%" }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: brand }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span>Nem Kontrolü</span>
                    <span className="text-white">92%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "92%" }}
                      transition={{ duration: 1.4, delay: 0.1, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="h-full rounded-full bg-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div
                className="flex-1 rounded-3xl p-8 text-white"
                style={{ backgroundColor: brand }}
              >
                <Truck className="mb-6 h-8 w-8 text-white/80" />
                <h3 className="text-xl font-black tracking-tight">
                  Aynı Gün Express Kargo
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  Saat 14:00'a kadar verilen siparişler aynı gün kargoya verilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────────────────────── */}
      <section id="products" className="border-t border-slate-100 bg-slate-50 py-24 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {settings?.productsSubtitle || "Paket Seçimi"}
            </p>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              {settings?.productsTitle || "İhtiyacınıza Özel Setler"}
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white">
              <p className="text-sm text-slate-400">Ürünler yükleniyor…</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {products.map((product, idx) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.6 }}
                    onClick={() => setSelectedProduct(product)}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-3xl border-2 bg-white transition-all duration-300",
                      isSelected
                        ? "shadow-xl shadow-slate-200 scale-[1.02]"
                        : "border-transparent hover:border-slate-200 hover:shadow-md"
                    )}
                    style={isSelected ? { borderColor: brand } : {}}
                  >
                    {/* Most popular badge */}
                    {idx === 1 && (
                      <div
                        className="absolute top-4 right-4 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: brand }}
                      >
                        En Popüler
                      </div>
                    )}

                    {/* Image */}
                    <div className="overflow-hidden bg-slate-50 aspect-[4/3]">
                      <img
                        src={product.image || undefined}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-7">
                      <h3 className="mb-1.5 text-xl font-black tracking-tight text-slate-900">
                        {product.name}
                      </h3>
                      <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-slate-400">
                        {product.description}
                      </p>

                      <div className="mb-6 flex items-baseline gap-3">
                        <span
                          className="text-3xl font-black tracking-tight"
                          style={{ color: isSelected ? brand : "#111827" }}
                        >
                          {formatCurrency(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-sm font-semibold text-slate-300 line-through">
                            {formatCurrency(product.oldPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        className={cn(
                          "w-full rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300",
                          isSelected
                            ? "text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-white"
                        )}
                        style={isSelected ? { backgroundColor: brand } : {}}
                      >
                        {isSelected ? "✓ Seçildi" : "Seti Seç"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Order form ───────────────────────────────────────────────────── */}
      <section
        id="order"
        ref={orderSectionRef}
        className="border-t border-slate-100 bg-white py-24 md:py-36"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
            {/* Left – info */}
            <div className="lg:pt-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {settings?.orderSubtitle || "Sipariş"}
              </p>
              <h2 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                {settings?.orderTitle || "Güvenli Sipariş"}
              </h2>
              <p className="mb-12 max-w-sm text-base leading-relaxed text-slate-500">
                Tüm siparişleriniz şifreli bağlantı ile iletilir. Ödemenizi kapıda, ürünü
                kontrol ettikten sonra yapabilirsiniz.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Sıfır Risk",
                    desc: "Ödemeyi kapınızda, kargoyu kontrol ederek yapın.",
                  },
                  {
                    icon: Award,
                    title: "Global Standart",
                    desc: "AB standartlarında paketleme ve hijyen kontrolü.",
                  },
                  {
                    icon: Truck,
                    title: "Hızlı Teslimat",
                    desc: "14:00'a kadar siparişlerde aynı gün kargo.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: brand + "15", color: brand }}
                    >
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
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100 md:p-10">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-16 text-center"
                  >
                    <div
                      className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                      style={{ backgroundColor: brand + "15", color: brand }}
                    >
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900">
                      Siparişiniz Alındı!
                    </h3>
                    <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                      Siparişiniz sisteme işlendi. Kurye ekibimiz en kısa sürede sizinle
                      iletişime geçecek.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* Selected product preview */}
                    {selectedProduct ? (
                      <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <img
                            src={selectedProduct.image || undefined}
                            alt={selectedProduct.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Seçilen Paket
                          </p>
                          <p className="truncate font-bold text-slate-900">{selectedProduct.name}</p>
                          <p
                            className="text-lg font-black"
                            style={{ color: brand }}
                          >
                            {formatCurrency(selectedProduct.price)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
                        <p className="text-xs font-semibold text-red-500">
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
                      style={{ backgroundColor: brand }}
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
      <footer className="border-t border-slate-100 bg-slate-50 pb-10 pt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              {settings?.logo ? (
                <img src={settings.logo || undefined} alt="" className="h-8 w-auto" />
              ) : (
                <>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-black"
                    style={{ backgroundColor: brand }}
                  >
                    {settings?.title?.[0] || "T"}
                  </div>
                  <span className="font-black tracking-tight text-slate-900">
                    {settings?.title || "Termo Maske"}
                  </span>
                </>
              )}
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-4">
              {[Instagram, MessageCircle, Mail].map((Icon, i) => (
                <button
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 border-t border-slate-100 pt-8 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-400">
              {settings?.footerText ||
                `© ${new Date().getFullYear()} ${settings?.title || "Termo Maske"}. Tüm hakları saklıdır.`}
            </p>
            <nav className="flex flex-wrap gap-6">
              {["Mesafeli Satış", "KVKK", "Hakkımızda", "İletişim"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-xs text-slate-400 transition-colors hover:text-slate-900"
                >
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