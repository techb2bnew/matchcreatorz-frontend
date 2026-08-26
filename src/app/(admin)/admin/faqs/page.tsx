'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { adminFaqApi, AdminFaq } from '@/lib/adminApi';
import { PageLoader } from '@/components/ui/Loader';
import toast from 'react-hot-toast';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

const emptyForm = { question: '', answer: '' };

export default function FaqsPage() {
  const [faqs, setFaqs]       = useState<AdminFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<number | null>(null);

  // -- Add modal ---------------------------------------------
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addErrs, setAddErrs]     = useState<Record<string, string>>({});

  // -- Edit modal ----------------------------------------------
  const [editFaq, setEditFaq]       = useState<AdminFaq | null>(null);
  const [editForm, setEditForm]     = useState(emptyForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editErrs, setEditErrs]     = useState<Record<string, string>>({});

  // -- Delete confirm --------------------------------------------
  const [deleteFaq, setDeleteFaq]   = useState<AdminFaq | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFaqs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const json = await adminFaqApi.list();
      setFaqs(json.data || []);
    } catch (err: any) {
      if (!silent) toast.error(err.message || 'Failed to fetch FAQs');
      else console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  useAutoRefresh(() => fetchFaqs(true), 20000, !showAdd && !editFaq && !deleteFaq);

  // -- Add ---------------------------------------------------
  const handleAdd = async () => {
    const e: Record<string, string> = {};
    if (!addForm.question.trim()) e.question = 'Question is required';
    if (!addForm.answer.trim())   e.answer   = 'Answer is required';
    if (Object.keys(e).length) { setAddErrs(e); return; }
    setAddErrs({});
    setAddLoading(true);
    try {
      await adminFaqApi.add({ question: addForm.question.trim(), answer: addForm.answer.trim() });
      toast.success('FAQ added successfully');
      setShowAdd(false);
      setAddForm(emptyForm);
      fetchFaqs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add FAQ');
    } finally {
      setAddLoading(false);
    }
  };

  // -- Edit --------------------------------------------------
  const openEdit = (f: AdminFaq) => {
    setEditFaq(f);
    setEditForm({ question: f.question, answer: f.answer });
    setEditErrs({});
  };

  const handleEdit = async () => {
    const e: Record<string, string> = {};
    if (!editForm.question.trim()) e.question = 'Question is required';
    if (!editForm.answer.trim())   e.answer   = 'Answer is required';
    if (Object.keys(e).length) { setEditErrs(e); return; }
    setEditErrs({});
    setEditLoading(true);
    try {
      await adminFaqApi.edit(editFaq!.id, { question: editForm.question.trim(), answer: editForm.answer.trim() });
      toast.success('FAQ updated');
      setEditFaq(null);
      fetchFaqs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update FAQ');
    } finally {
      setEditLoading(false);
    }
  };

  // -- Delete ------------------------------------------------
  const handleDelete = async () => {
    if (!deleteFaq) return;
    setDeleteLoading(true);
    try {
      await adminFaqApi.delete(deleteFaq.id);
      toast.success('FAQ deleted');
      setDeleteFaq(null);
      fetchFaqs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete FAQ');
    } finally {
      setDeleteLoading(false);
    }
  };

  // -- Reorder -------------------------------------------------
  const handleMove = async (f: AdminFaq, direction: 'up' | 'down') => {
    setMovingId(f.id);
    try {
      await adminFaqApi.move(f.id, direction);
      fetchFaqs(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reorder');
    } finally {
      setMovingId(null);
    }
  };

  return (
    <DashboardLayout role="ADMIN" title="FAQ">

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">FAQ</h2>
          <p className="text-sm text-gray-500 mt-0.5">Question &amp; answer pairs shown on the public FAQ page</p>
        </div>
        <div className="w-full sm:w-auto sm:ml-auto">
          <Button className="w-full sm:w-auto" leftIcon={<i className="fa fa-plus text-sm" />} onClick={() => { setAddForm(emptyForm); setAddErrs({}); setShowAdd(true); }}>
            Add FAQ
          </Button>
        </div>
      </div>

      {loading ? (
        <PageLoader text="Loading FAQs..." />
      ) : faqs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <i className="fa fa-question-circle text-4xl mb-3 block" />
          <p className="font-medium">No FAQs yet</p>
          <p className="text-sm mt-1">Add your first question &amp; answer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Card key={f.id} padding="md">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => handleMove(f, 'up')}
                    disabled={i === 0 || movingId === f.id}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fa fa-chevron-up text-xs" />
                  </button>
                  <button
                    onClick={() => handleMove(f, 'down')}
                    disabled={i === faqs.length - 1 || movingId === f.id}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fa fa-chevron-down text-xs" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{f.question}</p>
                  <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{f.answer}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(f)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <i className="fa fa-pencil text-xs" />
                  </button>
                  <button
                    onClick={() => setDeleteFaq(f)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <i className="fa fa-trash text-xs" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* -- Add Modal -- */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add FAQ" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Question *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545]"
              placeholder="e.g. How do payments work?"
              value={addForm.question}
              onChange={(e) => { setAddForm(f => ({ ...f, question: e.target.value })); setAddErrs(p => ({ ...p, question: '' })); }}
            />
            {addErrs.question && <p className="mt-1 text-xs text-red-500">{addErrs.question}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Answer *</label>
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545] resize-none"
              placeholder="Write the answer..."
              value={addForm.answer}
              onChange={(e) => { setAddForm(f => ({ ...f, answer: e.target.value })); setAddErrs(p => ({ ...p, answer: '' })); }}
            />
            {addErrs.answer && <p className="mt-1 text-xs text-red-500">{addErrs.answer}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button fullWidth onClick={handleAdd} disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add FAQ'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* -- Edit Modal -- */}
      <Modal isOpen={!!editFaq} onClose={() => setEditFaq(null)} title="Edit FAQ" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Question *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545]"
              value={editForm.question}
              onChange={(e) => { setEditForm(f => ({ ...f, question: e.target.value })); setEditErrs(p => ({ ...p, question: '' })); }}
            />
            {editErrs.question && <p className="mt-1 text-xs text-red-500">{editErrs.question}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Answer *</label>
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545] resize-none"
              value={editForm.answer}
              onChange={(e) => { setEditForm(f => ({ ...f, answer: e.target.value })); setEditErrs(p => ({ ...p, answer: '' })); }}
            />
            {editErrs.answer && <p className="mt-1 text-xs text-red-500">{editErrs.answer}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setEditFaq(null)}>Cancel</Button>
            <Button fullWidth onClick={handleEdit} disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* -- Delete Confirm Modal -- */}
      <Modal isOpen={!!deleteFaq} onClose={() => setDeleteFaq(null)} title="Delete FAQ" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>&quot;{deleteFaq?.question}&quot;</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={() => setDeleteFaq(null)}>Cancel</Button>
            <Button
              fullWidth
              onClick={handleDelete}
              disabled={deleteLoading}
              className="!bg-red-500 hover:!bg-red-600"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  );
}
