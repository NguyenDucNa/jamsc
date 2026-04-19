# 🎵 JAMSC - Listen Together, Feel Together

JAMSC là ứng dụng nghe nhạc chung theo thời gian thực, cho phép bạn tạo phòng, mời bạn bè, và cùng thưởng thức âm nhạc từ YouTube & SoundCloud.

![JAMSC Landing](https://img.shields.io/badge/JAMSC-Listen_Together-00f5d4?style=for-the-badge&logo=music&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socketdotio&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## ✨ Tính năng

### 🏠 Hệ thống phòng
- Tạo phòng với **mã 6 ký tự** ngẫu nhiên
- Mời bạn bè bằng cách chia sẻ mã phòng
- Tự động chuyển quyền Host khi host rời phòng
- Nút copy mã phòng nhanh

### 🎵 Đồng bộ nhạc thời gian thực
- Phát nhạc **đồng bộ chính xác** giữa tất cả thành viên
- Heartbeat sync mỗi 5 giây, tự chỉnh drift > 2s
- Server-authoritative model đảm bảo tính nhất quán
- Tự động phát bài tiếp theo khi hết bài

### 🎧 Đa nguồn nhạc
- **YouTube** — Hỗ trợ mọi link youtube.com/watch, youtu.be, YouTube Shorts
- **YouTube Music** — Tự động chuyển đổi link music.youtube.com
- **SoundCloud** — Hỗ trợ mọi bài hát công khai trên SoundCloud

### 🔒 Quản lý quyền (Host Controls)
- **Cho phép / Tắt tua nhạc** — Ngăn thành viên tua tới/lui
- **Cho phép / Tắt thêm bài** — Kiểm soát ai được thêm vào hàng chờ
- Chỉ Host có quyền: play/pause, chuyển bài, xóa bài, thay đổi cài đặt

### 💬 Chat & Tương tác
- Chat text trong phòng
- Thông báo khi có người tham gia / rời phòng
- Hiển thị danh sách thành viên với role badge

### 🎨 Giao diện Premium
- Dark theme với glassmorphism
- Neon accents (cyan, purple, magenta)
- Particles background animation
- Responsive design (desktop + mobile)
- Smooth micro-animations

---

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────┐
│              Browser (Client)            │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ │
│  │ YouTube │ │SoundCloud│ │ Socket.IO │ │
│  │ IFrame  │ │  Widget  │ │  Client   │ │
│  └─────────┘ └──────────┘ └─────┬─────┘ │
└─────────────────────────────────┼───────┘
                                  │ WebSocket
┌─────────────────────────────────┼───────┐
│           Node.js Server        │       │
│  ┌──────────┐  ┌────────────┐  ┌┴─────┐ │
│  │  Express  │  │ Socket.IO  │  │ REST │ │
│  │  Static   │  │   Server   │  │ API  │ │
│  └──────────┘  └─────┬──────┘  └──────┘ │
│         ┌────────────┼────────────┐      │
│    ┌────┴────┐ ┌─────┴─────┐ ┌───┴───┐  │
│    │  Room   │ │  Queue    │ │ Sync  │  │
│    │ Manager │ │  Manager  │ │Manager│  │
│    └─────────┘ └───────────┘ └───────┘  │
└─────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
jamsc/
├── server/
│   ├── package.json          # Dependencies
│   ├── index.js              # Express + Socket.IO server
│   ├── roomManager.js        # Room CRUD, permissions
│   ├── queueManager.js       # Queue operations per room
│   └── syncManager.js        # Playback synchronization
├── public/
│   ├── index.html            # Single Page Application
│   ├── css/
│   │   └── style.css         # Dark theme, glassmorphism
│   └── js/
│       ├── app.js            # Main coordinator
│       ├── socket.js         # Socket.IO client wrapper
│       ├── player.js         # Unified YT + SC player
│       ├── queue.js          # Queue UI
│       ├── room.js           # Room UI & permissions
│       └── ui.js             # Toast, particles, utilities
├── vercel.json               # Vercel deployment config
└── README.md
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu
- **Node.js** >= 18.x
- **npm** >= 9.x

### Cài đặt local

```bash
# 1. Clone repository
git clone https://github.com/your-username/jamsc.git
cd jamsc

# 2. Cài dependencies
cd server
npm install

# 3. Chạy server
node index.js
# hoặc với auto-reload:
npm run dev
```

Server sẽ chạy tại **http://localhost:3000**

### Sử dụng

1. Mở trình duyệt tại `http://localhost:3000`
2. **Tạo phòng** — Nhập tên → nhận mã phòng 6 ký tự
3. **Chia sẻ mã phòng** cho bạn bè
4. **Bạn bè tham gia** — Nhập mã phòng + tên
5. **Dán link nhạc** YouTube hoặc SoundCloud → nhấn ➕
6. **Nhấn Play** → tất cả cùng nghe đồng bộ!

---

## ☁️ Deploy lên Vercel

### Cách 1: Vercel CLI

```bash
# 1. Cài Vercel CLI
npm install -g vercel

# 2. Deploy
cd jamsc
vercel
```

### Cách 2: Vercel Dashboard

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → Import Project
3. Chọn repository → Deploy

> ⚠️ **Lưu ý:** Vercel sử dụng serverless functions. Socket.IO sẽ hoạt động qua HTTP long-polling (fallback) thay vì WebSocket thuần. App vẫn hoạt động bình thường nhưng có thể có độ trễ cao hơn so với chạy trên server truyền thống.

### Deploy trên nền tảng khác (khuyến nghị cho WebSocket)

| Nền tảng | Ưu điểm | Lệnh deploy |
|----------|---------|-------------|
| **Railway** | WebSocket đầy đủ, free tier | `railway up` |
| **Render** | WebSocket, auto-deploy từ Git | Dashboard |
| **Fly.io** | WebSocket, global edge | `fly launch` |

---

## 🔧 Cấu hình

### Biến môi trường

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `PORT` | `3000` | Port server lắng nghe |

### Room Settings (runtime)

| Cài đặt | Mặc định | Mô tả |
|---------|----------|-------|
| `allowSeek` | `false` | Cho phép thành viên tua nhạc |
| `allowQueueAdd` | `true` | Cho phép thành viên thêm bài |

---

## 🛠️ Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Runtime** | Node.js |
| **HTTP Server** | Express.js |
| **Real-time** | Socket.IO |
| **Frontend** | Vanilla HTML/CSS/JS |
| **YouTube** | YouTube IFrame Player API |
| **SoundCloud** | SoundCloud Widget API |
| **Metadata** | YouTube & SoundCloud oEmbed API |
| **Font** | Google Fonts (Inter) |

---

## 📄 License

MIT License — Tự do sử dụng, chỉnh sửa và phân phối.
