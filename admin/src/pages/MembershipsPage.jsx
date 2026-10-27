import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  User,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Eye,
  Settings,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function MembershipsPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const [selectedMember, setSelectedMember] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (page - 1) * limit,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/membership/members', { params });
      const data = res.data || res;
      setMembers(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load memberships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleViewDetail = async (memberId) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const res = await api.get(`/admin/membership/members/${memberId}`);
      setSelectedMember(res.data || res);
    } catch (err) {
      setDetailError(err.response?.data?.detail || 'Failed to load membership details');
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-amber-500" />
            Membership Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Authoritative customer membership directory, validity tracking, and verified payment history.
          </p>
        </div>
        <Link to="/settings">
          <Button variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
            Configure Membership Rules
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by mobile, email, or card number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm bg-white text-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="EXPIRED">Expired Only</option>
            </select>

            <Button type="submit" variant="primary" size="sm">
              Filter
            </Button>
            {(search || statusFilter) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Directory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Card / Member</th>
                <th className="py-3 px-4">Customer Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Active Period</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                    Loading memberships...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No membership records found matching query.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isActive = m.status === 'ACTIVE';
                  const validTill = m.valid_till ? new Date(m.valid_till) : null;
                  const validFrom = m.valid_from ? new Date(m.valid_from) : null;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{m.card_number || 'BC-MEMBER'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-medium">
                          {m.user_info?.name || m.user_info?.mobile || 'Customer'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {m.user_info?.email || m.user_info?.mobile || `ID: ${m.user_id?.slice(-8)}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>
                          {validFrom ? validFrom.toLocaleDateString() : 'N/A'} -{' '}
                          {validTill ? validTill.toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        {isActive ? (
                          <span className="text-emerald-700">{m.remaining_days} days left</span>
                        ) : (
                          <span className="text-slate-400">Expired</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewDetail(m.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {members.length} of {total} records
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Membership & Payment History</h3>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Card Summary */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-700 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-amber-200">
                    BIGCHAMP CLUB MEMBER
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-bold">
                    {selectedMember.status}
                  </span>
                </div>
                <div className="mt-4 font-mono text-xl tracking-widest font-black">
                  {selectedMember.card_number || 'BC-MEMBER'}
                </div>
                <div className="mt-4 flex justify-between text-xs text-amber-100">
                  <div>
                    <span className="opacity-75">Customer ID: </span>
                    <span className="font-mono">{selectedMember.user_id?.slice(-8)}</span>
                  </div>
                  <div>
                    <span className="opacity-75">Valid Till: </span>
                    <span className="font-semibold">
                      {selectedMember.valid_till
                        ? new Date(selectedMember.valid_till).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Duration Applied</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {selectedMember.applied_validity_days || 334} Days
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Price Paid</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    ₹{((selectedMember.applied_price_paise || 10000) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Config Version</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    v{selectedMember.applied_version || 1}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Period Start</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedMember.valid_from
                      ? new Date(selectedMember.valid_from).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Expiry (UTC Server)</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedMember.valid_till
                      ? new Date(selectedMember.valid_till).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Renewal Policy</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedMember.applied_renewal_policy || 'EXTEND_FROM_EXPIRY'}
                  </div>
                </div>
              </div>

              {/* Verified Purchase & Payment Records */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  Linked Verified Purchase & Payment Records
                </h4>
                {selectedMember.purchases && selectedMember.purchases.length > 0 ? (
                  <div className="space-y-2">
                    {selectedMember.purchases.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-mono font-medium text-slate-800">
                            Order: {p.provider_order_id || p.order_id || 'N/A'}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Payment ID: {p.provider_payment_id || 'PENDING'}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                          <div className="font-bold text-slate-900 mt-1">
                            ₹{((p.price_paise || 10000) / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No purchase records linked.</p>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                <span className="font-bold">Security Invariant:</span> Administrative manual status
                override is disabled. All memberships strictly require cryptographic Razorpay payment
                verification.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
