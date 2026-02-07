import api from './api';

const leadService = {
  async getLeads(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/leads${params ? `?${params}` : ''}`);
  },

  async getLeadById(id) {
    return api.request(`/leads/${id}`);
  },

  async createLead(leadData) {
    return api.request('/leads', {
      method: 'POST',
      body: leadData,
    });
  },

  async updateLead(id, leadData) {
    return api.request(`/leads/${id}`, {
      method: 'PUT',
      body: leadData,
    });
  },

  async deleteLead(id) {
    return api.request(`/leads/${id}`, {
      method: 'DELETE',
    });
  },

  async convertToCustomer(id) {
    return api.request(`/leads/${id}/convert`, {
      method: 'POST',
    });
  },

  async createInteraction(leadId, interactionData) {
    return api.request(`/leads/${leadId}/interactions`, {
      method: 'POST',
      body: interactionData,
    });
  },

  async updateInteraction(interactionId, interactionData) {
    return api.request(`/leads/interactions/${interactionId}`, {
      method: 'PUT',
      body: interactionData,
    });
  },

  async deleteInteraction(interactionId) {
    return api.request(`/leads/interactions/${interactionId}`, {
      method: 'DELETE',
    });
  },
};

export default leadService;
