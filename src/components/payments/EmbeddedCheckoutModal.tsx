'use client';
import { useMemo } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import Modal from '@/components/ui/Modal';

// Loaded once per publishable key and reused — loadStripe() itself is meant
// to be called a single time, not per render/mount.
const stripePromises = new Map<string, Promise<Stripe | null>>();
const getStripe = (publishableKey: string) => {
  let p = stripePromises.get(publishableKey);
  if (!p) { p = loadStripe(publishableKey); stripePromises.set(publishableKey, p); }
  return p;
};

/**
 * Renders Stripe's Embedded Checkout (the actual card-entry form) inline,
 * inside our own modal — the buyer never leaves the page or gets redirected
 * to a Stripe-hosted checkout page for the payment step itself. Completion
 * still redirects the browser to whatever `return_url` the backend set on
 * the session (same as hosted mode's success_url), so existing confirm/
 * webhook handling elsewhere in the app needs no changes.
 */
export default function EmbeddedCheckoutModal({
  clientSecret,
  publishableKey,
  title = 'Complete Payment',
  onClose,
}: {
  clientSecret: string;
  publishableKey: string;
  title?: string;
  onClose: () => void;
}) {
  const stripe = useMemo(() => getStripe(publishableKey), [publishableKey]);

  return (
    <Modal isOpen onClose={onClose} title={title} size="lg" noPadding>
      <div className="p-4 sm:p-6 min-h-[420px]">
        <EmbeddedCheckoutProvider stripe={stripe} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </Modal>
  );
}
