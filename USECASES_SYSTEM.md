# Use Case Tong Hop He Thong

Tai lieu nay liet ke use case tu code hien tai cho 2 actor chinh:
- **Nguoi dung (User)**
- **Quan tri vien (Admin)**

Phan nay duoc tong hop tu `backend`, `frontend`, `ai-service` (route/controller/usecase class + trang UI).

---

## 1) Nguoi dung (User)

### 1.1 Xac thuc va tai khoan
- Dang ky tai khoan
- Dang nhap
- Lam moi token
- Dang xuat
- Yeu cau OTP
- Xac minh OTP
- Dat lai mat khau bang OTP
- Doi mat khau
- Xem/cap nhat ho so ca nhan
- Xem ho so nguoi khac
- Tim kiem nguoi dung

### 1.2 Mang xa hoi (bai viet, tuong tac)
- Tao bai viet
- Sua bai viet
- Xoa bai viet
- Doi quyen rieng tu bai viet (PUBLIC/FRIENDS/PRIVATE)
- Xem newsfeed
- Xem bai theo user
- Xem bai theo pet
- Like bo like bai viet
- Binh luan bai viet
- Tra loi binh luan
- Like bo like binh luan
- Chia se bai viet
- Bao cao bai viet
- Bao cao binh luan
- An bai viet khoi feed ca nhan

### 1.3 Ban be va theo doi
- Gui loi moi ket ban
- Chap nhan loi moi ket ban
- Tu choi loi moi ket ban
- Huy loi moi da gui
- Xoa ban
- Chan nguoi dung
- Bo chan nguoi dung
- Xem danh sach ban be
- Xem danh sach loi moi den/di
- Xem danh sach nguoi da chan
- Theo doi nguoi dung
- Bo theo doi
- Xem trang thai follow
- Xem danh sach dang theo doi
- Xem goi y theo doi

### 1.4 Nhom (Groups)
- Tao nhom
- Kham pha nhom
- Xem chi tiet nhom
- Xem danh sach nhom cua toi
- Gui yeu cau tham gia nhom
- Xem thanh vien nhom
- Dang bai trong nhom
- Xem bai trong nhom
- Xem feed bai nhom
- (Truong nhom) Duyet/tu choi thanh vien
- (Truong nhom) Duyet/tu choi bai viet nhom

### 1.5 Chat va tin nhan
- Tao hoi thoai
- Xem danh sach hoi thoai
- Xem chi tiet hoi thoai
- Gui tin nhan
- Sua tin nhan
- Xoa tin nhan
- Gui tin nhan kem file
- Tai file dinh kem
- Danh dau da doc
- Xem trang thai da doc
- Gui trang thai dang go
- Cap nhat/xem presence
- Gan sao tin nhan
- Tuy chinh giao dien hoi thoai (background, bubble, ...)
- Chan bo chan trong chat

### 1.6 Cuoc goi (WebRTC qua WebSocket)
- Goi/moi cuoc goi
- Chap nhan tu choi ket thuc huy cuoc goi
- Trao doi SDP offer/answer
- Gui ICE candidate
- Reconnect cuoc goi

### 1.7 Thu cung
- Tao thu cung
- Xem/sua/xoa thu cung
- Xem danh sach thu cung cua toi
- Xem thu cung cua user khac
- Xem danh sach giong loai

### 1.8 So suc khoe va nhac nho
- Them/xem/sua/xoa ho so suc khoe
- Them/xem lich nhac
- Danh dau hoan thanh nhac nho
- Bo qua nhac nho
- Xem nhac nho sap toi
- Xem nhac nho den han
- Ghi nhan can nang
- Ghi nhan an uong
- Ghi nhan hoat dong

### 1.9 Di dao va meetup
- Tao phien di dao
- Ket thuc phien di dao
- Xem lich su phien di dao
- Tim phien di dao gan day
- Gui loi moi meetup
- Chap nhan loi moi meetup
- Tu choi loi moi meetup
- Xem meetup da nhan/da gui
- Xem cac phien da tham gia

### 1.10 Tro ly va thu y
- Tim phong kham thu y gan day
- Gui trieu chung de chan doan (rule-based)
- Xem lich su/chi tiet chan doan
- Xem social health summary
- Xem social prompts
- Xem social badges

---

## 2) Quan tri vien (Admin)

### 2.1 Quan tri nguoi dung
- Tao user
- Cap nhat user
- Xoa user
- Xem danh sach user

### 2.2 Quan tri ban be/friendship
- Xem quan he cua user
- Force block friendship
- Force remove friendship

### 2.3 Quan tri bai viet/noi dung
- An bai viet
- Bo an bai viet
- An binh luan
- Xem danh sach bao cao noi dung
- Resolve bao cao
- Reject bao cao

### 2.4 Quan tri AI moderation
- Xem audit log moderation
- Danh dau audit da xu ly

### 2.5 Quan tri chat
- Xem danh sach hoi thoai
- Xem tin nhan cua hoi thoai
- Xoa tin nhan
- Xem audit log chat
- Quan ly background preset
- Xem/sua appearance cua hoi thoai

### 2.6 Quan tri cuoc goi
- Xem danh sach call sessions
- Xem call sessions theo user
- Xem event log cua 1 cuoc goi

### 2.7 Quan tri thu cung
- Xem thong ke thu cung toan he thong
- Tim kiem/liet ke thu cung
- Xem chi tiet pet
- Xem pet theo user
- Liet ke reminders/diagnoses/walks toan he thong
- Drilldown du lieu pet theo owner

### 2.8 Dashboard
- Xem so lieu tong quan he thong
- Loc theo khoang ngay
- Loc nang cao danh sach bao cao
- Xuat CSV

---

## 3) Ghi chu AI-service

- `ai-service` hien chi co:
  - `GET /healthz`
  - `POST /predict` (profanity text moderation)
- AI-service duoc goi **tu backend moderation module**, khong goi truc tiep tu frontend.
- Hien chua co image moderation endpoint trong `ai-service` de quet anh/video post.

---

## 4) Cac route/chuc nang dang noi bat de ve so do

### User
- Auth, Profile, Feed/Post, Comment/Reply, Report
- Friendship + Follow
- Groups + Group posts moderation (owner)
- Chat + Realtime + Call
- Pets + Health + Reminders + Walk + Meetup
- Vet nearby + Diagnosis + Social sharing/badges

### Admin
- User CRUD
- Content moderation (reports, hide post/comment)
- AI moderation audit
- Chat moderation
- Call audit
- Pet admin analytics/operations

