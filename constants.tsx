
import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Oversized Wool Blend Coat',
    category: 'Outerwear',
    price: 350,
    description: 'A timeless silhouette crafted from a heavy wool blend. Features structured shoulders and deep patch pockets.',
    image: 'https://images.unsplash.com/photo-1539533377285-a92cc867182f?q=80&w=800&auto=format&fit=crop',
    inventory: 12,
    featured: true
  },
  {
    id: '2',
    name: 'Relaxed Silk Shirt',
    category: 'Tops',
    price: 180,
    description: '100% mulberry silk with a sandwashed finish for a matte, fluid drape.',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=800&auto=format&fit=crop',
    inventory: 45
  },
  {
    id: '3',
    name: 'Straight Leg Raw Denim',
    category: 'Trousers',
    price: 145,
    description: 'Premium Japanese selvedge denim. Designed to age beautifully with a classic mid-rise fit.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop',
    inventory: 20
  },
  {
    id: '4',
    name: 'Cashmere Mock Neck Sweater',
    category: 'Knitwear',
    price: 220,
    description: 'Luxuriously soft Grade-A Mongolian cashmere in a refined mock neck silhouette.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop',
    inventory: 8,
    featured: true
  },
  {
    id: '5',
    name: 'Minimalist Leather Tote',
    category: 'Accessories',
    price: 295,
    description: 'Full-grain Italian leather with invisible stitching. Spacious enough for all daily essentials.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    inventory: 15
  },
  {
    id: '6',
    name: 'Chunky Chelsea Boots',
    category: 'Footwear',
    price: 260,
    description: 'Rugged yet refined. Featuring a recycled rubber lug sole and elastic side panels.',
    image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=800&auto=format&fit=crop',
    inventory: 10
  }
];

export const CATEGORIES = ['All', 'Outerwear', 'Tops', 'Trousers', 'Knitwear', 'Accessories', 'Footwear'];

export const SHIPPING_COST = 15;
export const TAX_RATE = 0.085; // 8.5%
