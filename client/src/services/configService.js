import api from './api';

const configService = {
  // קבלת קונפיגורציה מלאה
  async getConfig() {
    return api.request('/config');
  },

  // קבלת חלק ספציפי מהקונפיגורציה
  async getConfigSection(section) {
    return api.request(`/config/${section}`);
  },

  // עדכון קונפיגורציה
  async updateConfig(updates) {
    return api.request('/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

export default configService;
