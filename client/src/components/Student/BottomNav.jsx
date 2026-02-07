import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardIcon, BookIcon, ChartIcon, GraduationIcon, UserIcon } from '../ui/Icons';

/**
 * BottomNav - ניווט תחתון למובייל
 * מוטמע ב-StudentLayout אבל יכול לשמש גם כקומפוננטה עצמאית
 */
function BottomNav({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/student', label: 'דשבורד', icon: DashboardIcon },
    { path: '/student/courses', label: 'קורסים', icon: BookIcon },
    { path: '/student/grades', label: 'ציונים', icon: ChartIcon },
    { path: '/student/workshops', label: 'סדנאות', icon: GraduationIcon },
    { path: '/student/profile', label: 'פרופיל', icon: UserIcon },
  ];

  const isActive = (path) => {
    if (path === '/student') {
      return location.pathname === '/student';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50 ${className}`}>
      <div className="flex justify-around items-center h-16 safe-area-inset-bottom">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all touch-manipulation ${active
                  ? 'text-origami-coral'
                  : 'text-gray-600'
                }`}
              aria-label={item.label}
            >
              <IconComponent
                className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''} ${active ? 'text-origami-coral' : 'text-gray-600'
                  }`}
              />
              <span className={`text-xs mt-1 transition-all ${active ? 'font-semibold' : 'font-normal'
                }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
