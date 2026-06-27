import { useState, useRef } from 'react';
import { AlertCircle, Sparkles, Trash2, Upload } from 'lucide-react';
import { compressImage } from '../lib/imageCompressor';

export function PhotoUploader({ value, onChange }) {
  const [compressStats, setCompressStats] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

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
      console.warn('R2 photo upload failed:', error);
      setUploadError('Photo upload failed. Please check your connection and try again.');
      return null;
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
      if (uploadedUrl) onChange(uploadedUrl);
    } catch (err) {
      console.error('Compression/upload failed:', err);
      setUploadError('Photo upload failed. Please check your connection and try again.');
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();
  const handleFileChange = (event) => handleFileProcess(event.target.files?.[0]);
  const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileProcess(event.dataTransfer.files?.[0]);
  };

  const removePhoto = () => {
    onChange(null);
    setCompressStats(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block">
        Product Listing Photo
      </label>

      {isUploading && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2">
          Uploading photo to cloud storage...
        </div>
      )}

      {uploadError && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div
        className={`relative border rounded-lg overflow-hidden bg-stone-50 min-h-[220px] transition-all flex flex-col items-center justify-center ${isDragging ? 'border-amber-500 bg-amber-50/20' : 'border-stone-200'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="w-full p-4 flex flex-col items-center justify-center gap-3">
            <div className="relative group rounded-md overflow-hidden border border-stone-200 shadow-sm bg-white max-w-[180px]">
              <img src={value} alt="Product Preview" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
              <button type="button" onClick={removePhoto} className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-all active:scale-90" title="Delete Photo">
                <Trash2 size={13} />
              </button>
            </div>

            {compressStats && (
              <div className="w-full max-w-xs bg-amber-50/50 border border-amber-200/60 rounded-md p-2.5 text-[11px] space-y-1 text-amber-900">
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

            <button type="button" onClick={triggerFileSelect} className="px-3 py-1.5 border border-stone-300 hover:bg-stone-100 rounded text-xs font-semibold text-stone-700 transition-all">
              Change Photo
            </button>
          </div>
        ) : (
          <div className="w-full p-6 text-center flex flex-col items-center justify-center">
            <Upload size={28} className="text-stone-300 mb-2" />
            <p className="text-xs text-stone-600 font-medium">
              Drag and drop photo here, or{' '}
              <button type="button" onClick={triggerFileSelect} className="text-amber-600 hover:underline font-semibold">
                browse file
              </button>
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              Supports PNG, JPG, WebP. Max output dimensions: 800x800px.
            </p>
          </div>
        )}
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
}
