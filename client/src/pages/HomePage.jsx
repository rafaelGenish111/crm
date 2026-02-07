import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useBusinessConfig } from '../context/BusinessConfigContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatDate, formatCurrency } from '../utils/configUtils';
import customerService from '../services/customerService';
import leadService from '../services/leadService';
import courseService from '../services/courseService';
import workshopService from '../services/workshopService';
import userService from '../services/userService';
import { UsersIcon, TargetIcon, BookIcon, GraduationIcon, UserIcon, ChartIcon, MoneyIcon } from '../components/ui/Icons';

function HomePage() {
  const { businessName, logo, config } = useBusinessConfig();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'admin_staff';

  const [stats, setStats] = useState({
    customers: 0,
    leads: 0,
    employees: 0,
    courses: 0,
    workshops: 0,
    activeCourses: 0,
    upcomingCourses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // טעינת כל הנתונים במקביל
      const [customersData, leadsData, coursesData, workshopsData, usersData] = await Promise.all([
        customerService.getCustomers(),
        leadService.getLeads(),
        courseService.getCourses(),
        workshopService.getWorkshops(),
        isAdmin ? userService.getUsers() : Promise.resolve({ users: [] }),
      ]);

      const customers = customersData.customers || [];
      const leads = leadsData.leads || [];
      const courses = coursesData.courses || [];
      const workshops = workshopsData.workshops || [];
      const users = usersData.users || [];

      // חישוב קורסים פעילים וקרובים
      const now = new Date();
      const upcomingCourses = courses
        .filter(course => {
          if (!course.startDate) return false;
          const startDate = new Date(course.startDate);
          return startDate >= now;
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);

      const activeCourses = courses.filter(course => {
        if (!course.startDate || !course.endDate) return false;
        const startDate = new Date(course.startDate);
        const endDate = new Date(course.endDate);
        return now >= startDate && now <= endDate;
      });

      setStats({
        customers: customers.length,
        leads: leads.length,
        employees: users.length,
        courses: courses.length,
        workshops: workshops.length,
        activeCourses: activeCourses.length,
        upcomingCourses,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tips = [
    {
      title: 'ניהול לידים',
      content: 'עקוב אחר לידים חדשים וטפל בהם במהירות כדי להגדיל את שיעור ההמרה',
      icon: TargetIcon,
      color: 'from-origami-coral to-origami-peach',
    },
    {
      title: 'תקשורת עם לקוחות',
      content: 'שמור על קשר קבוע עם הלקוחות שלך כדי לשמור על שביעות רצון גבוהה',
      icon: UsersIcon,
      color: 'from-origami-sage to-origami-mint',
    },
    {
      title: 'ניהול קורסים',
      content: 'ודא שכל הקורסים הקרובים מוכנים וכל המשתתפים רשומים',
      icon: BookIcon,
      color: 'from-origami-ocean to-origami-sky',
    },
    {
      title: 'ניתוח ביצועים',
      content: 'בדוק את הדשבורד החשבונאי כדי לעקוב אחר הרווחיות והתזרים',
      icon: ChartIcon,
      color: 'from-origami-mint to-origami-sage',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">טוען נתונים...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ברוכים הבאים, {user?.name || 'משתמש'}!
            </h1>
            <p className="text-gray-600">{businessName || 'CRM Demo'}</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button to="/admin/staff" variant="secondary" size="sm">
                ניהול צוות
              </Button>
              <Button to="/admin/users" variant="primary" size="sm">
                ניהול משתמשים
              </Button>
              <Button to="/admin/config" variant="accent" size="sm">
                הגדרות העסק
              </Button>
            </div>
          )}
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-origami-ocean/20 to-origami-sky/20 border-origami-ocean/30 origami-card-standard cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/customers')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">לקוחות</p>
                <p className="text-3xl font-bold text-gray-900">{stats.customers}</p>
              </div>
              <UsersIcon className="w-12 h-12 text-origami-ocean" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-origami-coral/20 to-origami-peach/20 border-origami-coral/30 origami-card-standard cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/leads')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">לידים</p>
                <p className="text-3xl font-bold text-gray-900">{stats.leads}</p>
              </div>
              <TargetIcon className="w-12 h-12 text-origami-coral" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-origami-sage/20 to-origami-mint/20 border-origami-sage/30 origami-card-standard cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/courses')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">קורסים</p>
                <p className="text-3xl font-bold text-gray-900">{stats.courses}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.activeCourses} פעילים</p>
              </div>
              <BookIcon className="w-12 h-12 text-origami-sage" />
            </div>
          </Card>

          {isAdmin && (
            <Card className="bg-gradient-to-br from-origami-peach/20 to-origami-cream/20 border-origami-peach/30 origami-card-standard cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/staff')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">עובדים</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.employees}</p>
                </div>
                <UserIcon className="w-12 h-12 text-origami-peach" />
              </div>
            </Card>
          )}

          {!isAdmin && (
            <Card className="bg-gradient-to-br from-origami-lavender/20 to-origami-sky/20 border-origami-lavender/30 origami-card-standard cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/workshops')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">סדנאות</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.workshops}</p>
                </div>
                <GraduationIcon className="w-12 h-12 text-origami-lavender" />
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Courses */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">קורסים קרובים</h2>
              <Button to="/courses" variant="ghost" size="sm">
                צפה בכל
              </Button>
            </div>
            {stats.upcomingCourses.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingCourses.map((course) => (
                  <div
                    key={course._id || course.id}
                    className="p-4 bg-gradient-to-r from-origami-cream/50 to-origami-peach/30 rounded-lg border border-origami-peach/20 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/courses/${course._id || course.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        {course.subject && (
                          <p className="text-sm text-gray-600 mt-1">{course.subject}</p>
                        )}
                        {course.startDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            תאריך התחלה: {formatDate(course.startDate, config)}
                          </p>
                        )}
                      </div>
                      {course.price && (
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{formatCurrency(course.price, config)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">אין קורסים קרובים</p>
            )}
          </Card>

          {/* Tips */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">טיפים ועצות</h2>
            <div className="space-y-4">
              {tips.map((tip, index) => {
                const IconComponent = tip.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 bg-gradient-to-r ${tip.color} rounded-lg border border-white/30`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/50 rounded-lg">
                        <IconComponent className="w-5 h-5 text-gray-800" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{tip.title}</h3>
                        <p className="text-sm text-gray-700">{tip.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">פעולות מהירות</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button to="/leads" variant="secondary" className="h-auto py-4 flex-col">
              <TargetIcon className="w-6 h-6 mb-2" />
              <span>ליד חדש</span>
            </Button>
            <Button to="/customers" variant="secondary" className="h-auto py-4 flex-col">
              <UsersIcon className="w-6 h-6 mb-2" />
              <span>לקוח חדש</span>
            </Button>
            <Button to="/courses" variant="secondary" className="h-auto py-4 flex-col">
              <BookIcon className="w-6 h-6 mb-2" />
              <span>קורס חדש</span>
            </Button>
            <Button to="/accounting" variant="secondary" className="h-auto py-4 flex-col">
              <MoneyIcon className="w-6 h-6 mb-2" />
              <span>חשבונות</span>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default HomePage;
