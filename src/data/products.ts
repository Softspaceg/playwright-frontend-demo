export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji: string;
  description: string;
}

export const products: Product[] = [
  { id: 1, name: 'Wireless Headphones', price: 129.99, category: 'Electronics', emoji: '🎧', description: 'Noise-cancelling over-ear headphones with 30h battery.' },
  { id: 2, name: 'Smart Watch', price: 199.0, category: 'Electronics', emoji: '⌚', description: 'Fitness tracking, heart rate, and notifications.' },
  { id: 3, name: 'Bluetooth Speaker', price: 59.5, category: 'Electronics', emoji: '🔊', description: 'Portable waterproof speaker with deep bass.' },
  { id: 4, name: 'Laptop Stand', price: 34.99, category: 'Accessories', emoji: '💻', description: 'Adjustable aluminium stand for better posture.' },
  { id: 5, name: 'Mechanical Keyboard', price: 89.0, category: 'Accessories', emoji: '⌨️', description: 'Hot-swappable switches and RGB backlight.' },
  { id: 6, name: 'Coffee Mug', price: 12.0, category: 'Home', emoji: '☕', description: 'Ceramic mug, 350ml, dishwasher safe.' },
  { id: 7, name: 'Desk Lamp', price: 42.25, category: 'Home', emoji: '💡', description: 'LED lamp with three brightness levels.' },
  { id: 8, name: 'Indoor Plant', price: 24.99, category: 'Home', emoji: '🪴', description: 'Low-maintenance plant in a ceramic pot.' },
  { id: 9, name: 'Running Shoes', price: 110.0, category: 'Clothing', emoji: '👟', description: 'Lightweight shoes with cushioned soles.' },
  { id: 10, name: 'Hoodie', price: 49.99, category: 'Clothing', emoji: '🧥', description: 'Soft cotton hoodie, unisex fit.' },
  { id: 11, name: 'Baseball Cap', price: 19.99, category: 'Clothing', emoji: '🧢', description: 'Adjustable cap with curved brim.' },
  { id: 12, name: 'Backpack', price: 74.0, category: 'Accessories', emoji: '🎒', description: 'Water-resistant backpack with laptop sleeve.' },
];

export const categories = [...new Set(products.map((p) => p.category))].sort();

const CUSTOM_PRODUCTS_KEY = 'demo_products';

/** Products added from the "Add product" dialog, persisted in localStorage. */
export function loadCustomProducts(): Product[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomProducts(custom: Product[]) {
  localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(custom));
}
