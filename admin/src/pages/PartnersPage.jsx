import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { get, patch, post } from '../services/api';

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [commModalOpen, setCommModalOpen] = useState(false);

  // Status form
  const [targetStatus, setTargetStatus] = useState('ACTIVE');
  const [customCommRate, setCustomCommRate] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  // Settlement form
  const [settleAmount, setSettleAmount] = useState('');
  const [settleRef, setSettleRef] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  // Manual Commission form
  const [bookingAmount, setBookingAmount] = useState('');
  const [bookingSourceId, setBookingSourceId] = useState('');
  const [bookingType, setBookingType] = useState('BOOKING');

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      let url = '/partners/admin/list?limit=100';
      if (statusFilter) url += `&status_filter=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await get(url);
      setPartners(res?.items || []);
    } catch (err) {
      console.error('Failed to load partners', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPartners();
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setActionLoading(true);
    try {
      await patch(`/partners/admin/${selectedPartner.id}/status`, {
        status: targetStatus,
        commission_rate_percent: customCommRate ? parseFloat(customCommRate) : null,
        notes: statusNotes || undefined,
      });
      setFeedbackMsg({ type: 'success', text: `Partner status updated to ${targetStatus}` });
      setStatusModalOpen(false);
      fetchPartners();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err?.response?.data?.detail || 'Failed to update partner status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteSettlement = async (e) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setActionLoading(true);
    try {
      const amtPaise = Math.round(parseFloat(settleAmount) * 100);
      await post(`/partners/admin/${selectedPartner.id}/settlement`, {
        amount_paise: amtPaise,
        payment_reference: settleRef,
        notes: settleNotes || undefined,
      });
      setFeedbackMsg({ type: 'success', text: `Settlement of ₹${settleAmount} recorded successfully!` });
      setSettleModalOpen(false);
      fetchPartners();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err?.response?.data?.detail || 'Settlement failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordCommission = async (e) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setActionLoading(true);
    try {
      const amtPaise = Math.round(parseFloat(bookingAmount) * 100);
      await post(
        `/partners/admin/${selectedPartner.id}/commission?gross_amount_paise=${amtPaise}&source_id=${encodeURIComponent(bookingSourceId)}&source_type=${bookingType}`,
        {}
      );
      setFeedbackMsg({ type: 'success', text: `Commission of eligible booking credited to partner!` });
      setCommModalOpen(false);
      fetchPartners();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err?.response?.data?.detail || 'Failed to record commission' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge variant="neutral">Suspended</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Offline Partners & Ecosystem</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage partner sports hostels, dormitories, physio clinics, commissions, and payouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchPartners} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex justify-between items-center ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold text-xs ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white/70 backdrop-blur-sm shadow-sm border border-slate-200/80">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {['', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === '' ? 'ALL PARTNERS' : st}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name, city, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full md:w-64"
            />
            <Button type="submit" size="sm" variant="secondary">
              Search
            </Button>
          </form>
        </div>
      </Card>

      {/* Partners Table */}
      <Card className="overflow-hidden shadow-sm border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Business Name</th>
                <th className="px-6 py-3.5">Type & Location</th>
                <th className="px-6 py-3.5">Contact</th>
                <th className="px-6 py-3.5">Commission Rate</th>
                <th className="px-6 py-3.5">Pending Payout</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    Loading partner directory...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No partners found matching the selected filter.
                  </td>
                </tr>
              ) : (
                partners.map((p) => {
                  const pendingRupees = (p.pending_payout_paise || 0) / 100;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {p.business_name}
                        <div className="text-xs font-normal text-slate-400 font-mono mt-0.5">{p.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{p.business_type}</span>
                        <div className="text-xs text-slate-500">
                          {p.city}, {p.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium">{p.contact_person}</div>
                        <div className="text-xs text-slate-500">{p.email}</div>
                        <div className="text-xs text-slate-500">{p.phone}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-700">
                        {p.commission_rate_percent}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 font-mono">₹{pendingRupees.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">
                          Settled: ₹{((p.total_settled_paise || 0) / 100).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedPartner(p);
                            setTargetStatus(p.status);
                            setCustomCommRate(p.commission_rate_percent || '');
                            setStatusModalOpen(true);
                          }}
                        >
                          Status
                        </Button>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => {
                            setSelectedPartner(p);
                            setSettleAmount(pendingRupees > 0 ? pendingRupees.toFixed(2) : '');
                            setSettleModalOpen(true);
                          }}
                          disabled={pendingRupees <= 0}
                        >
                          Payout
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setSelectedPartner(p);
                            setBookingSourceId(`BKG-${Date.now().toString().slice(-6)}`);
                            setCommModalOpen(true);
                          }}
                        >
                          + Commission
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Update Partner Status */}
      {statusModalOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full p-6 bg-white space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Manage Partner Status: {selectedPartner.business_name}
            </h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Approved & Live)</option>
                  <option value="PENDING">PENDING (Under Review)</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Commission Percentage (%)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={customCommRate}
                  onChange={(e) => setCustomCommRate(e.target.value)}
                  placeholder="e.g. 15.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Reason</label>
                <textarea
                  rows="3"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Operational notes or verification details..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setStatusModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Status'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal 2: Payout Settlement */}
      {settleModalOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full p-6 bg-white space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Record Payout Settlement</h3>
            <p className="text-xs text-slate-500">
              Partner: <span className="font-semibold text-slate-800">{selectedPartner.business_name}</span> |
              Available Pending: <span className="font-bold text-amber-600 font-mono">₹{((selectedPartner.pending_payout_paise || 0) / 100).toFixed(2)}</span>
            </p>
            <form onSubmit={handleExecuteSettlement} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Settlement Amount (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  max={(selectedPartner.pending_payout_paise || 0) / 100}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Bank / UPI / NEFT Transaction Reference
                </label>
                <Input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g. UTR-20261025-998811"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
                <Input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Monthly settlement cycle..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSettleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Confirm Payout'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal 3: Record Manual Commission */}
      {commModalOpen && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full p-6 bg-white space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Record Transaction Commission</h3>
            <p className="text-xs text-slate-500">
              Partner: <span className="font-semibold text-slate-800">{selectedPartner.business_name}</span> (Rate: {selectedPartner.commission_rate_percent}%)
            </p>
            <form onSubmit={handleRecordCommission} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Source Type</label>
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="BOOKING">DORMITORY / BED BOOKING</option>
                  <option value="PHYSIO">PHYSIOTHERAPY SESSION</option>
                  <option value="REFERRAL">CUSTOMER REFERRAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Gross Booking / Fee Amount (₹)
                </label>
                <Input
                  type="number"
                  step="1"
                  min="10"
                  value={bookingAmount}
                  onChange={(e) => setBookingAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Booking / Order Identifier
                </label>
                <Input
                  type="text"
                  value={bookingSourceId}
                  onChange={(e) => setBookingSourceId(e.target.value)}
                  placeholder="BKG-992812"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCommModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Recording...' : 'Credit Commission'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
