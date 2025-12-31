import { useState, useEffect } from 'react';
import { GalleryImage } from '../lib/supabase';
import { apiGet } from '../lib/api';
import { Image as ImageIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const GalleryPage = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await apiGet('/gallery');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch gallery');
      const imgs = (json.data || []).map((i: any) => ({ ...i, id: i.id || i._id }));
      setImages(imgs as GalleryImage[]);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl mb-4">
            <ImageIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {t('gallery.title')}
          </h1>
          <p className="text-xl text-gray-600">{t('gallery.subtitle')}</p>
        </div>
        {loading ? (
          <div className="text-center py-20 text-gray-500">{t('gallery.loading')}</div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <ImageIcon className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl text-gray-600">{t('gallery.no_images')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                onClick={() => setSelectedImage(image)}
                className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <img
                  src={image.image_url}
                  alt={image.title || 'Gallery image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    {image.title && (
                      <h3 className="text-lg font-bold mb-1">{image.title}</h3>
                    )}
                    {image.description && (
                      <p className="text-sm text-gray-200">{image.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.title || 'Gallery image'}
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            {(selectedImage.title || selectedImage.description) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-4 text-white">
                {selectedImage.title && (
                  <h2 className="text-2xl font-bold mb-2">{selectedImage.title}</h2>
                )}
                {selectedImage.description && (
                  <p className="text-gray-200">{selectedImage.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
