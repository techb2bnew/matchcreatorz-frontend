'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import CustomSelect from '@/components/ui/CustomSelect';
import { formatDate } from '@/lib/utils';
import { sellerApi, adminConnectApi } from '@/lib/adminApi';
import { Spinner } from '@/components/ui/Loader';
import toast from 'react-hot-toast';

interface Seller { id: number; name: string; email: string }
interface Ledger {
  id: number;
  amount: number;
  type: string;
  note: string | null;
  balance_after: number | null;
  created_at: string;
}

const optLabel = (s: Seller) => `${s.name} (#${s.id})`;

export default function AdminConnectsPage() {
  const [sellers, setSellers]           = useState<Seller[]>([]);
  const [sellersLoading, setSL]         = useState(true);
  const [selectedId, setSelectedId]     = useState<number | null>(null);

  const [history, setHistory]           = useState<Ledger[]>([]);
  const [historyLoading, setHL]         = useState(false);

  // Add connects modal
  const [addModal, setAddModal]         = useState(false);
  const [addSellerId, setAddSellerId]   = useState<number | null>(null);
  const [addAmount, setAddAmount]       = useState('');
  const [addNote, setAddNote]           = useState('');
  const [adding, setAdding]             = useState(false);
  const [addErr, setAddErr]             = useState('');

  // -- Load sellers -----------------------------------------------------
  useEffect(() => {
    setSL(true);
    sellerApi.list({ page: 1, limit: 100 })
      .then((json) => {
        const rows: Seller[] = (json.data || []).map((s: { id: number; name: string; email: string }) => ({ id: s.id, name: s.name, email: s.email }));
        setSellers(rows);
        if (rows.length) setSelectedId((id) => id ?? rows[0].id);
      })
      .catch((e) => toast.error(e?.message || 'Failed to load sellers'))
      .finally(() => setSL(false));
  }, []);

  // -- Load history for selected seller ---------------------------------
  const loadHistory = useCallback(async (sellerId: number) => {
    setHL(true);
    try {
      const res = await adminConnectApi.history(sellerId, { limit: 50 });
      setHistory(res.data || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load history');
      setHistory([]);
    } finally {
      setHL(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId != null) loadHistory(selectedId);
  }, [selectedId, loadHistory]);

  const selectedSeller = sellers.find((s) => s.id === selectedId) || null;

  const openAdd = () => {
    setAddSellerId(selectedId ?? (sellers[0]?.id ?? null));
    setAddAmount('');
    setAddNote('');
    setAddErr('');
    setAddModal(true);
  };

  const handleAdd = async () => {
    if (!addSellerId)                              return setAddErr('Please select a seller');
    if (!addAmount || Number(addAmount) === 0)     return setAddErr('Enter a non-zero amount');
    setAddErr('');
    setAdding(true);
    try {
      await adminConnectApi.add(addSellerId, { amount: Number(addAmount), note: addNote.trim() || undefined });
      toast.success('Connects added');
      setAddModal(false);
      // If we added to the currently viewed seller, refresh; otherwise switch to that seller
      if (addSellerId === selectedId) loadHistory(addSellerId);
      else setSelectedId(addSellerId);
    } catch (e: unknown) {
      setAddErr(e instanceof Error ? e.message : 'Failed to add connects');
    } finally {
      setAdding(false);
    }
  };

  return (
    <DashboardLayout role="ADMIN" title="Connects">
      {/* Seller selector + add */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="w-72">
          {sellersLoading ? (
            <div className="h-11 rounded-xl bg-gray-100 animate-pulse" />
          ) : sellers.length === 0 ? (
            <p className="text-sm text-gray-400">No sellers found</p>
          ) : (
            <CustomSelect
              label="Select Seller"
              leftIcon="fa-user"
              value={selectedSeller ? optLabel(selectedSeller) : ''}
              onChange={(v) => {
                const found = sellers.find((s) => optLabel(s) === v);
                if (found) setSelectedId(found.id);
              }}
              options={sellers.map(optLabel)}
            />
          )}
        </div>
        <button
          onClick={openAdd}
          disabled={sellers.length === 0}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-50"
        >
          <i className="fa fa-plus text-xs" /> Add Connects
        </button>
      </div>

      {/* History */}
      <Card padding="none">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <CardTitle>{selectedSeller ? `${selectedSeller.name} — Connect History` : 'Connect History'}</CardTitle>
        </div>
        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="flex items-center justify-center py-14"><Spinner size="lg" /></div>
          ) : !selectedSeller ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <i className="fa fa-user text-2xl mb-2" />
              <p className="text-sm">Select a seller to view their connect history</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <i className="fa fa-link text-2xl mb-2" />
              <p className="text-sm">No connect activity for this seller</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Seller', 'Type', 'Connects', 'Balance After', 'Note', 'Date'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((h) => {
                  const credit = Number(h.amount) >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={selectedSeller.name} size="sm" />
                          <span className="font-medium text-gray-900">{selectedSeller.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 capitalize">
                          {h.type || '--'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${credit ? 'text-green-600' : 'text-red-500'}`}>
                          {credit ? '+' : '-'}{Math.abs(Number(h.amount))}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{h.balance_after ?? '--'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs italic">{h.note || '--'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(h.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* -- Add Connects Modal ------------------------------- */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Connects to Seller" size="sm">
        <div className="space-y-4">
          <CustomSelect
            label="Select Seller"
            leftIcon="fa-user"
            value={(() => { const s = sellers.find((x) => x.id === addSellerId); return s ? optLabel(s) : ''; })()}
            onChange={(v) => {
              const found = sellers.find((s) => optLabel(s) === v);
              if (found) setAddSellerId(found.id);
            }}
            options={sellers.map(optLabel)}
          />
          <Input
            label="Number of Connects"
            type="number"
            placeholder="e.g. 50 (use a negative value to deduct)"
            leftIcon={<i className="fa fa-link text-sm" />}
            value={addAmount}
            onChange={(e) => { setAddAmount(e.target.value); setAddErr(''); }}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Note (optional)</label>
            <textarea
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#e84545] focus:ring-2 focus:ring-[#e84545]/20 resize-none h-20 transition"
              placeholder="Reason for adding connects..."
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
            />
          </div>
          {addErr && <p className="text-xs text-red-500">{addErr}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setAddModal(false)} disabled={adding}>Cancel</Button>
            <Button fullWidth onClick={handleAdd} loading={adding}>
              <i className="fa fa-plus mr-1.5" /> Add Connects
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
