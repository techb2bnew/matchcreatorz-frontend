'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';

const jobs = [
  { id: 1, title: 'Logo Design for Tech Startup',       budget: { min: 100, max: 300  }, description: 'We need a modern, minimal logo for our new SaaS startup. Should be scalable and work on dark/light backgrounds.', buyer: 'Alice Johnson', postedAt: '2h ago',  bids: 12, category: 'Design'      },
  { id: 2, title: 'React Developer for E-commerce Site', budget: { min: 500, max: 1500 }, description: 'Looking for a React developer to build a fully functional e-commerce frontend connected to a REST API.', buyer: 'Carlos Ruiz',   postedAt: '4h ago',  bids: 8,  category: 'Development' },
  { id: 3, title: 'Social Media Content Strategy',       budget: { min: 150, max: 400  }, description: 'Need a content strategist to plan and create 30 days of social media posts across Instagram, Twitter, and LinkedIn.', buyer: 'Eva Green',     postedAt: '6h ago',  bids: 19, category: 'Marketing'   },
  { id: 4, title: 'Blog Writing — 10 SEO Articles',     budget: { min: 200, max: 500  }, description: 'Looking for an experienced SEO writer to produce 10 in-depth articles on finance and investment topics.', buyer: 'Frank Miller',  postedAt: '1d ago',  bids: 24, category: 'Writing'      },
  { id: 5, title: 'Product Demo Video',                  budget: { min: 300, max: 800  }, description: 'We need a 60-90 second polished product demo video for our mobile app. Animation and voiceover required.', buyer: 'Grace Hopper',  postedAt: '2d ago',  bids: 7,  category: 'Video'        },
  { id: 6, title: 'Brand Identity Package',              budget: { min: 400, max: 1200 }, description: 'Full brand identity needed: logo, color palette, typography guide, business card design, and brand guidelines PDF.', buyer: 'Henry Ford',    postedAt: '3d ago',  bids: 15, category: 'Design'      },
];

const categories = ['All', 'Design', 'Development', 'Marketing', 'Writing', 'Video'];

type Job = typeof jobs[0];

export default function SellerJobsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [bidModal, setBidModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [proposal, setProposal] = useState('');

  const filtered = jobs.filter((j) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || j.category === activeCategory;
    return matchSearch && matchCat;
  });

  const openBid = (job: Job) => {
    setSelectedJob(job);
    setBidAmount('');
    setDeliveryDays('');
    setProposal('');
    setBidModal(true);
  };

  return (
    <DashboardLayout role="SELLER" title="Browse Jobs">
      {/* Search */}
      <div className="mb-4 max-w-md">
        <Input
          placeholder="Search jobs..."
          leftIcon={<i className="fa fa-search text-sm" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === c ? 'bg-[#e84545] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Jobs grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map((j) => (
          <Card key={j.id} padding="md" hover>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1 pr-3">{j.title}</h3>
              <p className="text-sm font-bold text-[#e84545] flex-shrink-0">
                ${j.budget.min}–${j.budget.max}
              </p>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {j.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar name={j.buyer} size="xs" />
                <span className="text-xs text-gray-600">{j.buyer}</span>
                <span className="text-xs text-gray-400">· {j.postedAt}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{j.bids} bids</span>
                <Button size="sm" onClick={() => openBid(j)}>Place Bid</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bid Modal */}
      <Modal isOpen={bidModal} onClose={() => setBidModal(false)} title="Place a Bid" size="md">
        {selectedJob && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Job</p>
              <p className="text-sm font-semibold text-gray-900">{selectedJob.title}</p>
              <p className="text-xs text-[#e84545] font-medium mt-0.5">${selectedJob.budget.min}–${selectedJob.budget.max} budget</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Bid Amount ($)" type="number" placeholder="e.g. 250" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} required />
              <Input label="Delivery Days" type="number" placeholder="e.g. 5" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Proposal</label>
              <textarea
                rows={4}
                placeholder="Describe why you're the best fit for this job..."
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e84545] resize-none"
              />
            </div>
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <i className="fa fa-bolt text-sm text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">This will use <strong>2 connects</strong> from your balance (48 remaining).</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" fullWidth onClick={() => setBidModal(false)}>Cancel</Button>
              <Button fullWidth onClick={() => setBidModal(false)}>Submit Bid</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
