import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import { MoneyIcon, ChartIcon, UserIcon } from '../../components/ui/Icons';
import courseService from '../../services/courseService';
import customerService from '../../services/customerService';
import leadService from '../../services/leadService';
import examService from '../../services/examService';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [progressInfo, setProgressInfo] = useState(null);
  const [exams, setExams] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnrollments, setSelectedEnrollments] = useState([]);
  const [examData, setExamData] = useState({
    name: '',
    type: 'quiz',
    date: '',
    maxScore: 100,
    weight: 0,
    description: '',
  });
  const [gradesData, setGradesData] = useState({});
  const [enrollmentFormData, setEnrollmentFormData] = useState({
    paymentMethod: 'credit_card',
    numberOfPayments: 1,
    paymentPlan: 'single',
  });
  const [enrollmentData, setEnrollmentData] = useState({
    customerId: '',
    leadId: '',
    notes: '',
  });
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'other',
  });

  useEffect(() => {
    loadCourseData();
    loadCustomers();
    loadLeads();
    loadExams();
  }, [id]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourseById(id);
      setCourse(data.course);
      setEnrollments(data.enrollments || []);
      setProgressInfo(data.progressInfo || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadLeads = async () => {
    try {
      const data = await leadService.getLeads();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    }
  };

  const loadExams = async () => {
    try {
      const data = await examService.getExamsByCourse(id);
      setExams(data.exams || []);
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await examService.createExam(id, examData);
      await loadExams();
      setShowExamModal(false);
      setExamData({
        name: '',
        type: 'quiz',
        date: '',
        maxScore: 100,
        weight: 0,
        description: '',
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenGrades = async (exam) => {
    try {
      const data = await examService.getExamById(exam._id || exam.id);
      setSelectedExam(data.exam);

      // יצירת אובייקט ציונים מהנתונים הקיימים
      const grades = {};
      enrollments.forEach(enrollment => {
        const existingGrade = data.grades?.find(g =>
          (g.enrollment._id || g.enrollment.id) === (enrollment._id || enrollment.id)
        );
        grades[enrollment._id || enrollment.id] = {
          score: existingGrade?.score || 0,
          notes: existingGrade?.notes || '',
        };
      });
      setGradesData(grades);
      setShowGradesModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveGrades = async (e) => {
    e.preventDefault();
    try {
      const grades = Object.entries(gradesData).map(([enrollmentId, data]) => ({
        enrollmentId,
        score: parseFloat(data.score) || 0,
        notes: data.notes || '',
      }));

      await examService.saveGrades(selectedExam._id || selectedExam.id, grades);
      await loadExams();
      setShowGradesModal(false);
      setSelectedExam(null);
      setGradesData({});
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddToSelection = (type, item) => {
    const enrollment = {
      [type === 'customer' ? 'customerId' : 'leadId']: item._id || item.id,
      type,
      name: item.name,
      phone: item.phone,
      email: item.email,
      notes: '',
    };

    // בדיקה אם כבר קיים
    const exists = selectedEnrollments.some(e =>
      (type === 'customer' && e.customerId === enrollment.customerId) ||
      (type === 'lead' && e.leadId === enrollment.leadId)
    );

    if (!exists) {
      setSelectedEnrollments([...selectedEnrollments, enrollment]);
      setSearchQuery('');
    }
  };

  const handleRemoveFromSelection = (index) => {
    setSelectedEnrollments(selectedEnrollments.filter((_, i) => i !== index));
  };

  const handleEnrollMultiple = async (e) => {
    e.preventDefault();
    try {
      // רישום כל המשתתפים שנבחרו
      for (const enrollment of selectedEnrollments) {
        await courseService.enrollInCourse(id, {
          customerId: enrollment.customerId || '',
          leadId: enrollment.leadId || '',
          notes: enrollment.notes || '',
          paymentMethod: enrollmentFormData.paymentMethod,
          numberOfPayments: enrollmentFormData.numberOfPayments,
          paymentPlan: enrollmentFormData.paymentPlan,
        });
      }
      await loadCourseData();
      setShowEnrollModal(false);
      setSelectedEnrollments([]);
      setSearchQuery('');
      setEnrollmentFormData({
        paymentMethod: 'credit_card',
        numberOfPayments: 1,
        paymentPlan: 'single',
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      await courseService.enrollInCourse(id, enrollmentData);
      await loadCourseData();
      setShowEnrollModal(false);
      setEnrollmentData({ customerId: '', leadId: '', notes: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  // פילטור לקוחות ולידים לחיפוש
  const filteredCustomers = customers.filter(customer =>
    !searchQuery ||
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeads = leads.filter(lead =>
    !searchQuery ||
    lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone?.includes(searchQuery) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateLeadAndEnroll = async (e) => {
    e.preventDefault();
    try {
      await courseService.enrollInCourse(id, {
        leadData,
        notes: '',
      });
      await loadCourseData();
      setShowCreateLeadModal(false);
      setLeadData({ name: '', email: '', phone: '', source: 'other' });
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען פרטי קורס...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'קורס לא נמצא'}</p>
        </Card>
      </DashboardLayout>
    );
  }

  const examTypeLabels = {
    exam: 'מבחן',
    quiz: 'בוחן',
    assignment: 'מטלה',
    project: 'פרויקט',
  };

  const tabs = [
    {
      id: 'overview',
      label: 'סקירה כללית',
      content: (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">משתתפים</p>
                <p className="text-3xl font-bold text-blue-600">{enrollments.length}</p>
                <p className="text-xs text-gray-500 mt-1">מתוך {course.capacity}</p>
              </div>
            </Card>
            {progressInfo && (
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">התקדמות</p>
                  <p className="text-3xl font-bold text-green-600">
                    {progressInfo.currentSession} / {progressInfo.totalSessions}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{progressInfo.progress}% הושלם</p>
                </div>
              </Card>
            )}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">מבחנים ובחנים</p>
                <p className="text-3xl font-bold text-purple-600">{exams.length}</p>
                <p className="text-xs text-gray-500 mt-1">סה"כ</p>
              </div>
            </Card>
          </div>

          {/* Course Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-lg font-semibold mb-4">פרטי הקורס</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">מנחה:</span>
                  <span className="font-medium">{course.instructor?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">מחיר:</span>
                  <span className="font-medium">{formatCurrency(course.price, config)}</span>
                </div>
                {course.startDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">תאריך התחלה:</span>
                    <span className="font-medium">{formatDate(course.startDate, config)}</span>
                  </div>
                )}
                {course.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">תאריך סיום:</span>
                    <span className="font-medium">{formatDate(course.endDate, config)}</span>
                  </div>
                )}
                {course.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">מיקום:</span>
                    <span className="font-medium">{course.location}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">פרטים נוספים</h3>
              <div className="space-y-3">
                {course.numberOfSessions && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">מספר מפגשים:</span>
                    <span className="font-medium">
                      {progressInfo ? `${progressInfo.currentSession} / ${progressInfo.totalSessions}` : course.numberOfSessions}
                    </span>
                  </div>
                )}
                {course.dayOfWeek && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">יום בשבוע:</span>
                    <span className="font-medium">
                      {course.dayOfWeek === 'sunday' ? 'ראשון' :
                        course.dayOfWeek === 'monday' ? 'שני' :
                          course.dayOfWeek === 'tuesday' ? 'שלישי' :
                            course.dayOfWeek === 'wednesday' ? 'רביעי' :
                              course.dayOfWeek === 'thursday' ? 'חמישי' :
                                course.dayOfWeek === 'friday' ? 'שישי' :
                                  course.dayOfWeek === 'saturday' ? 'שבת' : course.dayOfWeek}
                    </span>
                  </div>
                )}
                {course.additionalStaff && course.additionalStaff.length > 0 && (
                  <div>
                    <span className="text-gray-600">אנשי צוות נוספים:</span>
                    <div className="mt-1">
                      {course.additionalStaff.map((staff, idx) => (
                        <span key={staff._id || staff.id || idx} className="text-sm font-medium mr-2">
                          {staff.name}
                          {idx < course.additionalStaff.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {course.requiredEquipment && course.requiredEquipment.length > 0 && (
                  <div>
                    <span className="text-gray-600">ציוד נדרש:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {course.requiredEquipment.map((equipment, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {course.holidays && course.holidays.length > 0 && (
                  <div>
                    <span className="text-gray-600">חופשים:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {course.holidays.map((holiday, idx) => (
                        <span key={idx} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          {formatDate(holiday, config)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {course.description && (
            <Card>
              <h3 className="text-lg font-semibold mb-2">תיאור הקורס</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'participants',
      label: 'משתתפים',
      badge: enrollments.length,
      content: (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">משתתפים</h2>
            <Button
              onClick={() => setShowEnrollModal(true)}
              variant="primary"
              size="sm"
            >
              הוסף משתתף
            </Button>
          </div>
          <DataTable
            columns={[
              {
                key: 'name',
                label: 'שם',
                render: (value, row) => {
                  if (row.customer) {
                    return row.customer.name;
                  }
                  if (row.lead) {
                    return row.lead.name;
                  }
                  return '-';
                },
              },
              {
                key: 'type',
                label: 'סוג',
                render: (value, row) => (
                  <span className={`text-xs px-2 py-0.5 rounded ${row.customer ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                    {row.customer ? 'לקוח' : 'ליד'}
                  </span>
                ),
              },
              {
                key: 'phone',
                label: 'טלפון',
                render: (value, row) => {
                  if (row.customer) {
                    return row.customer.phone;
                  }
                  if (row.lead) {
                    return row.lead.phone;
                  }
                  return '-';
                },
              },
              {
                key: 'enrolledAt',
                label: 'תאריך רישום',
                render: (value) => formatDate(value, config),
              },
              {
                key: 'status',
                label: 'סטטוס',
                render: (value, row) => {
                  const statusLabels = {
                    pending: 'ממתין לתשלום',
                    approved: 'מאושר',
                    enrolled: 'רשום',
                    completed: 'הושלם',
                    cancelled: 'בוטל',
                  };
                  const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    approved: 'bg-green-100 text-green-800',
                    enrolled: 'bg-blue-100 text-blue-800',
                    completed: 'bg-purple-100 text-purple-800',
                    cancelled: 'bg-gray-100 text-gray-800',
                  };
                  return (
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[value] || value}
                    </span>
                  );
                },
              },
              {
                key: 'actions',
                label: 'פעולות',
                render: (value, row) => {
                  return (
                    <div className="flex gap-2">
                      {row.status === 'pending' && row.customer && row.pendingPaymentId && (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => navigate(`/payment/${row.pendingPaymentId}`)}
                        >
                          שלם עכשיו
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          if (window.confirm('האם אתה בטוח שברצונך להסיר את המשתתף מהקורס?')) {
                            try {
                              await courseService.removeEnrollment(row._id || row.id);
                              await loadCourseData();
                            } catch (err) {
                              setError(err.message);
                            }
                          }
                        }}
                      >
                        הסר
                      </Button>
                    </div>
                  );
                },
              },
            ]}
            data={enrollments}
          />
        </Card>
      ),
    },
    {
      id: 'exams',
      label: 'מבחנים ובחנים',
      badge: exams.length,
      content: (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">מבחנים ובחנים</h2>
            <Button
              onClick={() => setShowExamModal(true)}
              variant="accent"
              size="sm"
            >
              הוסף מבחן/בוחן
            </Button>
          </div>
          {exams.length > 0 ? (
            <div className="space-y-3">
              {exams.map((exam) => (
                <Card key={exam._id || exam.id} className="hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{exam.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${exam.type === 'exam' ? 'bg-red-100 text-red-800' :
                          exam.type === 'quiz' ? 'bg-yellow-100 text-yellow-800' :
                            exam.type === 'assignment' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                          }`}>
                          {examTypeLabels[exam.type] || exam.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>תאריך: {formatDate(exam.date, config)}</span>
                        <span>ציון מקסימלי: {exam.maxScore}</span>
                        {exam.weight > 0 && <span>משקל: {exam.weight}%</span>}
                      </div>
                      {exam.description && (
                        <p className="text-sm text-gray-600 mt-2">{exam.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        onClick={() => handleOpenGrades(exam)}
                        variant="primary"
                        size="sm"
                      >
                        ציונים
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">אין מבחנים או בחנים עדיין</p>
          )}
        </Card>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-origami-coral to-origami-peach rounded-2xl p-6 text-gray-900 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gray-900">{course.name}</h1>
              <p className="text-gray-700 text-lg">{course.subject}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-800">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  <span>{course.instructor?.name || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MoneyIcon className="w-5 h-5" />
                  <span>{formatCurrency(course.price, config)}</span>
                </div>
                {progressInfo && (
                  <div className="flex items-center gap-2">
                    <ChartIcon className="w-5 h-5" />
                    <span>מפגש {progressInfo.currentSession} מתוך {progressInfo.totalSessions}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2 space-y-reverse">
              <Button
                onClick={() => navigate(`/courses/${id}/attendance`)}
                variant="success"
                className="bg-white text-gray-900"
              >
                בדיקת נוכחות
              </Button>
              <Button
                onClick={() => navigate('/courses')}
                variant="neutral"
                className="bg-white/90 text-gray-900 border-white/50 hover:bg-white"
              >
                חזרה
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <Tabs tabs={tabs} />

        {/* Enroll Modal */}
        <Modal
          isOpen={showEnrollModal}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedEnrollments([]);
            setSearchQuery('');
          }}
          title="שיבוץ משתתפים לקורס"
        >
          <form onSubmit={handleEnrollMultiple} className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">חיפוש לקוח או ליד</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי שם, טלפון או אימייל..."
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            {/* Search Results */}
            {(filteredCustomers.length > 0 || filteredLeads.length > 0) && searchQuery && (
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer._id || customer.id}
                    onClick={() => handleAddToSelection('customer', customer)}
                    className="p-2 hover:bg-blue-50 cursor-pointer rounded flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-sm text-gray-600 mr-2"> - {customer.phone}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">לקוח</span>
                    </div>
                  </div>
                ))}
                {filteredLeads.map((lead) => (
                  <div
                    key={lead._id || lead.id}
                    onClick={() => handleAddToSelection('lead', lead)}
                    className="p-2 hover:bg-purple-50 cursor-pointer rounded flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-sm text-gray-600 mr-2"> - {lead.phone}</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">ליד</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Enrollments Table */}
            {selectedEnrollments.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  משתתפים שנבחרו ({selectedEnrollments.length})
                </label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-right">שם</th>
                        <th className="px-4 py-2 text-right">טלפון</th>
                        <th className="px-4 py-2 text-right">סוג</th>
                        <th className="px-4 py-2 text-right">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEnrollments.map((enrollment, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{enrollment.name}</td>
                          <td className="px-4 py-2">{enrollment.phone}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${enrollment.type === 'customer'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                              }`}>
                              {enrollment.type === 'customer' ? 'לקוח' : 'ליד'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromSelection(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              הסר
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedEnrollments.length === 0 && !searchQuery && (
              <div className="text-center text-gray-500 py-4">
                השתמש בחיפוש כדי להוסיף לקוחות או לידים
              </div>
            )}

            {/* Payment Options - רק אם יש לקוחות שנבחרו */}
            {selectedEnrollments.some(e => e.type === 'customer') && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-gray-800">אפשרויות תשלום</h3>

                <div>
                  <label className="block text-sm font-medium mb-2">אמצעי תשלום</label>
                  <select
                    value={enrollmentFormData.paymentMethod}
                    onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, paymentMethod: e.target.value })}
                    className="origami-input w-full"
                  >
                    <option value="credit_card">כרטיס אשראי</option>
                    <option value="cardcom">Cardcom</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                    <option value="cash">מזומן</option>
                    <option value="check">צ'ק</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">מספר תשלומים</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={enrollmentFormData.numberOfPayments}
                    onChange={(e) => setEnrollmentFormData({
                      ...enrollmentFormData,
                      numberOfPayments: parseInt(e.target.value) || 1
                    })}
                    className="origami-input w-full"
                  />
                  {enrollmentFormData.numberOfPayments > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      סכום לכל תשלום: {formatCurrency((course?.price || 0) / enrollmentFormData.numberOfPayments, config)}
                    </p>
                  )}
                </div>

                {enrollmentFormData.numberOfPayments > 1 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">תוכנית תשלומים</label>
                    <select
                      value={enrollmentFormData.paymentPlan}
                      onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, paymentPlan: e.target.value })}
                      className="origami-input w-full"
                    >
                      <option value="single">תשלום יחיד</option>
                      <option value="monthly">חודשי</option>
                      <option value="biweekly">דו-שבועי</option>
                      <option value="custom">מותאם אישית</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-start space-x-4 space-x-reverse">
              <Button
                type="submit"
                disabled={selectedEnrollments.length === 0}
                variant="primary"
              >
                שׁבּץ {selectedEnrollments.length > 0 ? `(${selectedEnrollments.length})` : ''}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowEnrollModal(false);
                  setShowCreateLeadModal(true);
                }}
                variant="secondary"
              >
                צור ליד חדש
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowEnrollModal(false);
                  setSelectedEnrollments([]);
                  setSearchQuery('');
                  setEnrollmentFormData({
                    paymentMethod: 'credit_card',
                    numberOfPayments: 1,
                    paymentPlan: 'single',
                  });
                }}
                variant="neutral"
              >
                ביטול
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create Lead Modal */}
        <Modal
          isOpen={showCreateLeadModal}
          onClose={() => setShowCreateLeadModal(false)}
          title="צור ליד חדש ושיבוץ לקורס"
        >
          <form onSubmit={handleCreateLeadAndEnroll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם *</label>
              <input
                type="text"
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">טלפון *</label>
              <input
                type="tel"
                value={leadData.phone}
                onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">אימייל</label>
              <input
                type="email"
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex justify-start space-x-4 space-x-reverse">
              <Button
                type="submit"
                variant="primary"
              >
                צור ושיבוץ
              </Button>
              <Button
                type="button"
                onClick={() => setShowCreateLeadModal(false)}
                variant="neutral"
              >
                ביטול
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create Exam Modal */}
        <Modal
          isOpen={showExamModal}
          onClose={() => {
            setShowExamModal(false);
            setExamData({
              name: '',
              type: 'quiz',
              date: '',
              maxScore: 100,
              weight: 0,
              description: '',
            });
          }}
          title="הוסף מבחן/בוחן"
        >
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם מבחן/בוחן *</label>
              <input
                type="text"
                value={examData.name}
                onChange={(e) => setExamData({ ...examData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">סוג *</label>
                <select
                  value={examData.type}
                  onChange={(e) => setExamData({ ...examData, type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="quiz">בוחן</option>
                  <option value="exam">מבחן</option>
                  <option value="assignment">מטלה</option>
                  <option value="project">פרויקט</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">תאריך *</label>
                <input
                  type="date"
                  value={examData.date}
                  onChange={(e) => setExamData({ ...examData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ציון מקסימלי *</label>
                <input
                  type="number"
                  value={examData.maxScore}
                  onChange={(e) => setExamData({ ...examData, maxScore: parseInt(e.target.value) || 100 })}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">משקל (%)</label>
                <input
                  type="number"
                  value={examData.weight}
                  onChange={(e) => setExamData({ ...examData, weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תיאור</label>
              <textarea
                value={examData.description}
                onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="flex justify-start space-x-4 space-x-reverse">
              <Button
                type="submit"
                variant="primary"
              >
                שמור
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowExamModal(false);
                  setExamData({
                    name: '',
                    type: 'quiz',
                    date: '',
                    maxScore: 100,
                    weight: 0,
                    description: '',
                  });
                }}
                variant="neutral"
              >
                ביטול
              </Button>
            </div>
          </form>
        </Modal>

        {/* Grades Modal */}
        <Modal
          isOpen={showGradesModal}
          onClose={() => {
            setShowGradesModal(false);
            setSelectedExam(null);
            setGradesData({});
          }}
          title={`ציונים - ${selectedExam?.name || ''}`}
        >
          {selectedExam && (
            <form onSubmit={handleSaveGrades} className="space-y-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  ציון מקסימלי: <strong>{selectedExam.maxScore}</strong>
                  {selectedExam.weight > 0 && (
                    <span className="mr-4">משקל: <strong>{selectedExam.weight}%</strong></span>
                  )}
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-right">שם תלמיד</th>
                      <th className="px-4 py-2 text-right">ציון</th>
                      <th className="px-4 py-2 text-right">אחוז</th>
                      <th className="px-4 py-2 text-right">הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => {
                      const enrollmentId = enrollment._id || enrollment.id;
                      const studentName = enrollment.customer?.name || enrollment.lead?.name || '-';
                      const gradeData = gradesData[enrollmentId] || { score: 0, notes: '' };
                      const percentage = selectedExam.maxScore > 0
                        ? Math.round((gradeData.score / selectedExam.maxScore) * 100)
                        : 0;

                      return (
                        <tr key={enrollmentId} className="border-t">
                          <td className="px-4 py-2">{studentName}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={gradeData.score}
                              onChange={(e) => {
                                const score = parseFloat(e.target.value) || 0;
                                setGradesData({
                                  ...gradesData,
                                  [enrollmentId]: {
                                    ...gradeData,
                                    score,
                                  },
                                });
                              }}
                              className="w-20 px-2 py-1 border rounded-lg"
                              min="0"
                              max={selectedExam.maxScore}
                              step="0.1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <span className={`font-medium ${percentage >= 90 ? 'text-green-600' :
                              percentage >= 70 ? 'text-blue-600' :
                                percentage >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                              }`}>
                              {percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={gradeData.notes}
                              onChange={(e) => {
                                setGradesData({
                                  ...gradesData,
                                  [enrollmentId]: {
                                    ...gradeData,
                                    notes: e.target.value,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 border rounded-lg"
                              placeholder="הערות..."
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-start space-x-4 space-x-reverse">
                <Button
                  type="submit"
                  variant="primary"
                >
                  שמור ציונים
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowGradesModal(false);
                    setSelectedExam(null);
                    setGradesData({});
                  }}
                  variant="neutral"
                >
                  ביטול
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default CourseDetails;
