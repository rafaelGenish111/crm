import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '../context/StudentAuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

const StudentProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useStudentAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="טוען..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/student/login" replace />;
  }

  return children;
};

export default StudentProtectedRoute;
