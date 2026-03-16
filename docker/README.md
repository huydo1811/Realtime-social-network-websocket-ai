## Cấu trúc thư mục Docker, CI/CD & Test Reports

docker/
├── backend/ # Dockerfile backend (Spring Boot)
├── frontend/ # Dockerfile frontend (Next.js)
├── moderation/ # Dockerfile AI moderation service
├── ollama/ # Dockerfile Ollama server (nếu cần custom)
├── configs/ # Cấu hình cho các service
│ ├── nginx/
│ ├── postgres/
│ ├── redis/
│ └── ollama/

- **.github/workflows/**: Chứa file workflow CI/CD (GitHub Actions).
- **test-reports/backend/**: Lưu báo cáo test JUnit backend (Spring Boot).
- **test-reports/frontend/**: Lưu báo cáo test frontend (Jest, React Testing Library...).

**docker-compose.yml** đặt ở root hoặc trong thư mục docker/ để quản lý toàn bộ service.

---

### Quy ước sử dụng

- **Docker:** Mỗi service (backend, frontend, moderation, ollama) có Dockerfile riêng, cấu hình riêng trong docker/configs.
- **CI/CD:** Workflow tự động build, test, deploy, lưu tại `.github/workflows/`.
- **JUnit/Test Reports:** Báo cáo test tự động sinh ra khi chạy CI/CD, lưu tại `test-reports/` để dễ kiểm tra và upload artifact.

> Cấu trúc này giúp project dễ dàng mở rộng, kiểm thử tự động, triển khai nhanh chóng và teamwork hiệu quả.
