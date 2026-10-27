import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, ShieldCheck, ArrowRight, Search, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function UsersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        const res = await api.get('/admin/membership/members', { params: { limit: 5 } });
        const data = res.data || res;
        setMembers(data.items || []);
      } catch (e) {
        console.error('Error fetching member preview:', e);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" /> Registered Users & Members
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage student athletes, regular members, defense accounts, and active club subscribers.
          </p>
        </div>
        <Link to="/memberships">
          <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Go to Memberships Console
          </Button>
        </Link>
      </div>

      {/* Featured Banner for Membership System */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base">Dynamic Membership System Active</h3>
            <p className="text-xs text-amber-100 mt-0.5">
              Admin-controlled pricing, duration, and verified Razorpay payment activations.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/memberships">
            <button className="px-4 py-2 rounded-lg bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition-colors shadow">
              View Members Directory
            </button>
          </Link>
          <Link to="/settings">
            <button className="px-4 py-2 rounded-lg bg-black/20 hover:bg-black/30 text-white font-semibold text-xs transition-colors">
              Pricing Settings
            </button>
          </Link>
        </div>
      </div>

      {/* Quick Preview Table of Recent Memberships */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Recent Club Memberships</h2>
          <Link to="/memberships" className="text-xs font-semibold text-primary-600 hover:underline">
            View All →
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 py-6 text-center">Loading recent members...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No active members recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono font-medium text-slate-800">
                    {m.card_number || 'BC-MEMBER'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {m.user_info?.name || m.user_info?.email || m.user_id}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      m.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {m.status === 'ACTIVE' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {m.status}
                  </span>
                  <Link to="/memberships">
                    <Button variant="ghost" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
