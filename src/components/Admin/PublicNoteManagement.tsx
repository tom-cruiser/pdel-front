import { useEffect, useState } from 'react';
import { Save, Eye, EyeOff, FileText } from 'lucide-react';
import { apiGet, apiPut } from '../../lib/api';

type NotePayload = {
  title: string;
  content: string;
  is_active: boolean;
};

export const PublicNoteManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<NotePayload>({
    title: '',
    content: '',
    is_active: true,
  });

  useEffect(() => {
    fetchNote();
  }, []);

  const fetchNote = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiGet('/admin/note');
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to load note');
      }

      if (json.data) {
        setNote({
          title: json.data.title || '',
          content: json.data.content || '',
          is_active: json.data.is_active !== false,
        });
      }
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Failed to load note';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note.content.trim()) {
      setError('Please enter a note before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await apiPut('/admin/note', {
        title: note.title.trim(),
        content: note.content.trim(),
        is_active: note.is_active,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to save note');
      }

      setMessage('Public note saved successfully.');
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Failed to save note';
      setError(messageText);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading note editor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Public Note</h2>
        <p className="text-sm text-gray-600">
          Write a note for all users. This appears on the public Note page in the app.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title (optional)</label>
          <input
            value={note.title}
            onChange={(e) => setNote((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Club update"
            maxLength={120}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
          <textarea
            value={note.content}
            onChange={(e) => setNote((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Example: Courts 2 and 3 are under maintenance this Friday 10:00 to 14:00."
            rows={7}
            maxLength={1500}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
          />
          <p className="mt-2 text-xs text-gray-500">{note.content.length}/1500</p>
        </div>

        <label className="inline-flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={note.is_active}
            onChange={(e) => setNote((prev) => ({ ...prev, is_active: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show this note to users
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 text-white px-5 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Public Note'}
          </button>

          <button
            onClick={fetchNote}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <FileText className="w-4 h-4" />
            Reload
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-3 text-gray-700">
          {note.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="font-semibold">Preview</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{note.title || 'Public Note'}</h3>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content || 'No note content yet.'}</p>
      </div>
    </div>
  );
};
