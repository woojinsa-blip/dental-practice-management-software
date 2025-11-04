'use client';

import { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { TimeSlotCell } from './TimeSlotCell';
import { BookingModal } from './BookingModal';

type ViewMode = 'day' | 'week' | 'month';

interface Dentist {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string | null;
}

interface Operatory {
  id: string;
  name: string;
  operatory_number: number;
  is_active: boolean;
}

interface Appointment {
  id: string;
  patient_id: string;
  dentist_id: string;
  operatory_id: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  notes?: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  dentist: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

// Generate time slots (20-minute increments from 8:00 AM to 10:00 PM)
const generateTimeSlots = () => {
  const slots: { hour: number; minute: number; isFirstInHour: boolean }[] = [];
  const minutes = [0, 20, 40]; // Only 3 slots per hour
  for (let hour = 8; hour < 22; hour++) {
    for (const minute of minutes) {
      slots.push({ hour, minute, isFirstInHour: minute === 0 });
    }
  }
  return slots;
};

// Format hour to AM/PM
const formatHour = (hour: number) => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

// Color palette for dentists
const DENTIST_COLORS = [
  'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700',
  'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 border-green-300 dark:border-green-700',
  'bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700',
  'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700',
  'bg-pink-200 dark:bg-pink-800 text-pink-900 dark:text-pink-100 border-pink-300 dark:border-pink-700',
  'bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100 border-teal-300 dark:border-teal-700',
  'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700',
  'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100 border-red-300 dark:border-red-700',
];

export function SchedulingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [operatories, setOperatories] = useState<Operatory[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    operatoryId: string;
    date: Date;
    hour: number;
    minute: number;
    existingAppointment?: Appointment;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dentistColorMap, setDentistColorMap] = useState<Record<string, string>>({});

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    fetchDentists();
    fetchOperatories();
  }, []);

  useEffect(() => {
    if (operatories.length > 0) {
      fetchAppointments();
    }
  }, [operatories, currentDate, viewMode]);

  useEffect(() => {
    // Assign colors to dentists
    const colorMap: Record<string, string> = {};
    dentists.forEach((dentist, index) => {
      colorMap[dentist.id] = DENTIST_COLORS[index % DENTIST_COLORS.length];
    });
    setDentistColorMap(colorMap);
  }, [dentists]);

  async function fetchDentists() {
    try {
      const res = await fetch('/api/dentists');
      const data = await res.json();

      // Handle error response
      if (!res.ok || data.error) {
        console.error('Error fetching dentists:', data.error);
        setDentists([]);
        return;
      }

      // Ensure data is an array
      setDentists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching dentists:', error);
      setDentists([]);
    }
  }

  async function fetchOperatories() {
    try {
      const res = await fetch('/api/operatories');
      const data = await res.json();

      // Handle error response
      if (!res.ok || data.error) {
        console.error('Error fetching operatories:', data.error);
        setOperatories([]);
        setLoading(false);
        return;
      }

      // Ensure data is an array
      setOperatories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching operatories:', error);
      setOperatories([]);
      setLoading(false);
    }
  }

  async function fetchAppointments() {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'day') {
        startDate = currentDate;
        endDate = currentDate;
      } else if (viewMode === 'week') {
        startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
      } else {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      }

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const res = await fetch(`/api/appointments?startDate=${startDateStr}&endDate=${endDateStr}`);
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDentistColor = (dentistId: string) => {
    return dentistColorMap[dentistId] || DENTIST_COLORS[0];
  };

  const goToPrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const getMonthDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  async function handleDropAppointment(
    appointmentId: string,
    operatoryId: string,
    date: Date,
    hour: number,
    minute: number
  ) {
    try {
      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (!appointment) {
        alert('Appointment not found');
        return;
      }

      const originalStart = new Date(appointment.start_time);
      const originalEnd = new Date(appointment.end_time);
      const duration = (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60);

      // Create new start time in local timezone
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const newStart = new Date(year, month, day, hour, minute, 0, 0);

      const newEnd = new Date(newStart);
      newEnd.setMinutes(newEnd.getMinutes() + duration);

      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointmentId,
          patient_id: appointment.patient_id,
          dentist_id: appointment.dentist_id,
          operatory_id: operatoryId,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
          type: appointment.type,
          notes: appointment.notes,
          status: appointment.status,
        }),
      });

      if (res.ok) {
        fetchAppointments();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to move appointment');
      }
    } catch (error) {
      console.error('Error moving appointment:', error);
      alert('Failed to move appointment');
    }
  }

  async function handleResizeAppointment(appointmentId: string, newDurationMinutes: number) {
    try {
      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (!appointment) return;

      // Calculate new end time by adding duration to original start time in milliseconds
      const startTime = new Date(appointment.start_time).getTime();
      const newEndTime = new Date(startTime + newDurationMinutes * 60 * 1000);

      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointmentId,
          patient_id: appointment.patient_id,
          dentist_id: appointment.dentist_id,
          operatory_id: appointment.operatory_id,
          start_time: appointment.start_time, // Keep original start time unchanged
          end_time: newEndTime.toISOString(),
          type: appointment.type,
          notes: appointment.notes,
          status: appointment.status,
        }),
      });

      if (res.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error resizing appointment:', error);
    }
  }

  function handleEditAppointment(appointment: Appointment) {
    const startTime = new Date(appointment.start_time);
    setSelectedSlot({
      operatoryId: appointment.operatory_id,
      date: startTime,
      hour: startTime.getHours(),
      minute: startTime.getMinutes(),
      existingAppointment: appointment,
    });
  }

  async function handleDeleteAppointment(appointmentId: string) {
    try {
      const res = await fetch(`/api/appointments?id=${appointmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchAppointments();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    }
  }

  function handleBookSlot(operatoryId: string, date: Date, hour: number, minute: number) {
    setSelectedSlot({
      operatoryId,
      date,
      hour,
      minute,
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header Controls */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Date Range Text - Mobile First */}
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center sm:text-left">
          {getDateRangeText()}
        </h2>

        {/* Navigation and View Mode Container */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={goToPrevious}
              className="flex-1 sm:flex-none h-10 sm:h-9 px-3 sm:px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-transform"
            >
              Previous
            </button>
            <button
              onClick={goToToday}
              className="flex-1 sm:flex-none h-10 sm:h-9 px-3 sm:px-4 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-transform"
            >
              Today
            </button>
            <button
              onClick={goToNext}
              className="flex-1 sm:flex-none h-10 sm:h-9 px-3 sm:px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-transform"
            >
              Next
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-none h-10 sm:h-9 px-4 sm:px-4 text-sm font-medium rounded-md transition-all active:scale-95 ${
                viewMode === 'day'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 sm:flex-none h-10 sm:h-9 px-4 sm:px-4 text-sm font-medium rounded-md transition-all active:scale-95 ${
                viewMode === 'week'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-none h-10 sm:h-9 px-4 sm:px-4 text-sm font-medium rounded-md transition-all active:scale-95 ${
                viewMode === 'month'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Dentist Color Legend */}
      {dentists.length > 0 && (
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex flex-wrap gap-2 sm:gap-3 min-w-max sm:min-w-0">
            {dentists.map((dentist) => (
              <div key={dentist.id} className="flex items-center gap-2 whitespace-nowrap">
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${getDentistColor(dentist.id)}`}></div>
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Dr. {dentist.first_name} {dentist.last_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="overflow-auto max-h-[calc(100vh-480px)] sm:max-h-[calc(100vh-420px)] md:max-h-[calc(100vh-380px)]">
        {viewMode === 'day' && (
          <table className="border-collapse w-full">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 px-1 sm:px-2 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12 sm:w-16">
                  <span className="hidden sm:inline">Hour</span>
                  <span className="sm:hidden">Hr</span>
                </th>
                <th className="sticky left-12 sm:left-16 z-30 bg-gray-50 dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 px-1 sm:px-2 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10 sm:w-12">
                  <span className="hidden sm:inline">Min</span>
                  <span className="sm:hidden">M</span>
                </th>
                {operatories.map((operatory) => (
                  <th
                    key={operatory.id}
                    className="border-r border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] sm:min-w-[150px]"
                  >
                    <div className="hidden sm:block">Operatory {operatory.operatory_number}</div>
                    <div className="sm:hidden">Op {operatory.operatory_number}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={operatories.length + 2} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Loading schedule...
                  </td>
                </tr>
              ) : operatories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <p className="font-semibold mb-2">No operatories configured</p>
                      <p className="text-sm">
                        Default operatories should have been created automatically.
                        <br />
                        Please check your database setup or contact support.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                timeSlots.map(({ hour, minute, isFirstInHour }) => (
                  <tr key={`${hour}-${minute}`}>
                    {isFirstInHour ? (
                      <td
                        rowSpan={3}
                        className="sticky left-0 z-10 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 px-1 sm:px-2 py-0 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center align-middle font-medium"
                      >
                        <div className="hidden sm:block">{formatHour(hour)}</div>
                        <div className="sm:hidden text-[9px]">{formatHour(hour).replace(' ', '')}</div>
                      </td>
                    ) : null}
                    <td className="sticky left-12 sm:left-16 z-10 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 px-1 sm:px-2 py-0 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center align-top">
                      <div className="pt-0.5 sm:pt-1">
                        {minute.toString().padStart(2, '0')}
                      </div>
                    </td>
                    {operatories.map((operatory) => {
                      const operatoryAppointments = appointments.filter(
                        (apt) => apt.operatory_id === operatory.id
                      );
                      return (
                        <TimeSlotCell
                          key={`${operatory.id}-${hour}-${minute}`}
                          operatoryId={operatory.id}
                          date={currentDate}
                          hour={hour}
                          minute={minute}
                          appointments={operatoryAppointments}
                          onDropAppointment={handleDropAppointment}
                          onEditAppointment={handleEditAppointment}
                          onResizeAppointment={handleResizeAppointment}
                          onBookSlot={handleBookSlot}
                          getDentistColor={getDentistColor}
                        />
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {viewMode === 'week' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {getWeekDays().map((day) => {
              const dayAppointments = appointments.filter((apt) => {
                const aptDate = new Date(apt.start_time);
                return format(aptDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
              });

              return (
                <div key={day.toISOString()} className="bg-white dark:bg-gray-800 min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
                  <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 z-10">
                    <div className="text-center">
                      <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {format(day, 'EEE')}
                      </div>
                      <div className={`text-base sm:text-lg font-semibold mt-0.5 sm:mt-1 ${
                        format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      {dayAppointments.length > 0 && (
                        <div className="mt-1 inline-block px-1.5 sm:px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-[10px] sm:text-xs font-medium">
                          {dayAppointments.length}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-1.5 sm:p-2 space-y-1">
                    {dayAppointments.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                        No appts
                      </div>
                    ) : (
                      dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => handleEditAppointment(apt)}
                          className={`p-1.5 sm:p-2 rounded text-[10px] sm:text-xs cursor-pointer hover:shadow-md active:scale-95 transition-all ${getDentistColor(apt.dentist_id)}`}
                        >
                          <div className="font-semibold truncate">
                            {format(new Date(apt.start_time), 'HH:mm')} - {apt.patient.first_name} {apt.patient.last_name}
                          </div>
                          <div className="opacity-90 truncate text-[9px] sm:text-xs">
                            Dr. {apt.dentist.last_name}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'month' && (
          <div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <div
                  key={day}
                  className="bg-gray-50 dark:bg-gray-900 p-1 sm:p-2 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
              {/* Padding cells for days before month starts */}
              {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`padding-${i}`} className="bg-gray-50 dark:bg-gray-900 min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"></div>
              ))}

              {getMonthDays().map((day) => {
                const dayAppointments = appointments.filter((apt) => {
                  const aptDate = new Date(apt.start_time);
                  return format(aptDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                });

                return (
                  <div
                    key={day.toISOString()}
                    className="bg-white dark:bg-gray-800 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2"
                  >
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <div className={`text-xs sm:text-sm font-semibold ${
                        format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      {dayAppointments.length > 0 && (
                        <div className="inline-block px-1 sm:px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-[9px] sm:text-xs font-medium whitespace-nowrap">
                          {dayAppointments.length}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => handleEditAppointment(apt)}
                          className={`px-0.5 sm:px-1 py-0.5 rounded text-[9px] sm:text-xs cursor-pointer hover:shadow-sm active:scale-95 transition-all truncate ${getDentistColor(apt.dentist_id)}`}
                        >
                          <span className="hidden sm:inline">{format(new Date(apt.start_time), 'HH:mm')} {apt.patient.last_name}</span>
                          <span className="sm:hidden">{format(new Date(apt.start_time), 'HH:mm')}</span>
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 px-0.5 sm:px-1">
                          +{dayAppointments.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <BookingModal
          operatoryId={selectedSlot.operatoryId}
          date={selectedSlot.date}
          hour={selectedSlot.hour}
          minute={selectedSlot.minute}
          onClose={() => setSelectedSlot(null)}
          onBooked={() => {
            setSelectedSlot(null);
            fetchAppointments();
          }}
          existingAppointment={selectedSlot.existingAppointment}
          onDelete={handleDeleteAppointment}
        />
      )}
    </div>
  );
}
