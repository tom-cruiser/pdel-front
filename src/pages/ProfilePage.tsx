import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPatch } from '../lib/api';
import { User, Calendar, CheckCircle, XCircle, Edit, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProfilePage = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserBookings();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const fetchUserBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await apiGet('/bookings');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch bookings');
      // normalize bookings: map _id -> id and ensure courts object exists
      const list = (json.data || []).map((b: any) => ({
        ...b,
        id: b._id || b.id,
        courts: b.courts || { name: b.court_name || '', color: b.court_color || '#000' },
      }));
      setBookings(list);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancelling(bookingId);
    try {
      const res = await apiPatch(`/bookings/${bookingId}/cancel`, {});
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.message || 'Failed to cancel booking');
      }

      // Refresh bookings after successful cancellation
      await fetchUserBookings();
      alert('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(`Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCancelling(null);
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.booking_date) >= new Date()
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.booking_date) < new Date() || b.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            {t('profile.my_profile')}
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">{t('profile.account_details')}</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.full_name')}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('profile.phone')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 transition disabled:opacity-50"
                    >
                      {saving ? t('profile.save') : t('profile.save')}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFullName(profile?.full_name || '');
                        setPhone(profile?.phone || '');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      {t('profile.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">{t('profile.name_label')}</p>
                    <p className="font-semibold text-gray-800">
                      {profile?.full_name || t('profile.not_set')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{t('profile.email_label')}</p>
                    <p className="font-semibold text-gray-800">{profile?.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{t('profile.phone_label')}</p>
                    <p className="font-semibold text-gray-800">
                      {profile?.phone || t('profile.not_set')}
                    </p>
                  </div>

                  {profile?.is_admin && (
                    <div className="mt-4 px-3 py-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
                      <p className="text-sm font-semibold text-blue-700">Admin Account</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="text-2xl font-bold text-gray-800">{bookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="text-2xl font-bold text-green-600">
                    {upcomingBookings.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">My Bookings</h2>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No bookings yet</p>
                  <p className="text-gray-500 mt-2">Book your first court to get started!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingBookings.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Upcoming Bookings</span>
                      </h3>
                      <div className="space-y-3">
                        {upcomingBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="border-2 border-green-200 rounded-xl p-4 bg-green-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: booking.courts?.color }}
                                />
                                <span className="font-bold text-gray-800">
                                  {booking.courts?.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                  Confirmed
                                </span>
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancelling === booking.id}
                                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                  title="Cancel booking"
                                >
                                  {cancelling === booking.id ? (
                                    <span className="text-xs">...</span>
                                  ) : (
                                    <X className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>
                                <span className="font-semibold">Date:</span>{' '}
                                {new Date(booking.booking_date).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-semibold">Time:</span> {booking.start_time} -{' '}
                                {booking.end_time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pastBookings.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                        <XCircle className="w-5 h-5 text-gray-600" />
                        <span>Past Bookings</span>
                      </h3>
                      <div className="space-y-3">
                        {pastBookings.slice(0, 5).map((booking) => (
                          <div
                            key={booking.id}
                            className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: booking.courts?.color }}
                                />
                                <span className="font-bold text-gray-800">
                                  {booking.courts?.name}
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  booking.status === 'cancelled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {booking.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>
                                <span className="font-semibold">Date:</span>{' '}
                                {new Date(booking.booking_date).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-semibold">Time:</span> {booking.start_time} -{' '}
                                {booking.end_time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
