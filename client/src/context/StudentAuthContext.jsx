import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import studentService from '../services/studentService';

const StudentAuthContext = createContext(null);

export const StudentAuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('studentToken'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setStudent(null);
    localStorage.removeItem('studentToken');
    // Navigation will be handled by StudentProtectedRoute redirect
  }, []);

  const loadStudent = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await studentService.getProfile();
      setStudent(data.student);
    } catch (error) {
      console.error('Failed to load student:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  // טעינת תלמיד מ-localStorage ב-startup
  useEffect(() => {
    if (token) {
      loadStudent();
    } else {
      setLoading(false);
    }
  }, [token, loadStudent]);

  const studentLogin = async (email, phone, password) => {
    try {
      const data = await studentService.login(email, phone, password);
      setToken(data.token);
      setStudent(data.student);
      localStorage.setItem('studentToken', data.token);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await studentService.changePassword(currentPassword, newPassword);
      // עדכון state שהסיסמה שונתה
      if (student) {
        setStudent({ ...student, passwordChanged: true, initialPassword: undefined });
      }
      // רענון פרופיל מלא
      await loadStudent();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async () => {
    try {
      const data = await studentService.resetPassword();
      // רענון פרופיל מלא כדי לקבל את הסיסמה החדשה
      await loadStudent();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    student,
    token,
    loading,
    studentLogin,
    changePassword,
    resetPassword,
    logout,
    isAuthenticated: !!student,
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error('useStudentAuth must be used within StudentAuthProvider');
  }
  return context;
};
