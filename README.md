# Realtime Social Network Backend

## Kiến trúc tổng quan

Backend được xây dựng theo mô hình Clean Architecture, chia thành nhiều module (auth, api, call, chat, ...), mỗi module gồm 4 layer chính:

- **presentation**: Xử lý request/response, controller, DTO, mapper.
- **application**: Chứa service, use case nghiệp vụ.
- **domain**: Định nghĩa entity, event, exception, repository (interface), logic cốt lõi.
- **infrastructure**: Kết nối hệ thống ngoài (database, message broker, AI, ...), implement repository.

---

## Ví dụ cấu trúc module

### auth-module

backend/auth-module/src/main/java/com/social/auth/
├── application/
│ ├── services/
│ └── usecases/
├── domain/
│ ├── entities/
│ ├── events/
│ ├── exceptions/
│ └── repositories/
├── infrastructure/
│ ├── adapters/
│ ├── external/
│ └── repositories/
└── presentation/
├── controllers/
├── dto/
└── mapper/

### api module - infrastructure layer

backend/api/src/main/java/com/social/infrastructure/
├── ollama/
│ ├── client/
│ └── models/
├── redis/
│ ├── cache/
│ └── pubsub/
├── webrtc/
│ ├── handlers/
│ └── signaling/
└── websocket/
├── handlers/
└── message/

---

## Hướng dẫn phát triển

- Mỗi module nên tuân thủ đúng 4 layer, không để logic nghiệp vụ lẫn lộn giữa các layer.
- Layer **domain** không phụ thuộc bất kỳ layer nào khác.
- Layer **application** chỉ phụ thuộc **domain**.
- Layer **infrastructure** implement các interface từ **domain**.
- Layer **presentation** chỉ gọi vào **application**.

> Cấu trúc này giúp dự án dễ mở rộng, bảo trì, test và tích hợp nhiều công nghệ mới.

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
