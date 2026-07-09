'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cn } from '@/lib/utils';

type Tab = 'posted' | 'post';
const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'posted', label: 'My Posted Jobs', icon: 'fa-briefcase' },
  { key: 'post',   label: 'Post New Job',   icon: 'fa-plus'      },
];

const inputCls = 'w-full border border-[#e8e8e8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e84545] focus:ring-1 focus:ring-[#e84545] bg-white transition';
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

const postedJobs = [
  { id: 1, title: 'Logo Design for My Bakery',   category: 'Design',          budget: '₹1,000–₹2,500', proposals: 7,  status: 'OPEN',        posted: 'Jun 28', desc: 'I need a cute, modern logo for my home bakery business. Should include a pastry icon and work in pink/gold tones.' },
  { id: 2, title: 'WordPress Blog Setup',         category: 'Development',     budget: '₹2,000–₹5,000', proposals: 12, status: 'IN_PROGRESS', posted: 'Jun 25', desc: 'Setup a WordPress blog with premium theme, 5 plugins, SEO config, and basic content pages.' },
  { id: 3, title: 'YouTube Intro Video',          category: 'Video',           budget: '₹800–₹2,000',   proposals: 5,  status: 'CLOSED',      posted: 'Jun 20', desc: 'Create a 10-15 second animated intro for my YouTube cooking channel. Warm colors, fun style.' },
  { id: 4, title: 'Instagram Content Calendar',  category: 'Marketing',       budget: '₹1,500–₹3,000', proposals: 9,  status: 'OPEN',        posted: 'Jun 18', desc: 'Need 30 days of social media content ideas with captions and hashtag strategy.' },
];

const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:        { label: 'Open',        bg: '#d1fae5', color: '#059669' },
  IN_PROGRESS: { label: 'In Progress', bg: '#dbeafe', color: '#2563eb' },
  CLOSED:      { label: 'Closed',      bg: '#f3f4f6', color: '#6b7280' },
};

const categories = ['Design', 'Development', 'Marketing', 'Writing', 'Video', 'Photography', 'Music', 'Animation'];

