import { useState, ReactNode, useEffect, MouseEvent } from 'react';
import { StoreConfig, ThemeType, Product, Service, Order } from '../../types/store';
import { X, Save, Palette, Layout, List, Package, Trash2, Plus, ArrowLeft, Eye, RotateCcw, History, FileText } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { PRESETS } from '../../constants/presets';
import { storeService } from '../../firebase';

interface AdminDashboardProps {
  config: StoreConfig;
  onUpdateConfig: (newConfig: StoreConfig) => void;
  onDraftUpdate: (newConfig: StoreConfig | null) => void;
  onClose: () => void;
}

export const AdminDashboard = ({ config, onUpdateConfig, onDraftUpdate, onClose }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'config' | 'inventory' | 'sales'>('config');
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [myShops, setMyShops] = useState<StoreConfig[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Local state for tracking which shop we are currently editing
  // We don't use onDraftUpdate for switching storefront anymore per request
  const [selectedShopId, setSelectedShopId] = useState(config.id);

  // Synchronize localConfig if relevant props change
  useEffect(() => {
    setLocalConfig(config);
    setSelectedShopId(config.id);
  }, [config]);

  // 1. Initial Load of all shops
  useEffect(() => {
    const loadShops = async () => {
      const shops = await storeService.getAllShops();
      setMyShops(shops);
    };
    loadShops();
  }, []); // Only on mount

  // 2. Fetch orders when switching context or activeTab
  useEffect(() => {
    const loadOrders = async () => {
      if (activeTab === 'sales') {
        setIsLoadingOrders(true);
        const data = await storeService.getOrders(localConfig.id);
        setOrders(data);
        setIsLoadingOrders(false);
      }
    };
    loadOrders();
  }, [activeTab, localConfig.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig(localConfig);
      // Refresh the list in case the name changed
      const shops = await storeService.getAllShops();
      setMyShops(shops);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchContext = async (shop: StoreConfig) => {
    setLocalConfig(shop);
    setSelectedShopId(shop.id);
    // Note: We deliberately DON'T update App's storefront here
  };

  const handleAddNewShop = async () => {
    const newId = `shop-${Math.random().toString(36).substr(2, 5)}`;
    const newShop: StoreConfig = {
      ...PRESETS.hairdresser,
      id: newId,
      name: 'My New Shop',
      tagline: 'Ready for business',
    };
    
    setIsSaving(true);
    try {
      await storeService.saveShopConfig(newShop);
      const shops = await storeService.getAllShops();
      setMyShops(shops);
      setLocalConfig(newShop);
      setSelectedShopId(newId);
    } catch (err) {
      alert("Failed to create new shop.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all shop settings to the system default (Hairdresser)? This will instantly update the live database.")) {
      setIsSaving(true);
      try {
        const resetConfig = { ...PRESETS.hairdresser, id: config.id };
        await onUpdateConfig(resetConfig);
        setLocalConfig(resetConfig);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteShop = async (shopId: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (myShops.length <= 1) {
      alert("You must have at least one shop.");
      return;
    }

    setIsSaving(true);
    try {
      await storeService.deleteShopConfig(shopId);
      const shops = await storeService.getAllShops();
      setMyShops(shops);
      setDeleteConfirmId(null);
      
      if (shopId === selectedShopId) {
        const nextShop = shops[0];
        setLocalConfig(nextShop);
        setSelectedShopId(nextShop.id);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete shop.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = () => {
    const type = localConfig.modules.type;
    const newItem: Product | Service = type === 'product' 
      ? {
          id: Math.random().toString(36).substr(2, 9),
          name: 'New Product',
          price: 19.99,
          description: 'Enter product description...',
          imageUrl: `https://picsum.photos/seed/${Math.random()}/800/800`,
          isOutOfStock: false,
        } as Product
      : {
          id: Math.random().toString(36).substr(2, 9),
          name: 'New Service',
          price: 25.00,
          duration: 30,
          availableHours: ['09:00', '10:00', '11:00'],
          description: 'Enter service description...',
          imageUrl: `https://picsum.photos/seed/${Math.random()}/800/800`,
        } as Service;

    setLocalConfig({
      ...localConfig,
      modules: {
        ...localConfig.modules,
        items: [...localConfig.modules.items, newItem]
      }
    });
  };

  const handleDeleteItem = (id: string) => {
    setLocalConfig({
      ...localConfig,
      modules: {
        ...localConfig.modules,
        items: localConfig.modules.items.filter(item => item.id !== id)
      }
    });
  };

  const handleUpdateItem = (id: string, updates: Partial<Product | Service>) => {
    setLocalConfig({
      ...localConfig,
      modules: {
        ...localConfig.modules,
        items: localConfig.modules.items.map(item => 
          item.id === id ? { ...item, ...updates } : item
        ) as (Product | Service)[]
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col font-sans text-gray-900 admin-font-reset">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold">Tikkie Shop Engine</h2>
            <p className="text-xs text-gray-500 font-medium">Merchant Control Panel v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLocalConfig(config)}
            disabled={JSON.stringify(localConfig) === JSON.stringify(config)}
            className="px-4 py-2 text-stone-500 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-100 transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            Discard Changes
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button 
            onClick={handleReset}
            className="px-4 py-2 text-red-500 rounded-xl font-bold flex items-center gap-2 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
          >
            <RotateCcw size={18} />
            Factory Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || JSON.stringify(localConfig) === JSON.stringify(config)}
            className="px-4 py-2 bg-[#00AEEF] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#0099DD] transition-all disabled:grayscale disabled:opacity-50"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <Eye size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 py-6">
          <nav className="px-3 space-y-1">
            <NavItem 
              active={activeTab === 'config'} 
              onClick={() => setActiveTab('config')} 
              icon={<Palette size={20} />} 
              label="Branding & Layout" 
            />
            <NavItem 
              active={activeTab === 'inventory'} 
              onClick={() => setActiveTab('inventory')} 
              icon={<Package size={20} />} 
              label="Inventory Manager" 
            />
            <NavItem 
              active={activeTab === 'sales'} 
              onClick={() => setActiveTab('sales')} 
              icon={<History size={20} />} 
              label="Sales History" 
            />
          </nav>
          
          <div className="mt-8 px-6">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">My Shops</h4>
                <button 
                  onClick={handleAddNewShop}
                  className="p-1 hover:bg-gray-100 rounded text-[#00AEEF] transition-colors"
                  title="Add New Shop"
                >
                  <Plus size={14} />
                </button>
             </div>
             <div className="space-y-1 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {myShops.map(shop => {
                 const isConfirming = deleteConfirmId === shop.id;
                 
                 return (
                   <div 
                    key={shop.id} 
                    className={cn(
                      "relative group rounded-lg transition-all",
                      isConfirming ? "bg-red-50 ring-1 ring-red-200" : ""
                    )}
                   >
                     <div 
                      onClick={() => !isConfirming && handleSwitchContext(shop)}
                      className={cn(
                        "w-full text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-all font-medium flex flex-col gap-0.5",
                        shop.id === selectedShopId && !isConfirming ? "bg-[#00AEEF]/10 text-[#00AEEF]" : "hover:bg-gray-100 text-gray-600",
                        isConfirming ? "opacity-50 pointer-events-none" : ""
                      )}
                     >
                       <div className="flex items-center justify-between w-full">
                         <span className="truncate flex-1 pr-6">{shop.name}</span>
                         {shop.id === selectedShopId && !isConfirming && <div className="w-1.5 h-1.5 rounded-full bg-[#00AEEF] flex-shrink-0 ml-2" />}
                       </div>
                       <span className="text-[9px] opacity-40 font-mono truncate">ID: {shop.id}</span>
                     </div>
                     
                     <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                       {!isConfirming ? (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setDeleteConfirmId(shop.id);
                           }}
                           className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50"
                           title="Delete Shop"
                         >
                           <Trash2 size={14} />
                         </button>
                       ) : (
                         <div className="flex items-center gap-1 pr-1 bg-white rounded-md shadow-sm border p-0.5 animate-in slide-in-from-right-1 duration-200">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setDeleteConfirmId(null);
                             }}
                             className="p-1 text-gray-400 hover:text-gray-600 rounded"
                           >
                             <X size={12} />
                           </button>
                           <button 
                             onClick={(e) => handleDeleteShop(shop.id, e)}
                             className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded hover:bg-red-600 font-bold"
                           >
                             Delete
                           </button>
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 max-w-4xl">
          {activeTab === 'config' && (
            <div className="space-y-8">
              <section className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Palette size={22} className="text-[#00AEEF]" />
                  Branding
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Shop Name</label>
                    <input 
                      type="text" 
                      value={localConfig.name}
                      onChange={(e) => setLocalConfig({...localConfig, name: e.target.value})}
                      className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00AEEF] focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Subheader / Tagline</label>
                    <input 
                      type="text" 
                      value={localConfig.tagline}
                      onChange={(e) => setLocalConfig({...localConfig, tagline: e.target.value})}
                      className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00AEEF] focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Hero Banner Image URL</label>
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/..."
                    value={localConfig.bannerImage || ''}
                    onChange={(e) => setLocalConfig({...localConfig, bannerImage: e.target.value})}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00AEEF] focus:border-transparent transition-all outline-none"
                  />
                  <p className="text-[10px] text-gray-400 font-medium italic">Recommended: 1920x600 pixels</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Primary Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={localConfig.primaryColor}
                        onChange={(e) => setLocalConfig({...localConfig, primaryColor: e.target.value})}
                        className="h-14 w-20 p-2 bg-white border border-gray-200 rounded-xl cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={localConfig.primaryColor}
                        onChange={(e) => setLocalConfig({...localConfig, primaryColor: e.target.value})}
                        className="flex-1 p-4 bg-white border border-gray-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Secondary Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={localConfig.secondaryColor}
                        onChange={(e) => setLocalConfig({...localConfig, secondaryColor: e.target.value})}
                        className="h-14 w-20 p-2 bg-white border border-gray-200 rounded-xl cursor-pointer"
                      />
                       <input 
                        type="text" 
                        value={localConfig.secondaryColor}
                        onChange={(e) => setLocalConfig({...localConfig, secondaryColor: e.target.value})}
                        className="flex-1 p-4 bg-white border border-gray-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              <section className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Layout size={22} className="text-[#00AEEF]" />
                  Theme & Engine Settings
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Visual Theme Preset</label>
                    <select 
                      value={localConfig.theme}
                      onChange={(e) => setLocalConfig({...localConfig, theme: e.target.value as ThemeType})}
                      className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none appearance-none"
                    >
                      <option value="minimalist">Minimalist / Luxe</option>
                      <option value="playful">Playful / Warm</option>
                      <option value="streetwear">Streetwear / Brutalist</option>
                      <option value="sophisticated">Sophisticated / Dark Art</option>
                      <option value="natural">Natural Tones</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Engine Layout</label>
                    <select 
                      value={localConfig.layout}
                      onChange={(e) => setLocalConfig({...localConfig, layout: e.target.value as 'grid' | 'calendar'})}
                      className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none appearance-none"
                    >
                      <option value="grid">Grid View (Product Focus)</option>
                      <option value="calendar">Calendar View (Service Focus)</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <List size={22} className="text-[#00AEEF]" />
                    {localConfig.modules.type === 'product' ? 'Product' : 'Service'} Inventory
                  </h3>
                  <button 
                    onClick={handleAddItem}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-bold"
                  >
                    <Plus size={18} />
                    Add New {localConfig.modules.type === 'product' ? 'Product' : 'Service'}
                  </button>
               </div>

               <div className="space-y-4">
                 {localConfig.modules.items.map((item, idx) => (
                   <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between group hover:border-[#00AEEF]/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                           {((item as Product).imageUrl || (item as Service).imageUrl) ? (
                             <img src={(item as Product).imageUrl || (item as Service).imageUrl} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <List size={20} className="text-gray-400" />
                           )}
                        </div>
                        <div>
                          <input 
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                            className="font-bold bg-transparent border-none p-0 focus:ring-0 outline-none w-full"
                          />
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">€</span>
                            <input 
                              type="number"
                              value={item.price}
                              onChange={(e) => handleUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                              className="text-xs text-gray-500 font-medium bg-transparent border-none p-0 focus:ring-0 outline-none w-16"
                            />
                            <span className="text-xs text-gray-500 font-medium"> • {localConfig.modules.type === 'service' ? `${(item as Service).duration} mins` : 'Physical Good'}</span>
                          </div>
                          <div className="mt-2 group-hover:block hidden">
                             <input 
                                type="text"
                                placeholder="Image URL..."
                                value={(item as Product).imageUrl || ''}
                                onChange={(e) => handleUpdateItem(item.id, { imageUrl: e.target.value })}
                                className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-1 w-full focus:ring-1 focus:ring-[#00AEEF] outline-none"
                             />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 mr-4 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={localConfig.modules.type === 'product' ? !(item as Product).isOutOfStock : true} 
                            onChange={(e) => {
                              if (localConfig.modules.type === 'product') {
                                handleUpdateItem(item.id, { isOutOfStock: !e.target.checked });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-[#00AEEF] focus:ring-[#00AEEF]"
                          />
                          <span className="text-xs font-bold text-gray-600 uppercase">Available</span>
                        </label>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <History size={22} className="text-[#00AEEF]" />
                  Sales History & Invoices
                </h3>
              </div>

              {isLoadingOrders ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-4 border-[#00AEEF]/20 border-t-[#00AEEF] rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 font-medium italic">Fetching transaction data...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <History size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">No sales recorded yet</p>
                    <p className="text-sm text-gray-500">Successful Tikkie payments will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="col-span-2">Item / Order ID</div>
                    <div>Date</div>
                    <div className="text-right">Amount</div>
                  </div>
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between group hover:border-[#00AEEF]/50 transition-all">
                      <div className="flex-1 grid grid-cols-4 items-center gap-4">
                        <div className="col-span-2 flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            order.status === 'paid' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                          )}>
                            <FileText size={20} />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-sm truncate">{order.itemName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">Invoice #{order.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-right font-bold text-sm text-[#00AEEF]">
                          {formatCurrency(order.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all",
      active ? "bg-[#00AEEF]/10 text-[#00AEEF]" : "text-gray-500 hover:bg-gray-100"
    )}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);
