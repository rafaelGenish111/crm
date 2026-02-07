import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/Layout/StudentLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import studentService from '../../services/studentService';

function StudentProfilePage() {
  const navigate = useNavigate();
  const { student, logout, resetPassword: resetPasswordFromContext } = useStudentAuth();
  const { config } = useBusinessConfig();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getProfile();
      setProfile(data.student);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך לאפס את הסיסמה? תקבל סיסמה ראשונית חדשה.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await resetPasswordFromContext();
      alert(`סיסמה אופסה בהצלחה!\nהסיסמה הראשונית החדשה שלך: ${data.initialPassword}\n\nשמור את הסיסמה במקום בטוח.`);
      // רענון הפרופיל כדי להציג את הסיסמה החדשה
      await loadProfile();
    } catch (err) {
      setError(err.message || 'שגיאה באיפוס סיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="טוען פרופיל..." />
        </div>
      </StudentLayout>
    );
  }

  const displayStudent = profile || student;

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">פרופיל אישי</h1>

        {error && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {displayStudent && (
          <div className="space-y-6">
            {/* Personal Info */}
            <Card>
              <h2 className="text-lg font-semibold mb-4">פרטים אישיים</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">שם</label>
                  <p className="text-gray-900 font-medium">{displayStudent.name}</p>
                </div>
                {displayStudent.email && (
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">אימייל</label>
                    <p className="text-gray-900">{displayStudent.email}</p>
                  </div>
                )}
                {displayStudent.phone && (
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">טלפון</label>
                    <p className="text-gray-900">{displayStudent.phone}</p>
                  </div>
                )}
                {displayStudent.createdAt && (
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">תאריך רישום</label>
                    <p className="text-gray-900">{formatDate(displayStudent.createdAt, config)}</p>
                  </div>
                )}
                {displayStudent.lastLogin && (
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">התחברות אחרונה</label>
                    <p className="text-gray-900">{formatDate(displayStudent.lastLogin, config)}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Password Status */}
            <Card>
              <h2 className="text-lg font-semibold mb-4">אבטחה</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">סטטוס סיסמה</p>
                    <p className="text-gray-900">
                      {displayStudent.passwordChanged ? (
                        <span className="text-green-600 font-medium">סיסמה שונתה</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">סיסמה ראשונית</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate('/student/change-password')}
                      variant="primary"
                      size="sm"
                    >
                      {displayStudent.passwordChanged ? 'שנה סיסמה' : 'הגדר סיסמה חדשה'}
                    </Button>
                    {!displayStudent.passwordChanged && (
                      <Button
                        onClick={handleResetPassword}
                        variant="neutral"
                        size="sm"
                        disabled={loading}
                      >
                        אפס סיסמה
                      </Button>
                    )}
                  </div>
                </div>
                {!displayStudent.passwordChanged && displayStudent.initialPassword && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>סיסמה ראשונית:</strong>
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-lg font-mono text-center tracking-wider">
                        {displayStudent.initialPassword}
                      </code>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(displayStudent.initialPassword);
                          alert('הסיסמה הועתקה ללוח');
                        }}
                        variant="neutral"
                        size="sm"
                      >
                        העתק
                      </Button>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      שמור את הסיסמה במקום בטוח. מומלץ לשנות אותה לסיסמה אישית.
                    </p>
                  </div>
                )}
                {!displayStudent.passwordChanged && !displayStudent.initialPassword && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>שימו לב:</strong> מומלץ לשנות את הסיסמה הראשונית לסיסמה אישית חזקה יותר.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Account Status */}
            <Card>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">סטטוס חשבון</p>
                  <p className="text-gray-900">
                    {displayStudent.isActive ? (
                      <span className="text-green-600 font-medium">פעיל</span>
                    ) : (
                      <span className="text-red-600 font-medium">מושבת</span>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            {/* Logout */}
            <Card>
              <Button
                onClick={logout}
                variant="danger"
                className="w-full"
              >
                התנתק
              </Button>
            </Card>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default StudentProfilePage;
