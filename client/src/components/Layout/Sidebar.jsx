import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import {
  DashboardIcon,
  TargetIcon,
  UsersIcon,
  BookIcon,
  GraduationIcon,
  MoneyIcon,
  MegaphoneIcon,
  UserIcon,
  SettingsIcon,
  BrainIcon,
} from '../ui/Icons';

// Calendar icon for events
const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const menuItems = [
  { path: '/home', label: 'דשבורד', icon: DashboardIcon },
  { path: '/leads', label: 'לידים', icon: TargetIcon },
  { path: '/customers', label: 'לקוחות', icon: UsersIcon },
  { path: '/courses', label: 'קורסים', icon: BookIcon },
  { path: '/workshops', label: 'סדנאות', icon: GraduationIcon },
  { path: '/events', label: 'אירועים', icon: CalendarIcon },
  { path: '/accounting', label: 'חשבונות', icon: MoneyIcon },
  { path: '/campaigns', label: 'קמפיינים', icon: MegaphoneIcon },
];

const adminItems = [
  { path: '/admin/staff', label: 'ניהול צוות', icon: UsersIcon },
  { path: '/admin/users', label: 'ניהול משתמשים', icon: UserIcon },
  { path: '/admin/knowledge-base', label: 'בסיס ידע AI', icon: BrainIcon },
  { path: '/admin/config', label: 'הגדרות העסק', icon: SettingsIcon },
];

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { businessName, logo } = useBusinessConfig();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'admin_staff';

  return (
    <div className="w-64 flex-shrink-0 origami-sidebar text-gray-800 h-screen flex flex-col shadow-origami-lg" dir="rtl">
      {/* Logo/Header */}
      <div className="p-6 border-b border-white/30">
        {logo && (
          <div className="mb-4 p-2 bg-white/40 rounded-origami backdrop-blur-sm inline-block">
            <img src={logo} alt={businessName} className="h-10" />
          </div>
        )}
        <h1 className="text-2xl font-display font-bold text-gray-800">{businessName || 'CRM'}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-origami transition-all duration-300
                ${isActive
                  ? 'bg-white/80 text-gray-800 shadow-origami font-medium backdrop-blur-sm'
                  : 'text-gray-700 hover:bg-white/50 hover:shadow-origami backdrop-blur-sm'
                }
              `}
            >
              {item.icon && <item.icon className="w-5 h-5" />}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin ? (
          <>
            <div className="pt-4 mt-4 border-t border-white/30">
              <div className="px-4 py-2 text-xs text-gray-600 uppercase font-semibold tracking-wider">ניהול</div>
            </div>
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-origami transition-all duration-300
                    ${isActive
                      ? 'bg-white/80 text-gray-800 shadow-origami font-medium backdrop-blur-sm'
                      : 'text-gray-700 hover:bg-white/50 hover:shadow-origami backdrop-blur-sm'
                    }
                  `}
                >
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        ) : (
          <div className="pt-4 mt-4 border-t border-white/30">
            <div className="px-4 py-2 text-sm text-gray-700 font-medium">
              תפקיד: {user?.role || 'לא מוגדר'}
            </div>
            <div className="px-4 py-2 text-xs text-gray-600 mt-2 bg-white/30 rounded-lg p-2">
              גישה לדפי ניהול דורשת תפקיד admin, admin_staff או super_admin
            </div>
          </div>
        )}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/30 bg-white/30 backdrop-blur-sm">
        <div className="text-sm font-medium text-gray-800">{user?.name}</div>
        <div className="text-xs text-gray-600 mt-1">{user?.email}</div>
      </div>
    </div>
  );
}

export default Sidebar;
