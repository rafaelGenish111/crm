import { motion } from 'framer-motion';
import Card from '../ui/Card';

/**
 * MobileCard - כרטיס מותאם למובייל עם touch-friendly design
 */
function MobileCard({
  children,
  className = '',
  onClick,
  variant = 'default',
  touchable = true
}) {
  const baseClasses = 'rounded-2xl p-4 md:p-6';
  const touchClasses = touchable ? 'active:scale-95 transition-transform' : '';

  const cardContent = (
    <Card
      className={`${baseClasses} ${touchClasses} ${className}`}
      onClick={onClick}
      variant={variant}
      hover={!!onClick}
    >
      {children}
    </Card>
  );

  return cardContent;
}

export default MobileCard;
