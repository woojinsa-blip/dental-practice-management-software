'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Dentist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string | null;
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

interface BookingModalProps {
  operatoryId: string;
  date: Date;
  hour: number;
  minute: number;
  onClose: () => void;
  onBooked: () => void;
  existingAppointment?: Appointment;
  onDelete?: (appointmentId: string) => void;
}

export function BookingModal({
  operatoryId,
  date,
  hour,
  minute,
  onClose,
  onBooked,
  existingAppointment,
  onDelete,
}: BookingModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedPatient, setSelectedPatient] = useState(existingAppointment?.patient_id || '');
  const [selectedDentist, setSelectedDentist] = useState(existingAppointment?.dentist_id || '');
  const [durationHours, setDurationHours] = useState('0');
  const [durationMinutes, setDurationMinutes] = useState('20');
  const [appointmentType, setAppointmentType] = useState(existingAppointment?.type || '');
  const [notes, setNotes] = useState(existingAppointment?.notes || '');
  const [appointmentStatus, setAppointmentStatus] = useState(existingAppointment?.status || 'scheduled');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Generate duration hour options (0-3)
  const durationHourOptions = ['0', '1', '2', '3'];

  // Generate duration minute options (00, 20, 40)
  const durationMinuteOptions = ['00', '20', '40'];

  useEffect(() => {
    fetchPatients();
    fetchDentists();

    // If editing, calculate duration
    if (existingAppointment) {
      const startDate = new Date(existingAppointment.start_time);
      const endDate = new Date(existingAppointment.end_time);

      const durationMs = endDate.getTime() - startDate.getTime();
      const totalMinutes = Math.floor(durationMs / (1000 * 60));
      const durHours = Math.floor(totalMinutes / 60);
      const durMinutes = totalMinutes % 60;

      setDurationHours(durHours.toString());
      setDurationMinutes(durMinutes.toString());
    }
  }, []);

  async function fetchPatients() {
    try {
      const res = await fetch(`/api/patients?search=${searchTerm}`);
      const data = await res.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }

  async function fetchDentists() {
    try {
      const res = await fetch('/api/dentists');
      const data = await res.json();
      setDentists(data);
    } catch (error) {
      console.error('Error fetching dentists:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient || !selectedDentist || !appointmentType) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate duration is not zero
    if (parseInt(durationHours) === 0 && parseInt(durationMinutes) === 0) {
      alert('Duration must be greater than 0');
      return;
    }

    // Create start and end times
    const startTime = new Date(date);
    startTime.setHours(hour, minute, 0, 0);

    const totalMinutes = parseInt(durationHours) * 60 + parseInt(durationMinutes);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + totalMinutes);

    setLoading(true);
    try {
      const method = existingAppointment ? 'PUT' : 'POST';
      const body: any = {
        patient_id: selectedPatient,
        dentist_id: selectedDentist,
        operatory_id: operatoryId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        type: appointmentType,
        notes,
        status: appointmentStatus,
      };

      if (existingAppointment) {
        body.id = existingAppointment.id;
      }

      const res = await fetch('/api/appointments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onBooked();
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${existingAppointment ? 'update' : 'book'} appointment`);
      }
    } catch (error) {
      console.error(`Error ${existingAppointment ? 'updating' : 'booking'} appointment:`, error);
      alert(`Failed to ${existingAppointment ? 'update' : 'book'} appointment`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {existingAppointment ? 'Edit Appointment' : 'Book Appointment'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-95 transition-transform"
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Date and Time Display */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Date & Time
              </label>
              <div className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                {format(date, 'EEEE, MMMM d, yyyy')} at {hour.toString().padStart(2, '0')}:
                {minute.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Patient Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Patient *
              </label>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} ({patient.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Doctor *
              </label>
              <select
                value={selectedDentist}
                onChange={(e) => setSelectedDentist(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a doctor</option>
                {dentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    Dr. {dentist.first_name} {dentist.last_name}
                    {dentist.specialty ? ` - ${dentist.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Duration *
              </label>
              <div className="flex gap-2">
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  required
                  className="flex-1 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {durationHourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}h
                    </option>
                  ))}
                </select>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  required
                  className="flex-1 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {durationMinuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}m
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Appointment Type */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Appointment Type *
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type</option>
                <option value="checkup">Checkup</option>
                <option value="cleaning">Cleaning</option>
                <option value="filling">Filling</option>
                <option value="extraction">Extraction</option>
                <option value="root-canal">Root Canal</option>
                <option value="crown">Crown</option>
                <option value="consultation">Consultation</option>
              </select>
            </div>

            {/* Status (only when editing) */}
            {existingAppointment && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Status
                </label>
                <select
                  value={appointmentStatus}
                  onChange={(e) => setAppointmentStatus(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
              {/* Delete button (only when editing) */}
              {existingAppointment && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this appointment?')) {
                      onDelete(existingAppointment.id);
                      onClose();
                    }
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-md hover:bg-red-700 dark:hover:bg-red-600 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel Appointment
                </button>
              )}

              <div className={`flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 ${existingAppointment && onDelete ? '' : 'sm:ml-auto'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-transform"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? (existingAppointment ? 'Updating...' : 'Booking...')
                    : (existingAppointment ? 'Update Appointment' : 'Book Appointment')
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
