import { useState, useEffect } from 'react';
import StudentLayout from '../../components/Layout/StudentLayout';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import studentService from '../../services/studentService';

function StudentWorkshopsPage() {
  const { config } = useBusinessConfig();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getRecommendedWorkshops();
      setWorkshops(data.workshops || []);
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
          <LoadingSpinner size="lg" text="טוען סדנאות..." />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">סדנאות מומלצות</h1>

        {error && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {workshops.length > 0 ? (
          <div className="space-y-4">
            {workshops.map((workshop) => (
              <Card
                key={workshop.id}
                className={`hover:shadow-lg transition-shadow ${workshop.isEnrolled ? 'bg-green-50 border-green-200' : ''
                  }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{workshop.name}</h3>
                      {workshop.description && (
                        <p className="text-sm text-gray-600 mt-1">{workshop.description}</p>
                      )}
                      {workshop.instructor && (
                        <p className="text-xs text-gray-500 mt-2">
                          מנחה: {workshop.instructor.name}
                        </p>
                      )}
                    </div>
                    {workshop.isEnrolled && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        רשום
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {workshop.date && (
                      <div>
                        <p className="text-gray-600 mb-1">תאריך</p>
                        <p className="font-semibold text-gray-900">{formatDate(workshop.date, config)}</p>
                      </div>
                    )}
                    {workshop.duration && (
                      <div>
                        <p className="text-gray-600 mb-1">משך זמן</p>
                        <p className="font-semibold text-gray-900">{workshop.duration} שעות</p>
                      </div>
                    )}
                    {workshop.price && (
                      <div>
                        <p className="text-gray-600 mb-1">מחיר</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(workshop.price, config)}</p>
                      </div>
                    )}
                    {workshop.location && (
                      <div>
                        <p className="text-gray-600 mb-1">מיקום</p>
                        <p className="font-semibold text-gray-900">{workshop.location}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-gray-500 text-center py-8">אין סדנאות מומלצות כרגע</p>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}

export default StudentWorkshopsPage;
