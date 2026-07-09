'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import CustomSelect from '@/components/ui/CustomSelect';
import { formatCurrency, formatDate } from '@/lib/utils';

const SELLERS = ['Bob Smith', 'Diana Prince', 'Frank Miller', 'Grace Hopper', 'Henry Ford', 'Alice Johnson', 'Carlos Ruiz', 'Eva Green'];

const initialPlans = [
  { id: 1, name: 'Starter',  price: 9.99,  connects: 30,  popular: false },
  { id: 2, name: 'Pro',      price: 19.99, connects: 80,  popular: true  },
  { id: 3, name: 'Business', price: 39.99, connects: 200, popular: false },
];

const initHistory = [
  { id: 1, user: 'Bob Smith',    type: 'Purchase', plan: 'Pro',      connects: 80,  amount: 19.99, date: '2024-11-10', note: '' },
  { id: 2, user: 'Frank Miller', type: 'Purchase', plan: 'Starter',  connects: 30,  amount: 9.99,  date: '2024-11-09', note: '' },
  { id: 3, user: 'Diana Prince', type: 'Purchase', plan: 'Business', connects: 200, amount: 39.99, date: '2024-11-08', note: '' },
  { id: 4, user: 'Grace Hopper', type: 'Bonus',    plan: '—',        connects: 20,  amount: 0,     date: '2024-11-07', note: 'Welcome bonus' },
  { id: 5, user: 'Henry Ford',   type: 'Purchase', plan: 'Starter',  connects: 30,  amount: 9.99,  date: '2024-11-05', note: '' },
  { id: 6, user: 'Alice Johnson', type: 'Bonus',   plan: '—',        connects: 50,  amount: 0,     date: '2024-11-03', note: 'Promotional offer' },
  { id: 7, user: 'Carlos Ruiz',  type: 'Purchase', plan: 'Business', connects: 200, amount: 39.99, date: '2024-11-01', note: '' },
  { id: 8, user: 'Eva Green',    type: 'Manual',   plan: '—',        connects: 15,  amount: 0,     date: '2024-10-28', note: 'Refund adjustment' },
];

type Plan    = typeof initialPlans[0];
type History = typeof initHistory[0];

const typeStyle: Record<string, string> = {
  Purchase: 'bg-blue-50 text-blue-600',
  Bonus:    'bg-green-50 text-green-600',
  Manual:   'bg-orange-50 text-orange-600',
};

