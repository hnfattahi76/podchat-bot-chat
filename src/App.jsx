import { usePodChat } from './usePodChat.js';

const STATUS_LABEL = {
  connecting: 'در حال اتصال…',
  ready: 'آنلاین',
  error: 'خطا در اتصال',
};

export default function App() {
  const { status, threadId } = usePodChat();

  return (
    <div className="chat">
      <header>
        <span>چت با ربات</span>
        <small className={status}>{STATUS_LABEL[status]}</small>
      </header>

      <div className="messages">
        {threadId && <div>Thread ساخته شد: {threadId}</div>}
      </div>
    </div>
  );
}