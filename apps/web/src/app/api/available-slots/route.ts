import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addMinutes } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dentistId = searchParams.get('dentistId');
    const date = searchParams.get('date');

    if (!dentistId || !date) {
      return NextResponse.json(
        { error: 'dentistId and date are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get dentist schedule for the day
    const { data: schedule, error: scheduleError } = await supabase
      .from('dentist_schedules')
      .select('*')
      .eq('dentist_id', dentistId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json([]);
    }

    // Get existing appointments for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('dentist_id', dentistId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .neq('status', 'cancelled');

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
    }

    const appointments = appointmentsData || [];

    // Generate time slots (30-minute intervals)
    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    const slotDuration = 30; // minutes

    const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = schedule.end_time.split(':').map(Number);

    let currentSlot = new Date(targetDate);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(targetDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentSlot < endTime) {
      const slotEnd = addMinutes(currentSlot, slotDuration);

      // Check if slot conflicts with any appointment
      const hasConflict = appointments.some((apt) => {
        const aptStart = new Date(apt.start_time);
        const aptEnd = new Date(apt.end_time);

        return (
          (currentSlot >= aptStart && currentSlot < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (currentSlot <= aptStart && slotEnd >= aptEnd)
        );
      });

      slots.push({
        startTime: currentSlot.toISOString(),
        endTime: slotEnd.toISOString(),
        available: !hasConflict,
      });

      currentSlot = slotEnd;
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
