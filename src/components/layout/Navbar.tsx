import { ShoppingCart, Menu, User, Settings } from 'lucide-react';
import { StoreConfig } from '../../types/store';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface NavbarProps {
  config: StoreConfig;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
}

export const Navbar = ({ config, cartCount, onOpenCart, onOpenAdmin }: NavbarProps) => {
  return (
    <nav className={cn(
      "sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between transition-all duration-300",
      "bg-secondary/80 backdrop-blur-md border-b border-primary/10"
    )}>
      <div className="flex items-center gap-4">
        {config.logo ? (
          <img src={config.logo} alt={config.name} className="h-8 w-auto" />
        ) : (
          <span className="font-bold text-xl font-sans tracking-tight">{config.name}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenAdmin}
          className="p-2 hover:bg-primary/5 rounded-full transition-colors text-primary/60 hover:text-primary"
          title="Merchant Dashboard"
        >
          <Settings size={20} />
        </button>
        
        <div className="h-6 w-px bg-primary/10 mx-1" />

        <button 
          onClick={onOpenCart}
          className="relative p-2 hover:bg-primary/5 rounded-full transition-colors group"
        >
          <ShoppingCart size={22} className="text-primary" />
          {cartCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-primary text-secondary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-secondary"
            >
              {cartCount}
            </motion.span>
          )}
        </button>
        
        <button className="md:hidden p-2">
          <Menu size={22} />
        </button>
      </div>
    </nav>
  );
};
