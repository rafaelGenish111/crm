// Student-specific API service that uses studentToken
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

class StudentApiService {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // קבלת studentToken מ-localStorage
    const token = localStorage.getItem('studentToken');

    if (!token) {
      throw new Error('לא מאומת. נדרש token.');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    // אם יש body, צריך להמיר ל-JSON
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // אם ה-token לא תקין, למחוק אותו
        if (response.status === 401) {
          localStorage.removeItem('studentToken');
          throw new Error('Token לא תקין לתלמיד');
        }
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}

const studentApi = new StudentApiService();

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
