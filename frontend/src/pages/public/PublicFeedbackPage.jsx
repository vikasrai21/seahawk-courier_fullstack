import { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PublicFeedbackPage() {
  const { token } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({ rating: 0, deliveryRating: 0, packagingRating: 0, communicationRating: 0, comment: '', respondentName: '', issues: [] });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useState(() => {
    (async () => {
      try {
        const res = await fetch(`/api/features/feedback/${token}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setFeedback(data.data);
        if (data.data.submittedAt) setSubmitted(true);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const submit = async () => {
    try {
      const res = await fetch(`/api/features/feedback/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSubmitted(true);
    } catch (e) { setError(e.message); }
  };

  const StarRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex gap-1">{[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => onChange(s)} className={`text-2xl transition-all ${s <= value ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-600'}`}>★</button>
      ))}</div>
    </div>
  );

  const issues = ['LATE_DELIVERY', 'DAMAGED', 'WRONG_ITEM', 'RUDE_AGENT', 'OTHER'];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="card max-w-md p-8 text-center"><div className="text-4xl mb-4">😔</div><h2 className="text-xl font-bold text-slate-900">Survey Unavailable</h2><p className="text-sm text-slate-500 mt-2">{error}</p></div></div>;
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="card max-w-md p-8 text-center animate-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-slate-900">Thank You!</h2>
        <p className="text-sm text-slate-500 mt-2">Your feedback helps us improve our delivery service.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-6 sm:p-8 animate-in">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📦</div>
          <h1 className="text-xl font-black text-slate-900">How was your delivery?</h1>
          <p className="text-sm text-slate-500 mt-1">AWB: <span className="font-mono font-bold">{feedback?.awb}</span></p>
        </div>

        <StarRow label="Overall Experience" value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
        <StarRow label="Delivery Speed" value={form.deliveryRating} onChange={v => setForm(p => ({ ...p, deliveryRating: v }))} />
        <StarRow label="Packaging Quality" value={form.packagingRating} onChange={v => setForm(p => ({ ...p, packagingRating: v }))} />
        <StarRow label="Communication" value={form.communicationRating} onChange={v => setForm(p => ({ ...p, communicationRating: v }))} />

        <div className="mt-4">
          <label className="label">Any Issues?</label>
          <div className="flex flex-wrap gap-2">
            {issues.map(issue => (
              <button key={issue} onClick={() => setForm(p => ({ ...p, issues: p.issues.includes(issue) ? p.issues.filter(i => i !== issue) : [...p.issues, issue] }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${form.issues.includes(issue) ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {issue.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Comments (optional)</label>
          <textarea className="input min-h-[80px]" value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="Tell us more..." />
        </div>

        <button className="btn-primary w-full mt-6" onClick={submit} disabled={form.rating === 0}>Submit Feedback</button>
      </div>
    </div>
  );
}
