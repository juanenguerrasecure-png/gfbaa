import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function MessageMeModal({ isOpen, onClose }) {
  const { addDirectMessage } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedText = text.trim();

    if (!trimmedName || !trimmedEmail || !trimmedText) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    const result = await addDirectMessage({
      name: trimmedName,
      email: trimmedEmail,
      text: trimmedText
    });
    setIsSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setName('');
      setEmail('');
      setText('');
    } else {
      setError(result.error || 'Failed to send your message. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 select-none" id="message_me_portal">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-10 cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-lg bg-[var(--bg)] rounded-2xl shadow-2xl overflow-hidden z-20 border border-stone-200 select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header banner decoration */}
            <div className="h-2 bg-[var(--gold)] w-full" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all cursor-pointer"
              aria-label="Close modal"
              id="message_modal_close"
            >
              <X size={15} />
            </button>

            <div className="p-6 md:p-8">
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="text-center space-y-1.5 mb-2">
                    <div className="inline-flex items-center gap-1.5 justify-center mb-1">
                      <Sparkles size={13} className="text-[var(--gold)]" />
                      <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C7B6E]">
                        Get In Touch
                      </span>
                    </div>
                    <h3 className="font-serif font-light text-stone-900 text-2xl tracking-tight">
                      Message Me
                    </h3>
                    <p className="text-xs text-stone-500 font-sans font-light max-w-sm mx-auto">
                      Have a query about a specific curation or wish to request custom sourcing? Send me a message directly.
                    </p>
                  </div>

                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200/50 rounded-lg p-3 text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Eleanor Vance"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 bg-[var(--surface)] text-stone-800 text-sm font-sans placeholder-stone-400 transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. eleanor@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 bg-[var(--surface)] text-stone-800 text-sm font-sans placeholder-stone-400 transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                        Your Inquiry / Message
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Detail your request or question here..."
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/20 bg-[var(--surface)] text-stone-800 text-sm font-sans placeholder-stone-400 transition-all outline-none resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-950 text-[var(--btn-primary-fg)] text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="h-4 w-4 rounded-full border-2 border-stone-400 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 size={48} className="text-[var(--gold)]" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif font-light text-stone-900 text-2xl tracking-tight">
                      Message Sent
                    </h3>
                    <p className="text-sm text-stone-600 font-sans font-light max-w-sm mx-auto leading-relaxed">
                      Thank you for reaching out! Your message has been received, and we will get back to you shortly at the email provided.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setSuccess(false);
                        onClose();
                      }}
                      className="px-6 py-2 rounded-full border border-stone-300 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
