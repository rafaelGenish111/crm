import { useAuth } from '../../context/AuthContext';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import BackButton from '../ui/BackButton';

function Header() {
  const { user, logout } = useAuth();
  const { businessName } = useBusinessConfig();

  return (
    <header className="origami-header px-6 py-4 shadow-origami" dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BackButton className="hover:bg-white/60" />
          <h2 className="text-xl font-display font-semibold text-gray-800">{businessName}</h2>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Notifications placeholder */}
          <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-white/60 rounded-origami transition-all duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-gradient-to-r from-origami-coral to-origami-rose rounded-full border-2 border-white"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="text-right bg-white/40 backdrop-blur-sm px-4 py-2 rounded-origami border border-white/50">
              <div className="text-sm font-medium text-gray-800">{user?.name}</div>
              <div className="text-xs text-gray-600">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-white/50 rounded-origami hover:bg-white/60 backdrop-blur-sm transition-all duration-200 shadow-origami hover:shadow-origami-lg"
            >
              התנתק
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
