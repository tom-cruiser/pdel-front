import { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';
import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const ReportsPanel = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/admin/bookings');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch bookings');
      const list = (json.data || []).map((b: any) => ({ ...b, id: b._id || b.id }));
      setBookings(list || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookingsByPeriod = () => {
    const now = new Date();
    let filtered = [...bookings];

    if (startDate && endDate) {
      filtered = filtered.filter(
        (b) => b.booking_date >= startDate && b.booking_date <= endDate
      );
    } else {
      switch (period) {
        case 'daily':
          const today = now.toISOString().split('T')[0];
          filtered = filtered.filter((b) => b.booking_date === today);
          break;
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((b) => new Date(b.booking_date) >= weekAgo);
          break;
        case 'monthly':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          filtered = filtered.filter((b) => new Date(b.booking_date) >= monthAgo);
          break;
        case 'yearly':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          filtered = filtered.filter((b) => new Date(b.booking_date) >= yearAgo);
          break;
      }
    }

    return filtered;
  };

  const generateReport = () => {
    const filteredBookings = filterBookingsByPeriod();
    const confirmedBookings = filteredBookings.filter((b) => b.status === 'confirmed');
    const cancelledBookings = filteredBookings.filter((b) => b.status === 'cancelled');

    const courtStats = filteredBookings.reduce((acc, booking) => {
      const courtName = booking.courts?.name || 'Unknown';
      if (!acc[courtName]) {
        acc[courtName] = { total: 0, confirmed: 0, cancelled: 0 };
      }
      acc[courtName].total++;
      if (booking.status === 'confirmed') acc[courtName].confirmed++;
      if (booking.status === 'cancelled') acc[courtName].cancelled++;
      return acc;
    }, {} as Record<string, { total: number; confirmed: number; cancelled: number }>);

    return {
      total: filteredBookings.length,
      confirmed: confirmedBookings.length,
      cancelled: cancelledBookings.length,
      courtStats,
    };
  };

  const exportToPDF = () => {
    const report = generateReport();
    const content = `
Padel Court Booking Report
Period: ${period.toUpperCase()}
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Total Bookings: ${report.total}
Confirmed: ${report.confirmed}
Cancelled: ${report.cancelled}

COURT BREAKDOWN
---------------
${Object.entries(report.courtStats)
  .map(
    ([court, stats]) => `
${court}:
  Total: ${stats.total}
  Confirmed: ${stats.confirmed}
  Cancelled: ${stats.cancelled}
`
  )
  .join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padel-report-${period}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const filteredBookings = filterBookingsByPeriod();
    const headers = ['Date', 'Court', 'Time', 'Player', 'Email', 'Status', 'Notes'];
    const rows = filteredBookings.map((b) => [
      b.booking_date,
      b.courts?.name || 'Unknown',
      `${b.start_time} - ${b.end_time}`,
      b.profiles?.full_name || 'Unknown',
      b.profiles?.email || 'Unknown',
      b.status,
      b.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padel-bookings-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const report = generateReport();

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Report Settings</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as ReportPeriod);
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-gray-800">{report.total}</span>
          </div>
          <p className="text-gray-600 font-medium">Total Bookings</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-gray-800">{report.confirmed}</span>
          </div>
          <p className="text-gray-600 font-medium">Confirmed</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-bold text-gray-800">{report.cancelled}</span>
          </div>
          <p className="text-gray-600 font-medium">Cancelled</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Court Statistics</h3>
        <div className="space-y-4">
          {Object.entries(report.courtStats).map(([court, stats]) => (
            <div key={court} className="border-2 border-gray-100 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 mb-3">{court}</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
                  <p className="text-sm text-gray-600">Confirmed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                  <p className="text-sm text-gray-600">Cancelled</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={exportToPDF}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition"
        >
          <Download className="w-5 h-5" />
          <span>Export as Text</span>
        </button>
        <button
          onClick={exportToCSV}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition"
        >
          <Download className="w-5 h-5" />
          <span>Export as CSV</span>
        </button>
      </div>
    </div>
  );
};
