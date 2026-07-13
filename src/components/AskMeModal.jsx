import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Send, CheckCircle2, MessageSquare, AlertCircle, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export function AskMeModal({ isOpen, onClose }) {
  const { socialLinks } = useStore();

  const [name, setName] = useState('');
  const [contactMethod, setContactMethod] = useState('email'); // 'email' | 'whatsapp'
  const [contactValue, setContactValue] = useState('');
  const [message, setMessage] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setContactMethod('email');
      setContactValue('');
      setMessage('');
      setPhotoFile(null);
      setPhotoPreview('');
      setError('');
      setSuccess(false);
      setSubmittedRequest(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Photo exceeds the maximum size limit of 5MB.');
      return;
    }

    setPhotoFile(file);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setError('');
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedContactValue = contactValue.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    if (!trimmedContactValue) {
      setError('Contact details are required.');
      return;
    }
    if (!trimmedMessage) {
      setError('Please let us know what piece you are looking for.');
      return;
    }

    // Basic regex checks
    if (contactMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedContactValue)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else if (contactMethod === 'whatsapp') {
      const digitsOnly = trimmedContactValue.replace(/\D/g, '');
      if (digitsOnly.length < 5) {
        setError('Please enter a valid WhatsApp number with digits.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', trimmedName);
      formData.append('contact_method', contactMethod);
      formData.append('contact_value', trimmedContactValue);
      formData.append('message', trimmedMessage);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        setSuccess(true);
        setSubmittedRequest(result.request);
      } else {
        setError(result.error || 'Unable to submit request. Please verify fields.');
      }
    } catch (err) {
      console.error('Request submission error:', err);
      setError('Network connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getWhatsAppDirectLink = () => {
    if (!submittedRequest) return '#';
    const whatsapp = socialLinks?.whatsapp || '1234567890';
    const cleanNum = whatsapp.replace(/[^0-9]/g, '');
    const reference = ` (Request ID: ${submittedRequest.id})`;
    const text = `Hello Good Finds by AA! I just submitted a personal shopper request${reference}.\n\nName: ${name}\nContact: ${contactValue}\n\nMy Wishlist Description:\n"${message}"`;
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      id="ask-me-modal-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 210 }}
        className="bg-[#FAF8F5] border border-stone-200/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        id="ask-me-modal-content"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200/60 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent animate-pulse" />
            <h2 className="font-serif text-lg font-normal text-stone-900 tracking-tight">
              Personal Shopper Wishlist
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Introduction card */}
              <div className="bg-accent-soft border border-accent/15 p-4 rounded-xl text-stone-700 text-xs leading-relaxed">
                <p>
                  Let us do the hunt for you! Our elite concierge partners with primary boutique distributors worldwide to trace pristine handbags, fine jewelry, and rare vintages.
                </p>
              </div>

              {/* Error Callout */}
              {error && (
                <div className="bg-red-50 border border-red-200/50 rounded-lg p-3 text-red-800 text-xs flex items-center gap-2 animate-bounce-subtle">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name field */}
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 block">
                  Your Full Name <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-4 py-2.5 rounded border border-stone-200 text-sm bg-white text-stone-800 focus:outline-none focus:border-accent font-sans transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Contact Method Selector & Input */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 block">
                    Preferred Contact Method <span className="text-accent">*</span>
                  </label>
                  
                  {/* Segmented Control */}
                  <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-lg border border-stone-200/40">
                    <button
                      type="button"
                      onClick={() => { setContactMethod('email'); setContactValue(''); }}
                      className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        contactMethod === 'email'
                          ? 'bg-white text-stone-900 shadow-xs border border-stone-200/20'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Email Address
                    </button>
                    <button
                      type="button"
                      onClick={() => { setContactMethod('whatsapp'); setContactValue(''); }}
                      className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        contactMethod === 'whatsapp'
                          ? 'bg-white text-stone-900 shadow-xs border border-stone-200/20'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      WhatsApp Number
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 block">
                    {contactMethod === 'email' ? 'Email Address' : 'WhatsApp Number (with country code)'} <span className="text-accent">*</span>
                  </label>
                  <input
                    type={contactMethod === 'email' ? 'email' : 'tel'}
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    placeholder={contactMethod === 'email' ? 'eleanor@example.com' : '+63 917 123 4567'}
                    className="w-full px-4 py-2.5 rounded border border-stone-200 text-sm bg-white text-stone-800 focus:outline-none focus:border-accent font-sans transition-colors"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 block">
                  Describe Your Wishlist Piece <span className="text-accent">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Specify brand, model name, color scheme, hardware preference (e.g. Gold hardware, palladium), pristine size, or any budget constraints."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded border border-stone-200 text-sm bg-white text-stone-800 focus:outline-none focus:border-accent font-sans transition-colors resize-none leading-relaxed"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 block">
                  Reference Photo (Optional)
                </label>

                {!photoPreview ? (
                  <div className="border border-dashed border-stone-200 rounded-xl p-4 bg-stone-50 hover:bg-stone-100/50 transition-colors flex flex-col items-center justify-center text-center relative cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isLoading}
                    />
                    <div className="p-2 rounded-full bg-stone-200/60 group-hover:bg-accent/10 group-hover:text-accent text-stone-500 transition-all mb-2">
                      <Upload size={16} />
                    </div>
                    <span className="text-xs text-stone-700 font-semibold mb-0.5">Upload product photo</span>
                    <span className="text-[9px] text-stone-400 font-mono">PNG, JPG, WEBP • Max 5MB</span>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-stone-200 overflow-hidden bg-white p-2.5 flex items-center gap-4 shadow-2xs">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-100 bg-stone-50 shrink-0">
                      <img
                        src={photoPreview}
                        alt="Reference upload preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-800 font-medium truncate">{photoFile?.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {(photoFile ? (photoFile.size / 1024 / 1024).toFixed(2) : 0)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors mr-1 shrink-0 cursor-pointer"
                      title="Remove photo"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 shrink-0">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-semibold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-stone-600 border-t-white animate-spin shrink-0" />
                      <span>Transmitting Wishlist...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Submit Wishlist</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* Success confirmation card */
            <div className="text-center py-6 px-2 space-y-6 animate-zoom-in">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                <CheckCircle2 size={28} strokeWidth={2.2} />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-xl font-normal text-stone-950">
                  Wishlist Submitted!
                </h3>
                <p className="text-stone-500 text-xs">
                  We have safely received your personal shopper request.
                </p>
              </div>

              {submittedRequest && (
                <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-4 max-w-sm mx-auto space-y-2 text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 uppercase tracking-wider pb-1.5 border-b border-stone-100">
                    <span>Reference Ticket</span>
                    <span className="font-bold text-stone-700 bg-stone-200/50 px-1.5 py-0.5 rounded">
                      {submittedRequest.id}
                    </span>
                  </div>
                  
                  <div className="text-xs text-stone-700 leading-relaxed font-sans">
                    <strong>Request Details:</strong><br />
                    Name: {name}<br />
                    Contact: {contactValue}
                  </div>
                </div>
              )}

              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                Thanks! We'll be in touch. Our private curation specialist will trace your piece and message you shortly.
              </p>

              <div className="pt-4 space-y-2.5 max-w-xs mx-auto">
                {contactMethod === 'whatsapp' && (
                  <a
                    href={getWhatsAppDirectLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>Open WhatsApp Backup</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border border-stone-200/40"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
