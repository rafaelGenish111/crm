import { useState, useEffect } from 'react';
import StudentLayout from '../../components/Layout/StudentLayout';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StudentCourseCard from '../../components/Student/StudentCourseCard';
import studentService from '../../services/studentService';
import { useStudentAuth } from '../../context/StudentAuthContext';

function StudentCoursesPage() {
  const { student } = useStudentAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // טעינת קורסים רק אם התלמיד מחובר
    if (student) {
      loadCourses();
    }
  }, [student]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getCourses();
      setCourses(data.courses || []);
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
          <LoadingSpinner size="lg" text="טוען קורסים..." />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">הקורסים שלי</h1>

        {error && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {courses.length > 0 ? (
          <div className="space-y-4">
            {courses.map((item) => (
              <StudentCourseCard key={item.enrollmentId} course={item.course} />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-gray-500 text-center py-8">אין קורסים פעילים</p>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}

export default StudentCoursesPage;
