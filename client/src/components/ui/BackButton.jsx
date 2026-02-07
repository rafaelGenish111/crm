import { useNavigate, useLocation } from 'react-router-dom';

function BackButton({ fallbackPath = '/home', className = '', showLabel = true }) {
  const navigate = useNavigate();
  const location = useLocation();

  // רשימת דפים שלא צריך להציג בהם כפתור חזרה
  const noBackPages = ['/home', '/login', '/signup'];
  const shouldShow = !noBackPages.includes(location.pathname);

  const handleBack = () => {
    // נסה לחזור אחורה בהיסטוריה
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // אם אין היסטוריה, חזור לדף הבית
      navigate(fallbackPath);
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <button
      onClick={handleBack}
      className={`flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white/60 backdrop-blur-sm rounded-origami transition-all duration-200 shadow-origami hover:shadow-origami-lg ${className}`}
      title="חזור לדף הקודם"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {showLabel && <span className="hidden sm:inline font-medium">חזרה</span>}
    </button>
  );
}

export default BackButton;
