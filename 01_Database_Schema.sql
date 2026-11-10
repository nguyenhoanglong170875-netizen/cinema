-- ====================================================================
-- HỆ THỐNG ĐẶT VÉ XEM PHIM - CSDL CHUẨN CÓ PHÂN QUYỀN HẠN (RBAC)
-- Môn: Hệ Quản Trị Cơ Sở Dữ Liệu (HQTCSDL)
-- ====================================================================

USE master;
GO

IF DB_ID('RapChieuPhimDB') IS NOT NULL
BEGIN
    ALTER DATABASE RapChieuPhimDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE RapChieuPhimDB;
END
GO

CREATE DATABASE RapChieuPhimDB;
GO

USE RapChieuPhimDB;
GO

-- ====================================================================
-- PHÂN HỆ 1: PHÂN QUYỀN HẠN (ROLE-BASED ACCESS CONTROL - RBAC)
-- ====================================================================

-- 1. Bảng Vai Trò (Roles)
CREATE TABLE VaiTro (
    MaVaiTro VARCHAR(20) PRIMARY KEY, -- 'KhachHang', 'NhanVien', 'Admin'
    TenVaiTro NVARCHAR(50) NOT NULL,
    MoTa NVARCHAR(255)
);
GO

-- 2. Bảng Quyền Hạn (Permissions)
CREATE TABLE QuyenHan (
    MaQuyen VARCHAR(50) PRIMARY KEY, -- 'XEM_LICH_CHIEU', 'DAT_VE', 'SOAT_VE', 'DOI_GIA_VE', 'THEM_PHIM', 'QUAN_LY_USER'
    TenQuyen NVARCHAR(100) NOT NULL,
    NhomQuyen NVARCHAR(50) NOT NULL
);
GO

-- 3. Bảng Quan hệ Vai Trò - Quyền Hạn
CREATE TABLE VaiTro_QuyenHan (
    MaVaiTro VARCHAR(20) FOREIGN KEY REFERENCES VaiTro(MaVaiTro),
    MaQuyen VARCHAR(50) FOREIGN KEY REFERENCES QuyenHan(MaQuyen),
    PRIMARY KEY (MaVaiTro, MaQuyen)
);
GO

-- 4. Bảng Người Dùng / Khách Hàng (Users)
CREATE TABLE KhachHang (
    MaKH INT IDENTITY(1,1) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    SoDienThoai VARCHAR(15) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL DEFAULT '123456',
    MaVaiTro VARCHAR(20) NOT NULL DEFAULT 'KhachHang' FOREIGN KEY REFERENCES VaiTro(MaVaiTro),
    DiemTichLuy INT DEFAULT 100,
    TrangThai NVARCHAR(20) DEFAULT N'Hoạt Động',
    NgayTao DATETIME DEFAULT GETDATE()
);
GO

-- ====================================================================
-- PHÂN HỆ 2: NGHIỆP VỤ RẠP CHIẾU PHIM
-- ====================================================================

-- 5. Bảng Phim
CREATE TABLE Phim (
    MaPhim INT IDENTITY(1,1) PRIMARY KEY,
    TenPhim NVARCHAR(150) NOT NULL,
    ThoiLuong INT NOT NULL, -- Phút
    DoTuoi INT DEFAULT 13,
    Poster VARCHAR(255) NULL
);
GO

-- 6. Bảng Phòng Chiếu
CREATE TABLE PhongChieu (
    MaPhong INT IDENTITY(1,1) PRIMARY KEY,
    TenPhong NVARCHAR(50) NOT NULL,
    TongSoGhe INT NOT NULL
);
GO

-- 7. Bảng Suất Chiếu
CREATE TABLE SuatChieu (
    MaSuatChieu INT IDENTITY(1,1) PRIMARY KEY,
    MaPhim INT FOREIGN KEY REFERENCES Phim(MaPhim),
    MaPhong INT FOREIGN KEY REFERENCES PhongChieu(MaPhong),
    GioBatDau DATETIME NOT NULL,
    GiaVeCoBan DECIMAL(18,2) NOT NULL DEFAULT 90000
);
GO

-- 8. Bảng Ghế
CREATE TABLE Ghe (
    MaGhe INT IDENTITY(1,1) PRIMARY KEY,
    MaPhong INT FOREIGN KEY REFERENCES PhongChieu(MaPhong),
    SoGhe VARCHAR(10) NOT NULL, -- 'A01', 'A02', 'B01'...
    LoaiGhe NVARCHAR(20) DEFAULT N'Thường', -- 'Thường', 'VIP', 'Sweetbox'
    CONSTRAINT UQ_Phong_SoGhe UNIQUE (MaPhong, SoGhe)
);
GO

