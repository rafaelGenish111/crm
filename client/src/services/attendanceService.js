import api from './api';

const attendanceService = {
  async getCourseSessions(courseId) {
    return api.request(`/attendance/course/${courseId}/sessions`);
  },

  async getAttendanceByCourse(courseId, sessionNumber) {
    const params = sessionNumber ? `?sessionNumber=${sessionNumber}` : '';
    return api.request(`/attendance/course/${courseId}${params}`);
  },

  async createOrUpdateAttendance(courseId, attendanceData) {
    return api.request(`/attendance/course/${courseId}`, {
      method: 'POST',
      body: attendanceData,
    });
  },
};

export default attendanceService;
