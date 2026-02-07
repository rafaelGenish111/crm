import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import Card from '../ui/Card';

/**
 * CourseSchedule - קומפוננטה להצגת לוח זמנים של מפגשי קורס
 */
function CourseSchedule({
  sessions = [],
  currentSession = null,
  className = ''
}) {
  const { config } = useBusinessConfig();

  if (!sessions || sessions.length === 0) {
    return (
      <Card className={className}>
        <p className="text-gray-500 text-center py-8">אין מפגשים מתוכננים</p>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold mb-4">לוח זמנים</h3>
      <div className="space-y-3">
        {sessions.map((session) => {
          const isCurrent = session.sessionNumber === currentSession;
          const isPast = session.date && new Date(session.date) < new Date();

          return (
            <div
              key={session.sessionNumber}
              className={`p-4 rounded-lg border transition-all ${isCurrent
                  ? 'bg-origami-coral/10 border-origami-coral shadow-md'
                  : isPast
                    ? 'bg-gray-50/50 border-gray-200 opacity-75'
                    : 'bg-white border-gray-200 hover:border-origami-coral/30'
                }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      מפגש {session.sessionNumber}
                    </p>
                    {isCurrent && (
                      <span className="px-2 py-1 bg-origami-coral text-white text-xs font-medium rounded-full">
                        נוכחי
                      </span>
                    )}
                    {isPast && !isCurrent && (
                      <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs font-medium rounded-full">
                        עבר
                      </span>
                    )}
                  </div>
                  {session.date && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(session.date, config)}
                    </p>
                  )}
                </div>
                {session.sessionNumber && (
                  <div className="text-left ml-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-origami-coral/20 to-origami-peach/20 flex items-center justify-center border-2 border-origami-coral/30">
                      <span className="text-lg font-bold text-origami-coral">
                        {session.sessionNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default CourseSchedule;
