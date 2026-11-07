# podchat-bot-chat

چت ساده با یک ربات با React + Vite و پکیج `podchat-browser`.

## اجرا
```bash
cp .env.example .env   # توکن و thread/username ربات را پر کنید
pnpm install
pnpm dev
```

## ساختار
- `src/usePodChat.js` — اتصال، ساخت/پیدا کردن thread، تاریخچه، ارسال و دریافت پیام
- `src/App.jsx` — رابط چت
