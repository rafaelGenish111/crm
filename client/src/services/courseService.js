import api from './api';

const courseService = {
  async getCourses(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/courses${params ? `?${params}` : ''}`);
  },

  async getCourseById(id) {
    return api.request(`/courses/${id}`);
  },

  async createCourse(courseData) {
    return api.request('/courses', {
      method: 'POST',
      body: courseData,
    });
  },

  async updateCourse(id, courseData) {
    return api.request(`/courses/${id}`, {
      method: 'PUT',
      body: courseData,
    });
  },

  async deleteCourse(id) {
    return api.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  async enrollInCourse(id, enrollmentData) {
    return api.request(`/courses/${id}/enroll`, {
      method: 'POST',
      body: enrollmentData,
    });
  },

  async removeEnrollment(enrollmentId) {
    return api.request(`/courses/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  },
};

export default courseService;
