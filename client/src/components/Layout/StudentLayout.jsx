import { useNavigate, useLocation } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import { DashboardIcon, BookIcon, ChartIcon, GraduationIcon, UserIcon, AIBotIcon } from '../ui/Icons';

function StudentLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { student, logout } = useStudentAuth();
  const { businessName, logo } = useBusinessConfig();

  const menuItems = [
    { path: '/student', label: 'דשבורד', icon: DashboardIcon },
    { path: '/student/courses', label: 'קורסים', icon: BookIcon },
    { path: '/student/grades', label: 'ציונים', icon: ChartIcon },
    { path: '/student/workshops', label: 'סדנאות', icon: GraduationIcon },
    { path: '/student/ai-bot', label: 'עוזר AI', icon: AIBotIcon },
    { path: '/student/profile', label: 'פרופיל', icon: UserIcon },
  ];

  const isActive = (path) => {
    if (path === '/student') {
      return location.pathname === '/student';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {logo && (
              <img src={logo} alt={businessName} className="h-8" />
            )}
            <h1 className="text-lg font-bold text-gray-900">{businessName || 'CRM'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">{student?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/student/login');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100 min-h-touch min-w-touch touch-manipulation active:scale-95 transition-transform"
            >
              התנתק
            </button>
          </div>
        </div>
      </header>

      {/* Side Navigation - Desktop */}
      <aside className="hidden md:block fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-gray-200 shadow-lg pt-16 z-40">
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-touch touch-manipulation active:scale-95 ${active
                  ? 'bg-origami-coral/10 text-origami-coral font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 md:mr-64">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-touch touch-manipulation active:scale-95 transition-transform ${active
                  ? 'text-origami-coral'
                  : 'text-gray-600'
                  }`}
                aria-label={item.label}
              >
                <IconComponent className={`w-6 h-6 transition-transform ${active ? 'scale-110 text-origami-coral' : 'text-gray-600'}`} />
                <span className={`text-xs mt-1 transition-all ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default StudentLayout;
