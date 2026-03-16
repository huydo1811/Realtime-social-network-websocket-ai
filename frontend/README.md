# Realtime Social Network Frontend

## Công nghệ sử dụng

- **Next.js 15** (App Router, Server Actions)
- **React 19** + **TypeScript**
- **Tailwind CSS**, **Shadcn/ui**, **Lucide icons**
- **Zustand** hoặc **React Query** (state management)
- **WebSocket** (native hoặc @stomp/stompjs)
- **WebRTC** (native browser API)
- **Axios** hoặc **Tanstack Query** để gọi backend

---

## Cấu trúc thư mục

src/
├── app/
│ ├── (auth)/login/
│ ├── (auth)/register/
│ ├── (user)/profile/
│ ├── (user)/edit/
│ ├── (post)/feed/
│ ├── (post)/create/
│ ├── (post)/[postId]/
│ ├── (moderation)/dashboard/
│ ├── (moderation)/reports/
│ ├── (friend)/suggestions/
│ ├── (friend)/requests/
│ ├── (chat)/[chatId]/
│ ├── (call)/[callId]/
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ ├── ui/
│ └── icons/
├── hooks/
├── lib/
│ ├── api/
│ ├── socket/
│ └── webrtc/
├── store/
├── styles/
├── types/
├── public/

### Giải thích nhanh

- **app/**: Routing chính, chia theo domain (auth, user, post, moderation, friend, chat, call).
- **components/**: Component dùng lại, chia nhỏ theo UI, icons.
- **hooks/**: Custom hooks cho logic dùng lại.
- **lib/**: Cấu hình API, WebSocket, WebRTC, các hàm tiện ích.
- **store/**: Quản lý state toàn cục (Zustand/React Query).
- **types/**: Định nghĩa type/interface dùng chung.
- **styles/**: Style bổ sung ngoài Tailwind (nếu cần).
- **public/**: Ảnh tĩnh, favicon, ...

---

## Hướng dẫn phát triển

- Tổ chức code theo domain, dễ mở rộng và bảo trì.
- Ưu tiên chia nhỏ component, hook, store theo chức năng.
- Sử dụng state management phù hợp (Zustand hoặc React Query).
- Kết nối backend qua Axios hoặc Tanstack Query.
- Sử dụng WebSocket và WebRTC cho realtime chat/call.

---

> Cấu trúc này giúp frontend dễ phát triển teamwork, mở rộng tính năng, và maintain lâu dài.
