import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import StudentLayout from '../../components/Layout/StudentLayout';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import studentService from '../../services/studentService';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function StudentGradesPage() {
  const [searchParams] = useSearchParams();
  const { config } = useBusinessConfig();
  const { student } = useStudentAuth();
  const [gradesData, setGradesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || 'all');

  useEffect(() => {
    // טעינת ציונים רק אם התלמיד מחובר
    if (student) {
      loadGrades();
    }
  }, [student]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getGrades();
      setGradesData(data);
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
          <LoadingSpinner size="lg" text="טוען ציונים..." />
        </div>
      </StudentLayout>
    );
  }

  const filteredGrades = selectedCourse === 'all'
    ? gradesData?.gradesByCourse || []
    : gradesData?.gradesByCourse?.filter(g => g.course._id === selectedCourse || g.course.id === selectedCourse) || [];

  // הכנת נתונים לגרף
  const chartData = filteredGrades.flatMap(courseData =>
    courseData.grades.map(grade => ({
      name: grade.exam.name,
      score: grade.percentage || (grade.score / grade.exam.maxScore * 100),
      course: courseData.course.name,
    }))
  );

  const COLORS = ['#FFB4A2', '#FFE5D9', '#C8D5B9', '#B8E0D2', '#B8D4E3', '#A8D4E2'];

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">הציונים שלי</h1>

        {error && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Summary */}
        {gradesData?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-origami-ocean/20 to-origami-sky/20 border-origami-ocean/30">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">סה"כ מבחנים</p>
                <p className="text-3xl font-bold text-gray-900">{gradesData.summary.totalExams}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-origami-coral/20 to-origami-peach/20 border-origami-coral/30">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">ממוצע ציונים</p>
                <p className="text-3xl font-bold text-gray-900">
                  {gradesData.summary.averagePercentage ? `${Math.round(gradesData.summary.averagePercentage)}%` : '-'}
                </p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-origami-sage/20 to-origami-mint/20 border-origami-sage/30">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">מספר קורסים</p>
                <p className="text-3xl font-bold text-gray-900">{filteredGrades.length}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Filter */}
        {gradesData?.gradesByCourse && gradesData.gradesByCourse.length > 1 && (
          <Card className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סינון לפי קורס
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-origami-coral"
            >
              <option value="all">כל הקורסים</option>
              {gradesData.gradesByCourse.map((courseData) => (
                <option key={courseData.course._id || courseData.course.id} value={courseData.course._id || courseData.course.id}>
                  {courseData.course.name}
                </option>
              ))}
            </select>
          </Card>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">גרף ציונים</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#FFB4A2">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Grades by Course */}
        {filteredGrades.length > 0 ? (
          <div className="space-y-6">
            {filteredGrades.map((courseData) => (
              <Card key={courseData.course._id || courseData.course.id}>
                <h3 className="text-lg font-semibold mb-4">{courseData.course.name}</h3>
                {courseData.grades.length > 0 ? (
                  <div className="space-y-3">
                    {courseData.grades.map((grade) => (
                      <div
                        key={grade.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
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
                            {grade.notes && (
                              <p className="text-sm text-gray-700 mt-2">{grade.notes}</p>
                            )}
                          </div>
                          <div className="text-left ml-4">
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">אין ציונים לקורס זה</p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-gray-500 text-center py-8">אין ציונים להצגה</p>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}

export default StudentGradesPage;
