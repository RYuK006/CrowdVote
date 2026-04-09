import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface UnderDevelopmentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function UnderDevelopmentPopup({ isOpen, onClose, title = "Under Development", message }: UnderDevelopmentPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white border border-black/10 p-10 rounded-[40px] max-w-md w-full relative z-10 text-center space-y-6 shadow-2xl"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <AlertCircle className="w-10 h-10 text-emerald-600 font-bold" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-950 italic">{title}</h3>
              <p className="text-slate-900 text-sm font-bold italic leading-relaxed">
                {message || "This feature is currently under development and will be available in a future update."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all shadow-lg italic uppercase tracking-widest text-sm"
            >
              Understand
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
