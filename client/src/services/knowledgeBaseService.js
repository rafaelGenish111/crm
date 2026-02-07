import api from './api';

const knowledgeBaseService = {
  async getKnowledgeEntries(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/knowledge-base${params ? `?${params}` : ''}`);
  },

  async getKnowledgeEntryById(id) {
    return api.request(`/knowledge-base/${id}`);
  },

  async createKnowledgeEntry(entryData) {
    return api.request('/knowledge-base', {
      method: 'POST',
      body: entryData,
    });
  },

  async updateKnowledgeEntry(id, entryData) {
    return api.request(`/knowledge-base/${id}`, {
      method: 'PUT',
      body: entryData,
    });
  },

  async deleteKnowledgeEntry(id) {
    return api.request(`/knowledge-base/${id}`, {
      method: 'DELETE',
    });
  },

  async importFromCourse(courseId) {
    return api.request(`/knowledge-base/import/course/${courseId}`, {
      method: 'POST',
    });
  },
};

export default knowledgeBaseService;
