import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BookingManagement } from '../components/Admin/BookingManagement';
import { MessageManagement } from '../components/Admin/MessageManagement';
import { GalleryManagement } from '../components/Admin/GalleryManagement';
import { ReportsPanel } from '../components/Admin/ReportsPanel';

type AdminTab = 'bookings' | 'messages' | 'gallery' | 'reports';

export const AdminPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('bookings');

  const tabs = [
    { id: 'bookings' as AdminTab, label: 'Bookings', count: null },
    { id: 'messages' as AdminTab, label: 'Messages', count: null },
    { id: 'gallery' as AdminTab, label: 'Gallery', count: null },
    { id: 'reports' as AdminTab, label: 'Reports', count: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            {t('admin.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('admin.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'bookings' && <BookingManagement />}
            {activeTab === 'messages' && <MessageManagement />}
            {activeTab === 'gallery' && <GalleryManagement />}
            {activeTab === 'reports' && <ReportsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};
