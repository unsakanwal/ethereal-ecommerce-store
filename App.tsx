
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  User as UserIcon, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft,
  Search,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { 
  Product, 
  CartItem, 
  User, 
  ViewState, 
  ShippingAddress,
  Order
} from './types';
import { 
  INITIAL_PRODUCTS, 
  CATEGORIES, 
  SHIPPING_COST, 
  TAX_RATE 
} from './constants';
import { getStylistAdvice } from './services/gemini';

// --- Sub-components (defined outside to avoid re-renders) ---

const Button = ({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary", 
  disabled = false,
  type = "button"
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string, 
  variant?: "primary" | "secondary" | "outline",
  disabled?: boolean,
  type?: "button" | "submit"
}) => {
  const baseStyles = "px-6 py-3 text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50 font-medium";
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    outline: "border border-zinc-200 text-zinc-900 hover:bg-zinc-50"
  };
  
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="flex flex-col space-y-1 mb-4">
    <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{label}</label>
    <input 
      className="border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none transition-colors text-sm" 
      {...props} 
    />
  </div>
);

// --- Main App ---

export default function App() {
  // State
  const [view, setView] = useState<ViewState>('home');
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ethereal_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('ethereal_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ethereal_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stylistAdvice, setStylistAdvice] = useState<string>('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ethereal_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist Data
  useEffect(() => {
    localStorage.setItem('ethereal_products', JSON.stringify(products));
    localStorage.setItem('ethereal_cart', JSON.stringify(cart));
    localStorage.setItem('ethereal_user', JSON.stringify(user));
    localStorage.setItem('ethereal_orders', JSON.stringify(orders));
  }, [products, cart, user, orders]);

  // Derived State
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + (subtotal > 0 ? SHIPPING_COST : 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Handlers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product);
    setView('product');
    setStylistAdvice('');
    setIsLoadingAdvice(true);
    const advice = await getStylistAdvice(product.name, product.category);
    setStylistAdvice(advice);
    setIsLoadingAdvice(false);
    window.scrollTo(0, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      setView('auth');
    } else {
      setView('checkout');
    }
    setIsCartOpen(false);
  };

  const completeOrder = (address: ShippingAddress) => {
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId: user?.id || 'guest',
      items: [...cart],
      total,
      status: 'pending',
      date: new Date().toISOString(),
      shippingAddress: address
    };
    
    // Update Inventory
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(ci => ci.id === p.id);
      if (cartItem) {
        return { ...p, inventory: Math.max(0, p.inventory - cartItem.quantity) };
      }
      return p;
    }));

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setView('home');
    alert(`Order Placed! Your order number is ${newOrder.id}`);
  };

  // Views

  const Nav = () => (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <button onClick={() => setIsMenuOpen(true)} className="p-1 hover:bg-zinc-50 rounded-full">
          <Menu size={20} />
        </button>
        <button onClick={() => { setView('home'); window.scrollTo(0, 0); }} className="text-xl tracking-[0.2em] font-light uppercase">
          Ethereal
        </button>
      </div>
      
      <div className="hidden md:flex items-center space-x-8 text-[11px] uppercase tracking-widest font-medium">
        <button onClick={() => setView('catalog')} className="hover:text-zinc-500 transition-colors">Shop All</button>
        <button onClick={() => { setSelectedCategory('Outerwear'); setView('catalog'); }} className="hover:text-zinc-500 transition-colors">Outerwear</button>
        <button onClick={() => { setSelectedCategory('Knitwear'); setView('catalog'); }} className="hover:text-zinc-500 transition-colors">Knitwear</button>
      </div>

      <div className="flex items-center gap-4">
        {user?.role === 'admin' && (
          <button onClick={() => setView('admin')} className="text-[10px] uppercase tracking-widest border border-zinc-900 px-2 py-1 hover:bg-zinc-900 hover:text-white transition-all">
            Admin
          </button>
        )}
        <button onClick={() => user ? setView('auth') : setView('auth')} className="p-1 hover:bg-zinc-50 rounded-full relative">
          <UserIcon size={20} />
          {user && <span className="absolute top-0 right-0 w-2 h-2 bg-zinc-900 rounded-full border border-white"></span>}
        </button>
        <button onClick={() => setIsCartOpen(true)} className="p-1 hover:bg-zinc-50 rounded-full relative">
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-zinc-900 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );

  const HomeView = () => (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative h-[85vh] overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          alt="Hero"
        />
        <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center text-white p-6">
          <h2 className="text-5xl md:text-7xl font-serif mb-6 text-center animate-fade-in">Modern Essentials</h2>
          <p className="text-sm md:text-lg tracking-[0.3em] uppercase mb-8 text-center">Collection 2025</p>
          <Button onClick={() => setView('catalog')} variant="outline" className="bg-white/10 backdrop-blur-md border-white text-white hover:bg-white hover:text-zinc-900 px-10">
            Explore Collection
          </Button>
        </div>
      </section>

      {/* Featured Grid */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mb-2 block">Curation</span>
            <h3 className="text-3xl font-serif">Seasonal Highlights</h3>
          </div>
          <button onClick={() => setView('catalog')} className="text-xs uppercase tracking-widest border-b border-zinc-900 pb-1 flex items-center gap-2 group">
            View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {products.filter(p => p.featured).slice(0, 3).map(product => (
            <div key={product.id} className="group cursor-pointer" onClick={() => handleProductClick(product)}>
              <div className="aspect-[3/4] overflow-hidden bg-zinc-100 mb-4">
                <img 
                  src={product.image} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  alt={product.name}
                />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium tracking-wide mb-1 uppercase">{product.name}</h4>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">{product.category}</p>
                </div>
                <span className="text-sm font-light">${product.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Section */}
      <section className="bg-zinc-50 py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <h3 className="text-4xl font-serif mb-6 leading-tight">The Art of<br/>Quiet Luxury</h3>
            <p className="text-zinc-600 leading-relaxed mb-8 max-w-md">
              Our philosophy is rooted in the pursuit of perfection. Every seam, every button, and every fiber is chosen to ensure longevity and comfort. We believe in buying less, but better.
            </p>
            <div className="flex gap-12">
              <div>
                <span className="block text-2xl font-serif mb-1">100%</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Natural Fibers</span>
              </div>
              <div>
                <span className="block text-2xl font-serif mb-1">Fair</span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Production</span>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 aspect-square md:aspect-[4/5] overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover" 
              alt="Editorial"
            />
          </div>
        </div>
      </section>
    </div>
  );

  const CatalogView = () => (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="text-4xl font-serif mb-8">Collections</h2>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
          <div className="flex flex-wrap gap-4">
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] uppercase tracking-widest px-4 py-2 border rounded-full transition-all ${selectedCategory === cat ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-transparent text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border-b border-zinc-200 focus:border-zinc-900 outline-none text-[10px] tracking-widest w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {filteredProducts.map(product => (
          <div key={product.id} className="group cursor-pointer" onClick={() => handleProductClick(product)}>
            <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 mb-4">
              <img 
                src={product.image} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={product.name}
              />
              {product.inventory < 5 && (
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 text-[9px] uppercase tracking-tighter text-red-600 font-bold">
                  Low Stock
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">{product.category}</span>
              <h4 className="text-xs font-medium tracking-wide uppercase mb-1">{product.name}</h4>
              <span className="text-xs font-light">${product.price}</span>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-400 italic">
            No items found matching your selection.
          </div>
        )}
      </div>
    </div>
  );

  const ProductDetailView = () => {
    if (!selectedProduct) return null;
    return (
      <div className="pt-20 pb-20 px-6 max-w-7xl mx-auto">
        <button 
          onClick={() => setView('catalog')}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-12 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Catalog
        </button>

        <div className="grid md:grid-cols-12 gap-12">
          {/* Images */}
          <div className="md:col-span-7 space-y-4">
            <div className="aspect-[4/5] bg-zinc-100">
              <img src={selectedProduct.image} className="w-full h-full object-cover" alt={selectedProduct.name} />
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-5 flex flex-col pt-4">
            <span className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 mb-2">{selectedProduct.category}</span>
            <h1 className="text-3xl font-serif mb-4 leading-tight">{selectedProduct.name}</h1>
            <p className="text-xl font-light mb-8">${selectedProduct.price}</p>
            
            <div className="space-y-6 mb-12">
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-900 mb-3 font-semibold">Description</h3>
                <p className="text-sm text-zinc-600 leading-relaxed font-light">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="bg-zinc-50 p-6 border-l-2 border-zinc-900 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-zinc-900" />
                  <h3 className="text-[10px] uppercase tracking-widest text-zinc-900 font-bold">Stylist Advice</h3>
                  <span className="text-[9px] px-1.5 py-0.5 bg-zinc-900 text-white rounded font-mono ml-auto">AI POWERED</span>
                </div>
                {isLoadingAdvice ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 animate-pulse">
                    Consulting our digital atelier...
                  </div>
                ) : (
                  <p className="text-xs text-zinc-800 leading-relaxed italic">
                    "{stylistAdvice}"
                  </p>
                )}
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <Button 
                onClick={() => addToCart(selectedProduct)}
                disabled={selectedProduct.inventory === 0}
                className="w-full"
              >
                {selectedProduct.inventory > 0 ? 'Add to Shopping Bag' : 'Sold Out'}
              </Button>
              <div className="flex items-center justify-center gap-8 py-4 border-t border-b border-zinc-100">
                <div className="text-center">
                  <span className="block text-[9px] uppercase tracking-widest text-zinc-400">Inventory</span>
                  <span className="text-xs font-medium">{selectedProduct.inventory > 0 ? `${selectedProduct.inventory} available` : 'Out of Stock'}</span>
                </div>
                <div className="text-center">
                  <span className="block text-[9px] uppercase tracking-widest text-zinc-400">Shipping</span>
                  <span className="text-xs font-medium">Global Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CheckoutView = () => {
    const [step, setStep] = useState(1);
    const [address, setAddress] = useState<ShippingAddress>({
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      zipCode: '',
      country: ''
    });

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (step === 1) setStep(2);
      else completeOrder(address);
    };

    return (
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-serif mb-12 text-center">Checkout</h2>
        
        <div className="flex items-center justify-center mb-12">
          <div className={`flex items-center ${step >= 1 ? 'text-zinc-900' : 'text-zinc-300'}`}>
            <span className={`w-8 h-8 rounded-full border flex items-center justify-center mr-3 ${step >= 1 ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300'}`}>1</span>
            <span className="text-xs uppercase tracking-widest font-medium">Shipping</span>
          </div>
          <div className="w-12 h-px bg-zinc-200 mx-4"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-zinc-900' : 'text-zinc-300'}`}>
            <span className={`w-8 h-8 rounded-full border flex items-center justify-center mr-3 ${step >= 2 ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300'}`}>2</span>
            <span className="text-xs uppercase tracking-widest font-medium">Payment</span>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-7">
            <form onSubmit={handleFormSubmit}>
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="First Name" required value={address.firstName} onChange={e => setAddress({...address, firstName: e.target.value})} />
                    <Input label="Last Name" required value={address.lastName} onChange={e => setAddress({...address, lastName: e.target.value})} />
                  </div>
                  <Input label="Address" required value={address.address} onChange={e => setAddress({...address, address: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="City" required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                    <Input label="Zip Code" required value={address.zipCode} onChange={e => setAddress({...address, zipCode: e.target.value})} />
                  </div>
                  <Input label="Country" required value={address.country} onChange={e => setAddress({...address, country: e.target.value})} />
                  <Button type="submit" className="w-full mt-6">Continue to Payment</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 border border-zinc-200 rounded-lg">
                    <h3 className="text-sm uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                      <Lock size={14} /> Payment Details
                    </h3>
                    <Input label="Card Number" placeholder="0000 0000 0000 0000" required />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Expiry Date" placeholder="MM/YY" required />
                      <Input label="CVC" placeholder="123" required />
                    </div>
                  </div>
                  <div className="bg-zinc-50 p-6">
                    <h4 className="text-[10px] uppercase tracking-widest mb-2 text-zinc-500">Shipping To</h4>
                    <p className="text-xs">{address.firstName} {address.lastName}</p>
                    <p className="text-xs">{address.address}, {address.city}, {address.zipCode}</p>
                    <button type="button" onClick={() => setStep(1)} className="text-[10px] uppercase underline mt-2">Edit Info</button>
                  </div>
                  <Button type="submit" className="w-full">Complete Purchase (${total.toFixed(2)})</Button>
                </div>
              )}
            </form>
          </div>

          <div className="md:col-span-5 bg-zinc-50 p-8 h-fit">
            <h3 className="text-xs uppercase tracking-[0.2em] mb-6 font-bold pb-4 border-b border-zinc-200">Order Summary</h3>
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-zinc-600">{item.name} x {item.quantity}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-xs border-t border-zinc-200 pt-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Shipping</span>
                <span>${SHIPPING_COST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-medium pt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AdminView = () => {
    const [newItem, setNewItem] = useState<Partial<Product>>({
      name: '', category: 'Tops', price: 0, description: '', image: '', inventory: 0
    });

    const addProduct = (e: React.FormEvent) => {
      e.preventDefault();
      const product: Product = {
        ...newItem as Product,
        id: Math.random().toString(36).substr(2, 9)
      };
      setProducts(prev => [...prev, product]);
      setNewItem({ name: '', category: 'Tops', price: 0, description: '', image: '', inventory: 0 });
      alert("Product added successfully!");
    };

    return (
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif mb-12">Admin Dashboard</h2>
        
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Inventory Table */}
          <div className="lg:col-span-8 overflow-x-auto">
            <h3 className="text-xs uppercase tracking-widest mb-6 font-bold">Inventory Management</h3>
            <table className="w-full text-left text-xs uppercase tracking-widest">
              <thead className="border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="py-4 font-normal">Product</th>
                  <th className="py-4 font-normal">Stock</th>
                  <th className="py-4 font-normal">Price</th>
                  <th className="py-4 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} className="w-10 h-10 object-cover" />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={p.inventory < 5 ? 'text-red-500 font-bold' : ''}>{p.inventory}</span>
                    </td>
                    <td className="py-4">${p.price}</td>
                    <td className="py-4">
                      <button 
                        onClick={() => setProducts(prev => prev.filter(i => i.id !== p.id))}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Product Form */}
          <div className="lg:col-span-4 bg-zinc-50 p-8 h-fit">
            <h3 className="text-xs uppercase tracking-widest mb-6 font-bold">Add New Item</h3>
            <form onSubmit={addProduct} className="space-y-4">
              <Input label="Name" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <div className="flex flex-col space-y-1 mb-4">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Category</label>
                <select 
                  className="bg-transparent border-b border-zinc-200 py-2 outline-none text-sm"
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price ($)" type="number" required value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                <Input label="Stock" type="number" required value={newItem.inventory} onChange={e => setNewItem({...newItem, inventory: Number(e.target.value)})} />
              </div>
              <Input label="Image URL" required value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
              <div className="flex flex-col space-y-1 mb-4">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Description</label>
                <textarea 
                  className="bg-transparent border-b border-zinc-200 py-2 outline-none text-sm resize-none h-24"
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full mt-4">Publish Item</Button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const AuthView = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulation of auth
      const mockUser: User = {
        id: 'user_123',
        email,
        name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user'
      };
      setUser(mockUser);
      setView('home');
      alert(`Welcome, ${mockUser.name}!`);
    };

    return (
      <div className="pt-32 pb-20 px-6 max-w-md mx-auto">
        <h2 className="text-3xl font-serif mb-12 text-center">{isLogin ? 'Sign In' : 'Register'}</h2>
        <form onSubmit={handleAuth} className="space-y-6">
          <Input label="Email Address" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" className="w-full">{isLogin ? 'Enter Atelier' : 'Create Account'}</Button>
        </form>
        <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-500 mb-4">
            {isLogin ? "Don't have an account?" : "Already registered?"}
          </p>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] uppercase tracking-widest font-bold underline"
          >
            {isLogin ? 'Join the Community' : 'Sign in to your Profile'}
          </button>
        </div>
        {user && (
          <div className="mt-8 text-center">
             <button onClick={() => { setUser(null); setView('home'); }} className="text-red-500 text-[10px] uppercase tracking-widest">Logout</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white selection:bg-zinc-900 selection:text-white">
      <Nav />
      
      <main>
        {view === 'home' && <HomeView />}
        {view === 'catalog' && <CatalogView />}
        {view === 'product' && <ProductDetailView />}
        {view === 'checkout' && <CheckoutView />}
        {view === 'admin' && <AdminView />}
        {view === 'auth' && <AuthView />}
      </main>

      {/* Cart Sidebar */}
      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-500 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col p-8">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-xs uppercase tracking-[0.3em] font-bold">Shopping Bag ({cartCount})</h3>
              <button onClick={() => setIsCartOpen(false)}><X size={20} /></button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-8 pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-24 aspect-[3/4] bg-zinc-100 flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-[10px] uppercase tracking-widest font-bold">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">{item.category}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-zinc-200">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-zinc-50"><Minus size={12} /></button>
                        <span className="px-3 text-[10px]">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-zinc-50"><Plus size={12} /></button>
                      </div>
                      <span className="text-sm font-light">${item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400 italic">
                  <ShoppingBag size={48} className="mb-4 opacity-10" />
                  Your bag is empty.
                </div>
              )}
            </div>

            <div className="mt-auto pt-8 border-t border-zinc-100 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-widest text-zinc-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-400">
                  <span>Shipping & Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <Button onClick={handleCheckout} disabled={cart.length === 0} className="w-full">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu Sidebar */}
      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
        <div className={`absolute left-0 top-0 h-full w-full max-w-xs bg-white shadow-2xl transition-transform duration-500 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col p-8">
            <div className="flex justify-end mb-12">
              <button onClick={() => setIsMenuOpen(false)}><X size={20} /></button>
            </div>
            <div className="space-y-8">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => { setSelectedCategory(cat); setView('catalog'); setIsMenuOpen(false); }}
                  className="block text-2xl font-serif hover:italic transition-all w-full text-left"
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="mt-auto space-y-4 text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-400">
              <button className="block hover:text-zinc-900 transition-colors">About the Studio</button>
              <button className="block hover:text-zinc-900 transition-colors">Sustainability</button>
              <button className="block hover:text-zinc-900 transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h4 className="text-white text-xl tracking-[0.2em] uppercase font-light mb-8">Ethereal</h4>
            <p className="text-sm leading-relaxed max-w-sm mb-8">
              Redefining the modern wardrobe with a focus on quality, comfort, and longevity. Designed in our studio for the intentional individual.
            </p>
            <div className="flex items-center gap-4 text-white">
              <span className="text-[10px] uppercase tracking-widest cursor-pointer hover:underline">Instagram</span>
              <span className="text-[10px] uppercase tracking-widest cursor-pointer hover:underline">Pinterest</span>
              <span className="text-[10px] uppercase tracking-widest cursor-pointer hover:underline">LinkedIn</span>
            </div>
          </div>
          <div>
            <h5 className="text-[10px] uppercase tracking-[0.3em] text-white mb-6 font-bold">Client Care</h5>
            <ul className="space-y-3 text-[11px] uppercase tracking-widest">
              <li><button className="hover:text-white transition-colors">Shipping Info</button></li>
              <li><button className="hover:text-white transition-colors">Returns & Exchanges</button></li>
              <li><button className="hover:text-white transition-colors">Size Guide</button></li>
              <li><button className="hover:text-white transition-colors">FAQs</button></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] uppercase tracking-[0.3em] text-white mb-6 font-bold">Newsletter</h5>
            <p className="text-[11px] mb-4">Receive updates on new collections and editorial stories.</p>
            <div className="flex border-b border-zinc-700 pb-2">
              <input type="email" placeholder="YOUR EMAIL" className="bg-transparent text-[10px] outline-none flex-grow" />
              <button className="text-[10px] uppercase tracking-widest font-bold">Join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between gap-4 text-[9px] uppercase tracking-widest">
          <span>&copy; 2025 Ethereal Studio. All Rights Reserved.</span>
          <div className="flex gap-6">
            <button className="hover:text-white transition-colors">Privacy Policy</button>
            <button className="hover:text-white transition-colors">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
