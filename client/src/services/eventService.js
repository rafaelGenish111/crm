import api from './api';

const eventService = {
  async getEvents(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/events${params ? `?${params}` : ''}`);
  },

  async getEventById(id) {
    return api.request(`/events/${id}`);
  },

  async createEvent(eventData) {
    return api.request('/events', {
      method: 'POST',
      body: eventData,
    });
  },

  async updateEvent(id, eventData) {
    return api.request(`/events/${id}`, {
      method: 'PUT',
      body: eventData,
    });
  },

  async deleteEvent(id) {
    return api.request(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  async addParticipant(eventId, participantData) {
    return api.request(`/events/${eventId}/participants`, {
      method: 'POST',
      body: participantData,
    });
  },

  async updateEnrollment(eventId, enrollmentId, enrollmentData) {
    return api.request(`/events/${eventId}/enrollments/${enrollmentId}`, {
      method: 'PUT',
      body: enrollmentData,
    });
  },

  async removeParticipant(eventId, enrollmentId) {
    return api.request(`/events/${eventId}/participants/${enrollmentId}`, {
      method: 'DELETE',
    });
  },
};

export default eventService;
