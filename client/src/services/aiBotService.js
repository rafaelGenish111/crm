import { studentApi } from './studentService';

const aiBotService = {
  async sendMessage(message, courseId, intent) {
    return studentApi.request('/student/ai-bot/message', {
      method: 'POST',
      body: { message, courseId, intent },
    });
  },

  async getChatHistory(courseId, limit) {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (limit) params.append('limit', limit);
    return studentApi.request(`/student/ai-bot/history?${params.toString()}`);
  },

  async generateExamQuestion(courseId, difficulty) {
    return studentApi.request('/student/ai-bot/exam/generate', {
      method: 'POST',
      body: { courseId, difficulty },
    });
  },

  async submitExamAnswer(questionId, answer) {
    return studentApi.request('/student/ai-bot/exam/submit', {
      method: 'POST',
      body: { questionId, answer },
    });
  },

  async generateStudyPlan(courseId) {
    return studentApi.request('/student/ai-bot/study-plan', {
      method: 'POST',
      body: { courseId },
    });
  },
};

export default aiBotService;
