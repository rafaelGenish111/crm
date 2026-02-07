import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import attendanceService from '../../services/attendanceService';
import courseService from '../../services/courseService';
import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import { useAuth } from '../../context/AuthContext';

function Attendance() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [attendees, setAttendees] = useState([]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'admin_staff';

  useEffect(() => {
    loadData();
  }, [courseId]);

  useEffect(() => {
    if (selectedSession !== null && enrollments.length > 0) {
      loadAttendanceForSession();
    } else if (selectedSession !== null && enrollments.length === 0) {
      // אם אין הרשמות, יצירת רשימה ריקה
      setAttendees([]);
      setAttendance(null);
    }
  }, [selectedSession, enrollments.length]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseData, sessionsData] = await Promise.all([
        courseService.getCourseById(courseId),
        attendanceService.getCourseSessions(courseId),
      ]);

      setCourse(courseData.course);
      setEnrollments(courseData.enrollments || []);
      setSessions(sessionsData.sessions || []);
      setCurrentSession(sessionsData.currentSession || sessionsData.nextSession || 1);
      setSelectedSession(sessionsData.currentSession || sessionsData.nextSession || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForSession = async () => {
    if (!selectedSession || enrollments.length === 0) {
      setAttendees([]);
      return;
    }

    try {
      const data = await attendanceService.getAttendanceByCourse(courseId, selectedSession);
      if (data.attendance && data.attendance.length > 0) {
        setAttendance(data.attendance[0]);
        // מיפוי המשתתפים מהנוכחות עם המשתתפים הרשומים
        const existingAttendees = data.attendance[0].attendees || [];
        const enrollmentIds = enrollments.map(e => e._id || e.id);
        
        // יצירת רשימה מלאה - כולל משתתפים חדשים שנוספו אחרי שמירת הנוכחות
        const allAttendees = enrollments.map(enrollment => {
          const existing = existingAttendees.find(a => 
            (a.enrollment._id || a.enrollment.id || a.enrollment) === (enrollment._id || enrollment.id)
          );
          return existing || {
            enrollment: enrollment._id || enrollment.id,
            status: 'absent',
            notes: '',
          };
        });
        
        setAttendees(allAttendees);
      } else {
        // יצירת רשימת משתתפים חדשה
        const newAttendees = enrollments.map(enrollment => ({
          enrollment: enrollment._id || enrollment.id,
          status: 'absent',
          notes: '',
        }));
        setAttendees(newAttendees);
        setAttendance(null);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
      // יצירת רשימת משתתפים חדשה
      const newAttendees = enrollments.map(enrollment => ({
        enrollment: enrollment._id || enrollment.id,
        status: 'absent',
        notes: '',
      }));
      setAttendees(newAttendees);
    }
  };

  const handleStatusChange = (index, status) => {
    const updated = [...attendees];
    updated[index].status = status;
    setAttendees(updated);
  };

  const handleNotesChange = (index, notes) => {
    const updated = [...attendees];
    updated[index].notes = notes;
    setAttendees(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const selectedSessionData = sessions.find(s => s.sessionNumber === selectedSession);
      if (!selectedSessionData) {
        setError('לא ניתן למצוא את פרטי המפגש');
        return;
      }

      await attendanceService.createOrUpdateAttendance(courseId, {
        sessionNumber: selectedSession,
        sessionDate: selectedSessionData.date,
        attendees,
      });

      await loadAttendanceForSession();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getEnrollmentName = (enrollmentId) => {
    // אם זה אובייקט enrollment מלא
    if (typeof enrollmentId === 'object' && enrollmentId !== null) {
      if (enrollmentId.customer) {
        return enrollmentId.customer.name;
      }
      if (enrollmentId.lead) {
        return enrollmentId.lead.name;
      }
    }
    
    // אם זה ID בלבד
    const enrollment = enrollments.find(e => 
      (e._id || e.id) === (enrollmentId?._id || enrollmentId?.id || enrollmentId)
    );
    if (!enrollment) return '-';
    if (enrollment.customer) {
      return enrollment.customer.name;
    }
    if (enrollment.lead) {
      return enrollment.lead.name;
    }
    return '-';
  };

  const getEnrollmentPhone = (enrollmentId) => {
    // אם זה אובייקט enrollment מלא
    if (typeof enrollmentId === 'object' && enrollmentId !== null) {
      if (enrollmentId.customer) {
        return enrollmentId.customer.phone;
      }
      if (enrollmentId.lead) {
        return enrollmentId.lead.phone;
      }
    }
    
    // אם זה ID בלבד
    const enrollment = enrollments.find(e => 
      (e._id || e.id) === (enrollmentId?._id || enrollmentId?.id || enrollmentId)
    );
    if (!enrollment) return '-';
    if (enrollment.customer) {
      return enrollment.customer.phone;
    }
    if (enrollment.lead) {
      return enrollment.lead.phone;
    }
    return '-';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען בדיקת נוכחות...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !course) {
    return (
      <DashboardLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </DashboardLayout>
    );
  }

  const selectedSessionData = sessions.find(s => s.sessionNumber === selectedSession);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">בדיקת נוכחות</h1>
            <p className="text-gray-600 mt-2">{course?.name}</p>
          </div>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            חזרה לקורס
          </button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Session Selector - רק לאדמין */}
        {isAdmin && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">בחר מפגש</h3>
            <div className="flex flex-wrap gap-2">
              {sessions.map((session) => (
                <button
                  key={session.sessionNumber}
                  onClick={() => setSelectedSession(session.sessionNumber)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedSession === session.sessionNumber
                      ? 'bg-blue-600 text-white'
                      : session.sessionNumber === currentSession
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  מפגש {session.sessionNumber}
                  {session.sessionNumber === currentSession && ' (נוכחי)'}
                  <br />
                  <span className="text-xs">
                    {formatDate(session.date, config)}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Attendance Form */}
        {selectedSessionData && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                מפגש {selectedSession} - {formatDate(selectedSessionData.date, config)}
                {selectedSession === currentSession && (
                  <span className="mr-2 text-sm text-green-600 font-normal">(מפגש נוכחי)</span>
                )}
              </h3>
              <button
                onClick={handleSave}
                disabled={saving || attendees.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'שמור נוכחות'}
              </button>
            </div>

            {attendees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right">שם</th>
                      <th className="px-4 py-2 text-right">טלפון</th>
                      <th className="px-4 py-2 text-right">נוכחות</th>
                      <th className="px-4 py-2 text-right">הערות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((attendee, index) => {
                      const enrollmentId = attendee.enrollment?._id || attendee.enrollment?.id || attendee.enrollment;
                      return (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{getEnrollmentName(enrollmentId)}</td>
                          <td className="px-4 py-2">{getEnrollmentPhone(enrollmentId)}</td>
                        <td className="px-4 py-2">
                          <select
                            value={attendee.status}
                            onChange={(e) => handleStatusChange(index, e.target.value)}
                            className="px-3 py-1 border rounded-lg"
                          >
                            <option value="absent">נעדר</option>
                            <option value="present">נוכח</option>
                            <option value="late">איחר</option>
                            <option value="excused">מוצדק</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={attendee.notes || ''}
                            onChange={(e) => handleNotesChange(index, e.target.value)}
                            placeholder="הערות..."
                            className="w-full px-3 py-1 border rounded-lg"
                          />
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">אין משתתפים רשומים לקורס זה</p>
            )}
          </Card>
        )}

        {!selectedSessionData && sessions.length === 0 && (
          <Card>
            <p className="text-gray-500 text-center py-8">
              הקורס לא מוגדר עם מפגשים. יש להגדיר תאריך התחלה, מספר מפגשים ויום בשבוע.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Attendance;
