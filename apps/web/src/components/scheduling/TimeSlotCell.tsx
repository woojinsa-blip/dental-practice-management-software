'use client';

import { useState } from 'react';
import { format } from 'date-fns';

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

interface TimeSlotCellProps {
  operatoryId: string;
  date: Date;
  hour: number;
  minute: number;
  appointments: Appointment[];
  onDropAppointment: (appointmentId: string, operatoryId: string, date: Date, hour: number, minute: number) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onResizeAppointment: (appointmentId: string, newDuration: number) => void;
  onBookSlot: (operatoryId: string, date: Date, hour: number, minute: number) => void;
  getDentistColor: (dentistId: string) => string;
}

export function TimeSlotCell({
  operatoryId,
  date,
  hour,
  minute,
  appointments,
  onDropAppointment,
  onEditAppointment,
  onResizeAppointment,
  onBookSlot,
  getDentistColor,
}: TimeSlotCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasResized, setHasResized] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.types.includes('appointmentid') ? 'dragging' : null;

    // Allow drop even if there's an appointment in this slot if we're dragging that same appointment
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set drag over to false if we're actually leaving the cell
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const appointmentId = e.dataTransfer.getData('appointmentId');
    if (appointmentId) {
      onDropAppointment(appointmentId, operatoryId, date, hour, minute);
    }
  };

  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    e.dataTransfer.setData('appointmentId', appointment.id);
    e.dataTransfer.setData('text/plain', appointment.id); // Fallback for compatibility
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);

    // Create a custom drag preview
    const dragPreview = document.createElement('div');
    dragPreview.className = 'p-3 rounded-lg shadow-2xl border-2 border-blue-500 bg-white dark:bg-gray-800 text-sm font-medium';
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    dragPreview.textContent = `${appointment.patient.first_name} ${appointment.patient.last_name}`;
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 0, 0);

    // Clean up the preview element after drag starts
    setTimeout(() => {
      if (document.body.contains(dragPreview)) {
        document.body.removeChild(dragPreview);
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleResizeStart = (e: React.MouseEvent, appointment: Appointment) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setHasResized(false);

    const startY = e.clientY;
    const startTime = new Date(appointment.start_time);
    const endTime = new Date(appointment.end_time);
    const startDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes
    let currentDuration = startDuration;
    let hasMoved = false;

    // Get the appointment element reference before starting listeners
    const resizeHandle = e.currentTarget as HTMLElement;
    const appointmentElement = resizeHandle.closest('[data-appointment]') as HTMLElement;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaY = moveEvent.clientY - startY;

      // Mark that mouse has moved
      if (Math.abs(deltaY) > 3) {
        hasMoved = true;
      }

      // Each 20-minute slot is 60px tall, so pixels per minute = 3
      const pixelsPerMinute = 3;
      const minutesDelta = Math.round(deltaY / pixelsPerMinute / 20) * 20; // snap to 20-minute increments
      const newDuration = Math.max(20, startDuration + minutesDelta); // minimum 20 minutes

      // Update visual feedback immediately
      if (newDuration !== currentDuration && appointmentElement) {
        currentDuration = newDuration;
        appointmentElement.style.height = `${(newDuration / 20) * 60 - 8}px`;
        appointmentElement.style.transition = 'none'; // Disable transition during resize for smooth feedback
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Re-enable transition
      if (appointmentElement) {
        appointmentElement.style.transition = '';
      }

      // Only call resize if duration changed
      if (currentDuration !== startDuration) {
        setHasResized(true);
        onResizeAppointment(appointment.id, currentDuration);

        // Reset hasResized flag after a short delay
        setTimeout(() => setHasResized(false), 300);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Check if this time slot has an appointment
  const slotTime = new Date(date);
  slotTime.setHours(hour, minute, 0, 0);

  const appointmentInSlot = appointments.find((apt) => {
    const aptStart = new Date(apt.start_time);
    const aptEnd = new Date(apt.end_time);
    return slotTime >= aptStart && slotTime < aptEnd;
  });

  // Check if this is the first slot of an appointment
  const isAppointmentStart = appointmentInSlot && (() => {
    const aptStart = new Date(appointmentInSlot.start_time);
    return aptStart.getHours() === hour && aptStart.getMinutes() === minute;
  })();

  // Calculate appointment height (each 20 min = 60px)
  const getAppointmentHeight = (appointment: Appointment) => {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return (durationMinutes / 20) * 60; // 60px per 20-minute slot
  };

  return (
    <td
      className={`relative border-r border-b border-gray-200 dark:border-gray-700 transition-all duration-150 ${
        isDragOver
          ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-inset'
          : appointmentInSlot
          ? 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
          : 'hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer'
      }`}
      style={{ height: '60px', minWidth: '150px' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        if (!appointmentInSlot && !isDragging) {
          onBookSlot(operatoryId, date, hour, minute);
        }
      }}
    >
      {/* Show a subtle "+" icon when hovering over empty cells */}
      {!appointmentInSlot && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-40 dark:hover:opacity-30 pointer-events-none transition-opacity">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      )}

      {isAppointmentStart && appointmentInSlot && (
        <div
          data-appointment
          draggable={!isResizing}
          onDragStart={(e) => handleDragStart(e, appointmentInSlot)}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            e.stopPropagation();
            // Don't open modal if we just resized or dragged
            if (!hasResized && !isDragging) {
              onEditAppointment(appointmentInSlot);
            }
          }}
          className={`absolute inset-x-0 top-0 mx-1 mt-1 p-2 rounded-md shadow-md hover:shadow-lg text-xs overflow-hidden transition-all border-l-4 ${
            isDragging ? 'opacity-50 z-0 cursor-grabbing' : 'opacity-100 z-10 cursor-grab'
          } ${getDentistColor(appointmentInSlot.dentist_id)}`}
          style={{ height: `${getAppointmentHeight(appointmentInSlot) - 8}px` }}
        >
          {/* Drag handle indicator */}
          <div className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
            </svg>
          </div>

          <div className="font-semibold truncate pr-6">
            {appointmentInSlot.patient.first_name} {appointmentInSlot.patient.last_name}
          </div>
          <div className="text-xs opacity-90 truncate">
            Dr. {appointmentInSlot.dentist.last_name}
          </div>
          <div className="text-xs opacity-75 truncate">{appointmentInSlot.type}</div>
          <div className="text-xs opacity-75">
            {format(new Date(appointmentInSlot.start_time), 'HH:mm')} -{' '}
            {format(new Date(appointmentInSlot.end_time), 'HH:mm')}
          </div>

          {/* Enhanced Resize handle with better visibility */}
          <div
            onMouseDown={(e) => handleResizeStart(e, appointmentInSlot)}
            className={`absolute bottom-0 left-0 right-0 cursor-ns-resize flex items-center justify-center transition-all ${
              isResizing ? 'bg-blue-500/30 dark:bg-blue-400/30 h-8' : 'h-6 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            title="Drag to resize appointment duration"
          >
            <div className={`rounded transition-all ${
              isResizing
                ? 'w-16 h-1.5 bg-blue-600 dark:bg-blue-400'
                : 'w-12 h-1 bg-gray-500 dark:bg-gray-400 group-hover:w-16 group-hover:h-1.5'
            }`}></div>
            {/* Resize icon */}
            <div className="absolute right-2 opacity-50">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V8m10 8V8" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </td>
  );
}
