import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import Card from '../ui/Card';
import Button from '../ui/Button';

function StudentCourseCard({ course }) {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [expanded, setExpanded] = useState(false);

  const nextSession = course.upcomingSessions?.[0];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h3>
            {course.subject && (
              <p className="text-sm text-gray-600">{course.subject}</p>
            )}
            {course.instructor && (
              <p className="text-xs text-gray-500 mt-1">
                מנחה: {course.instructor.name}
              </p>
            )}
          </div>
        </div>

        {/* Progress */}
        {course.currentSession && course.totalSessions && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">התקדמות</span>
              <span className="font-semibold text-gray-900">
                מפגש {course.currentSession} מתוך {course.totalSessions}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-origami-coral to-origami-peach h-2 rounded-full transition-all"
                style={{ width: `${(course.currentSession / course.totalSessions) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Next Session */}
        {nextSession && (
          <div className="mb-3 p-3 bg-origami-coral/10 rounded-lg border border-origami-coral/20">
            <p className="text-xs text-gray-600 mb-1">מפגש הבא</p>
            <p className="text-sm font-semibold text-gray-900">
              מפגש {nextSession.sessionNumber} - {formatDate(nextSession.date, config)}
            </p>
          </div>
        )}

        {/* Syllabus - Expandable */}
        {course.syllabus && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full text-right text-sm text-origami-coral hover:text-origami-coral/80 font-medium flex items-center justify-between"
            >
              <span>סילבוס</span>
              <svg
                className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {course.syllabus}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => navigate(`/student/courses/${course.id}`)}
            variant="primary"
            size="sm"
            className="flex-1 min-h-touch"
          >
            פרטים נוספים
          </Button>
          <Button
            onClick={() => navigate(`/student/grades?course=${course.id}`)}
            variant="secondary"
            size="sm"
            className="flex-1 min-h-touch"
          >
            ציונים
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default StudentCourseCard;
