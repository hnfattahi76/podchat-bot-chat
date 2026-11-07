import { useEffect, useRef, useState } from 'react';
import { usePodChat } from './usePodChat.js';

const STATUS_LABEL = {
  connecting: 'در حال اتصال…',
  ready: 'آنلاین',
  error: 'خطا در اتصال',
};

export default function App() {
  const { status, messages, send } = usePodChat();
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    send(text);
    setText('');
  };

  return (
    <div className="chat">
      <header>
        <span>چت با ربات</span>
        <small className={status}>{STATUS_LABEL[status]}</small>
      </header>

      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.mine ? 'mine' : 'bot'}`}>
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="پیام خود را بنویسید…"
          disabled={status !== 'ready'}
        />
        <button disabled={status !== 'ready' || !text.trim()}>ارسال</button>
      </form>
    </div>
  );
}
