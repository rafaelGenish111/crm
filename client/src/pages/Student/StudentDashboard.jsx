import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/Layout/StudentLayout';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import studentService from '../../services/studentService';
import { BookIcon, ChartIcon, GraduationIcon } from '../../components/ui/Icons';

function StudentDashboard() {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        studentService.getCourses(),
        studentService.getGrades(),
        studentService.getRecommendedWorkshops(),
      ]);

      const [coursesResult, gradesResult, workshopsResult] = results;

      if (coursesResult.status === 'fulfilled') setCourses(coursesResult.value?.courses || []);
      else console.warn('Failed to load courses:', coursesResult.reason);

      if (gradesResult.status === 'fulfilled') setGrades(gradesResult.value);
      else console.warn('Failed to load grades:', gradesResult.reason);

      if (workshopsResult.status === 'fulfilled') setWorkshops(workshopsResult.value?.workshops || []);
      else console.warn('Failed to load workshops:', workshopsResult.reason);

      const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);
      if (errors.length > 0) setError(errors.join('; '));
    } catch (err) {
      setError(err?.message || 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="טוען נתונים..." />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">דשבורד אישי</h1>
          <p className="text-gray-600">ברוכים הבאים לאזור האישי שלך</p>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/student/ai-bot')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              עוזר AI אישי
            </button>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-origami-ocean/20 to-origami-sky/20 border-origami-ocean/30 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/student/courses')}>
            <div className="text-center">
              <BookIcon className="w-12 h-12 text-origami-ocean mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">קורסים פעילים</p>
              <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-origami-coral/20 to-origami-peach/20 border-origami-coral/30 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/student/grades')}>
            <div className="text-center">
              <ChartIcon className="w-12 h-12 text-origami-coral mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">ממוצע ציונים</p>
              <p className="text-3xl font-bold text-gray-900">
                {grades?.summary?.averagePercentage ? `${Math.round(grades.summary.averagePercentage)}%` : '-'}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-origami-sage/20 to-origami-mint/20 border-origami-sage/30 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/student/workshops')}>
            <div className="text-center">
              <GraduationIcon className="w-12 h-12 text-origami-sage mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">סדנאות מומלצות</p>
              <p className="text-3xl font-bold text-gray-900">{workshops.length}</p>
            </div>
          </Card>
        </div>

        {/* Active Courses */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">קורסים פעילים</h2>
            <button
              onClick={() => navigate('/student/courses')}
              className="text-sm text-origami-coral hover:text-origami-coral/80 font-medium"
            >
              צפה בכל
            </button>
          </div>
          {courses.length > 0 ? (
            <div className="space-y-3">
              {courses.slice(0, 3).map((item) => (
                <div
                  key={item.enrollmentId}
                  className="p-4 bg-gradient-to-r from-origami-cream/50 to-origami-peach/30 rounded-lg border border-origami-peach/20 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/student/courses/${item.course.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.course.name}</h3>
                      {item.course.subject && (
                        <p className="text-sm text-gray-600 mt-1">{item.course.subject}</p>
                      )}
                      {item.course.instructor && (
                        <p className="text-xs text-gray-500 mt-1">
                          מנחה: {item.course.instructor.name}
                        </p>
                      )}
                      {item.course.nextSession && (
                        <p className="text-xs text-origami-coral mt-2 font-medium">
                          מפגש הבא: מפגש {item.course.nextSession} מתוך {item.course.totalSessions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">אין קורסים פעילים</p>
          )}
        </Card>

        {/* Recommended Workshops */}
        {workshops.length > 0 && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">סדנאות מומלצות</h2>
              <button
                onClick={() => navigate('/student/workshops')}
                className="text-sm text-origami-coral hover:text-origami-coral/80 font-medium"
              >
                צפה בכל
              </button>
            </div>
            <div className="space-y-3">
              {workshops.slice(0, 3).map((workshop) => (
                <div
                  key={workshop.id}
                  className="p-4 bg-gradient-to-r from-origami-lavender/30 to-origami-sky/30 rounded-lg border border-origami-lavender/20"
                >
                  <h3 className="font-semibold text-gray-900">{workshop.name}</h3>
                  {workshop.date && (
                    <p className="text-sm text-gray-600 mt-1">
                      תאריך: {formatDate(workshop.date, config)}
                    </p>
                  )}
                  {workshop.price && (
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {formatCurrency(workshop.price, config)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}

export default StudentDashboard;
