import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Users,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Crown,
  Calendar,
  Phone,
  Mail,
  User,
  Eye,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Ban,
  Check,
  X,
  CreditCard,
  Package,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total_users: 0,
    total_normal: 0,
    total_members: 0,
    new_7d: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [accountType, setAccountType] = useState(''); // '' | 'NORMAL' | 'MEMBER'
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'ACTIVE' | 'SUSPENDED'
  const [page, setPage] = useState(1);
  const limit = 15;

  // Inspect Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (page - 1) * limit,
        limit,
      };
      if (search.trim()) params.search = search.trim();
      if (accountType) params.account_type = accountType;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/users', { params });
      const data = res.data || res;
      setUsers(data.items || []);
      setTotal(data.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching registered users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, accountType, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleInspectUser = async (userId) => {
    setInspectModalOpen(true);
    setDetailLoading(true);
    setSelectedUser(null);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data || res);
    } catch (err) {
      console.error('Error inspecting user:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active;
    const confirmMsg = newStatus
      ? `Activate account for ${user.full_name}?`
      : `Suspend account for ${user.full_name}? They will not be able to log in.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setStatusUpdating(true);
      await api.patch(`/admin/users/${user.id || user._id}/status`, {
        is_active: newStatus,
      });

      // Update in local list
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
      );
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, is_active: newStatus });
      }
    } catch (err) {
      alert('Failed to update user status: ' + (err.response?.data?.detail || err.message));
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-600" />
            <span>Registered Customers &amp; Users</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Authoritative directory separating free shopping accounts from active VIP membership holders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/memberships">
            <Button variant="outline" rightIcon={<ShieldCheck className="w-4 h-4 text-amber-600" />}>
              VIP Memberships Console
            </Button>
          </Link>
          <Button variant="ghost" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.total_users}</div>
            <div className="text-xs font-medium text-slate-500">Total Registered</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.total_normal}</div>
            <div className="text-xs font-medium text-slate-500">Normal Users (Free)</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600">{stats.total_members}</div>
            <div className="text-xs font-medium text-slate-500">VIP Athlete Members</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-600">{stats.new_7d}</div>
            <div className="text-xs font-medium text-slate-500">Joined Last 7 Days</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Toolbar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Account Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/60 w-fit">
            <button
              type="button"
              onClick={() => {
                setAccountType('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                accountType === ''
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Users ({stats.total_users})
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountType('NORMAL');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                accountType === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Normal Users ({stats.total_normal})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountType('MEMBER');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                accountType === 'MEMBER'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>VIP Members ({stats.total_members})</span>
            </button>
          </div>

          {/* Search & Status Filter */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search name, mobile, email, or referral code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>

            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Users Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Account Tier</th>
                <th className="py-3.5 px-4">Membership Card</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
                    <span>Loading registered users...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No users found matching your filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or tab selection.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isMember = u.has_membership || u.account_type === 'VIP Member';
                  const initial = u.full_name ? u.full_name[0].toUpperCase() : 'U';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isMember
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isMember && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                              ID: {u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          {u.email && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[170px]">{u.email}</span>
                            </div>
                          )}
                          {u.mobile && (
                            <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{u.mobile}</span>
                            </div>
                          )}
                          {!u.email && !u.mobile && <span className="text-slate-400">—</span>}
                        </div>
                      </td>

                      {/* Account Tier Badge */}
                      <td className="py-3.5 px-4">
                        {isMember ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
                            <Crown className="w-3.5 h-3.5 text-amber-600" />
                            <span>VIP Member</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                            <span>Normal User</span>
                          </span>
                        )}
                      </td>

                      {/* Membership Card */}
                      <td className="py-3.5 px-4">
                        {isMember && u.membership?.card_number ? (
                          <div>
                            <div className="font-mono font-bold text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                              {u.membership.card_number}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Valid: {formatDate(u.membership.valid_till)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No Membership Pass</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.is_active ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{u.is_active ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInspectUser(u.id)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Inspect
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              u.is_active
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.is_active ? 'Suspend Account' : 'Activate Account'}
                          >
                            {u.is_active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{users.length}</span> of{' '}
            <span className="font-bold text-slate-800">{total}</span> customers (Page {page} of{' '}
            {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Customer Inspection Modal */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setInspectModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading ? (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
                <p>Loading customer profile...</p>
              </div>
            ) : selectedUser ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                      selectedUser.has_membership
                        ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-2 border-slate-200'
                    }`}
                  >
                    {selectedUser.full_name ? selectedUser.full_name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span>{selectedUser.full_name}</span>
                      {selectedUser.has_membership ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                          <span>VIP Member</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Normal User
                        </span>
                      )}
                    </h2>
                    <p className="text-xs font-mono text-slate-400">ID: {selectedUser.id}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Contact Details
                    </div>
                    <div className="text-xs text-slate-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{selectedUser.email || 'No email provided'}</span>
                    </div>
                    <div className="text-xs text-slate-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedUser.mobile || 'No mobile provided'}</span>
                    </div>
                    <div className="text-xs text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Registered on {formatDate(selectedUser.created_at)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Membership &amp; Wallet
                    </div>
                    <div className="text-xs text-slate-700 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>
                        Card: {selectedUser.membership?.card_number || 'None (Free Tier)'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span>
                        Wallet Balance: ₹{selectedUser.wallet?.balance_inr?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>Orders Placed: {selectedUser.orders_summary?.total_orders || 0}</span>
                    </div>
                  </div>
                </div>

                {/* VIP Membership Card Details if Active */}
                {selectedUser.has_membership && selectedUser.membership && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span>Active VIP Membership Pass</span>
                      </span>
                      <span className="text-xs font-bold font-mono text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
                        {selectedUser.membership.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-amber-950">
                      <div>
                        Card Number: <strong>{selectedUser.membership.card_number}</strong>
                      </div>
                      <div>
                        Plan: <strong>{selectedUser.membership.plan_name}</strong>
                      </div>
                      <div>
                        Activated: <strong>{formatDate(selectedUser.membership.activated_at)}</strong>
                      </div>
                      <div>
                        Valid Till: <strong>{formatDate(selectedUser.membership.valid_till)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Orders Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Recent Orders ({selectedUser.orders_summary?.total_orders || 0})
                  </h3>
                  {selectedUser.orders_summary?.recent?.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {selectedUser.orders_summary.recent.map((ord) => (
                        <div key={ord.id} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-800">
                              #{ord.order_number}
                            </span>
                            <span className="text-slate-400 ml-2">{formatDate(ord.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800">₹{ord.total_amount}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-xl">
                      No orders placed yet.
                    </p>
                  )}
                </div>

                {/* Action Bar in Modal */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedUser)}
                    disabled={statusUpdating}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedUser.is_active
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {selectedUser.is_active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    <span>{selectedUser.is_active ? 'Suspend Account' : 'Activate Account'}</span>
                  </button>

                  <Button variant="secondary" onClick={() => setInspectModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-10">Unable to load customer details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
