import { useCallback, useEffect, useRef, useState } from 'react';
import Chat from 'podchat-browser';

const env = import.meta.env;

/**
 * هوک مدیریت اتصال به podchat و گفتگو با ربات.
 * status: connecting | ready | error
 */
export function usePodChat() {
  const chatRef = useRef(null);
  const threadIdRef = useRef(env.VITE_BOT_THREAD_ID ? Number(env.VITE_BOT_THREAD_ID) : null);
  const myUserIdRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [messages, setMessages] = useState([]);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  useEffect(() => {
    const chat = new Chat({
      appId: String(Date.now()),
      socketAddress: env.VITE_SOCKET_ADDRESS,
      ssoHost: env.VITE_SSO_HOST,
      platformHost: env.VITE_PLATFORM_HOST,
      fileServer: env.VITE_FILE_SERVER,
      podSpaceFileServer: env.VITE_PODSPACE_FILE_SERVER,
      serverName: env.VITE_SERVER_NAME,
      token: env.VITE_POD_TOKEN,
      wsConnectionWaitTime: 500,
      connectionRetryInterval: 5000,
      enableCache: false,
      fullResponseObject: true,
    });
    chatRef.current = chat;

    chat.on('chatReady', async () => {
      try {
        const user = chat.getCurrentUser?.();
        myUserIdRef.current = user?.id ?? null;
        await ensureThread(chat, threadIdRef);
        await loadHistory(chat, threadIdRef.current, myUserIdRef.current, setMessages);
        setStatus('ready');
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    });

    chat.on('messageEvents', (event) => {
      if (event.type !== 'MESSAGE_NEW') return;
      const m = event.result?.message;
      if (!m || m.threadId !== threadIdRef.current) return;
      addMessage(normalize(m, myUserIdRef.current));
    });

    chat.on('error', (err) => {
      console.error('podchat error', err);
      setStatus('error');
    });

    return () => {
      chat.logout?.();
    };
  }, [addMessage]);

  const send = useCallback((text) => {
    const chat = chatRef.current;
    const threadId = threadIdRef.current;
    if (!chat || !threadId || !text.trim()) return;
    chat.sendTextMessage({ threadId, textMessage: text }, {
      onSent: (res) => {
        const id = res?.result?.messageId ?? res?.messageId ?? `local-${Date.now()}`;
        addMessage({ id, text, mine: true, time: Date.now() });
      },
    });
  }, [addMessage]);

  return { status, messages, send };
}

function ensureThread(chat, threadIdRef) {
  if (threadIdRef.current) return Promise.resolve();
  return new Promise((resolve, reject) => {
    chat.createThread(
      {
        type: 'NORMAL',
        invitees: [{ id: env.VITE_BOT_USERNAME, idType: 'TO_BE_USER_USERNAME' }],
      },
      (res) => {
        const id = res?.result?.thread?.id;
        if (res?.hasError || !id) return reject(new Error('createThread failed'));
        threadIdRef.current = id;
        resolve();
      },
    );
  });
}

function loadHistory(chat, threadId, myUserId, setMessages) {
  return new Promise((resolve) => {
    chat.getHistory({ threadId, count: 50, order: 'asc' }, (res) => {
      const list = res?.result?.history ?? [];
      setMessages(list.map((m) => normalize(m, myUserId)));
      resolve();
    });
  });
}

function normalize(m, myUserId) {
  return {
    id: m.id,
    text: m.message,
    mine: m.participant?.id === myUserId,
    time: m.time ? Math.floor(m.time / 1000000) : Date.now(),
  };
}
