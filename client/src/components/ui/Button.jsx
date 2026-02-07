import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const buttonVariants = {
  // primary: coral/peach gradient - צבעים בהירים, צריך טקסט כהה
  primary: 'bg-gradient-to-r from-origami-coral to-origami-peach text-gray-900 hover:from-origami-coral/90 hover:to-origami-peach/90',
  // secondary: sage/mint gradient - צבעים בהירים, צריך טקסט כהה
  secondary: 'bg-gradient-to-r from-origami-sage to-origami-mint text-gray-900 hover:from-origami-sage/90 hover:to-origami-mint/90',
  // accent: ocean/sky gradient - צבעים בהירים, צריך טקסט כהה
  accent: 'bg-gradient-to-r from-origami-ocean to-origami-sky text-gray-900 hover:from-origami-ocean/90 hover:to-origami-sky/90',
  // success: mint/sage gradient - צבעים בהירים, צריך טקסט כהה
  success: 'bg-gradient-to-r from-origami-mint to-origami-sage text-gray-900 hover:from-origami-mint/90 hover:to-origami-sage/90',
  // danger: rose/coral gradient - צבעים בהירים, צריך טקסט כהה
  danger: 'bg-gradient-to-r from-origami-rose to-origami-coral text-gray-900 hover:from-origami-rose/90 hover:to-origami-coral/90',
  // neutral: white background - משתמש ב-text-gray-800 (קונטרסט טוב)
  neutral: 'bg-white/80 text-gray-800 border border-gray-200 hover:bg-white hover:shadow-origami-lg',
  // ghost: transparent - משתמש ב-text-gray-700 (קונטרסט טוב)
  ghost: 'bg-transparent text-gray-700 hover:bg-white/50',
};

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon,
  as: Component = 'button',
  to,
  href,
  ...props
}) {
  const baseClasses = 'origami-button inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-touch touch-manipulation active:scale-95';
  const sizeClasses = buttonSizes[size];
  const variantClasses = buttonVariants[variant];

  const buttonContent = (
    <>
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {Icon && !loading && <Icon className="w-4 h-4" />}
      {children}
    </>
  );

  const buttonProps = {
    onClick,
    disabled: disabled || loading,
    className: `${baseClasses} ${sizeClasses} ${variantClasses} ${className}`,
    ...props,
  };

  if (Component === 'a' || href) {
    return (
      <motion.a
        href={href || to}
        {...buttonProps}
        whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      >
        {buttonContent}
      </motion.a>
    );
  }

  if (Component === Link || to) {
    return (
      <motion.div
        whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      >
        <Link
          to={to}
          className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
          {...props}
        >
          {buttonContent}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      {...buttonProps}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
    >
      {buttonContent}
    </motion.button>
  );
}

export default Button;
