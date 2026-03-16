# Realtime Social Network with AI Content Moderation

**Mạng xã hội thời gian thực tích hợp AI kiểm duyệt nội dung vi phạm**  
Một nền tảng mạng xã hội hiện đại hỗ trợ đăng bài, bình luận, chat nhóm, gọi video/audio thời gian thực, với hệ thống AI tự động phát hiện và xử lý nội dung vi phạm (text + hình ảnh) dựa trên các mô hình ngôn ngữ lớn chạy local.

## Mục tiêu & Tính năng chính

- **Realtime Social Features**
  - Đăng bài, bình luận, like/reaction
  - Chat cá nhân/nhóm thời gian thực
  - Gọi video/audio (peer-to-peer qua WebRTC)

- **AI Moderation**
  - Tự động phân loại & chặn nội dung vi phạm quy tắc cộng đồng
  - Hỗ trợ cả text (Llama-Guard) và hình ảnh (Qwen2.5-VL, Llava)
  - Chạy local với Ollama → bảo mật cao, không phụ thuộc API bên thứ ba

- **Kiến trúc**
  - Hệ thống microservices-friendly, dễ mở rộng
  - CI/CD tự động qua GitHub Actions
  - Triển khai trên cloud (AWS EC2) hoặc local (Docker)

## Kiến trúc tổng thể

```mermaid
graph TD
    A[User] --> B[Nginx Reverse Proxy]
    B --> C[Frontend: Next.js 15 / React 19]
    B --> D[Backend: Spring Boot 3.3+]
    D --> E[(PostgreSQL 16)]
    D --> F[(Redis 7 - Pub/Sub + Cache)]
    D --> G[AI Moderation Service]
    G --> H[Ollama Server<br>Llama-Guard-3 / Qwen2.5-VL / Llava]
    D <--> I[WebSocket + STOMP]
    D <--> J[WebRTC Signaling]
    C <--> I
    C <--> J
```

## Tech Stack

![](https://github-readme-tech-stack.vercel.app/api/cards?lineCount=5&line1=next.js,next.js,000000,ffffff;tailwindcss,tailwindcss,06B6D4,ffffff&line2=springboot,springboot,6DB33F,ffffff;java,java,ED8B00,ffffff&line3=postgresql,postgresql,336791,ffffff;redis,redis,DC382D,ffffff;mongodb,mongodb,47A248,ffffff&line4=docker,docker,2496D,ffffff;githubactions,githubactions,2088FF,ffffff;junit,junit,DC0000,ffffff&line5=ollama,ollama,FF6B6B,ffffff;unsloth,unsloth,FF6B6B,ffffff)

## Cấu trúc thư mục

.
├── backend/ # Spring Boot multi-module
├── frontend/ # Next.js 15 project
├── ai/ # AI scripts, notebooks, fine-tuning, datasets
├── docker/ # Dockerfiles & service configs
│ ├── backend/
│ ├── frontend/
│ ├── moderation/
│ ├── ollama/
│ └── configs/ # nginx, postgres, redis, ollama
├── .github/
│ └── workflows/ # CI/CD pipelines
├── test-reports/ # Auto-generated test reports (JUnit, Jest, ...)
├── docker-compose.yml
└── README.md

## Người thực hiện

Họ tên: Đỗ Quang Huy
MSSV: B2205870
Email: huyb2205870@student.ctu.edu.vn
Trường: Đại học Cần Thơ (CTU)
