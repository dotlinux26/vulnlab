# PLAN: Nâng cấp VULNLAB

## 1. UI Consistency — Đồng nhất giao diện
**Vấn đề**: Admin panel (`AdminDashboard`, `AdminLessons`, `AddLabForm`, `GatewayManager`) dùng màu hardcode (`bg-gray-900`, `text-white`) trong khi phần còn lại dùng theme system (`bg-card`, `text-foreground`, `glass-card`).

**Giải pháp**: Refactor toàn bộ Admin pages sang dùng theme-aware classes. Dùng `bg-card border-border rounded-xl` thay vì `bg-gray-900 border-gray-700 rounded-lg`. Giữ nguyên chức năng.

**File ảnh hưởng**: `AdminDashboard.tsx`, `AdminLessons.tsx`, `AddLabForm.tsx`, `GatewayManager.tsx`

---

## 2. Admin Editor nâng cấp
**Vấn đề**: Textarea đơn thuần + nút preview toggle. Cần:
- Upload ảnh → chèn markdown `![alt](url)` tại vị trí con trỏ
- Split screen: edit bên trái, preview bên phải
- Toggle chế độ Edit ↔ Preview

**Giải pháp**: 
- Backend `POST /api/admin/lessons/upload` đã có
- Frontend: Viết component `MarkdownEditor` với split pane
- Dùng `react-resizable-panels` (đã có trong package.json) hoặc CSS flex split
- Textarea → bắt `selectionStart` để chèn ảnh đúng vị trí

**File ảnh hưởng**: `AdminLessons.tsx` → tách `MarkdownEditor.tsx`

---

## 3. Pagination — Chống DDOS
**Vấn đề**: API `/api/lessons`, `/api/labs`, `/api/exams` trả về ALL record. Khi có 100+ bài thì frontend render 100 card cùng lúc.

**Giải pháp**: 
- Backend: Thêm query params `page`, `limit` vào các GET endpoints
- Frontend: Paginated list hoặc "Load More" button
- Mỗi page 12 items

**File ảnh hưởng**: `server.ts` (backend), `api.ts`, `Dashboard.tsx`, `Learning.tsx`, `ExamPage.tsx`

---

## 4. Scroll-to-top button
**Giải pháp**: Component `ScrollToTop` FAB, xuất hiện khi scroll > 300px. Dùng chung cho toàn app.

**File ảnh hưởng**: Tạo mới `ScrollToTop.tsx` + import trong `App.tsx`

---

## 5. Learning Progress — Lưu tiến độ học
**Vấn đề**: Chưa có tracking, học viên không biết đã học tới đâu.

**Giải pháp**:
- Backend: Model `LessonProgress` (userId, lessonId, status: 'reading' | 'completed', updatedAt)
- Backend: API `POST /api/lessons/:id/progress` (cập nhật trạng thái)
- Frontend: 
  - Learning card hiển thị trạng thái (đã đọc/chưa)
  - Progress bar tổng thể (VD: "Đã hoàn thành 5/20 bài")
  - `/learning/:id` tự động đánh dấu "reading" khi mở

**File ảnh hưởng**: `db.ts`, `server.ts`, `api.ts`, `Learning.tsx`, `LearningDetail.tsx`

---

## 6. Deploy workflow — Kéo code không cần rebuild node_modules
**Vấn đề**: `npm install` trên cloud mất thời gian do rebuild sqlite3 native module.

**Giải pháp**: 
- Tạo script `deploy.sh`:
```
git pull
cd backend && npm install --ignore-scripts && npx electron-rebuild || true
cd ../frontend && npm install
pm2 restart all
pm2 save
```
- Hoặc: chuyển sang `better-sqlite3` (đã có trong dependencies) thay vì `sqlite3`

**Tối ưu**: Ưu tiên dùng `better-sqlite3` vì không cần GLIBC build.

---

## Thứ tự ưu tiên
1. Tuần này: UI Consistency + Scroll-to-top
2. Tuần sau: Admin Editor nâng cấp + Pagination
3. Tuần sau nữa: Learning Progress + Deploy script
