import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Product, Service, StoreConfig } from '../../types/store';
import { cn, formatCurrency } from '../../lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: (Product | Service)[];
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  config: StoreConfig;
}

export const CartDrawer = ({ isOpen, onClose, items, onRemoveItem, onCheckout, config }: CartDrawerProps) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[80] shadow-2xl flex flex-col font-sans"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-[#00AEEF]" size={24} />
                <h2 className="text-xl font-bold">Your Cart</h2>
                <span className="bg-[#00AEEF]/10 text-[#00AEEF] text-xs font-bold px-2 py-1 rounded-full">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingBag size={32} />
                  </div>
                  <div>
                    <p className="font-bold">Your cart is empty</p>
                    <p className="text-sm">Start adding items to see them here.</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-[#00AEEF] font-bold text-sm hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4 group">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {('imageUrl' in item && item.imageUrl) ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <button 
                          onClick={() => onRemoveItem(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                      <div className="pt-1 font-bold text-[#00AEEF]">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest text-center">
                  Payments secured by Tikkie
                </p>
                <button 
                  onClick={onCheckout}
                  className={cn(
                    "w-full py-4 bg-[#00AEEF] text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-[#0099DD] transition-all shadow-lg shadow-[#00AEEF]/20",
                    config.theme === 'streetwear' && "rounded-none uppercase italic",
                    config.theme === 'minimalist' && "rounded-sm"
                  )}
                >
                  Confirm & Pay
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
