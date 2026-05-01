export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string; // Base64
  stock: number;
  featured?: boolean;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  totalPrice: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: number;
}

export interface SiteSettings {
  title: string;
  description: string;
  bannerTitle: string;
  bannerSubtitle: string;
  phone: string;
  whatsapp: string;
  footerText: string;
  announcement: string;
  announcementActive: boolean;
  heroImage: string;
  logo: string;
  brandColor: string;
  featuresTitle: string;
  featuresSubtitle: string;
  productsTitle: string;
  productsSubtitle: string;
  orderTitle: string;
  orderSubtitle: string;
}
