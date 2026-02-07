const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config/businessConfig.json');

let cachedConfig = null;

/**
 * טעינת קונפיגורציה מהקובץ
 */
const loadConfig = () => {
  try {
    if (cachedConfig) {
      return cachedConfig;
    }

    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    cachedConfig = JSON.parse(configData);
    return cachedConfig;
  } catch (error) {
    console.error('Error loading business config:', error);
    throw new Error('Failed to load business configuration');
  }
};

/**
 * עדכון קונפיגורציה
 */
const updateConfig = (updates) => {
  try {
    const currentConfig = loadConfig();
    const updatedConfig = {
      ...currentConfig,
      business: {
        ...currentConfig.business,
        ...updates
      }
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2), 'utf8');
    cachedConfig = updatedConfig; // עדכון cache

    return updatedConfig;
  } catch (error) {
    console.error('Error updating business config:', error);
    throw new Error('Failed to update business configuration');
  }
};

/**
 * קבלת קונפיגורציה (public API)
 */
const getConfig = () => {
  return loadConfig();
};

/**
 * קבלת חלק ספציפי מהקונפיגורציה
 */
const getConfigSection = (section) => {
  const config = loadConfig();
  return config.business[section] || null;
};

/**
 * איפוס cache (שימושי אחרי עדכון ידני של הקובץ)
 */
const resetCache = () => {
  cachedConfig = null;
};

module.exports = {
  loadConfig,
  updateConfig,
  getConfig,
  getConfigSection,
  resetCache
};
