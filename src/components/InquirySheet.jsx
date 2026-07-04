import { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Send, Sparkles, Check, MessageCircle, MapPin } from 'lucide-react';

export function InquirySheet() {
  const { inquiryItem, setInquiryItem, addPurchaseRequest, syncAfterLocalChange, socialLinks } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    if (inquiryItem) {
      setIsOpen(true);
      setSubmittedRequest(null);
      // Pre-fill default message
      const text = inquiryItem.isPast 
        ? `I am highly interested in the past collection piece: "${inquiryItem.brand} - ${inquiryItem.caption || inquiryItem.name}". Could you source another similar piece?`
        : `Hello, I would like to inquire about the piece "${inquiryItem.brand} - ${inquiryItem.name}". Is it available for instant viewing or bank-transfer hold?`;
      setSpecialInstructions(text);
    } else {
      setIsOpen(false);
    }
  }, [inquiryItem]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setInquiryItem(null);
    }, 300); // Wait for transition
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buyerName || !buyerContact || !buyerAddress) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build items payload
      const itemPayload = {
        productId: inquiryItem.id,
        qty: 1,
        price: Number(inquiryItem.price) || 0,
        name: inquiryItem.name || inquiryItem.caption || 'Editorial piece',
        brand: inquiryItem.brand || 'Luxury piece'
      };

      const newRequest = addPurchaseRequest({
        buyerName,
        buyerEmail: buyerContact, // map to expected API field
        buyerAddress,
        items: [itemPayload],
        specialInstructions
      });

      // Synchronize changes to remote database
      await syncAfterLocalChange();

      setSubmittedRequest(newRequest);
    } catch (err) {
      console.error('Failed to register inquiry:', err);
      alert('Failed to register your inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppDirectLink = () => {
    if (!inquiryItem) return '#';
    const whatsapp = socialLinks?.whatsapp || '1234567890';
    const cleanNum = whatsapp.replace(/[^0-9]/g, '');
    const codePart = submittedRequest ? ` (Reference ID: ${submittedRequest.id})` : '';
    const text = `Hello! I just submitted an inquiry for "${inquiryItem.brand} - ${inquiryItem.name || inquiryItem.caption}"${codePart}.\n\nMy details:\nName: ${buyerName}\nContact: ${buyerContact}\n\nMessage:\n"${specialInstructions}"`;
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  };

  if (!inquiryItem && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-300 select-none ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      id="inquiry_sheet_wrapper"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/45 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className={`w-screen max-w-md bg-[#FAF8F5] shadow-2xl border-l border-stone-200/40 flex flex-col transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200/60 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--accent)] animate-pulse" />
              <h2 className="font-serif text-lg font-normal text-stone-900 tracking-tight">
                Luxury Inquiry Sheet
              </h2>
            </div>
            <button 
              onClick={handleClose}
              className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            
            {/* Item Showcase Card */}
            {inquiryItem && (
              <div className="bg-white rounded-xl border border-stone-200/50 p-4 flex gap-4 shadow-xs">
                <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                  <img 
                    src={inquiryItem.photoUrl || inquiryItem.photo || (inquiryItem.photos && inquiryItem.photos[0]) || (inquiryItem.photoUrls && inquiryItem.photoUrls[0])} 
                    alt={inquiryItem.name || 'Inquired luxury piece'} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-accent uppercase block mb-0.5">
                    {inquiryItem.brand}
                  </span>
                  <h3 className="font-serif text-sm font-medium text-stone-900 truncate mb-1">
                    {inquiryItem.name || inquiryItem.caption}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-stone-600">
                      {inquiryItem.price && inquiryItem.price > 0 ? `$${Number(inquiryItem.price).toLocaleString()}` : 'Price on request'}
                    </span>
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      inquiryItem.isPast ? 'bg-amber-50 text-amber-800 border border-amber-200/40' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/40'
                    }`}>
                      {inquiryItem.isPast ? 'Past Collection' : 'Current Selection'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!submittedRequest ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                    Your Full Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-xs text-stone-950 bg-white border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                {/* Contact Email/Phone */}
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                    Email / Contact Handle *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    placeholder="e.g. client@example.com or WhatsApp number"
                    className="w-full text-xs text-stone-950 bg-white border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                {/* Delivery Address / Location */}
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                    Registered Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-stone-400" />
                    <textarea 
                      required 
                      rows={2}
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      placeholder="Please input your full delivery coordinates to calculate optimal secure shipping logistics"
                      className="w-full text-xs text-stone-950 bg-white border border-stone-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none leading-normal"
                    />
                  </div>
                </div>

                {/* Inquiry notes */}
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-500 mb-1">
                    Personalized Notes & Requests
                  </label>
                  <textarea 
                    rows={4}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Add optional special delivery preferences, payment plan requests, or sizing inquiries..."
                    className="w-full text-xs text-stone-950 bg-white border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-950 text-white text-xs font-semibold uppercase tracking-widest rounded-lg transition-all shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Registering Curation...</span>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Submit Inquiry Sheet</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-stone-400 leading-relaxed max-w-[280px] mx-auto">
                  Submitting will safely log this request inside the vault database. You will also get a direct WhatsApp click-to-chat backup next.
                </p>

              </form>
            ) : (
              /* Success State */
              <div className="bg-white rounded-xl border border-stone-200/60 p-6 text-center space-y-4 animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                  <Check size={22} strokeWidth={2.5} />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-serif text-base font-normal text-stone-950">
                    Inquiry Registered Successfully
                  </h3>
                  <p className="text-xs text-stone-500">
                    Curation Ticket ID: <span className="font-mono font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">{submittedRequest.id}</span>
                  </p>
                </div>

                <div className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
                  Your interest in the <strong>{inquiryItem?.brand} {inquiryItem?.name || inquiryItem?.caption}</strong> has been logged in our queue. Our concierge team will review shipping calculations.
                </div>

                <div className="pt-2 space-y-2">
                  <a
                    href={getWhatsAppDirectLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    <span>Open WhatsApp Chat</span>
                  </a>

                  <button
                    onClick={handleClose}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Continue Curation
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
