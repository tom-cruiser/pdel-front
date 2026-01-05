import { useState, useEffect } from 'react';
import { GalleryImage } from '../../lib/supabase';
import { apiFetch, apiGet } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

export const GalleryManagement = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/gallery');
      if (!res.ok) throw new Error('Failed to load gallery');
      const body = await res.json();
      console.log('[GalleryManagement] Raw API response:', body);
      console.log('[GalleryManagement] Images data:', body.data);
      if (body.data && body.data.length > 0) {
        console.log('[GalleryManagement] First image sample:', body.data[0]);
        console.log('[GalleryManagement] First image id:', body.data[0].id);
        console.log('[GalleryManagement] First image _id:', body.data[0]._id);
      }
      setImages(body.data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!file) throw new Error('No file selected');
      const fd = new FormData();
      fd.append('image', file, file.name);
      fd.append('title', title || '');
      fd.append('description', description || '');

      const res = await apiFetch('/admin/gallery', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || body?.error || 'Upload failed');
      }

      setTitle('');
      setDescription('');
      setFile(null);
      setShowAddForm(false);
      fetchImages();
    } catch (error: any) {
      console.error('Error adding image:', error);
      alert(error?.message || 'Failed to add image');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      console.log('[GalleryManagement] Attempting to delete image:', imageId);
      const res = await apiFetch(`/admin/gallery/${imageId}`, { method: 'DELETE' });
      
      console.log('[GalleryManagement] Delete response status:', res.status);
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[GalleryManagement] Delete failed:', body);
        throw new Error(body?.message || body?.error || 'Delete failed');
      }
      
      const body = await res.json();
      console.log('[GalleryManagement] Delete successful:', body);
      
      fetchImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert(error?.message || 'Failed to delete image');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading gallery...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-800">
            Gallery Images ({images.length})
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Image</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Image</h3>
          <form onSubmit={handleAddImage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image (Required)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                  setFile(f);
                  if (f) setPreviewUrl(URL.createObjectURL(f));
                }}
                required
                className="w-full text-sm text-gray-700 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700"
              />
              <p className="text-xs text-gray-500 mt-1">Pick an image from disk or use your camera</p>

              {previewUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Preview</p>
                  <div className="w-full aspect-square overflow-hidden rounded-lg">
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Tournament Finals 2024"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add details about this image..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-6 rounded-xl font-bold hover:from-blue-600 hover:to-green-600 transition disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Image'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">No images yet</p>
          <p className="text-gray-500">Add your first image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.title || 'Gallery image'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                {image.title && (
                  <h3 className="font-bold text-gray-800 mb-1">{image.title}</h3>
                )}
                {image.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{image.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Added {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-lg"
                  title="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
