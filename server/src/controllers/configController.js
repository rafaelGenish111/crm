const configService = require('../services/configService');

/**
 * קבלת קונפיגורציה מלאה
 */
const getConfig = (req, res) => {
  try {
    const config = configService.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * עדכון קונפיגורציה (למנהל בלבד)
 */
const updateConfig = (req, res) => {
  try {
    const updates = req.body;
    const updatedConfig = configService.updateConfig(updates);
    res.json({
      message: 'קונפיגורציה עודכנה בהצלחה',
      config: updatedConfig
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * קבלת חלק ספציפי מהקונפיגורציה
 */
const getConfigSection = (req, res) => {
  try {
    const { section } = req.params;
    const sectionData = configService.getConfigSection(section);

    if (!sectionData) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json(sectionData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConfig,
  updateConfig,
  getConfigSection
};
