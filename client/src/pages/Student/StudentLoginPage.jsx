import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import studentService from '../../services/studentService';

function StudentLoginPage() {
  const { studentLogin } = useStudentAuth();
  const navigate = useNavigate();
  const { businessName, logo } = useBusinessConfig();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetData, setResetData] = useState({ email: '', phone: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email && !formData.phone) {
      newErrors.email = 'נא להזין אימייל או טלפון';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'אימייל לא תקין';
    }

    if (!formData.password) {
      newErrors.password = 'סיסמה היא שדה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await studentLogin(formData.email, formData.phone, formData.password);
      navigate('/student');
    } catch (error) {
      setErrors({ submit: error.message || 'שגיאה בהתחברות. אנא נסה שוב.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetData.email && !resetData.phone) {
      setErrors({ reset: 'נא להזין אימייל או טלפון' });
      return;
    }

    setResetLoading(true);
    setErrors({});
    setResetSuccess(null);

    try {
      const data = await studentService.resetPasswordPublic(resetData.email, resetData.phone);
      setResetSuccess(`סיסמה אופסה בהצלחה! הסיסמה הראשונית החדשה שלך: ${data.initialPassword}`);
      setResetData({ email: '', phone: '' });
      setTimeout(() => {
        setShowResetPassword(false);
        setResetSuccess(null);
      }, 5000);
    } catch (error) {
      setErrors({ reset: error.message || 'שגיאה באיפוס סיסמה' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-origami-cream via-origami-peach/30 to-origami-sage/30 flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          {logo && (
            <div className="mb-4 flex justify-center">
              <img src={logo} alt={businessName} className="h-16" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            אזור אישי לתלמידים
          </h1>
          <p className="text-gray-600">{businessName || 'CRM'}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email or Phone */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                אימייל או טלפון
              </label>
              <input
                id="email"
                name="email"
                type="text"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.email
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-origami-coral'
                  }`}
                placeholder="הזן אימייל או טלפון"
                dir="ltr"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone (alternative) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                טלפון (אם לא הזנת אימייל)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.phone
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-origami-coral'
                  }`}
                placeholder="הזן טלפון"
                dir="ltr"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה ראשונית
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.password
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-origami-coral'
                  }`}
                placeholder="הזן סיסמה ראשונית"
                dir="ltr"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-origami-coral to-origami-peach text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg min-h-touch touch-manipulation active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin ml-3 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  מתחבר...
                </span>
              ) : (
                'התחברות'
              )}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            השתמש בסיסמה הראשונית שקיבלת בעת הרישום
          </p>
          <button
            type="button"
            onClick={() => setShowResetPassword(!showResetPassword)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            שכחתי את הסיסמה הראשונית
          </button>
        </div>

        {/* Reset Password Form */}
        {showResetPassword && (
          <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
            <h2 className="text-xl font-bold text-gray-900 mb-4">איפוס סיסמה ראשונית</h2>
            {resetSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">{resetSuccess}</p>
              </div>
            )}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                  אימייל או טלפון
                </label>
                <input
                  id="reset-email"
                  type="text"
                  value={resetData.email}
                  onChange={(e) => setResetData({ ...resetData, email: e.target.value, phone: '' })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-origami-coral"
                  placeholder="הזן אימייל"
                  dir="ltr"
                />
              </div>
              <div className="text-center text-sm text-gray-600">או</div>
              <div>
                <input
                  id="reset-phone"
                  type="tel"
                  value={resetData.phone}
                  onChange={(e) => setResetData({ ...resetData, phone: e.target.value, email: '' })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-origami-coral"
                  placeholder="הזן טלפון"
                  dir="ltr"
                />
              </div>
              {errors.reset && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 font-medium">{errors.reset}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  {resetLoading ? 'מאפס...' : 'אפס סיסמה'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetData({ email: '', phone: '' });
                    setErrors({});
                    setResetSuccess(null);
                  }}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-all"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentLoginPage;
