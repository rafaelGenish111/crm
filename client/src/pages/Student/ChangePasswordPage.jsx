import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/Layout/StudentLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useStudentAuth } from '../../context/StudentAuthContext';

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword, student } = useStudentAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'נא להזין סיסמה נוכחית';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'נא להזין סיסמה חדשה';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'סיסמה חייבת להכיל לפחות 6 תווים';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'נא לאשר את הסיסמה החדשה';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'הסיסמאות לא תואמות';
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
    setSuccess(false);

    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => {
        navigate('/student/profile');
      }, 2000);
    } catch (error) {
      setErrors({ submit: error.message || 'שגיאה בשינוי סיסמה. אנא נסה שוב.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">שינוי סיסמה</h1>

        <Card>
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">הסיסמה שונתה בהצלחה! מחזיר לפרופיל...</p>
            </div>
          )}

          {!student?.passwordChanged && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>שימו לב:</strong> זו הפעם הראשונה שאתם משנים את הסיסמה.
                השתמשו בסיסמה הראשונית שקיבלתם בעת הרישום.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {student?.passwordChanged ? 'סיסמה נוכחית' : 'סיסמה ראשונית'}
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.currentPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-origami-coral'
                  }`}
                placeholder="הזן סיסמה נוכחית"
                dir="ltr"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה חדשה
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.newPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-origami-coral'
                  }`}
                placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                dir="ltr"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                אישור סיסמה חדשה
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-origami-coral'
                  }`}
                placeholder="הזן שוב את הסיסמה החדשה"
                dir="ltr"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || success}
                className="flex-1"
              >
                {isLoading ? 'מעדכן...' : 'שמור סיסמה חדשה'}
              </Button>
              <Button
                type="button"
                variant="neutral"
                onClick={() => navigate('/student/profile')}
              >
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </StudentLayout>
  );
}

export default ChangePasswordPage;
