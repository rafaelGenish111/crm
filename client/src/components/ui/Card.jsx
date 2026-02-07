import { motion } from 'framer-motion';

function Card({ children, className = '', hover = true, onClick, variant = 'default' }) {
  const variantClasses = {
    default: 'origami-card',
    elevated: 'origami-card shadow-origami-lg',
    flat: 'bg-white/60 backdrop-blur-sm rounded-origami p-6 border border-white/40',
    gradient: 'bg-gradient-to-br from-origami-cream to-origami-paper rounded-origami shadow-origami p-6 border border-white/50',
  };

  const baseClasses = variantClasses[variant] || variantClasses.default;
  const hoverClasses = hover ? 'hover:shadow-origami-lg hover:-translate-y-1' : '';
  const clickClasses = onClick ? 'cursor-pointer' : '';

  const cardContent = (
    <div className={`${baseClasses} ${hoverClasses} ${clickClasses} ${className}`} style={{
      transformStyle: 'preserve-3d',
    }}>
      {children}
    </div>
  );

  if (hover && !onClick) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: -5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ perspective: '1000px' }}
      >
        {cardContent}
      </motion.div>
    );
  }

  if (onClick) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: -5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        whileHover={{ scale: 1.02, rotateY: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={onClick}
        style={{ perspective: '1000px' }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

export default Card;
