import { useState, useEffect } from 'react';
import { apiGet, apiPut, apiPatch, apiDelete } from '../../lib/api';
import { Calendar, Search, Trash2, CheckCircle, XCircle } from 'lucide-react';

export const BookingManagement = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/admin/bookings');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch bookings');
      const list = (json.data || []).map((b: any) => ({
        ...b,
        id: b._id || b.id,
      }));
      setBookings(list);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await apiPatch(`/bookings/${bookingId}/cancel`, {});
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to cancel booking');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;

    try {
      const res = await apiDelete(`/bookings/${bookingId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to delete/cancel booking');
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      !searchTerm ||
      booking.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.courts?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !filterDate || booking.booking_date === filterDate;

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or court..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full md:w-auto pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
            <p className="text-sm text-gray-600">Confirmed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {bookings.filter(b => b.status === 'cancelled').length}
            </p>
            <p className="text-sm text-gray-600">Cancelled</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{filteredBookings.length}</p>
            <p className="text-sm text-gray-600">Filtered</p>
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No bookings found matching your criteria
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: booking.courts?.color || '#gray' }}
                    />
                    <h3 className="font-bold text-gray-800 text-lg">
                      {booking.courts?.name || 'Unknown Court'}
                    </h3>
                    {booking.status === 'confirmed' ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Confirmed</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span>Cancelled</span>
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">Player:</span> {booking.profiles?.full_name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Email:</span> {booking.profiles?.email || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Phone:</span> {booking.profiles?.phone || 'N/A'}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">Date:</span>{' '}
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-semibold">Time:</span> {booking.start_time} - {booking.end_time}
                    </div>
                    <div>
                      <span className="font-semibold">Booked:</span>{' '}
                      {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {booking.membership_status && (
                    <div className="text-sm">
                      <span className="font-semibold text-gray-600">Membership:</span>{' '}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.membership_status === 'member' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.membership_status === 'member' ? 'Member' : 'Non-Member'}
                      </span>
                    </div>
                  )}

                  {booking.notes && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Notes:</span> {booking.notes}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-2">
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteBooking(booking.id)}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
