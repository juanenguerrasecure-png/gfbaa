import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, Trash2, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { compressImage } from '../lib/imageCompressor';

export function PhotoUploader({ value, onChange }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [compressStats, setCompressStats] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load available camera devices
  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices?.enumerateDevices()
        .then(deviceList => {
          const videoDevices = deviceList.filter(d => d.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            // Prefer back camera if available (usually has environment/facingMode back)
            const backCam = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
            setSelectedDeviceId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
          }
        })
        .catch(err => {
          console.warn('Error enumerating devices:', err);
        });
    }
  }, [isCameraActive, selectedDeviceId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError('');

    try {
      const constraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setCameraError('Could not access camera. Please make sure camera permissions are allowed.');
      setIsCameraActive(false);
    }
  }, [selectedDeviceId, stopCamera]);

  // Start/Stop camera stream
  useEffect(() => {
    if (isCameraActive && selectedDeviceId) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isCameraActive, selectedDeviceId, startCamera, stopCamera]);

  // Process and compress file
  const handleFileProcess = async (file) => {
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const originalSizeKb = Math.round(file.size / 1024);

    try {
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75
      });

      // Calculate compressed size from base64 length roughly
      const base64Length = compressedDataUrl.split(',')[1].length;
      const compressedSizeKb = Math.round((base64Length * 3) / 4 / 1024);

      setCompressStats({
        originalSize: `${originalSizeKb} KB`,
        compressedSize: `${compressedSizeKb} KB`,
        savings: `${Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100)}%`
      });

      onChange(compressedDataUrl);
    } catch (err) {
      console.error('Compression failed:', err);
      alert('Failed to compress image.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFileProcess(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileProcess(file);
  };

  // Capture frame from video stream
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror image if using front camera (usually has "front" or "user" in device/stream)
    const activeTrack = streamRef.current?.getVideoTracks()[0];
    const settings = activeTrack?.getSettings();
    const isFrontCamera = settings?.facingMode === 'user' || 
                         (devices.find(d => d.deviceId === selectedDeviceId)?.label.toLowerCase().includes('front'));

    if (isFrontCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const rawSizeKb = Math.round((rawDataUrl.split(',')[1].length * 3) / 4 / 1024);

    try {
      const compressedDataUrl = await compressImage(rawDataUrl, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75
      });

      const compressedSizeKb = Math.round((compressedDataUrl.split(',')[1].length * 3) / 4 / 1024);

      setCompressStats({
        originalSize: `${rawSizeKb} KB`,
        compressedSize: `${compressedSizeKb} KB`,
        savings: `${Math.round(((rawSizeKb - compressedSizeKb) / rawSizeKb) * 100)}%`
      });

      onChange(compressedDataUrl);
      setIsCameraActive(false);
    } catch (err) {
      console.error('Capture and compression failed:', err);
      alert('Failed to capture photo.');
    }
  };

  const switchCamera = () => {
    if (devices.length <= 1) return;
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
  };

  const removePhoto = () => {
    onChange(null);
    setCompressStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block">
        Product Listing Photo
      </label>

      {/* Main Image Showcase or Camera Container */}
      <div 
        className={`relative border rounded-lg overflow-hidden bg-stone-50 min-h-[220px] transition-all flex flex-col items-center justify-center ${
          isDragging ? 'border-amber-500 bg-amber-50/20' : 'border-stone-200'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isCameraActive ? (
          /* Live Camera View */
          <div className="w-full relative flex flex-col items-center bg-black min-h-[260px]">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[260px] object-contain scale-x-[-1]" // default mirror for styling
            />
            
            {/* Camera Controls Overlay */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-3 px-4">
              <button
                type="button"
                onClick={() => setIsCameraActive(false)}
                className="p-2 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full transition-all border border-stone-700"
                title="Cancel"
              >
                <X size={18} />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="w-14 h-14 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-900 rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-white transition-all"
                title="Capture Photo"
              >
                <Camera size={24} />
              </button>

              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-2 bg-stone-900/80 hover:bg-stone-900 text-white rounded-full transition-all border border-stone-700"
                  title="Switch Camera"
                >
                  <RefreshCw size={18} />
                </button>
              )}
            </div>

            {/* Device label or camera indicator */}
            <div className="absolute top-3 left-3 bg-stone-900/80 text-[10px] text-stone-300 px-2 py-0.5 rounded font-mono">
              Live Camera Preview
            </div>
          </div>
        ) : value ? (
          /* Image Display & Info */
          <div className="w-full p-4 flex flex-col items-center justify-center gap-3">
            <div className="relative group rounded-md overflow-hidden border border-stone-200 shadow-sm bg-white max-w-[180px]">
              <img 
                src={value} 
                alt="Product Preview" 
                className="w-full h-32 object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-all active:scale-90"
                title="Delete Photo"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Compression Statistics Panel */}
            {compressStats && (
              <div className="w-full max-w-xs bg-amber-50/50 border border-amber-200/60 rounded-md p-2.5 text-[11px] space-y-1 text-amber-900">
                <div className="font-semibold flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-600" />
                  Auto-Compression Activated!
                </div>
                <div className="grid grid-cols-3 text-center gap-1 font-mono pt-1 text-stone-600">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-stone-400">Original</div>
                    <div className="font-semibold">{compressStats.originalSize}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-stone-400">Compressed</div>
                    <div className="font-semibold text-amber-700">{compressStats.compressedSize}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-stone-400">Saved</div>
                    <div className="font-semibold text-emerald-600">-{compressStats.savings}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={triggerFileSelect}
                className="px-3 py-1.5 border border-stone-300 hover:bg-stone-100 rounded text-xs font-semibold text-stone-700 transition-all"
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={() => setIsCameraActive(true)}
                className="px-3 py-1.5 border border-stone-300 hover:bg-stone-100 rounded text-xs font-semibold text-stone-700 transition-all flex items-center gap-1"
              >
                <Camera size={12} />
                Retake
              </button>
            </div>
          </div>
        ) : (
          /* Empty / Trigger View */
          <div className="w-full p-6 text-center flex flex-col items-center justify-center">
            <Upload size={28} className="text-stone-300 mb-2" />
            <p className="text-xs text-stone-600 font-medium">
              Drag & drop photo here, or{' '}
              <button 
                type="button" 
                onClick={triggerFileSelect}
                className="text-amber-600 hover:underline font-semibold"
              >
                browse file
              </button>
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              Supports PNG, JPG, WebP. Max output dimensions: 800x800px.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="w-8 h-px bg-stone-200"></span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">OR</span>
              <span className="w-8 h-px bg-stone-200"></span>
            </div>

            <button
              type="button"
              onClick={() => setIsCameraActive(true)}
              className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Camera size={14} />
              Take Photo with Camera
            </button>
          </div>
        )}

        {/* Camera device connection error */}
        {cameraError && (
          <div className="absolute top-2 left-2 right-2 p-2 bg-red-50 text-red-700 rounded text-xs flex items-start gap-1.5 border border-red-200">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
