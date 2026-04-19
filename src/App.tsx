/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { StoreConfig, Product, Service } from './types/store';
import { PRESETS } from './constants/presets';
import { ThemeEngine } from './components/layout/ThemeEngine';
import { Navbar } from './components/layout/Navbar';
import { Storefront } from './components/storefront/Storefront';
import { TikkieCheckout } from './components/checkout/TikkieCheckout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartDrawer } from './components/checkout/CartDrawer';
import { motion, AnimatePresence } from 'motion/react';
import { storeService, auth } from './firebase';
import { signInAnonymously } from 'firebase/auth';

export default function App() {
  const [shopId, setShopId] = useState('hairdresser');
  const [config, setConfig] = useState<StoreConfig>(PRESETS.hairdresser);
  const [previewConfig, setPreviewConfig] = useState<StoreConfig | null>(null);
  const [cart, setCart] = useState<(Product | Service)[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<{ name: string; amount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeConfig = previewConfig || config;

  // 1. Initial Auth and First Core Fetch
  useEffect(() => {
    const init = async () => {
      try {
        await signInAnonymously(auth).catch(() => {});
        
        // Only seed if there are NO shops at all
        const existingShops = await storeService.getAllShops();
        if (existingShops.length === 0) {
          const allPresetIds = Object.keys(PRESETS);
          for (const id of allPresetIds) {
             await storeService.saveShopConfig({ ...PRESETS[id], id }).catch(() => {});
          }
        }

        // Load initial shop
        const savedConfig = await storeService.getShopConfig(shopId);
        if (savedConfig) {
          // ONE-TIME SURGICAL REPAIR (Fixing reported 404s)
          const newFixedUrl = 'https://images.unsplash.com/photo-1533281808624-e9b07b4294ff?auto=format&fit=crop&q=80&w=800&h=800';
          
          let needsUpdate = false;
          const items = savedConfig.modules.items.map(item => {
            const url = (item as any).imageUrl || '';
            // Catch any known problematic Unsplash IDs for this item
            if (item.name === 'Stone Bowl' && 
                (url.includes('photo-1610701596') || url.includes('photo-1590422443834'))) {
              needsUpdate = true;
              return { ...item, imageUrl: newFixedUrl };
            }
            return item;
          });

          if (needsUpdate) {
            const updated = { ...savedConfig, modules: { ...savedConfig.modules, items } };
            await storeService.saveShopConfig(updated);
            setConfig(updated);
          } else {
            setConfig(savedConfig);
          }
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []); // Only once on mount

  // 2. Refresh/Subscribe when shopId changes
  useEffect(() => {
    const refreshShop = async () => {
      try {
        const savedConfig = await storeService.getShopConfig(shopId);
        if (savedConfig) {
          setConfig(savedConfig);
        }
      } catch (err) {
        console.error("Background fetch failed:", err);
      }
    };

    if (!isLoading) {
      refreshShop();
    }

    const unsubscribe = storeService.subscribeToShopConfig(shopId, (updatedConfig) => {
      setConfig(updatedConfig);
    });

    return () => unsubscribe();
  }, [shopId, isLoading]);

  const handleAddToCart = (item: Product | Service) => {
    setCart((prev) => [...prev, item]);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckoutCart = () => {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    setCheckoutItem({ name: 'Cart Order', amount: total });
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleInstantBuy = (item: Product | Service) => {
    setCheckoutItem({ name: item.name, amount: item.price });
    setIsCheckoutOpen(true);
  };

  const handleUpdateConfig = async (newConfig: StoreConfig) => {
    try {
      await storeService.saveShopConfig(newConfig);
      // Synchronously update local state to prevent "closing" effects
      setConfig(newConfig);
      setShopId(newConfig.id);
      setPreviewConfig(null);
    } catch (err) {
      alert("Failed to save changes. Please try again.");
    }
  };

  const handleOrderSuccess = async () => {
    if (checkoutItem) {
      await storeService.recordOrder(shopId, {
        itemName: checkoutItem.name,
        amount: checkoutItem.amount,
        status: 'paid'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F7F6F2]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00AEEF] border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-stone-500 animate-pulse uppercase tracking-widest text-xs">Booting Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary selection:text-secondary">
      <ThemeEngine config={activeConfig} />
      
      <Navbar 
        config={activeConfig} 
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className="flex-1">
        <Storefront 
          config={activeConfig} 
          onAddToCart={handleAddToCart}
          onInstantBuy={handleInstantBuy}
        />
      </main>

      {/* Footer / Powered by */}
      <footer className="py-12 px-6 flex flex-col items-center gap-6 border-t border-primary/5 bg-primary/2">
        <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
          <span className="text-xs font-bold uppercase tracking-widest">Powered by</span>
          <div className="w-6 h-6 bg-[#00AEEF] rounded flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
          <span className="text-sm font-bold text-[#00AEEF]">Tikkie</span>
        </div>
      </footer>

      {/* Checkout Modal */}
      <TikkieCheckout 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        amount={checkoutItem?.amount || 0}
        itemName={checkoutItem?.name || ''}
        shopId={shopId}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckoutCart}
        config={activeConfig}
      />

      {/* Admin Dashboard Sidebar / Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60]"
          >
            <AdminDashboard 
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onDraftUpdate={setPreviewConfig}
              onClose={() => {
                setIsAdminOpen(false);
                setPreviewConfig(null); // Reset draft on close
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
