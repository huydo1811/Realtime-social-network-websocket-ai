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