-- 9. Bảng Vé (Quản lý trạng thái từng ghế theo suất chiếu)
CREATE TABLE Ve (
    MaVe INT IDENTITY(1,1) PRIMARY KEY,
    MaSuatChieu INT FOREIGN KEY REFERENCES SuatChieu(MaSuatChieu),
    MaGhe INT FOREIGN KEY REFERENCES Ghe(MaGhe),
    MaKH INT NULL FOREIGN KEY REFERENCES KhachHang(MaKH),
    GiaTien DECIMAL(18,2) NOT NULL,
    TrangThai NVARCHAR(30) NOT NULL DEFAULT N'Trống', -- N'Trống', N'Đang Giữ', N'Đã Đặt', N'Đã Soát Vé'
    ThoiGianDat DATETIME NULL,
    NguoiSoatVe INT NULL FOREIGN KEY REFERENCES KhachHang(MaKH),
    ThoiGianSoatVe DATETIME NULL,
    CONSTRAINT UQ_SuatChieu_Ghe UNIQUE (MaSuatChieu, MaGhe)
);
GO

-- 10. Bảng Hóa Đơn
CREATE TABLE HoaDon (
    MaHoaDon INT IDENTITY(1,1) PRIMARY KEY,
    MaCode VARCHAR(20) UNIQUE NOT NULL, -- 'CNX-88219'
    MaKH INT FOREIGN KEY REFERENCES KhachHang(MaKH),
    NgayLap DATETIME DEFAULT GETDATE(),
    TongTien DECIMAL(18,2) NOT NULL DEFAULT 0,
    TrangThai NVARCHAR(50) DEFAULT N'Đã Thanh Toán'
);
GO

-- ====================================================================
-- SEED DATA: PHÂN QUYỀN & TÀI KHOẢN
-- ====================================================================

-- 1. Nạp Vai Trò
INSERT INTO VaiTro (MaVaiTro, TenVaiTro, MoTa) VALUES
('KhachHang', N'Khách Hàng Thành Viên', N'Xem phim, đặt vé, tích điểm thành viên, xem vé cá nhân'),
('NhanVien',  N'Nhân Viên Rạp / Bán Vé', N'Bán vé tại quầy (POS), soát vé (Check-in), kiểm tra ghế phòng chiếu'),
('Admin',     N'Quản Trị Viên Hệ Thống', N'Toàn quyền: Đổi giá vé, thêm phim, thêm ghế, phân quyền, xem báo cáo doanh thu');

-- 2. Nạp Quyền Hạn
INSERT INTO QuyenHan (MaQuyen, TenQuyen, NhomQuyen) VALUES
('XEM_PHIM',       N'Xem phim và lịch chiếu',       N'Khách Hàng'),
('DAT_VE',         N'Đặt vé và chọn ghế',          N'Khách Hàng'),
('XEM_VE_CA_NHAN', N'Xem lịch sử vé của chính mình', N'Khách Hàng'),
('SOAT_VE',        N'Soát vé khách hàng vào rạp',   N'Nhân Viên'),
('BAN_VE_QUAY',    N'Bán vé tại quầy cho khách',    N'Nhân Viên'),
('XEM_DANH_SACH_VE', N'Xem tất cả vé bán hôm nay',  N'Nhân Viên'),
('DOI_GIA_VE',     N'Điều chỉnh giá vé suất chiếu', N'Quản Trị'),
('THEM_PHIM',      N'Thêm / Sửa / Xóa phim',        N'Quản Trị'),
('THEM_GHE_PHU',   N'Thêm ghế VIP dự phòng',        N'Quản Trị'),
('PHAN_QUYEN_USER',N'Quản lý và phân quyền tài khoản', N'Quản Trị'),
('XEM_DOANH_THU',  N'Xem báo cáo doanh thu rạp',    N'Quản Trị');

-- 3. Gán Quyền cho từng Vai Trò
-- Khách Hàng
INSERT INTO VaiTro_QuyenHan (MaVaiTro, MaQuyen) VALUES
('KhachHang', 'XEM_PHIM'),
('KhachHang', 'DAT_VE'),
('KhachHang', 'XEM_VE_CA_NHAN');

-- Nhân Viên
INSERT INTO VaiTro_QuyenHan (MaVaiTro, MaQuyen) VALUES
('NhanVien', 'XEM_PHIM'),
('NhanVien', 'DAT_VE'),
('NhanVien', 'XEM_VE_CA_NHAN'),
('NhanVien', 'SOAT_VE'),
('NhanVien', 'BAN_VE_QUAY'),
('NhanVien', 'XEM_DANH_SACH_VE');

