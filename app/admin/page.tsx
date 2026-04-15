'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Submission {
  id: string;
  status: string;
  created_at: string;
  pdf_url: string;
  type: 'bgc' | 'dd214' | 'cert';
}

type AdminTab =
  | 'users'
  | 'bgc-queue'
  | 'certs-queue'
  | 'revenue'
  | 'refunds'
  | 'loads'
  | 'sms-blast'
  | 'settings'
  | 'verification-queue'
  | 'sponsored-zones'
  | 'disputes'
  | 'flags-reports';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('verification-queue');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'bgc-queue' || activeTab === 'certs-queue' || activeTab === 'verification-queue') {
      fetchSubmissions();
    }
  }, [activeTab]);

  async function fetchSubmissions() {
    setLoading(true);
    const typeFilter =
      activeTab === 'bgc-queue'
        ? ['bgc']
        : activeTab === 'certs-queue'
        ? ['cert']
        : ['bgc', 'dd214', 'cert'];

    const { data } = await supabase
      .from('submissions')
      .select('*')
      .in('type', typeFilter)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setSubmissions(data || []);
    setLoading(false);
  }

  async function handleAction(id: string, action: 'approve' | 'deny', type: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/webhook/${type === 'bgc' ? 'bgc' : type === 'dd214' ? 'dd214-submit' : 'cert-upload'}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Submission ${action}d successfully!`);
        fetchSubmissions();
      } else {
        alert(data.error || `Failed to ${action} submission`);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingId(null);
  }

  const NAV_TABS: { key: AdminTab; label: string }[] = [
    { key: 'users',              label: 'Users' },
    { key: 'bgc-queue',         label: 'BGC Queue' },
    { key: 'certs-queue',       label: 'Certs Queue' },
    { key: 'verification-queue',label: 'Verification Queue' },
    { key: 'sponsored-zones',   label: 'Sponsored Zones' },
    { key: 'disputes',          label: 'Disputes' },
    { key: 'flags-reports',     label: 'Flags / Reports' },
    { key: 'revenue',           label: 'Revenue' },
    { key: 'refunds',           label: 'Refunds' },
    { key: 'loads',             label: 'Loads' },
    { key: 'sms-blast',         label: 'SMS Blast' },
    { key: 'settings',          label: 'Settings' },
  ];

  function renderContent() {
    if (activeTab === 'bgc-queue' || activeTab === 'certs-queue' || activeTab === 'verification-queue') {
      if (loading) return <div className="p-8 text-center text-lg">Loading submissions...</div>;
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-6">
            {activeTab === 'bgc-queue' && 'BGC Queue'}
            {activeTab === 'certs-queue' && 'Certs Queue'}
            {activeTab === 'verification-queue' && 'Verification Queue (BGC + DD-214)'}
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700 text-left">
                <th className="pb-3 text-zinc-400 font-medium">ID</th>
                <th className="pb-3 text-zinc-400 font-medium">Type</th>
                <th className="pb-3 text-zinc-400 font-medium">Submitted</th>
                <th className="pb-3 text-zinc-400 font-medium">Document</th>
                <th className="pb-3 text-zinc-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-zinc-800 py-3">
                  <td className="py-3 text-zinc-300 text-sm font-mono">{s.id.slice(0, 8)}…</td>
                  <td className="py-3">
                    <span className="bg-zinc-700 text-xs px-2 py-1 rounded uppercase font-bold">{s.type}</span>
                  </td>
                  <td className="py-3 text-zinc-400 text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <a href={s.pdf_url} target="_blank" rel="noopener noreferrer"
                       className="text-orange-400 hover:text-orange-300 text-sm underline">
                      View PDF
                    </a>
                  </td>
                  <td className="py-3 flex gap-2">
                    <button
                      onClick={() => handleAction(s.id, 'approve', s.type)}
                      disabled={loadingId === s.id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                    >
                      {loadingId === s.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(s.id, 'deny', s.type)}
                      disabled={loadingId === s.id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                    >
                      {loadingId === s.id ? 'Processing...' : 'Deny'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {submissions.length === 0 && (
            <p className="text-center text-gray-400 py-16 text-lg">No pending submissions found.</p>
          )}
        </div>
      );
    }

    if (activeTab === 'users') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <p className="text-zinc-400">User management coming soon.</p>
        </div>
      );
    }

    if (activeTab === 'sponsored-zones') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Sponsored Zones</h2>
          <p className="text-zinc-400">Manage active sponsored zones — assign, expire, or revoke zone sponsorships.</p>
        </div>
      );
    }

    if (activeTab === 'disputes') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Disputes</h2>
          <p className="text-zinc-400">No open disputes at this time.</p>
        </div>
      );
    }

    if (activeTab === 'flags-reports') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Flags / Reports</h2>
          <p className="text-zinc-400">No active user reports at this time.</p>
        </div>
      );
    }

    if (activeTab === 'revenue') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Revenue</h2>
          <p className="text-zinc-400">Revenue analytics coming soon.</p>
        </div>
      );
    }

    if (activeTab === 'refunds') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Refunds</h2>
          <p className="text-zinc-400">No pending refund requests.</p>
        </div>
      );
    }

    if (activeTab === 'loads') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Loads</h2>
          <p className="text-zinc-400">Load management coming soon.</p>
        </div>
      );
    }

    if (activeTab === 'sms-blast') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">SMS Blast</h2>
          <p className="text-zinc-400">SMS broadcast tools coming soon.</p>
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Settings</h2>
          <p className="text-zinc-400">Admin settings coming soon.</p>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {NAV_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === key
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
}
