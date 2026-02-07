import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

function Timeline({ items, direction = 'rtl' }) {
  return (
    <div className="relative" dir={direction}>
      {/* Timeline Line */}
      <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: direction === 'rtl' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pr-12"
          >
            {/* Timeline Dot */}
            <div
              className="absolute right-0 top-1 w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center"
              style={{ backgroundColor: item.color || '#3B82F6' }}
            >
              {item.icon && <span className="text-white text-sm">{item.icon}</span>}
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                {item.date && (
                  <span className="text-sm text-gray-500">
                    {format(new Date(item.date), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-gray-600 text-sm">{item.description}</p>
              )}
              {item.meta && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(item.meta).map(([key, value]) => (
                    <span
                      key={key}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Timeline;
