import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Users, UserPlus, Trash2, Shield, Key, AlertTriangle, Database } from 'lucide-react';

export function UsersTab() {
  const { users, currentUser, createUser, deleteUser } = useAuth();
  const { clearMockData, products, batches, sales } = useStore();

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Administrator');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newUsername.trim()) {
      setErrorMsg('Username is required.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setIsSubmittingUser(true);
    try {
      await createUser(newUsername, newPassword, newRole);
      setSuccessMsg(`User "${newUsername}" created successfully and synced securely.`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('Administrator');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create user.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        await deleteUser(userId);
        setSuccessMsg(`User "${username}" deleted successfully.`);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to delete user.');
      }
    }
  };

  const handleClearMockData = () => {
    clearMockData();
    setIsConfirmingClear(false);
    alert('Database has been completely cleared. You now have a blank slate!');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="font-display text-2xl text-stone-900 font-normal">Users & System Control</h2>
        <p className="text-sm text-stone-500">Manage administrator logins and configure system databases.</p>
      </div>

      {errorMsg && <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-center gap-2"><AlertTriangle size={16} /><span>{errorMsg}</span></div>}
      {successMsg && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-800 flex items-center gap-2"><Shield size={16} className="text-emerald-600" /><span>{successMsg}</span></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-stone-900 border-b border-stone-100 pb-3"><Users size={18} className="text-amber-600" /><h3 className="font-medium text-lg">System Administrators</h3></div>
            <p className="text-xs text-stone-500">The following users have administrator access to this dashboard. Passwords are stored as hashes after the security migration.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold text-xs uppercase tracking-wider">
                    <th className="p-3">Username</th><th className="p-3">Role</th><th className="p-3">Password Status</th><th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map((u) => {
                    const isSelf = currentUser && currentUser.id === u.id;
                    const isOnlyUser = users.length === 1;
                    const isHashed = typeof u.password === 'string' && u.password.startsWith('sha256$');
                    return (
                      <tr key={u.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="p-3 font-medium text-stone-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{u.username}{isSelf && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold">You</span>}</td>
                        <td className="p-3 text-stone-600">{u.role}</td>
                        <td className="p-3 font-mono text-xs text-stone-500">{isHashed ? 'Hashed credential' : 'Will migrate on next login'}</td>
                        <td className="p-3 text-right"><button onClick={() => handleDeleteUser(u.id, u.username)} disabled={isOnlyUser} className={`p-1.5 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all ${isOnlyUser ? 'opacity-30 cursor-not-allowed' : ''}`} title={isOnlyUser ? 'Cannot delete the last admin' : 'Delete user'}><Trash2 size={16} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-stone-900 border-b border-stone-100 pb-3"><Database size={18} className="text-amber-600" /><h3 className="font-medium text-lg">Data & Clean Slate Utilities</h3></div>
            <p className="text-sm text-stone-600">Meticulously manage your system dataset. You can wipe products, batches, and recorded sales/requests to start with a fresh, clean slate.</p>
            <div className="p-5 border border-stone-200 rounded-lg bg-stone-50 flex flex-col justify-between space-y-4">
              <div className="space-y-1"><h4 className="font-semibold text-stone-900 text-sm flex items-center gap-1.5"><Trash2 size={15} className="text-red-600" />Wipe Database Slate</h4><p className="text-xs text-stone-500">Removes all products, purchase batches, and recorded sales logs from the store context.</p></div>
              <div className="pt-2">
                {!isConfirmingClear ? <button onClick={() => setIsConfirmingClear(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded shadow-sm transition-all uppercase tracking-wider font-sans">Clear Store Database</button> : (
                  <div className="space-y-3 bg-red-50 p-3 border border-red-200 rounded"><p className="text-xs text-red-900 font-semibold">Are you absolutely sure? This action is irreversible! All catalog items, batches, and sales will be lost.</p><div className="flex gap-2"><button onClick={handleClearMockData} className="px-3 py-1.5 bg-red-700 text-white font-semibold text-xs rounded hover:bg-red-800 transition">Yes, Wipe Everything</button><button onClick={() => setIsConfirmingClear(false)} className="px-3 py-1.5 bg-white border border-stone-300 text-stone-700 font-semibold text-xs rounded hover:bg-stone-50 transition">Cancel</button></div></div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center border-t border-stone-100 pt-4">
              <div><div className="text-xs text-stone-500 uppercase tracking-wider">Catalog Items</div><div className="font-semibold text-xl text-stone-900 font-mono mt-1">{products.length}</div></div>
              <div><div className="text-xs text-stone-500 uppercase tracking-wider">Batches</div><div className="font-semibold text-xl text-stone-900 font-mono mt-1">{batches.length}</div></div>
              <div><div className="text-xs text-stone-500 uppercase tracking-wider">Sales Records</div><div className="font-semibold text-xl text-stone-900 font-mono mt-1">{sales.length}</div></div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-stone-900 border-b border-stone-100 pb-3"><UserPlus size={18} className="text-amber-600" /><h3 className="font-medium text-lg">Create Administrator</h3></div>
            <p className="text-xs text-stone-500">Add a new login profile. The password will be hashed before storage.</p>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Username *</label><div className="relative"><Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="e.g. ana_finds" className="w-full text-sm text-stone-950 bg-white border border-stone-300 rounded-md py-2 pl-9 pr-3 outline-none focus:border-amber-500" /></div></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Password *</label><div className="relative"><Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter password" className="w-full text-sm text-stone-950 bg-white border border-stone-300 rounded-md py-2 pl-9 pr-3 outline-none focus:border-amber-500 font-mono" /></div></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Access Level / Role</label><select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full text-sm text-stone-950 bg-white border border-stone-300 rounded-md p-2 outline-none focus:border-amber-500"><option value="Administrator">Administrator (Full Access)</option><option value="Manager">Inventory Manager</option><option value="Viewer">Auditor / Read-Only</option></select></div>
              <button type="submit" disabled={isSubmittingUser} className="w-full mt-2 py-2.5 bg-stone-900 hover:bg-stone-850 text-white text-xs font-semibold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 shadow disabled:opacity-50"><UserPlus size={14} />{isSubmittingUser ? 'Creating...' : 'Create Admin Account'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
