import { useState, useEffect } from 'react';
import { LogIn, Download, Trash2, Plus, Link, Settings, Users, ArrowLeft } from 'lucide-react';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('rsvps');
  const [rsvps, setRsvps] = useState([]);
  const [invites, setInvites] = useState([]);
  const [settings, setSettings] = useState({});
  const [newInvite, setNewInvite] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  const headers = { 'x-admin-password': password, 'Content-Type': 'application/json' };

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/rsvps', { headers: { 'x-admin-password': password } });
      if (!res.ok) throw new Error();
      setAuthed(true);
      setAuthError('');
    } catch {
      setAuthError('Invalid password');
    }
  };

  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/rsvps', { headers }).then(r => r.json()).then(setRsvps);
    fetch('/api/admin/invites', { headers }).then(r => r.json()).then(setInvites);
    fetch('/api/admin/settings', { headers }).then(r => r.json()).then(setSettings);
  }, [authed]);

  const deleteRsvp = async (id) => {
    await fetch(`/api/admin/rsvps/${id}`, { method: 'DELETE', headers });
    setRsvps(r => r.filter(x => x.id !== id));
  };

  const saveSettings = async () => {
    setSaving(true);
    await fetch('/api/admin/settings', { method: 'PUT', headers, body: JSON.stringify(settings) });
    setSaving(false);
  };

  const createInvite = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/invites', { method: 'POST', headers, body: JSON.stringify(newInvite) });
    const inv = await res.json();
    setInvites(i => [inv, ...i]);
    setNewInvite({ name: '', email: '' });
  };

  const exportCsv = () => {
    window.open(`/api/admin/rsvps/csv?t=${Date.now()}`, '_blank');
  };

  const totalGuests = rsvps.filter(r => r.attending).reduce((s, r) => s + r.num_guests, 0);

  if (!authed) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <form onSubmit={login} className="bg-white rounded-2xl p-8 shadow-lg border border-gold/20 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-maroon/10 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-maroon" />
            </div>
            <h2 className="font-heading text-2xl text-maroon font-bold">Admin Panel</h2>
          </div>
          {authError && <p className="text-red-500 text-sm text-center mb-4">{authError}</p>}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-cream/50 mb-4"
          />
          <button type="submit" className="w-full py-3 rounded-lg bg-maroon text-white font-medium hover:bg-maroon-light transition-colors">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-maroon transition-colors"><ArrowLeft className="w-5 h-5" /></a>
            <h1 className="font-heading text-xl text-maroon font-bold">Wedding Admin</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{rsvps.filter(r => r.attending).length} attending</span>
            <span className="mx-1">·</span>
            <span>{totalGuests} total guests</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex">
          {[
            { id: 'rsvps', label: 'RSVPs', icon: <Users className="w-4 h-4" /> },
            { id: 'invites', label: 'Invites', icon: <Link className="w-4 h-4" /> },
            { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-maroon text-maroon' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* RSVPs Tab */}
        {tab === 'rsvps' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{rsvps.length} Responses</h2>
              <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />Export CSV
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Guests</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Message</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rsvps.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.full_name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.email}</td>
                      <td className="px-4 py-3 text-gray-500">{r.phone || '—'}</td>
                      <td className="px-4 py-3 text-center">{r.num_guests}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.attending ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.attending ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.message || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteRsvp(r.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rsvps.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No RSVPs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invites Tab */}
        {tab === 'invites' && (
          <div>
            <form onSubmit={createInvite} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-3">
              <input
                value={newInvite.name}
                onChange={e => setNewInvite(n => ({ ...n, name: e.target.value }))}
                placeholder="Guest name"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <input
                value={newInvite.email}
                onChange={e => setNewInvite(n => ({ ...n, email: e.target.value }))}
                placeholder="Guest email"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-maroon text-white text-sm rounded-lg hover:bg-maroon-light transition-colors">
                <Plus className="w-4 h-4" />Create Invite
              </button>
            </form>
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Invite Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invites.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{inv.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{inv.email || '—'}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded select-all">
                          {window.location.origin}/?invite={inv.id}
                        </code>
                      </td>
                    </tr>
                  ))}
                  {invites.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-400">No invites created yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
            <div className="space-y-4">
              {[
                { key: 'groom_name', label: 'Groom Name' },
                { key: 'bride_name', label: 'Bride Name' },
                { key: 'wedding_date', label: 'Wedding Date', type: 'date' },
                { key: 'wedding_time', label: 'Wedding Time' },
                { key: 'venue_name', label: 'Venue Name' },
                { key: 'venue_address', label: 'Venue Address' },
                { key: 'venue_lat', label: 'Latitude' },
                { key: 'venue_lng', label: 'Longitude' },
                { key: 'rsvp_deadline', label: 'RSVP Deadline', type: 'datetime-local' },
                { key: 'invitation_message', label: 'Invitation Message', textarea: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.textarea ? (
                    <textarea
                      value={settings[f.key] || ''}
                      onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm resize-none"
                    />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={settings[f.key] || ''}
                      onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-3 bg-maroon text-white rounded-lg font-medium hover:bg-maroon-light transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
