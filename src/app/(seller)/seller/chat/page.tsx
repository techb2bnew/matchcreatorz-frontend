'use client';
import { Suspense } from 'react';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

export default function SellerChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatWorkspace role="SELLER" title="Messages" />
    </Suspense>
  );
}
