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
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(response.ok ? 'תגובה לא תקינה' : `שגיאת שרת (${response.status})`);
      }

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
export { studentApi };

const studentService = {
  async login(email, phone, password) {
    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
    const response = await fetch(`${API_BASE_URL}/student/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, password }),
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('שגיאה בתגובת השרת');
    }
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    return studentApi.request('/student/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async resetPassword() {
    return studentApi.request('/student/auth/reset-password', {
      method: 'POST',
    });
  },

  async resetPasswordPublic(email, phone) {
    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
    const response = await fetch(`${API_BASE_URL}/student/auth/reset-password-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('שגיאה בתגובת השרת');
    }
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    return data;
  },

  async getProfile() {
    return studentApi.request('/student/profile');
  },

  async getCourses() {
    return studentApi.request('/student/courses');
  },

  async getCourseDetails(courseId) {
    return studentApi.request(`/student/courses/${courseId}`);
  },

  async getGrades() {
    return studentApi.request('/student/grades');
  },

  async getGradesByCourse(courseId) {
    return studentApi.request(`/student/grades/${courseId}`);
  },

  async getRecommendedWorkshops() {
    return studentApi.request('/student/workshops');
  },
};

export default studentService;
