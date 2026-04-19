# 💰 FinanceVN — Hệ thống Quản lý Tài chính Cá nhân

> Personal Finance Management System — Node.js + ReactJS + PostgreSQL

---

## 🗂 Cấu trúc dự án

```
finance-app/
├── backend/
│   └── src/
│       ├── db/
│       │   ├── index.js          # PostgreSQL pool
│       │   └── schema.sql        # Toàn bộ schema + default data
│       ├── middleware/
│       │   └── auth.js           # JWT middleware
│       ├── routes/
│       │   ├── auth.js           # Đăng ký / Đăng nhập
│       │   ├── transactions.js   # CRUD giao dịch + budget alerts
│       │   ├── dashboard.js      # Summary, chart data, recent
│       │   ├── misc.js           # Categories, budgets, notifications, predictions
│       │   └── import.js         # Import CSV
│       └── app.js                # Entry point Express
│
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.js    # Auth state + JWT storage
        ├── services/
        │   └── api.js            # Axios client + all API methods
        ├── components/
        │   └── Layout.js         # Sidebar + routing layout
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js      # Charts + summary
        │   ├── Transactions.js   # CRUD với filter + phân trang
        │   ├── Budgets.js        # Progress bars + alerts
        │   ├── Notifications.js
        │   └── Predictions.js    # Trend chart + dự đoán
        ├── App.js                # Routes + Auth guards
        └── App.css               # Design system
```

---

## 🚀 Cách cài đặt và chạy

### Yêu cầu
- Node.js v18+
- PostgreSQL 14+
- npm hoặc yarn

---

### 1. Cài đặt Database

```bash
# Tạo database
createdb personal_finance

# Chạy schema (tạo bảng + dữ liệu mặc định)
psql personal_finance < backend/src/db/schema.sql
```

---

### 2. Backend

```bash
cd backend

# Copy và điền thông tin
cp .env.example .env
```

Mở `.env` và điền:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=personal_finance
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD    # <-- thay bằng mật khẩu PostgreSQL của bạn
JWT_SECRET=finance_secret_2026  # <-- đổi thành chuỗi bất kỳ
```

```bash
npm install
npm start
# → Server chạy tại http://localhost:5000
```

---

### 3. Frontend

```bash
cd frontend
npm install
npm start
# → App mở tại http://localhost:3000
```

---

## ✅ Danh sách API

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/login | Đăng nhập |
| GET | /api/auth/me | Thông tin user |
| GET | /api/transactions | Danh sách (có filter + phân trang) |
| POST | /api/transactions | Tạo giao dịch |
| PUT | /api/transactions/:id | Cập nhật |
| DELETE | /api/transactions/:id | Xóa |
| GET | /api/dashboard/summary | Tổng quan tháng |
| GET | /api/dashboard/by-category | Biểu đồ danh mục |
| GET | /api/dashboard/monthly-trend | Xu hướng 6 tháng |
| GET | /api/dashboard/recent | Giao dịch gần đây |
| GET | /api/categories | Danh sách danh mục |
| POST | /api/categories | Tạo danh mục |
| GET | /api/budgets | Ngân sách tháng |
| POST | /api/budgets | Tạo/cập nhật ngân sách |
| DELETE | /api/budgets/:id | Xóa ngân sách |
| GET | /api/notifications | Danh sách thông báo |
| PATCH | /api/notifications/:id/read | Đánh dấu đã đọc |
| PATCH | /api/notifications/read-all | Đọc tất cả |
| GET | /api/predictions/monthly | Dự đoán tháng tới |
| POST | /api/import/csv | Import file CSV |

---

## 📋 Mẫu file CSV để import

```csv
date,amount,type,category,description
2026-03-01,50000,expense,Ăn uống,Cà phê buổi sáng
2026-03-02,120000,expense,Di chuyển,Đi xe công nghệ
2026-03-02,1500000,income,Lương,Lương tháng 3
```

---

## 🔒 Bảo mật
- Mật khẩu mã hóa bằng bcrypt (salt 12)
- Xác thực bằng JWT, hết hạn sau 7 ngày
- Mỗi API đều kiểm tra user_id để phân quyền
- Dữ liệu input được validate trước khi lưu

---

## 📈 Hướng phát triển
- [ ] Tích hợp ngân hàng / ví điện tử
- [ ] Machine learning phân loại giao dịch
- [ ] Xuất báo cáo PDF/Excel
- [ ] Mobile app (React Native)
- [ ] Chia sẻ ngân sách nhóm/gia đình
