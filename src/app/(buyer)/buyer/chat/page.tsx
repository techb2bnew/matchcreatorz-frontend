'use client';
import { Suspense } from 'react';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

export default function BuyerChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatWorkspace role="BUYER" title="Messages" />
    </Suspense>
  );
}
