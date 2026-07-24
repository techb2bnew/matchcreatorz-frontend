'use client';
import { Suspense } from 'react';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

export default function AdminSupportChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatWorkspace role="ADMIN" title="Support Chat" />
    </Suspense>
  );
}
