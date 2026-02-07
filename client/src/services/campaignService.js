import api from './api';

const campaignService = {
  async getCampaigns(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/campaigns${params ? `?${params}` : ''}`);
  },

  async getCampaignById(id) {
    return api.request(`/campaigns/${id}`);
  },

  async createCampaign(campaignData) {
    return api.request('/campaigns', {
      method: 'POST',
      body: campaignData,
    });
  },

  async updateCampaign(id, campaignData) {
    return api.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: campaignData,
    });
  },

  async deleteCampaign(id) {
    return api.request(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  async getEmbedCode(id) {
    return api.request(`/popup/campaign/${id}/embed-code`);
  },
};

export default campaignService;
