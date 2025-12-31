import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import { Clock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type TimeSlotPickerProps = {
  courtId: string;
  selectedDate: string;
  selectedTime: string | null; // this will store the start time like "07:00"
  onSelect: (time: string) => void;
  selectedCoachId?: string | null;
  onCoachSelect?: (coachId: string | null) => void;
};

type Coach = {
  _id: string;
  name: string;
  specialty?: string;
};

type Slot = { hour: number; label: string };

const TIME_SLOTS: Slot[] = [
  { hour: 7.0, label: '7:00 AM - 8:30 AM' },
  { hour: 8.5, label: '8:30 AM - 10:00 AM' },
  { hour: 10.0, label: '10:00 AM - 11:30 AM' },
  { hour: 11.5, label: '11:30 AM - 13:00 PM' },
  { hour: 13.0, label: '13:00 PM - 14:30 PM' },
  { hour: 14.5, label: '14:30 PM - 16:00 PM' },
  { hour: 16.0, label: '16:00 PM - 17:30 PM' },
  { hour: 17.5, label: '17:30 PM - 19:00 PM' },
  { hour: 19.0, label: '19:00 PM - 20:30 PM' },
  { hour: 20.5, label: '20:30 PM - 22:00 PM' },
];

function hourToTimeString(hour: number) {
  const h = Math.floor(hour);
  const m = hour % 1 === 0.5 ? 30 : 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
}

export const TimeSlotPicker = ({ courtId, selectedDate, selectedTime, onSelect, selectedCoachId, onCoachSelect }: TimeSlotPickerProps) => {
  const { t } = useTranslation();
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  useEffect(() => {
    fetchBookedSlots();
    fetchCoaches();
  }, [courtId, selectedDate]);

  const fetchBookedSlots = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/bookings/availability?court_id=${encodeURIComponent(courtId)}&date=${encodeURIComponent(selectedDate)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch bookings');

      // Build a set of blocked slots based on overlapping with 90-minute bookings.
      const bookings = (json.data || []).map((b: any) => ({ start: b.start_time, end: b.end_time }));
      const blocked = new Set<string>();

      for (const slot of TIME_SLOTS) {
        const slotTime = hourToTimeString(slot.hour);
        const slotStart = new Date(`${selectedDate}T${slotTime}`);
        const slotEnd = new Date(slotStart.getTime() + 90 * 60 * 1000);

        const overlaps = bookings.some((bk) => {
          const bStart = new Date(`${selectedDate}T${bk.start}`);
          const bEnd = new Date(`${selectedDate}T${bk.end}`);
          // overlap if slotStart < bEnd && slotEnd > bStart
          return slotStart < bEnd && slotEnd > bStart;
        });

        if (overlaps) blocked.add(slotTime);
      }

      setBookedSlots(Array.from(blocked));
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    setLoadingCoaches(true);
    try {
      const res = await apiGet('/coaches');
      const json = await res.json();
      if (json.success && json.data) {
        setCoaches(json.data);
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
    } finally {
      setLoadingCoaches(false);
    }
  };

  const isSlotBooked = (time: string) => bookedSlots.includes(time);
  const isPastSlot = (time: string) => {
    const now = new Date();
    const slotDate = new Date(`${selectedDate}T${time}`);
    return slotDate < now;
  };

  return (
    <div className="space-y-4">
      {/* Coach Selection */}
      {onCoachSelect && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-gray-700">
            <Users className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{t('bookings.choose_coach')}</h3>
          </div>
          {loadingCoaches ? (
            <div className="text-center py-4 text-gray-500">{t('bookings.loading_coaches')}</div>
          ) : (
            <select
              value={selectedCoachId || ''}
              onChange={(e) => onCoachSelect(e.target.value || null)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            >
              <option value="">{t('bookings.no_coach')}</option>
              {coaches.map((coach) => (
                <option key={coach._id} value={coach._id}>
                  {coach.name} {coach.specialty && `- ${coach.specialty}`}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Time Slot Selection */}
      <div className="flex items-center space-x-2 text-gray-700">
        <Clock className="w-5 h-5" />
        <h3 className="text-lg font-semibold">{t('bookings.select_time_slot')}</h3>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">{t('bookings.loading_slots')}</div>
      ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {TIME_SLOTS.map((slot) => {
            const time = hourToTimeString(slot.hour);
            const booked = isSlotBooked(time);
            const past = isPastSlot(time);
            const disabled = booked || past;

            return (
              <button
                key={slot.hour}
                onClick={() => !disabled && onSelect(time)}
                disabled={disabled}
                className={`px-4 py-3 rounded-lg font-medium transition-all text-center ${
                  selectedTime === time
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg scale-105'
                    : disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:scale-105'
                }`}
              >
                <div className="text-sm font-semibold">{slot.label}</div>
              </button>
            );
            })}
          </div>
        )
      }

      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded"></div>
          <span className="text-gray-600">{t('bookings.legend_selected')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
          <span className="text-gray-600">{t('bookings.legend_available')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-gray-600">{t('bookings.legend_unavailable')}</span>
        </div>
      </div>
    </div>
  );
};
