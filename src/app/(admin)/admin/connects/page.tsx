'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import CustomSelect from '@/components/ui/CustomSelect';
import SortableTh from '@/components/ui/SortableTh';
import { formatDate } from '@/lib/utils';
import { sellerApi, adminConnectApi } from '@/lib/adminApi';
import { Spinner } from '@/components/ui/Loader';
import toast from 'react-hot-toast';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface Seller { id: number; name: string; email: string }
interface Ledger {
  id: number;
  amount: number;
  type: string;
  note: string | null;
  balance_after: number | null;
  created_at: string;
  seller?: { id: number; name: string; email: string } | null;
}

const optLabel = (s: Seller) => `${s.name} (#${s.id})`;
const ALL_LABEL = 'All Sellers';

export default function AdminConnectsPage() {
  const [sellers, setSellers]           = useState<Seller[]>([]);
  const [sellersLoading, setSL]         = useState(true);
  const [sellerSearchLoading, setSSL]   = useState(false);
  const [selectedId, setSelectedId]     = useState<number | 'all' | null>(null);
  // Kept separately from `sellers` (the dropdown's current, backend-searched
  // candidate list) so the selected seller's display never breaks just
  // because a later search no longer includes them in the visible options.
  const [selectedSellerObj, setSelectedSellerObj] = useState<Seller | null>(null);
  const [addSellerObj, setAddSellerObj] = useState<Seller | null>(null);
  // Set once from the initial (unsearched) load — distinct from `sellers`,
  // which later reflects whatever a search matched (possibly zero results).
  const [noSellersAtAll, setNoSellersAtAll] = useState(false);

  const [history, setHistory]           = useState<Ledger[]>([]);
  const [historyLoading, setHL]         = useState(false);
  const [sortBy, setSortBy]             = useState('date');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

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
        setNoSellersAtAll(rows.length === 0);
        if (rows.length) {
          setSelectedId((id) => id ?? rows[0].id);
          setSelectedSellerObj((s) => s ?? rows[0]);
        }
      })
      .catch((e) => toast.error(e?.message || 'Failed to load sellers'))
      .finally(() => setSL(false));
  }, []);

  // -- Backend seller search for both pickers below (main selector + Add Connects modal) --
  const searchSellers = useCallback(async (query: string) => {
    setSSL(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: query ? 30 : 100 };
      if (query) params.search = query;
      const json = await sellerApi.list(params);
      const rows: Seller[] = (json.data || []).map((s: { id: number; name: string; email: string }) => ({ id: s.id, name: s.name, email: s.email }));
      setSellers(rows);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to search sellers');
    } finally {
      setSSL(false);
    }
  }, []);

  // -- Load history for the selected seller, or every seller combined ---
  const loadHistory = useCallback(async (target: number | 'all', silent = false) => {
    if (!silent) setHL(true);
    try {
      const res = target === 'all'
        ? await adminConnectApi.allHistory({ limit: 50 })
        : await adminConnectApi.history(target, { limit: 50 });
      setHistory(res.data || []);
    } catch (e: unknown) {
      if (!silent) {
        toast.error(e instanceof Error ? e.message : 'Failed to load history');
        setHistory([]);
      } else {
        console.error(e);
      }
    } finally {
      if (!silent) setHL(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId != null) loadHistory(selectedId);
  }, [selectedId, loadHistory]);

  useAutoRefresh(() => { if (selectedId != null) loadHistory(selectedId, true); }, 20000, !addModal);

  const selectedSeller = typeof selectedId === 'number' ? selectedSellerObj : null;
  const viewingAll = selectedId === 'all';

  const sortedHistory = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return history.slice().sort((a, b) => {
      switch (sortBy) {
        case 'type':
          return (a.type || '').localeCompare(b.type || '') * dir;
        case 'amount':
          return (Number(a.amount) - Number(b.amount)) * dir;
        case 'balance':
          return ((a.balance_after ?? 0) - (b.balance_after ?? 0)) * dir;
        case 'note':
          return (a.note || '').localeCompare(b.note || '') * dir;
        case 'date':
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
    });
  }, [history, sortBy, sortDir]);

  const openAdd = () => {
    const fallback = typeof selectedId === 'number' ? selectedSellerObj : (sellers[0] ?? null);
    setAddSellerId(fallback?.id ?? null);
    setAddSellerObj(fallback);
    setAddAmount('');
    setAddNote('');
    setAddErr('');
    setAddModal(true);
  };

  const handleAdd = async () => {
    if (!addSellerId)                              return setAddErr('Please select a seller');
    if (!addAmount || Number(addAmount) === 0)     return setAddErr('Enter a non-zero amount');
    if (Number(addAmount) < 0 && !addNote.trim())  return setAddErr('A note is required when deducting connects');
    setAddErr('');
    setAdding(true);
    try {
      await adminConnectApi.add(addSellerId, { amount: Number(addAmount), note: addNote.trim() || undefined });
      toast.success('Connects added');
      setAddModal(false);
      // If we added to the currently viewed seller, refresh; otherwise switch to that seller
      if (addSellerId === selectedId) {
        loadHistory(addSellerId);
      } else {
        setSelectedId(addSellerId);
        setSelectedSellerObj(addSellerObj);
      }
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
          ) : noSellersAtAll ? (
            <p className="text-sm text-gray-400">No sellers found</p>
          ) : (
            <CustomSelect
              label="Select Seller"
              leftIcon="fa-user"
              searchable
              externalFilter
              loading={sellerSearchLoading}
              onSearchChange={searchSellers}
              value={viewingAll ? ALL_LABEL : selectedSeller ? optLabel(selectedSeller) : ''}
              onChange={(v) => {
                if (v === ALL_LABEL) { setSelectedId('all'); return; }
                const found = sellers.find((s) => optLabel(s) === v);
                if (found) { setSelectedId(found.id); setSelectedSellerObj(found); }
              }}
              options={[ALL_LABEL, ...sellers.map(optLabel)]}
            />
          )}
        </div>
        <button
          onClick={openAdd}
          disabled={noSellersAtAll}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-[#e84545] text-white text-sm font-semibold hover:bg-[#c73333] transition shadow-sm disabled:opacity-50"
        >
          <i className="fa fa-plus text-xs" /> Add Connects
        </button>
      </div>

      {/* History */}
      <Card padding="none">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <CardTitle>{viewingAll ? 'All Sellers — Connect History' : selectedSeller ? `${selectedSeller.name} — Connect History` : 'Connect History'}</CardTitle>
        </div>
        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="flex items-center justify-center py-14"><Spinner size="lg" /></div>
          ) : !selectedSeller && !viewingAll ? (
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
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Seller</th>
                  <SortableTh label="Type" sortKey="type" activeKey={sortBy} direction={sortDir} onSort={handleSort} />
                  <SortableTh label="Connects" sortKey="amount" activeKey={sortBy} direction={sortDir} onSort={handleSort} />
                  <SortableTh label="Balance After" sortKey="balance" activeKey={sortBy} direction={sortDir} onSort={handleSort} />
                  <SortableTh label="Note" sortKey="note" activeKey={sortBy} direction={sortDir} onSort={handleSort} />
                  <SortableTh label="Date" sortKey="date" activeKey={sortBy} direction={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedHistory.map((h) => {
                  const credit = Number(h.amount) >= 0;
                  const rowSellerName = viewingAll ? (h.seller?.name || 'Unknown') : (selectedSeller?.name || '');
                  return (
                    <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={rowSellerName} size="sm" />
                          <span className="font-medium text-gray-900">{rowSellerName}</span>
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
            searchable
            externalFilter
            loading={sellerSearchLoading}
            onSearchChange={searchSellers}
            value={addSellerObj ? optLabel(addSellerObj) : ''}
            onChange={(v) => {
              const found = sellers.find((s) => optLabel(s) === v);
              if (found) { setAddSellerId(found.id); setAddSellerObj(found); }
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
          {Number(addAmount) < 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
              <i className="fa fa-exclamation-triangle mr-1.5" />
              This will deduct <strong>{Math.abs(Number(addAmount))}</strong> connects from this seller&apos;s balance. Please add a note explaining why.
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Note {Number(addAmount) < 0 ? '(required)' : '(optional)'}
            </label>
            <textarea
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#e84545] focus:ring-2 focus:ring-[#e84545]/20 resize-none h-20 transition"
              placeholder="Reason for adding or deducting connects..."
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
            />
          </div>
          {addErr && <p className="text-xs text-red-500">{addErr}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setAddModal(false)} disabled={adding}>Cancel</Button>
            <Button fullWidth variant={Number(addAmount) < 0 ? 'danger' : 'primary'} onClick={handleAdd} loading={adding}>
              <i className={`fa ${Number(addAmount) < 0 ? 'fa-minus' : 'fa-plus'} mr-1.5`} /> {Number(addAmount) < 0 ? 'Deduct Connects' : 'Add Connects'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
