import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

/**
 * Toast - הודעת התראה זמנית
 */
function Toast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000
}) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${typeClasses[type]} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[90vw]`}
          dir="rtl"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium flex-1">{message}</p>
            <button
              onClick={onClose}
              className="text-current opacity-70 hover:opacity-100 transition-opacity min-w-touch min-h-touch"
              aria-label="סגור"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
