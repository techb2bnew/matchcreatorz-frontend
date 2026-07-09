'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

const staticPages = [
  { id: 1, name: 'About Us',         slug: '/about',   updated: '2024-11-01', content: 'We are MatchCreatorz, a platform connecting talented creators with businesses worldwide. Our mission is to make creative work accessible and affordable.' },
  { id: 2, name: 'Privacy Policy',   slug: '/privacy', updated: '2024-10-15', content: 'Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.' },
  { id: 3, name: 'Terms of Service', slug: '/terms',   updated: '2024-10-15', content: 'By accessing and using MatchCreatorz, you accept and agree to be bound by the terms and provision of this agreement.' },
  { id: 4, name: 'FAQ',              slug: '/faq',     updated: '2024-09-20', content: 'Frequently Asked Questions about MatchCreatorz. Find answers to common questions about payments, bookings, connects, and more.' },
  { id: 5, name: 'Contact Us',       slug: '/contact', updated: '2024-09-01', content: 'Get in touch with our support team. Email: support@matchcreatorz.com | Phone: +1 800 123 4567 | Hours: Mon-Fri 9AM-6PM EST.' },
];

type Page = typeof staticPages[0];

export default function PagesPage() {
  const [editModal, setEditModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const openEdit = (page: Page) => {
    setSelectedPage(page);
    setEditTitle(page.name);
    setEditContent(page.content);
    setEditModal(true);
  };

  return (
    <DashboardLayout role="ADMIN" title="Pages">
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Page Name', 'Slug', 'Last Updated', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staticPages.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.updated)}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<i className="fa fa-pencil text-xs" />}
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Edit: ${selectedPage?.name}`} size="lg">
        <div className="space-y-4">
          <Input
            label="Page Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={selectedPage?.slug || ''}
              readOnly
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 font-mono cursor-not-allowed focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea
              rows={8}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545] resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setEditModal(false)}>Cancel</Button>
            <Button fullWidth onClick={() => setEditModal(false)}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
