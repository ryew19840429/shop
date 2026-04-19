/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeType = 'minimalist' | 'playful' | 'streetwear' | 'sophisticated' | 'natural';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  variants?: {
    label: string;
    options: string[];
    inventory: Record<string, number>;
  }[];
  isOutOfStock: boolean;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  availableHours: string[]; // e.g. ["09:00", "10:00", ...]
  description: string;
  imageUrl?: string;
}

export interface StoreConfig {
  id: string;
  name: string;
  tagline: string;
  logo?: string;
  bannerImage?: string;
  primaryColor: string;
  secondaryColor: string;
  theme: ThemeType;
  layout: 'grid' | 'calendar';
  modules: {
    type: 'product' | 'service';
    items: (Product | Service)[];
  };
  seo: {
    title: string;
    description: string;
  };
}

export interface Order {
  id: string;
  shopId: string;
  itemName: string;
  amount: number;
  status: 'paid' | 'pending';
  createdAt: string;
  customerEmail?: string;
}