export default function AdminConnectsPage() {
  const [plans, setPlans]         = useState(initialPlans);
  const [history, setHistory]     = useState(initHistory);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal]   = useState(false);
  const [addPlanModal, setAddPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editPrice, setEditPrice]       = useState('');
  const [editConnects, setEditConnects] = useState('');

  // Add connects form
  const [addSeller,   setAddSeller]   = useState(SELLERS[0]);
  const [addAmount,   setAddAmount]   = useState('');
  const [addType,     setAddType]     = useState('Bonus');
  const [addNote,     setAddNote]     = useState('');

  // Add plan form
  const [newPlanName,     setNewPlanName]     = useState('');
  const [newPlanPrice,    setNewPlanPrice]    = useState('');
  const [newPlanConnects, setNewPlanConnects] = useState('');

  const openEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setEditPrice(String(plan.price));
    setEditConnects(String(plan.connects));
    setEditModal(true);
  };

  const saveEdit = () => {
    if (!selectedPlan) return;
    setPlans(prev => prev.map(p => p.id === selectedPlan.id
      ? { ...p, price: parseFloat(editPrice) || p.price, connects: parseInt(editConnects) || p.connects }
      : p
    ));
    setEditModal(false);
  };

  const handleAddConnects = () => {
    if (!addAmount || !addSeller) return;
    setHistory(prev => [{
      id: Date.now(), user: addSeller, type: addType, plan: '—',
      connects: parseInt(addAmount), amount: 0,
      date: new Date().toISOString().split('T')[0], note: addNote,
    }, ...prev]);
    setAddAmount(''); setAddNote(''); setAddModal(false);
  };

  const handleAddPlan = () => {
    if (!newPlanName || !newPlanPrice || !newPlanConnects) return;
    setPlans(prev => [...prev, {
      id: Date.now(), name: newPlanName,
      price: parseFloat(newPlanPrice), connects: parseInt(newPlanConnects), popular: false,
    }]);
    setNewPlanName(''); setNewPlanPrice(''); setNewPlanConnects('');
    setAddPlanModal(false);
  };

  const totalConnects = history.reduce((s, h) => s + h.connects, 0);
  const totalRevenue  = history.reduce((s, h) => s + h.amount, 0);
  const bonusGiven    = history.filter(h => h.type !== 'Purchase').reduce((s, h) => s + h.connects, 0);

  return (
    <DashboardLayout role="ADMIN" title="Connects">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Issued"   value={totalConnects}          icon="fa-link"         color="red"   />
        <StatCard title="Revenue"        value={formatCurrency(totalRevenue)} icon="fa-rupee"   color="green" />
        <StatCard title="Bonus / Manual" value={bonusGiven}             icon="fa-gift"         color="blue"  />
        <StatCard title="Active Plans"   value={plans.length}           icon="fa-th-large"     color="orange"/>
      </div>

      {/* Plans */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Connect Plans</h3>
        <button onClick={() => setAddPlanModal(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#e84545] text-white text-xs font-semibold hover:bg-[#c73333] transition shadow-sm">
          <i className="fa fa-plus text-xs" /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-5 ${plan.popular ? 'border-[#e84545] shadow-lg' : 'border-[#e8e8e8] shadow-sm'}`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e84545] text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
            )}
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-bold text-gray-900 text-lg">{plan.name}</h4>
              <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <i className="fa fa-pencil text-sm" />
              </button>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{formatCurrency(plan.price)}</p>
            <div className="flex items-center gap-2 mt-2">
              <i className="fa fa-link text-sm text-[#e84545]" />
              <p className="text-xl font-bold text-[#e84545]">{plan.connects} Connects</p>
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      <Card padding="none">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <CardTitle>Connects History</CardTitle>
          <button onClick={() => setAddModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#e84545] text-white text-xs font-semibold hover:bg-[#c73333] transition shadow-sm">
            <i className="fa fa-plus text-xs" /> Add Connects
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Seller', 'Type', 'Plan', 'Connects', 'Amount', 'Note', 'Date'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={h.user} size="sm" />
                      <span className="font-medium text-gray-900">{h.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeStyle[h.type] || 'bg-gray-100 text-gray-500'}`}>
                      {h.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{h.plan}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-[#e84545]">+{h.connects}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {h.amount > 0 ? formatCurrency(h.amount) : <span className="text-gray-400 text-xs">Free</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs italic">{h.note || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(h.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Add Connects Modal ─────────────────────────────── */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Connects to Seller" size="sm">
        <div className="space-y-4">
          <CustomSelect
            label="Select Seller"
            leftIcon="fa-user"
            value={addSeller}
            onChange={setAddSeller}
            options={SELLERS}
          />
          <CustomSelect
            label="Type"
            leftIcon="fa-tag"
            value={addType}
            onChange={setAddType}
            options={['Bonus', 'Manual', 'Refund', 'Promotional']}
          />
          <Input
            label="Number of Connects"
            type="number"
            placeholder="e.g. 50"
            leftIcon={<i className="fa fa-link text-sm" />}
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
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
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setAddModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleAddConnects}>
              <i className="fa fa-plus mr-1.5" /> Add Connects
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Plan Modal ────────────────────────────────── */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Edit ${selectedPlan?.name} Plan`} size="sm">
        <div className="space-y-4">
          <Input label="Price ($)" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
          <Input label="Connects" type="number" value={editConnects} onChange={(e) => setEditConnects(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setEditModal(false)}>Cancel</Button>
            <Button fullWidth onClick={saveEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Plan Modal ─────────────────────────────────── */}
      <Modal isOpen={addPlanModal} onClose={() => setAddPlanModal(false)} title="Add New Plan" size="sm">
        <div className="space-y-4">
          <Input label="Plan Name" placeholder="e.g. Enterprise" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} />
          <Input label="Price ($)" type="number" placeholder="e.g. 59.99" value={newPlanPrice} onChange={(e) => setNewPlanPrice(e.target.value)} />
          <Input label="Connects" type="number" placeholder="e.g. 500" value={newPlanConnects} onChange={(e) => setNewPlanConnects(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setAddPlanModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleAddPlan}>
              <i className="fa fa-plus mr-1.5" /> Add Plan
            </Button>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  );
}
