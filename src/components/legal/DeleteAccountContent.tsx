import Link from 'next/link';
import Logo from '@/components/ui/Logo';

const STEPS = [
  { title: 'Open the MatchCreatorz app and sign in', body: 'Use the account you want to delete.' },
  { title: 'Go to Profile → Delete Account', body: 'Found in your account settings menu.' },
  { title: 'Enter a short reason and confirm', body: 'Your account is deleted immediately.' },
];

const DELETED_GROUPS = [
  { icon: 'fa-user', title: 'Your profile', items: ['Name, email, phone number', 'Address and profile photo', 'Bio'] },
  { icon: 'fa-briefcase', title: 'Seller data', items: ['Services and portfolio files', 'Resume and listed skills', 'Hourly rate'] },
  { icon: 'fa-file-text-o', title: 'Buyer data', items: ['Posted jobs', 'Bids received', 'Screening questions'] },
  { icon: 'fa-comments-o', title: 'Messages & support', items: ['Chat messages and attachments', 'Support tickets'] },
  { icon: 'fa-cloud-upload', title: 'Uploads', items: ['Photos and documents', 'Work attachments'] },
  { icon: 'fa-mobile', title: 'Access & devices', items: ['Push notification tokens', 'Login sessions'] },
];

/**
 * Public, no-login page satisfying Apple/Google's account-deletion URL
 * requirement. Content is fixed (not admin-editable like the other legal
 * pages), so it's plain static markup rather than routed through
 * publicPageApi/LegalPageContent.
 */