export default function BuyerJobsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('posted');

  // Post form state
  const [jobTitle, setJobTitle]       = useState('');
  const [jobDesc, setJobDesc]         = useState('');
  const [category, setCategory]       = useState('Design');
  const [budgetMin, setBudgetMin]     = useState('');
  const [budgetMax, setBudgetMax]     = useState('');
  const [deadline, setDeadline]       = useState('');
  const [skills, setSkills]           = useState('');
  const [jobType, setJobType]         = useState('fixed');
  const [experience, setExperience]   = useState('any');
  const [posted, setPosted]           = useState(false);

  const stats = [
    { label: 'Total Posted', val: '4',  icon: 'fa-briefcase',   color: '#e84545', bg: '#fef2f2' },
    { label: 'Open',         val: '2',  icon: 'fa-circle',      color: '#10b981', bg: '#ecfdf5' },
    { label: 'In Progress',  val: '1',  icon: 'fa-spinner',     color: '#4f9ef8', bg: '#eff6ff' },
    { label: 'Total Bids',   val: '33', icon: 'fa-gavel',       color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <DashboardLayout role="BUYER" title="My Jobs">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <i className={`fa ${s.icon} text-base`} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8e8e8] shadow-sm p-1 rounded-2xl w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === t.key ? 'bg-[#e84545] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
              )}>
              <i className={`fa ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* Posted Jobs */}
        {activeTab === 'posted' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {postedJobs.map(job => {
              const st = statusMap[job.status];
              return (
                <div key={job.id} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400"><i className="fa fa-tag mr-1" />{job.category}</span>
                        <span className="text-xs text-gray-400"><i className="fa fa-calendar mr-1" />{job.posted}</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{job.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Budget</p>
                        <p className="text-sm font-bold text-gray-800">{job.budget}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Proposals</p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-bold text-gray-800">{job.proposals}</p>
                          {job.proposals > 0 && <span className="text-xs text-[#e84545] font-semibold">bids</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-xs px-3 py-1.5 rounded-lg border border-[#e8e8e8] shadow-sm text-gray-600 hover:bg-gray-50 transition">
                        <i className="fa fa-eye mr-1" />View Bids
                      </button>
                      {job.status === 'OPEN' && (
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-[#e84545] text-white hover:bg-[#c73333] transition">
                          <i className="fa fa-pencil mr-1" />Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Post New Job */}
        {activeTab === 'post' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                <i className="fa fa-plus-circle text-[#e84545]" /> Post a New Job
              </h3>
              <p className="text-xs text-gray-400 mb-6">Fill in the details to attract the right creators</p>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}><i className="fa fa-pencil mr-1 text-[#e84545]" /> Job Title <span className="text-red-500">*</span></label>
                  <input className={inputCls} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Logo Design for My Startup" />
                </div>

                <div>
                  <label className={labelCls}><i className="fa fa-align-left mr-1 text-[#e84545]" /> Description</label>
                  <textarea className={inputCls + ' h-28 resize-none py-3'} value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder="Describe what you need, including any specific requirements, style preferences, references..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}><i className="fa fa-tag mr-1 text-[#e84545]" /> Category</label>
                    <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-clock-o mr-1 text-[#e84545]" /> Job Type</label>
                    <select className={inputCls} value={jobType} onChange={e => setJobType(e.target.value)}>
                      <option value="fixed">Fixed Price</option>
                      <option value="hourly">Hourly Rate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}><i className="fa fa-rupee mr-1 text-[#10b981]" /> Budget Min (₹)</label>
                    <input className={inputCls} type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="500" />
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-rupee mr-1 text-[#10b981]" /> Budget Max (₹)</label>
                    <input className={inputCls} type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="5000" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}><i className="fa fa-calendar mr-1 text-[#4f9ef8]" /> Deadline</label>
                    <input className={inputCls} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}><i className="fa fa-graduation-cap mr-1 text-[#f59e0b]" /> Experience Level</label>
                    <select className={inputCls} value={experience} onChange={e => setExperience(e.target.value)}>
                      <option value="any">Any Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}><i className="fa fa-code mr-1 text-[#8b5cf6]" /> Required Skills</label>
                  <input className={inputCls} value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Photoshop, Illustrator, Branding (comma separated)" />
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => { setPosted(true); setTimeout(() => setPosted(false), 3000); setJobTitle(''); setJobDesc(''); setBudgetMin(''); setBudgetMax(''); setDeadline(''); setSkills(''); }}
                    className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-[#e84545] text-white text-sm font-bold hover:bg-[#c73333] transition shadow-sm"
                  >
                    <i className="fa fa-paper-plane" /> Post Job
                  </button>
                  {posted && <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium"><i className="fa fa-check-circle" /> Job posted successfully!</span>}
                </div>
              </div>
            </div>

            {/* Tips Panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><i className="fa fa-lightbulb-o text-[#f59e0b]" /> Tips for a Great Post</h4>
                <div className="space-y-3">
                  {[
                    { icon: 'fa-check-circle', color: '#10b981', tip: 'Write a clear, specific title'                 },
                    { icon: 'fa-check-circle', color: '#10b981', tip: 'Describe your requirements in detail'          },
                    { icon: 'fa-check-circle', color: '#10b981', tip: 'Set a realistic budget range'                  },
                    { icon: 'fa-check-circle', color: '#10b981', tip: 'Add relevant skills to attract experts'        },
                    { icon: 'fa-check-circle', color: '#10b981', tip: 'Include examples or references if possible'    },
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <i className={`fa ${t.icon} text-sm mt-0.5 flex-shrink-0`} style={{ color: t.color }} />
                      <p className="text-xs text-gray-600">{t.tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><i className="fa fa-bar-chart text-[#4f9ef8]" /> Platform Stats</h4>
                {[
                  { label: 'Avg. Bids per Job', val: '8–12',     color: '#e84545' },
                  { label: 'Avg. Hire Time',    val: '24 hours', color: '#4f9ef8' },
                  { label: 'Active Creators',   val: '12,000+',  color: '#10b981' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xs font-bold" style={{ color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-[#e84545] to-[#c02a2a] rounded-2xl p-5 text-white">
                <i className="fa fa-shield text-2xl mb-2 block" />
                <h4 className="text-sm font-bold mb-1">Buyer Protection</h4>
                <p className="text-xs text-red-100">Your payment is held in escrow and released only when you approve the work.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
