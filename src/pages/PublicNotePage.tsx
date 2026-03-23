import { useEffect, useState } from 'react';
import { Megaphone, Clock3 } from 'lucide-react';
import { apiGet } from '../lib/api';

type PublicNote = {
  title?: string;
  content?: string;
  updated_at?: string;
};

export const PublicNotePage = () => {
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<PublicNote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNote();
  }, []);

  const fetchNote = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiGet('/note');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load note');
      }
      setNote(json.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load note';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-4">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Club Note</h1>
          <p className="text-xl text-gray-600">Latest update from the admin team</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
          {loading && <p className="text-gray-500 text-center py-8">Loading note...</p>}

          {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && !note && (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg">No public note has been posted yet.</p>
              <p className="text-gray-500 mt-2">Please check again later.</p>
            </div>
          )}

          {!loading && !error && note && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                {note.title || 'Public Note'}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                {note.content}
              </p>

              {note.updated_at && (
                <div className="mt-6 pt-5 border-t border-gray-100 text-sm text-gray-500 flex items-center gap-2">
                  <Clock3 className="w-4 h-4" />
                  Updated on {new Date(note.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