export default function DeleteAccountContent() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#efefef' }}>
      {/* Header */}
      <header className="relative flex items-center justify-center py-7 overflow-hidden" style={{ background: '#1e2235' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize: '32px 32px' }} />
        <Link href="/login" className="relative">
          <Logo className="h-11 w-auto" />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-3xl">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e84545] transition-colors mb-5">
            <i className="fa fa-arrow-left" />Back to login
          </Link>

          <div className="bg-white rounded-2xl shadow-lg border border-[#e0e0e0] overflow-hidden">
            {/* Title band */}
            <div className="flex items-center gap-4 px-6 sm:px-10 py-6 border-b border-gray-100 bg-gray-50/50">
              <div className="h-12 w-12 rounded-2xl bg-[#fff0f0] text-[#e84545] flex items-center justify-center flex-shrink-0">
                <i className="fa fa-trash-o text-xl" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Delete your MatchCreatorz account</h1>
                <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-medium">
                  <i className="fa fa-clock-o" />Last updated 3 September 2026
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-10 py-8 space-y-10">
              <p className="text-[15px] leading-relaxed text-gray-700 max-w-[64ch]">
                MatchCreatorz, operated by BCE Group, lets you delete your account and the data associated with it at any time.
              </p>

              <div className="flex gap-3.5 items-start bg-[#fff0f0] border border-[#ffd9d9] rounded-2xl px-5 py-4">
                <span className="h-7 w-7 rounded-full bg-[#e84545] text-white flex items-center justify-center flex-shrink-0 text-xs">
                  <i className="fa fa-info" />
                </span>
                <div className="text-sm text-gray-700 leading-relaxed space-y-1.5">
                  <p><strong className="text-gray-900">In the app:</strong> deletion happens immediately from Profile → Delete Account.</p>
                  <p><strong className="text-gray-900">No app installed?</strong> Email us and we&apos;ll verify and delete your account within 30 days.</p>
                </div>
              </div>

              {/* How to request deletion */}
              <section>
                <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900 mb-5">
                  <i className="fa fa-list text-[#e84545] text-base" />How to request deletion
                </h2>

                <p className="text-xs font-bold tracking-wider uppercase text-gray-500 mb-3.5">In the app</p>
                <div className="bg-[#faf7ee] border border-[#f5edd6] rounded-2xl px-6 py-5 mb-5">
                  <ol className="space-y-5">
                    {STEPS.map((step, i) => (
                      <li key={step.title} className="grid grid-cols-[34px_1fr] gap-4 relative pb-0 last:pb-0">
                        {i < STEPS.length - 1 && (
                          <span className="absolute left-4 top-9 -bottom-5 w-px bg-[#d8d8d8]" aria-hidden="true" />
                        )}
                        <span className="relative z-10 h-[34px] w-[34px] rounded-full bg-[#e84545] text-white font-bold text-sm flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <strong className="block text-[15px] text-gray-900">{step.title}</strong>
                          <span className="text-sm text-gray-500">{step.body}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-xs font-bold tracking-wider uppercase text-gray-500 mb-3.5">If you no longer have the app installed</p>
                <div className="bg-white border border-[#e0e0e0] rounded-2xl px-5 py-4 flex gap-3.5">
                  <i className="fa fa-envelope-o text-[#e84545] mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Email <a href="mailto:tech@base2brand.com?subject=Delete%20my%20account" className="text-[#e84545] font-semibold hover:underline">tech@base2brand.com</a> from the address registered on your account, with the subject <strong className="text-gray-900">&ldquo;Delete my account.&rdquo;</strong> We verify the request and delete the account within 30 days.
                  </p>
                </div>
              </section>

              {/* What is deleted */}
              <section>
                <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900 mb-5">
                  <i className="fa fa-database text-[#e84545] text-base" />What is deleted
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {DELETED_GROUPS.map((group) => (
                    <div key={group.title} className="bg-white border border-[#e0e0e0] rounded-2xl p-4 hover:border-[#ef6666] hover:shadow-hover transition-colors">
                      <div className="h-9 w-9 rounded-[11px] bg-[#fff0f0] text-[#e84545] flex items-center justify-center mb-3 text-sm">
                        <i className={`fa ${group.icon}`} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">{group.title}</h3>
                      <ul className="space-y-1.5">
                        {group.items.map((item) => (
                          <li key={item} className="text-[13px] text-gray-500 pl-3.5 relative before:content-['–'] before:absolute before:left-0 before:text-[#ef6666]">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* What is kept */}
              <section>
                <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900 mb-5">
                  <i className="fa fa-archive text-[#e84545] text-base" />What is kept, and for how long
                </h2>
                <div className="space-y-3">
                  <div className="bg-white border border-[#e0e0e0] rounded-2xl px-5 py-4 grid grid-cols-[auto_1fr] gap-3.5 items-start">
                    <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 whitespace-nowrap h-fit bg-gray-100 text-gray-500">7 years</span>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong className="block text-[15px] text-gray-900 mb-0.5">Completed transaction and invoice records</strong>
                      Retained where required by tax and accounting law, in a restricted financial ledger no longer linked to your public profile.
                    </p>
                  </div>
                  <div className="bg-white border border-[#e0e0e0] rounded-2xl px-5 py-4 grid grid-cols-[auto_1fr] gap-3.5 items-start">
                    <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 whitespace-nowrap h-fit bg-[#fff0f0] text-[#c73333]">Action needed</span>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong className="block text-[15px] text-gray-900 mb-0.5">Wallet balance</strong>
                      Any funds remaining must be withdrawn before deletion. Contact <a href="mailto:tech@base2brand.com" className="text-[#e84545] font-semibold hover:underline">tech@base2brand.com</a> if you need help withdrawing a balance.
                    </p>
                  </div>
                  <div className="bg-white border border-[#e0e0e0] rounded-2xl px-5 py-4 grid grid-cols-[auto_1fr] gap-3.5 items-start">
                    <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 whitespace-nowrap h-fit bg-gray-100 text-gray-500">Indefinite</span>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <strong className="block text-[15px] text-gray-900 mb-0.5">Anonymised, aggregated statistics</strong>
                      Cannot be used to identify you.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Questions? Reach us at <a href="mailto:tech@base2brand.com" className="text-[#e84545] hover:underline">tech@base2brand.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}
