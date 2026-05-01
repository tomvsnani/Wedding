import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Heart, Edit3, RefreshCw } from 'lucide-react';

export default function RsvpForm({ event, invite }) {
  const deadline = new Date(event.rsvp_deadline);
  const isPastDeadline = new Date() > deadline;

  const [form, setForm] = useState({
    full_name: invite?.name || '',
    email: invite?.email || '',
    phone: '',
    num_guests: 1,
    attending: true,
    message: '',
    invite_id: invite?.id || '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Existing RSVP state
  const [existingRsvp, setExistingRsvp] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Check if email already has an RSVP
  const checkExisting = useCallback(async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLookingUp(true);
    try {
      const res = await fetch(`/api/rsvp/lookup?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.found) {
        setExistingRsvp(data.rsvp);
      } else {
        setExistingRsvp(null);
      }
    } catch {
      // ignore
    } finally {
      setLookingUp(false);
    }
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (form.attending && (form.num_guests < 1 || form.num_guests > 20)) errs.num_guests = 'Between 1-20';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Duplicate — show existing RSVP
        await checkExisting(form.email);
        setServerError('');
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!existingRsvp) return;
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch(`/api/rsvp/${existingRsvp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          num_guests: form.num_guests,
          attending: form.attending,
          message: form.message,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExistingRsvp(data.rsvp);
      setEditMode(false);
      setUpdateSuccess(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setForm(f => ({
      ...f,
      full_name: existingRsvp.full_name,
      num_guests: existingRsvp.num_guests,
      attending: !!existingRsvp.attending,
      message: existingRsvp.message || '',
      phone: existingRsvp.phone || '',
    }));
    setEditMode(true);
    setUpdateSuccess(false);
  };

  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  if (isPastDeadline) {
    return (
      <section id="rsvp" className="w-full py-20 md:py-28 bg-gradient-to-b from-cream-dark to-cream">
        <div className="section-container">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-white rounded-2xl p-12 md:p-16 shadow-lg border border-gold/20">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-maroon/10 flex items-center justify-center">
                <Heart className="w-8 h-8 text-maroon" />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl text-maroon font-bold mb-3">RSVP Closed</h3>
              <p className="text-gray-500 leading-relaxed">The RSVP deadline has passed. We look forward to celebrating with you!</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Already RSVPed — show status card
  if (existingRsvp && !editMode) {
    return (
      <section id="rsvp" className="w-full py-20 md:py-28 bg-gradient-to-b from-cream-dark to-cream">
        <div className="section-container">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
              <p className="text-gold tracking-[0.3em] uppercase text-xs md:text-sm mb-4">Your Response</p>
              <h2 className="font-heading text-4xl sm:text-5xl text-maroon font-bold">RSVP</h2>
              <div className="ornament"><span className="text-gold">✦</span></div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gold/20 corner-decor"
            >
              {updateSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Your RSVP has been updated successfully!
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${existingRsvp.attending ? 'bg-green-50' : 'bg-orange-50'}`}>
                  <CheckCircle className={`w-8 h-8 ${existingRsvp.attending ? 'text-green-500' : 'text-orange-500'}`} />
                </div>
                <h3 className="font-heading text-xl md:text-2xl text-maroon font-bold mb-1">{existingRsvp.full_name}</h3>
                <p className="text-gray-400 text-sm">{existingRsvp.email}</p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${existingRsvp.attending ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {existingRsvp.attending ? 'Joyfully Attending' : 'Regretfully Declined'}
                  </span>
                </div>
                {existingRsvp.attending ? (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">Number of Guests</span>
                    <span className="text-maroon font-heading text-lg font-semibold">{existingRsvp.num_guests}</span>
                  </div>
                ) : null}
                {existingRsvp.phone && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">Phone</span>
                    <span className="text-gray-700">{existingRsvp.phone}</span>
                  </div>
                )}
                {existingRsvp.message && (
                  <div className="py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500 font-medium block mb-1">Message</span>
                    <p className="text-gray-700 text-sm italic">&ldquo;{existingRsvp.message}&rdquo;</p>
                  </div>
                )}
              </div>

              <button
                onClick={startEditing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-gold-dark to-gold text-white font-heading text-lg font-semibold tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Edit3 className="w-5 h-5" />
                Update Your Response
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="rsvp" className="w-full py-20 md:py-28 bg-gradient-to-b from-cream-dark to-cream">
      <div className="section-container">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-12"
          >
            <p className="text-gold tracking-[0.3em] uppercase text-xs md:text-sm mb-4">{editMode ? 'Update Your Response' : 'Will You Join Us?'}</p>
            <h2 className="font-heading text-4xl sm:text-5xl text-maroon font-bold">RSVP</h2>
            <div className="ornament"><span className="text-gold">✦</span></div>
            <p className="text-sm text-gray-500 mt-2">
              Please respond by {deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-12 md:p-16 shadow-lg border border-gold/20 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
                </motion.div>
                <h3 className="font-heading text-2xl md:text-3xl text-maroon font-bold mb-3">Thank You!</h3>
                <p className="text-gray-600 leading-relaxed">
                  {form.attending
                    ? "We're thrilled you'll be joining us! See you at the celebration."
                    : "We'll miss you! Thank you for letting us know."}
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={editMode ? handleUpdate : handleSubmit}
                className="bg-white rounded-2xl p-8 md:p-10 shadow-lg border border-gold/20 corner-decor"
              >
                {serverError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                    {serverError}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Attending toggle */}
                  <div className="flex items-center justify-center gap-4 py-2">
                    <span className={`text-sm font-medium transition-colors ${!form.attending ? 'text-maroon' : 'text-gray-400'}`}>
                      Regretfully Decline
                    </span>
                    <button
                      type="button"
                      onClick={() => update('attending', !form.attending)}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${form.attending ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${form.attending ? 'translate-x-7' : ''}`} />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${form.attending ? 'text-green-600' : 'text-gray-400'}`}>
                      Joyfully Accept
                    </span>
                  </div>

                  {/* Name — disabled in edit mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={e => update('full_name', e.target.value)}
                      disabled={editMode}
                      className={`w-full px-4 py-3.5 rounded-xl border ${errors.full_name ? 'border-red-400' : 'border-gray-200'} bg-cream/50 font-body transition-all ${editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder="Your full name"
                    />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1.5">{errors.full_name}</p>}
                  </div>

                  {/* Email — disabled in edit mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      onBlur={e => !editMode && checkExisting(e.target.value)}
                      disabled={editMode}
                      className={`w-full px-4 py-3.5 rounded-xl border ${errors.email ? 'border-red-400' : 'border-gray-200'} bg-cream/50 font-body transition-all ${editMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                    {lookingUp && <p className="text-gold text-xs mt-1.5">Checking...</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-cream/50 font-body transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {/* Guests */}
                  {form.attending && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Guests (including yourself)</label>
                      <select
                        value={form.num_guests}
                        onChange={e => update('num_guests', parseInt(e.target.value))}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-cream/50 font-body transition-all"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                      {errors.num_guests && <p className="text-red-500 text-xs mt-1.5">{errors.num_guests}</p>}
                    </motion.div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message / Notes</label>
                    <textarea
                      value={form.message}
                      onChange={e => update('message', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-cream/50 font-body transition-all resize-none"
                      placeholder="Any dietary requirements or a message for the couple..."
                    />
                  </div>

                  {/* Submit / Update */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-maroon to-maroon-light text-white font-heading text-lg font-semibold tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : editMode ? (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Update RSVP
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send RSVP
                      </>
                    )}
                  </button>

                  {editMode && (
                    <button
                      type="button"
                      onClick={() => { setEditMode(false); setUpdateSuccess(false); }}
                      className="w-full py-3 text-sm text-gray-500 hover:text-maroon transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