-- Admin (Toàn quyền)
INSERT INTO VaiTro_QuyenHan (MaVaiTro, MaQuyen)
SELECT 'Admin', MaQuyen FROM QuyenHan;

-- 4. Tạo các tài khoản mẫu cho 3 vai trò
INSERT INTO KhachHang (HoTen, SoDienThoai, Email, MatKhau, MaVaiTro, DiemTichLuy) VALUES 
(N'Nguyễn Văn A', '0901234567', 'a.nguyen@email.com', '123456', 'KhachHang', 500),
(N'Trần Thị B',   '0912345678', 'b.tran@email.com',   '123456', 'KhachHang', 300),
(N'Lê Thu Ngân (Staff)', '0988888888', 'staff@cinema.vn', 'staff123', 'NhanVien',  200),
(N'Vũ Quản Trị (Admin)', '0999999999', 'admin@cinema.vn', 'admin123', 'Admin',     9999);

-- 5. Nạp Phim & Phòng Chiếu
INSERT INTO Phim (TenPhim, ThoiLuong, DoTuoi) VALUES 
(N'Avatar: Dòng Chảy Của Nước', 192, 13),
(N'Oppenheimer', 180, 18),
(N'Doraemon: Bản Giao Hưởng Địa Cầu', 115, 6),
(N'Dune: Hành Tinh Cát 2', 166, 16);

INSERT INTO PhongChieu (TenPhong, TongSoGhe) VALUES 
(N'Phòng 01 (IMAX)', 10),
(N'Phòng 02 (2D Standard)', 10);

INSERT INTO Ghe (MaPhong, SoGhe, LoaiGhe) VALUES 
(1, 'A01', N'Thường'), (1, 'A02', N'Thường'), (1, 'A03', N'Thường'),
(1, 'B01', N'VIP'),    (1, 'B02', N'VIP'),    (1, 'B03', N'VIP'),
(1, 'C01', N'Sweetbox'),(1, 'C02', N'Sweetbox');

INSERT INTO SuatChieu (MaPhim, MaPhong, GioBatDau, GiaVeCoBan) VALUES 
(1, 1, DATEADD(HOUR, 2, GETDATE()), 90000),
(2, 1, DATEADD(HOUR, 6, GETDATE()), 100000);

INSERT INTO Ve (MaSuatChieu, MaGhe, GiaTien, TrangThai)
SELECT 1, MaGhe, 90000, N'Trống'
FROM Ghe
WHERE MaPhong = 1;
GO

-- ====================================================================
-- STORED PROCEDURES HỖ TRỢ PHÂN QUYỀN
-- ====================================================================

-- Kiểm tra xem người dùng có quyền cụ thể hay không
CREATE OR ALTER PROCEDURE sp_KiemTraQuyen
    @MaKH INT,
    @MaQuyen VARCHAR(50),
    @CoQuyen BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 
        FROM KhachHang u
        JOIN VaiTro_QuyenHan vq ON u.MaVaiTro = vq.MaVaiTro
        WHERE u.MaKH = @MaKH AND vq.MaQuyen = @MaQuyen
    )
        SET @CoQuyen = 1;
    ELSE
        SET @CoQuyen = 0;
END;
GO

-- Cập nhật vai trò (Chỉ Admin mới có quyền thực thi)
CREATE OR ALTER PROCEDURE sp_PhanQuyenNguoiDung
    @AdminMaKH INT,
    @TargetMaKH INT,
    @NewMaVaiTro VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra người thực hiện có quyền PHAN_QUYEN_USER hay không
    DECLARE @IsAdmin BIT;
    EXEC sp_KiemTraQuyen @AdminMaKH, 'PHAN_QUYEN_USER', @IsAdmin OUTPUT;

    IF @IsAdmin = 0
    BEGIN
        RAISERROR(N'Từ chối truy cập: Bạn không có quyền phân quyền người dùng!', 16, 1);
        RETURN;
    END

    UPDATE KhachHang
    SET MaVaiTro = @NewMaVaiTro
    WHERE MaKH = @TargetMaKH;

    PRINT N'Cập nhật vai trò thành công cho người dùng: ' + CAST(@TargetMaKH AS NVARCHAR(10));
END;
GO

PRINT N'==> Khởi tạo CSDL RapChieuPhimDB và phân quyền hoàn chỉnh thành công!';
GO
