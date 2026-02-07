import api from './api';

const examService = {
  async getExamsByCourse(courseId) {
    return api.request(`/exams/course/${courseId}`);
  },

  async getExamById(examId) {
    return api.request(`/exams/${examId}`);
  },

  async createExam(courseId, examData) {
    return api.request(`/exams/course/${courseId}`, {
      method: 'POST',
      body: examData,
    });
  },

  async updateExam(examId, examData) {
    return api.request(`/exams/${examId}`, {
      method: 'PUT',
      body: examData,
    });
  },

  async deleteExam(examId) {
    return api.request(`/exams/${examId}`, {
      method: 'DELETE',
    });
  },

  async saveGrades(examId, grades) {
    return api.request(`/exams/${examId}/grades`, {
      method: 'POST',
      body: { grades },
    });
  },
};

export default examService;
