import { createContext, useContext, useState, useEffect } from 'react';
import configService from '../services/configService';

const BusinessConfigContext = createContext(null);

export const BusinessConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // טעינת קונפיגורציה בהתחלה
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configService.getConfig();
      setConfig(data.business);
    } catch (err) {
      console.error('Failed to load business config:', err);
      setError(err.message);
      // Fallback config במקרה של שגיאה
      setConfig({
        name: 'בית הספר לקורסים',
        nameEn: 'School for Courses',
        logo: '/assets/logo.png',
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#8B5CF6',
          accentColor: '#10B981',
        },
        settings: {
          currency: 'ILS',
          currencySymbol: '₪',
          dateFormat: 'DD/MM/YYYY',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates) => {
    try {
      setError(null);
      const data = await configService.updateConfig(updates);
      setConfig(data.config.business);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    config,
    loading,
    error,
    updateConfig,
    reloadConfig: loadConfig,
    // Helper getters
    businessName: config?.name || '',
    businessNameEn: config?.nameEn || '',
    logo: config?.logo || '',
    branding: config?.branding || {},
    settings: config?.settings || {},
    features: config?.features || {},
    contact: config?.contact || {},
  };

  return (
    <BusinessConfigContext.Provider value={value}>
      {children}
    </BusinessConfigContext.Provider>
  );
};

export const useBusinessConfig = () => {
  const context = useContext(BusinessConfigContext);
  if (!context) {
    throw new Error('useBusinessConfig must be used within BusinessConfigProvider');
  }
  return context;
};

export default BusinessConfigContext;
