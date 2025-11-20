# Booking Server (Node.js + Express + PostgreSQL)

## Setup

1. Cài đặt Node.js (>= 16) và PostgreSQL trên máy.
2. Tạo file `.env` trong thư mục này với nội dung ví dụ:

```
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/bookingdb
```

3. Cài đặt dependencies:
```bash
npm install
```

4. Chạy server (dev):
```bash
npm run dev
```

## Scripts
- `npm run dev`: Chạy server với nodemon (hot reload)
- `npm start`: Chạy server bình thường

## Dependencies
- express
- pg
- cors
- dotenv
- nodemon (dev)

## Endpoints
- `POST /booking`: Tạo booking mới
- `GET /bookings`: Lấy danh sách booking
- (Có thể mở rộng thêm các endpoint khác)

## Ghi chú
- Đảm bảo PostgreSQL đã chạy và đã tạo database `bookingdb` (hoặc tên khác, chỉnh lại trong .env)
- Xem mã nguồn để biết chi tiết các endpoint và validate.
