import { useBusinessConfig } from '../context/BusinessConfigContext';

/**
 * פורמט סכום כסף לפי הגדרות העסק
 */
export const formatCurrency = (amount, config) => {
  const currencySymbol = config?.settings?.currencySymbol || '₪';
  const formattedAmount = new Intl.NumberFormat('he-IL').format(amount);
  return `${formattedAmount} ${currencySymbol}`;
};

/**
 * פורמט תאריך לפי הגדרות העסק
 */
export const formatDate = (date, config) => {
  const dateFormat = config?.settings?.dateFormat || 'DD/MM/YYYY';
  // TODO: Implement date formatting based on dateFormat
  // For now, using basic formatting
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('he-IL');
};

/**
 * קבלת צבע Branding
 */
export const getBrandColor = (type, config) => {
  const branding = config?.branding || {};
  switch (type) {
    case 'primary':
      return branding.primaryColor || '#3B82F6';
    case 'secondary':
      return branding.secondaryColor || '#8B5CF6';
    case 'accent':
      return branding.accentColor || '#10B981';
    default:
      return branding.primaryColor || '#3B82F6';
  }
};

/**
 * בדיקה אם feature פעיל
 */
export const isFeatureEnabled = (featureName, config) => {
  const features = config?.features || {};
  return features[featureName] === true;
};
