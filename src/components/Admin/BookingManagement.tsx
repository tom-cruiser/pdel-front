import { useState, useEffect } from 'react';
import { apiGet, apiPut, apiPatch, apiDelete } from '../../lib/api';
import { Calendar, Search, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export const BookingManagement = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBookings();
  }, [currentPage, filterStatus, filterDate, searchTerm]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (filterStatus) params.append('status', filterStatus);
      if (filterDate) params.append('date_from', filterDate);
      if (searchTerm) params.append('search', searchTerm);
      
      const res = await apiGet(`/admin/bookings?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch bookings');
      
      const data = json.data || {};
      const list = (data.bookings || []).map((b: any) => ({
        ...b,
        id: b._id || b.id,
      }));
      
      setBookings(list);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalBookings(data.pagination?.total || 0);
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDateChange = (value: string) => {
    setFilterDate(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </h2>
          {(searchTerm || filterDate || filterStatus) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or court..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalBookings}</p>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
            <p className="text-sm text-gray-600">Current Page</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalPages}</p>
            <p className="text-sm text-gray-600">Total Pages</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">Page {currentPage}</p>
            <p className="text-sm text-gray-600">Current</p>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No bookings found matching your criteria
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="w-10 h-10 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
