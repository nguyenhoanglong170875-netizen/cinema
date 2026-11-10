# CINEMAX PREMIER - HỆ THỐNG ĐẶT VÉ PHIM & XỬ LÝ TRANH CHẤP SQL SERVER

Hệ thống ứng dụng web đặt vé xem phim chuẩn thương mại tích hợp **Phân quyền hạn người dùng đầy đủ (Role-Based Access Control - RBAC)** và **Bộ thực nghiệm xử lý 5 xung đột dữ liệu kinh điển** trong môn **Hệ Quản Trị Cơ Sở Dữ Liệu (SQL Server)**.

---

## 🌐 TRUY CẬP TRỰC TIẾP TRÊN TRÌNH DUYỆT

Website đang chạy trực tiếp tại:
👉 **[http://localhost:3000](http://localhost:3000)**

*(Khởi động lại khi cần: `npm start` hoặc `node server.js`)*

---

## 👥 HỆ THỐNG PHÂN QUYỀN HẠN ĐẦY ĐỦ (RBAC)

Hệ thống được thiết kế theo mô hình **RBAC 3 cấp độ** chuẩn thực tế:

| Vai Trò | Mã Quyền / Chức Năng Được Phép | Giao Diện Hiển Thị |
| :--- | :--- | :--- |
| **1. Khách Hàng (`KhachHang`)** | • Xem phim, xem lịch chiếu & giá vé.<br>• Chọn ghế trực quan, đặt vé & thanh toán.<br>• Mua combo bắp rang bơ, nước ngọt.<br>• Tích lũy điểm thưởng thành viên.<br>• Xem vé điện tử cá nhân (`E-Ticket`) kèm mã QR.<br>• **Bị chặn (403 Forbidden)** nếu cố vào trang Nhân Viên hoặc Admin. | Trang Chủ, Lịch Chiếu, Bắp Nước, Vé Của Tôi, Lab Tranh Chấp SQL. |
| **2. Nhân Viên Rạp (`NhanVien`)** | • Toàn bộ quyền của Khách hàng.<br>• **Bàn Soát Vé (Check-in Desk):** Quét mã QR hoặc nhập mã vé (`CNX-xxxxx`) để soát vé khách vào phòng chiếu.<br>• Bảng danh sách toàn bộ vé đã bán trong ngày.<br>• Bán vé tại quầy (POS) cho khách vãng lai.<br>• Kiểm tra tình trạng ghế trống các phòng chiếu. | Thấy thêm Tab **"🎫 Bàn Soát Vé"**. Bị chặn nếu cố vào trang Admin. |
| **3. Quản Trị Viên (`Admin`)** | • Toàn quyền hệ thống rạp chiếu phim (Full Control):<br>• **Quản lý Phim & Phòng Chiếu:** Thêm phim mới, bổ sung ghế VIP dự phòng B04 (gây Phantom Read).<br>• **Quản lý Giá Vé & Suất Chiếu:** Điều chỉnh giá vé cơ bản (gây Non-Repeatable Read).<br>• **Phân Quyền Tài Khoản (RBAC):** Thay đổi vai trò giữa Khách Hàng, Nhân Viên, Admin.<br>• **Thống Kê & Báo Cáo:** Doanh thu, số vé bán, tỷ lệ lấp đầy ghế. | Thấy đầy đủ tất cả các Tab, bao gồm **"🛠 Quản Trị Hệ Thống"**. |

---

## ⚡ TÀI KHOẢN TEST NHANH 3 VAI TRÒ (TÍCH HỢP TRÊN NAVBAR)

Trên góc phải thanh điều hướng có sẵn nút **Chuyển nhanh (⚡ Vai trò)** để bạn demo tiện lợi mà không cần gõ lại form:

1. **👤 Khách hàng A:** `a.nguyen@email.com` / `123456` *(Vai trò: `KhachHang` - 500 điểm VIP)*
2. **👥 Khách hàng B:** `b.tran@email.com` / `123456` *(Vai trò: `KhachHang` - 300 điểm)*
3. **🎫 Nhân viên rạp:** `staff@cinema.vn` / `staff123` *(Vai trò: `NhanVien` - Bàn soát vé)*
4. **🛠 Quản trị viên:** `admin@cinema.vn` / `admin123` *(Vai trò: `Admin` - Toàn quyền)*

---

## 🎬 5 TÍNH NĂNG CHÍNH CỦA ỨNG DỤNG

1. **Trang Chủ (Home):**
   - Hero banner phim bom tấn *Avatar 2* (IMAX 3D), điểm IMDb, thời lượng, tag độ tuổi C13, nút mua vé & xem trailer.
   - Danh sách phim đang chiếu tại rạp dạng lưới thẻ có poster, thể loại và đạo diễn.
2. **Lịch Chiếu & Đặt Vé (Full Booking Flow):**
   - Bước 1: Chọn phim và suất chiếu trong ngày (`10:00`, `13:30`, `16:45`, `19:30`, `22:15`).
   - Bước 2: Sơ đồ phòng chiếu IMAX với màn hình cong và 3 loại ghế (Thường: 90k, VIP: 110k, Sweetbox: 160k).
   - Bước 3: Chọn combo bắp nước (Solo, Couple, Family).
   - Bước 4: Tóm tắt hóa đơn và nút thanh toán xuất vé.
3. **Vé Của Tôi & Thẻ Thành Viên (E-Tickets):**
   - Thẻ thành viên điện tử (họ tên, điểm tích lũy, hạng thẻ VIP).
   - Vé xem phim điện tử có mã vé (`CNX-xxxxx`) và mã QR code quét vào rạp.
4. **Bàn Soát Vé Của Nhân Viên (Staff Check-in):**
   - Nhập/quét mã vé để check-in khách vào rạp, cảnh báo chống soát vé trùng 2 lần.
   - Bảng giám sát tất cả vé đã bán hôm nay.
5. **Trung Tâm Quản Trị Hệ Thống (Admin Dashboard):**
   - 4 Thẻ KPI: Doanh thu thực tế, Vé đã bán, Tỷ lệ lấp đầy ghế, Tổng số tài khoản.
   - Bảng phân quyền tài khoản (RBAC): Đổi vai trò tài khoản trực tiếp và lưu vào CSDL.
   - Điều chỉnh giá vé & Bổ sung ghế VIP (tác nhân gây xung đột trong bài HQTCSDL).

---

## ⚡ PHÒNG LAB MÔ PHỎNG 5 TRANH CHẤP DỮ LIỆU SQL SERVER

Nằm ở Tab **"⚡ Lab Tranh Chấp SQL"**:
1. **Lost Update (Mất cập nhật):** Xử lý bằng `WITH (UPDLOCK, ROWLOCK)`.
2. **Dirty Read (Đọc rác):** Khách A thanh toán ghế B02 nhưng ngân hàng từ chối -> `ROLLBACK`, trong khi sơ đồ ghế của Khách B (`READ UNCOMMITTED`) đã hiện "Đã Đặt". Xử lý bằng `READ COMMITTED`.
3. **Non-Repeatable Read (Đọc không lặp lại):** Xử lý bằng `REPEATABLE READ`.
4. **Phantom Read (Bóng ma):** Khách đoàn đếm ghế VIP 2 lần (`REPEATABLE READ`), Admin `INSERT` thêm ghế VIP ở giữa nên số ghế tăng từ 3 lên 4. Xử lý bằng `SERIALIZABLE` (Key-Range Lock trên index `IX_Ghe_Phong_Loai`).
5. **Deadlock (Kẹt chết 2 chiều):** Xử lý bằng **Lock Ordering** và **Retry khi gặp mã lỗi 1205**.

---

## 🗄 CSDL SQL SERVER (`01_Database_Schema.sql`)
- 10 Bảng quan hệ: `VaiTro`, `QuyenHan`, `VaiTro_QuyenHan`, `KhachHang`, `Phim`, `PhongChieu`, `SuatChieu`, `Ghe`, `Ve`, `HoaDon`.
- Stored Procedures kiểm tra quyền: `sp_KiemTraQuyen`, `sp_PhanQuyenNguoiDung`, `sp_DangKy`, `sp_DangNhap`.
