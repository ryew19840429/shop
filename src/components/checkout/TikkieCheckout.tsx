import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import { X, Smartphone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { storeService } from '../../firebase';

interface TikkieCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  itemName: string;
  shopId: string;
}

export const TikkieCheckout = ({ isOpen, onClose, amount, itemName, shopId }: TikkieCheckoutProps) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [status, setStatus] = useState<'pending' | 'success'>('pending');

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(300);
      setStatus('pending');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulateSuccess = async () => {
    try {
      await storeService.recordOrder(shopId, {
        itemName,
        amount,
        status: 'paid'
      });
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to record order:", err);
      // Still show success in UI for demo, or we could handle error
      setStatus('success');
    }
  };

  const tikkieBlue = '#00AEEF';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 bg-[#00AEEF] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-[#00AEEF]" />
                </div>
                <span className="font-bold text-xl tracking-tight">Tikkie.</span>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {status === 'pending' ? (
                <>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Betaal veilig met Tikkie</h2>
                    <p className="text-gray-500">Scan de QR-code om te betalen voor <span className="font-medium text-gray-900">{itemName}</span></p>
                  </div>

                  <div className="flex justify-center flex-col items-center gap-6">
                    <div className="p-6 bg-gray-50 rounded-2xl border-2 border-gray-100 shadow-inner group hover:border-[#6600FF]/30 transition-colors">
                      <QRCode 
                        value={`tikkie://pay?amount=${amount}&ref=${itemName}`} 
                        size={200}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                        fgColor={tikkieBlue}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      Deze Tikkie verloopt over {formatTime(timeLeft)}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button
                      onClick={handleSimulateSuccess}
                      className="w-full py-4 bg-[#00AEEF] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#0099DD] transition-all transform active:scale-[0.98]"
                    >
                      <Smartphone size={20} />
                      Betaal met Tikkie App
                    </button>
                    
                    <div className="flex justify-center items-center gap-4 text-xs text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={14} className="text-green-500" />
                        Beveiligd door Tikkie
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <div>Onderdeel van ABN AMRO</div>
                    </div>
                  </div>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-gray-900">Bedankt!</h3>
                    <p className="text-gray-500">Je betaling van {formatCurrency(amount)} is geslaagd.</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Accent */}
            <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
