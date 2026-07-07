import { useState, useRef, useMemo } from 'react';
import { AlertCircle, Sparkles, Trash2, Upload, MoveUp, MoveDown, Image } from 'lucide-react';
import { compressImage } from '../lib/imageCompressor';

export function MultiPhotoEditor({ photos = [], onChange, label = 'Product Listing Photos' }) {
  const [compressStats, setCompressStats] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Normalize incoming photos to [{ url, description }]
  const normalizedPhotos = useMemo(() => {
    if (!Array.isArray(photos)) return [];
    return photos.map((p, idx) => {
      if (p && typeof p === 'object') {
        return {
          id: p.id || `photo-${idx}-${Date.now()}`,
          url: p.url || '',
          description: p.description || ''
        };
      }
      return {
        id: `photo-${idx}-${Date.now()}`,
        url: String(p || ''),
        description: ''
      };
    }).filter(p => p.url);
  }, [photos]);

  const dataUrlToBlob = async (dataUrl) => {
    const response = await fetch(dataUrl);
    return response.blob();
  };

  const uploadCompressedDataUrl = async (dataUrl) => {
    setIsUploading(true);
    setUploadError('');
    try {
      const token = localStorage.getItem('gf_session_token') || '';
      if (!token) throw new Error('Missing admin session token. Please sign in again.');

      const blob = await dataUrlToBlob(dataUrl);
      const formData = new FormData();
      formData.append('file', blob, `product-${Date.now()}.jpg`);

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Photo upload failed.');
      return result.url;
    } catch (error) {
      console.warn('R2 photo upload failed; falling back to base64 Data URL for local session:', error);
      // Fallback gracefully to base64
      return dataUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileProcess = async (file) => {
    if (!file) return;
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file.');
      return;
    }

    const originalSizeKb = Math.round(file.size / 1024);

    try {
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75,
      });

      const base64Length = compressedDataUrl.split(',')[1].length;
      const compressedSizeKb = Math.round((base64Length * 3) / 4 / 1024);
      setCompressStats({
        originalSize: `${originalSizeKb} KB`,
        compressedSize: `${compressedSizeKb} KB`,
        savings: `${Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100)}%`,
      });

      const uploadedUrl = await uploadCompressedDataUrl(compressedDataUrl);
      if (uploadedUrl) {
        // Add new photo with empty description
        const newPhoto = { url: uploadedUrl, description: '' };
        const updated = [...normalizedPhotos.map(p => ({ url: p.url, description: p.description })), newPhoto];
        onChange(updated);
      }
    } catch (err) {
      console.error('Compression/upload failed:', err);
      setUploadError('Photo upload failed. Please check your connection and try again.');
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();
  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };
  const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const updatePhotoDescription = (index, description) => {
    const updated = normalizedPhotos.map((p, idx) => {
      if (idx === index) {
        return { ...p, description };
      }
      return p;
    }).map(p => ({ url: p.url, description: p.description }));
    onChange(updated);
  };

  const removePhoto = (index) => {
    const updated = normalizedPhotos.filter((_, idx) => idx !== index)
      .map(p => ({ url: p.url, description: p.description }));
    onChange(updated.length > 0 ? updated : []);
    setCompressStats(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const movePhoto = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === normalizedPhotos.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...normalizedPhotos];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    onChange(updated.map(p => ({ url: p.url, description: p.description })));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-stone-200 pb-2">
        <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block">
          {label} ({normalizedPhotos.length})
        </label>
        <span className="text-[10px] text-stone-400 font-mono">Drag & drop or add one-by-one</span>
      </div>

      {isUploading && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2 flex items-center gap-2 animate-pulse">
          <Sparkles size={14} className="text-amber-500 shrink-0" />
          <span>Uploading and compressing photo to cloud storage...</span>
        </div>
      )}

      {uploadError && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload Drag Area */}
      <div
        className={`relative border border-dashed rounded-lg overflow-hidden bg-stone-50/50 min-h-[140px] transition-all flex flex-col items-center justify-center cursor-pointer ${isDragging ? 'border-[#C9A84C] bg-amber-50/20' : 'border-stone-300 hover:border-[#C9A84C] hover:bg-stone-50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <div className="w-full p-6 text-center flex flex-col items-center justify-center">
          <Upload size={24} className="text-stone-400 mb-2" />
          <p className="text-xs text-stone-600 font-medium">
            Drag & drop photo here, or <span className="text-[#C9A84C] font-semibold underline">browse file</span>
          </p>
          <p className="text-[10px] text-stone-400 mt-1">
            Supports PNG, JPG, WebP. High quality auto-compression will be applied.
          </p>
        </div>
      </div>

      {/* Auto compression metrics */}
      {compressStats && (
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-md p-2.5 text-[11px] space-y-1 text-amber-900 max-w-sm">
          <div className="font-semibold flex items-center gap-1">
            <Sparkles size={12} className="text-amber-600" />
            Auto-Compression Activated!
          </div>
          <div className="grid grid-cols-3 text-center gap-1 font-mono pt-1 text-stone-600">
            <div><div className="text-[9px] uppercase tracking-wider text-stone-400">Original</div><div className="font-semibold">{compressStats.originalSize}</div></div>
            <div><div className="text-[9px] uppercase tracking-wider text-stone-400">Compressed</div><div className="font-semibold text-amber-700">{compressStats.compressedSize}</div></div>
            <div><div className="text-[9px] uppercase tracking-wider text-stone-400">Saved</div><div className="font-semibold text-emerald-600">-{compressStats.savings}</div></div>
          </div>
        </div>
      )}

      {/* Photo List & Descriptions */}
      {normalizedPhotos.length > 0 && (
        <div className="space-y-3.5 mt-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
          {normalizedPhotos.map((photo, index) => (
            <div key={photo.id} className="flex gap-3 bg-white border border-stone-200 rounded-lg p-3 shadow-xs relative group/item">
              {/* Photo Preview Thumbnail */}
              <div className="w-20 h-20 bg-stone-100 rounded-md border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                <img src={photo.url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] font-mono rounded font-semibold">
                  #{index + 1}
                </span>
              </div>

              {/* Photo settings & details */}
              <div className="flex-1 flex flex-col justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Photo Caption / Description</span>
                  <input
                    type="text"
                    value={photo.description}
                    onChange={(e) => updatePhotoDescription(index, e.target.value)}
                    placeholder="e.g. Back view showing pristine condition"
                    className="w-full text-xs p-1.5 border border-stone-300 rounded outline-none focus:border-[#C9A84C]"
                  />
                </div>

                {/* Operations */}
                <div className="flex justify-between items-center text-stone-500 text-[11px]">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => movePhoto(index, 'up')}
                      className="p-1 hover:text-[#C9A84C] hover:bg-stone-50 rounded disabled:opacity-30 disabled:hover:text-stone-500 disabled:hover:bg-transparent"
                      title="Move up"
                    >
                      <MoveUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={index === normalizedPhotos.length - 1}
                      onClick={() => movePhoto(index, 'down')}
                      className="p-1 hover:text-[#C9A84C] hover:bg-stone-50 rounded disabled:opacity-30 disabled:hover:text-stone-500 disabled:hover:bg-transparent"
                      title="Move down"
                    >
                      <MoveDown size={13} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors ml-auto"
                    title="Delete photo"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
}
