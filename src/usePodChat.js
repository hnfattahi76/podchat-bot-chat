import { useEffect, useState } from 'react';
import Chat from 'podchat-browser';

const env = import.meta.env;

let chat = null;
let chatIsReady = false;
let threadPromise = null;

function getChat() {
  if (chat) return chat;
  chat = new Chat({
    token: env.VITE_POD_TOKEN,
    typeCode: 'default',
    typeCodeOwnerId: 1,
    ssoGrantDevicesAddress: '/oauth2/grants/devices',
    socketAddress: env.VITE_SOCKET_ADDRESS,        // wss://msg1.pod.ir/ws
    platformHost: env.VITE_PLATFORM_HOST,          // https://api.pod.ir/srv/core
    fileServer: env.VITE_FILE_SERVER,              // https://core.pod.ir
    podSpaceFileServer: env.VITE_PODSPACE_FILE_SERVER, // https://podspace.pod.ir
    protocol: 'websocket',
    serverName: 'chat-server',
    wsConnectionWaitTime: 500,
    systemMessageIntervalPitch: 3000,
    connectionRetryInterval: 5000,
    connectionCheckTimeout: 10000,
    messageTtl: 10000,
    reconnectOnClose: true,
    enableCache: false,
    fullResponseObject: true,
    dynamicHistoryCount: true,
    asyncLogging: { consoleLogging: false },
  });
  chat.on('chatReady', () => { chatIsReady = true; });
  return chat;
}

function createBotThread(c) {
  if (!threadPromise) {
    threadPromise = new Promise((resolve, reject) => {
      c.createThread(
        {
          type: 'NORMAL',
          invitees: [{ id: env.VITE_BOT_USERNAME, idType: 'TO_BE_USER_USERNAME' }],
        },
        (res) => {
          console.log('createThread response', res);
          const id = res?.result?.thread?.id ?? res?.result?.id;
          if (res?.hasError || !id) {
            threadPromise = null;
            return reject(new Error(res?.errorMessage || 'createThread failed'));
          }
          resolve(id);
        },
      );
    });
  }
  return threadPromise;
}

export function usePodChat() {
  const [status, setStatus] = useState('connecting');
  const [threadId, setThreadId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const c = getChat();

    const start = () =>
      createBotThread(c)
        .then((id) => { if (!cancelled) { setThreadId(id); setStatus('ready'); } })
        .catch((e) => { console.error(e); if (!cancelled) setStatus('error'); });

    if (chatIsReady) start();
    else c.on('chatReady', start);

    return () => { cancelled = true; };
  }, []);

  return { status, threadId };
}