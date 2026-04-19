import { motion } from 'motion/react';
import { StoreConfig, Product, Service } from '../../types/store';
import { cn, formatCurrency } from '../../lib/utils';
import { Calendar, Clock, ArrowRight, Star, Info } from 'lucide-react';
import { useState } from 'react';

interface StorefrontProps {
  config: StoreConfig;
  onAddToCart: (item: Product | Service) => void;
  onInstantBuy: (item: Product | Service) => void;
}

export const Storefront = ({ config, onAddToCart, onInstantBuy }: StorefrontProps) => {
  const isGridView = config.layout === 'grid';
  const items = config.modules.items;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-theme-card min-h-[300px] flex items-center justify-center text-center p-8",
          !config.bannerImage && "bg-primary/5"
        )}
      >
        {config.bannerImage && (
          <>
            <div className="absolute inset-0 z-0">
               <img 
                 src={config.bannerImage} 
                 alt="" 
                 className="w-full h-full object-cover"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>
          </>
        )}
        
        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          <h1 className={cn(
            "text-4xl md:text-6xl font-bold tracking-tight",
            config.bannerImage ? "text-white" : "text-primary",
            config.theme === 'minimalist' && "font-serif font-light",
            config.theme === 'streetwear' && "font-display uppercase italic",
            config.theme === 'sophisticated' && "font-serif italic",
            config.theme === 'natural' && "font-sans"
          )}>
            {config.tagline}
          </h1>
          <p className={cn(
            "text-lg",
            config.bannerImage ? "text-white/80" : "text-primary/60"
          )}>
            {config.seo.description}
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      {isGridView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <ProductCard 
              key={item.id} 
              product={item as Product} 
              theme={config.theme} 
              onAddToCart={() => onAddToCart(item)}
              onInstantBuy={() => onInstantBuy(item)}
            />
          ))}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {items.map((item) => (
            <ServiceListItem 
              key={item.id} 
              service={item as Service} 
              theme={config.theme} 
              onAddToCart={() => onAddToCart(item)}
              onBookAndPay={() => onInstantBuy(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, theme, onAddToCart, onInstantBuy }: { product: Product, theme: string, onAddToCart: () => void, onInstantBuy: () => void, key?: string }) => {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className={cn(
        "group bg-white overflow-hidden border border-primary/5 transition-all",
        "rounded-theme-card",
        theme === 'minimalist' && "border-none shadow-none",
        theme === 'streetwear' && "border-2 border-primary shadow-[8px_8px_0px_0px_var(--primary)] hover:shadow-none translate-x-[4px] translate-y-[4px]",
        theme === 'sophisticated' && "bg-zinc-900 border-zinc-800",
        theme === 'natural' && "border-stone-200 soft-shadow"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-primary/5">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.isOutOfStock && (
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white text-black px-4 py-2 font-bold uppercase tracking-widest text-sm">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className={cn(
              "text-xl font-bold",
              theme === 'minimalist' && "font-serif font-light",
              theme === 'sophisticated' && "font-serif text-white"
            )}>
              {product.name}
            </h3>
            <p className="text-primary/60 text-sm mt-1 line-clamp-2">{product.description}</p>
          </div>
          <span className={cn(
            "font-bold text-lg",
            theme === 'sophisticated' && "text-white"
          )}>
            {formatCurrency(product.price)}
          </span>
        </div>

        <div className="flex gap-2">
          <button 
            disabled={product.isOutOfStock}
            onClick={onAddToCart}
            className={cn(
              "flex-1 py-3 px-4 border-2 border-primary text-primary font-bold text-sm transition-all",
              "rounded-theme-button hover:bg-primary hover:text-secondary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              theme === 'streetwear' && "uppercase italic tracking-tighter"
            )}
          >
            Add to Bag
          </button>
          <button 
            disabled={product.isOutOfStock}
            onClick={onInstantBuy}
            className={cn(
              "flex-1 py-3 px-4 bg-primary text-secondary font-bold text-sm transition-all",
              "rounded-theme-button hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              theme === 'streetwear' && "uppercase italic tracking-tighter"
            )}
          >
            Instant Buy
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ServiceListItem = ({ service, theme, onAddToCart, onBookAndPay }: { service: Service, theme: string, onAddToCart: () => void, onBookAndPay: () => void, key?: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "bg-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-primary/5 transition-all shadow-sm",
        "rounded-theme-card hover:border-primary/20",
        theme === 'playful' && "bg-orange-50/50 border-white",
        theme === 'natural' && "border-stone-200 soft-shadow"
      )}
    >
      <div className="flex flex-col md:flex-row gap-6 flex-1 items-start">
        {service.imageUrl && (
          <div className="w-full md:w-32 h-32 flex-shrink-0 bg-primary/5 overflow-hidden rounded-xl">
             <img 
               src={service.imageUrl} 
               alt={service.name} 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
          </div>
        )}
        <div className="space-y-4 flex-1">
          <div className="space-y-1">
            <h3 className={cn(
              "text-2xl font-bold",
              theme === 'minimalist' && "font-serif font-light"
            )}>{service.name}</h3>
            <p className="text-primary/60 max-w-lg">{service.description}</p>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm font-medium text-primary/70">
            <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full">
              <Clock size={16} />
              {service.duration} mins
            </div>
            <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              Top Rated
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 min-w-[200px]">
        <div className="text-3xl font-bold">{formatCurrency(service.price)}</div>
        <div className="flex gap-2 w-full">
          <button 
            onClick={onAddToCart}
            className={cn(
              "flex-1 py-3 px-4 border-2 border-primary text-primary font-bold text-sm transition-all",
              "rounded-theme-button hover:bg-primary hover:text-secondary active:scale-95",
              theme === 'playful' && "rounded-full"
            )}
          >
            Add to Bag
          </button>
          <button 
            onClick={onBookAndPay}
            className={cn(
              "flex-1 py-4 px-6 bg-primary text-secondary font-bold text-sm flex items-center justify-center gap-2 transition-all",
              "rounded-theme-button hover:shadow-lg active:scale-[0.98]",
              theme === 'playful' && "bg-primary text-white rounded-full"
            )}
          >
            Buy Now
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
