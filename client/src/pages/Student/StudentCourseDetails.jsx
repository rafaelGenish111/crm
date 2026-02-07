import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/Layout/StudentLayout';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CourseSchedule from '../../components/Student/CourseSchedule';
import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import studentService from '../../services/studentService';

function StudentCourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseDetails();
  }, [id]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getCourseDetails(id);
      setCourse(data.course);
      setSessions(data.sessions || []);
      setGrades(data.grades || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="טוען פרטי קורס..." />
        </div>
      </StudentLayout>
    );
  }

  if (error || !course) {
    return (
      <StudentLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'קורס לא נמצא'}</p>
        </Card>
      </StudentLayout>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'סקירה כללית',
      content: (
        <div className="space-y-6">
          {/* Course Info */}
          <Card>
            <h3 className="text-lg font-semibold mb-4">מידע כללי</h3>
            <div className="space-y-3">
              {course.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">תיאור</p>
                  <p className="text-gray-900">{course.description}</p>
                </div>
              )}
              {course.instructor && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">מנחה</p>
                  <p className="text-gray-900">{course.instructor.name}</p>
                  {course.instructor.email && (
                    <p className="text-sm text-gray-600">{course.instructor.email}</p>
                  )}
                </div>
              )}
              {course.location && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">מיקום</p>
                  <p className="text-gray-900">{course.location}</p>
                </div>
              )}
              {course.startDate && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">תאריך התחלה</p>
                  <p className="text-gray-900">{formatDate(course.startDate, config)}</p>
                </div>
              )}
              {course.endDate && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">תאריך סיום</p>
                  <p className="text-gray-900">{formatDate(course.endDate, config)}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Syllabus */}
          {course.syllabus && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">סילבוס</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{course.syllabus}</p>
              </div>
            </Card>
          )}

          {/* Required Equipment */}
          {course.requiredEquipment && course.requiredEquipment.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">ציוד נדרש</h3>
              <ul className="list-disc list-inside space-y-2">
                {course.requiredEquipment.map((equipment, index) => (
                  <li key={index} className="text-gray-700">{equipment}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'schedule',
      label: 'לוח זמנים',
      content: (
        <CourseSchedule
          sessions={sessions}
          currentSession={course.currentSession}
        />
      ),
    },
    {
      id: 'grades',
      label: 'ציונים',
      badge: grades.length,
      content: (
        <Card>
          <h3 className="text-lg font-semibold mb-4">ציונים</h3>
          {grades.length > 0 ? (
            <div className="space-y-4">
              {grades.map((grade) => (
                <div
                  key={grade.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{grade.exam.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {grade.exam.type === 'exam' ? 'מבחן' :
                          grade.exam.type === 'quiz' ? 'בוחן' :
                            grade.exam.type === 'assignment' ? 'מטלה' : 'פרויקט'}
                      </p>
                      {grade.exam.date && (
                        <p className="text-xs text-gray-500 mt-1">
                          תאריך: {formatDate(grade.exam.date, config)}
                        </p>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-gray-900">
                        {grade.score}/{grade.exam.maxScore}
                      </p>
                      {grade.percentage !== undefined && (
                        <p className="text-sm text-gray-600">
                          {Math.round(grade.percentage)}%
                        </p>
                      )}
                    </div>
                  </div>
                  {grade.notes && (
                    <p className="text-sm text-gray-700 mt-2 border-t border-gray-200 pt-2">
                      {grade.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">אין ציונים עדיין</p>
          )}
        </Card>
      ),
    },
  ];

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => navigate('/student/courses')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              חזרה לקורסים
            </button>
            <button
              onClick={() => navigate(`/student/ai-bot/course/${id}`)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              שאל את העוזר AI
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.name}</h1>
          {course.subject && (
            <p className="text-gray-600">{course.subject}</p>
          )}
        </div>

        <Tabs tabs={tabs} />
      </div>
    </StudentLayout>
  );
}

export default StudentCourseDetails;
