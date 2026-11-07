import { useEffect, useRef, useState } from 'react';
import Chat from 'podchat-browser';

const env = import.meta.env;

export function usePodChat() {
  const chatRef = useRef(null);
  const [status, setStatus] = useState('connecting'); // connecting | ready | error
  const [threadId, setThreadId] = useState(null);

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
      asyncLogging: {
        onFunction: false,
        onMessageReceive: false,
        onMessageSend: false,
        actualTiming: false,
      },
    });
    chatRef.current = chat;

    chat.on('chatReady', () => {
      chat.createThread(
        {
          type: 'NORMAL',
          invitees: [{ id: env.VITE_BOT_USERNAME, idType: 'TO_BE_USER_USERNAME' }],
        },
        (res) => {
          console.log('createThread response', res);
          const id = res?.result?.thread?.id;
          if (res?.hasError || !id) return setStatus('error');
          setThreadId(id);
          setStatus('ready');
        },
      );
    });

    chat.on('error', (err) => {
      console.error('podchat error', err);
      setStatus('error');
    });

    return () => chat.logout?.();
  }, []);

  return { status, threadId };
}