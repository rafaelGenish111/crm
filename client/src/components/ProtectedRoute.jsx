import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LockIcon } from './ui/Icons';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center" dir="rtl">
          <div className="flex justify-center mb-4">
            <LockIcon className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">אין הרשאה</h2>
          <p className="text-gray-600 mb-6">
            אין לך הרשאה לגשת לדף זה. נדרש תפקיד: {requiredRoles.join(' או ')}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            התפקיד הנוכחי שלך: <strong>{user?.role || 'לא מוגדר'}</strong>
          </p>
          <a
            href="/home"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            חזור לדף הבית
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
