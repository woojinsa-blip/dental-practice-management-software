import { Suspense } from 'react';
import { SchedulingCalendar } from '@/components/scheduling/SchedulingCalendar';

export default function SchedulingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Patient Scheduling
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage appointments and view dentist availability
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sm:p-8 text-center">
              <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
          }
        >
          <SchedulingCalendar />
        </Suspense>
      </div>
    </div>
  );
}
