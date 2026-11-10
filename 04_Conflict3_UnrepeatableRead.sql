-- ====================================================================
-- XUNG ĐỘT 3: NON-REPEATABLE READ / UNREPEATABLE READ (ĐỌC KHÔNG LẶP LẠI)
-- ====================================================================
-- Tình huống:
-- - Khách hàng (T1) xem giá vé của Suất chiếu 1 (đọc được giá 90,000đ).
-- - Trong lúc khách hàng đang điền thông tin và xác nhận thanh toán (5 giây trễ),
--   quản lý rạp (T2) cập nhật tăng giá vé lên 120,000đ và COMMIT ngay.
-- - Khi T1 tiến hành đọc lại để tính tổng tiền lập hóa đơn, giá vé lại thành 120,000đ!
--   Hai lần đọc trong CÙNG MỘT TRANSACTION cho ra kết quả khác nhau.
-- ====================================================================

USE RapChieuPhimDB;
GO

-- Reset giá vé ban đầu
UPDATE SuatChieu SET GiaVeCoBan = 90000 WHERE MaSuatChieu = 1;
GO

-- ====================================================================
-- 1. THỦ TỤC XEM VÀ THANH TOÁN (GÂY LỖI KHI DÙNG READ COMMITTED)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_KhachHang_DatVe_UnrepeatableRead_Loi
    @MaSuatChieu INT
AS
BEGIN
    SET NOCOUNT ON;
    -- READ COMMITTED chỉ giữ Shared Lock trong lúc đọc, đọc xong nhả khóa ngay!
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    BEGIN TRANSACTION;

    PRINT N'[T1] Lần đọc 1: Kiểm tra giá vé trước khi chọn...';
    DECLARE @GiaLan1 DECIMAL(18,2);
    SELECT @GiaLan1 = GiaVeCoBan FROM SuatChieu WHERE MaSuatChieu = @MaSuatChieu;
    PRINT N'[T1] Giá vé lần 1: ' + CAST(@GiaLan1 AS NVARCHAR(20));

    -- Khách hàng mất 6 giây để nhập thẻ / OTP
    PRINT N'[T1] Đang chờ khách hàng nhập thông tin thanh toán (6 giây)...';
    WAITFOR DELAY '00:00:06';

    PRINT N'[T1] Lần đọc 2: Đọc lại giá vé để lập hóa đơn...';
    DECLARE @GiaLan2 DECIMAL(18,2);
    SELECT @GiaLan2 = GiaVeCoBan FROM SuatChieu WHERE MaSuatChieu = @MaSuatChieu;
    PRINT N'[T1] Giá vé lần 2: ' + CAST(@GiaLan2 AS NVARCHAR(20));

    IF @GiaLan1 <> @GiaLan2
    BEGIN
        PRINT N'[T1-CẢNH BÁO] Phát hiện lỗi Đọc Không Lặp Lại! Giá vé bị thay đổi từ ' 
              + CAST(@GiaLan1 AS NVARCHAR(20)) + N' sang ' + CAST(@GiaLan2 AS NVARCHAR(20));
    END

    COMMIT TRANSACTION;
END;
GO

-- ====================================================================
-- 2. THỦ TỤC QUẢN TRỊ CẬP NHẬT GIÁ VÉ (T2)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_Admin_CapNhatGiaVe
    @MaSuatChieu INT,
    @GiaMoi DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    PRINT N'[T2-Admin] Bắt đầu đổi giá vé...';
    UPDATE SuatChieu
    SET GiaVeCoBan = @GiaMoi
    WHERE MaSuatChieu = @MaSuatChieu;

    COMMIT TRANSACTION;
    PRINT N'[T2-Admin] Đã cập nhật giá mới thành công: ' + CAST(@GiaMoi AS NVARCHAR(20));
END;
GO

-- ====================================================================
-- 3. THỦ TỤC ĐÃ KHẮC PHỤC (SỬ DỤNG REPEATABLE READ)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_KhachHang_DatVe_RepeatableRead_KhacPhuc
    @MaSuatChieu INT
AS
BEGIN
    SET NOCOUNT ON;
    -- REPEATABLE READ: Giữ Shared Lock (S-lock) trên các bản ghi đã đọc cho đến hết transaction
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    BEGIN TRANSACTION;

    PRINT N'[T1-KHẮC PHỤC] Lần đọc 1: Kiểm tra giá vé (đang giữ Shared Lock)...';
    DECLARE @GiaLan1 DECIMAL(18,2);
    SELECT @GiaLan1 = GiaVeCoBan FROM SuatChieu WHERE MaSuatChieu = @MaSuatChieu;
    PRINT N'[T1-KHẮC PHỤC] Giá vé lần 1: ' + CAST(@GiaLan1 AS NVARCHAR(20));

    PRINT N'[T1-KHẮC PHỤC] Khách thanh toán trong 6 giây...';
    WAITFOR DELAY '00:00:06';

    PRINT N'[T1-KHẮC PHỤC] Lần đọc 2: Đọc lại giá vé để lập hóa đơn...';
    DECLARE @GiaLan2 DECIMAL(18,2);
    SELECT @GiaLan2 = GiaVeCoBan FROM SuatChieu WHERE MaSuatChieu = @MaSuatChieu;
    PRINT N'[T1-KHẮC PHỤC] Giá vé lần 2: ' + CAST(@GiaLan2 AS NVARCHAR(20));

    COMMIT TRANSACTION;
    PRINT N'[T1-KHẮC PHỤC] Giao dịch hoàn tất! Giá vé luôn đồng nhất.';
END;
GO

/*
-- ====================================================================
-- HƯỚNG DẪN TEST:
-- ====================================================================

--- TEST KỊCH BẢN LỖI ---
-- Đặt lại giá ban đầu:
UPDATE SuatChieu SET GiaVeCoBan = 90000 WHERE MaSuatChieu = 1;

-- Session 1 (Khách hàng):
EXEC sp_KhachHang_DatVe_UnrepeatableRead_Loi @MaSuatChieu = 1;

-- Session 2 (Admin - chạy ngay sau Session 1 1-2 giây):
EXEC sp_Admin_CapNhatGiaVe @MaSuatChieu = 1, @GiaMoi = 120000;

-- Kết quả: Session 2 cập nhật thành công ngay lập tức. Session 1 ở lần đọc 2 thấy giá biến thành 120,000!


--- TEST KỊCH BẢN ĐÃ KHẮC PHỤC ---
-- Đặt lại giá ban đầu:
UPDATE SuatChieu SET GiaVeCoBan = 90000 WHERE MaSuatChieu = 1;

-- Session 1 (Khách hàng):
EXEC sp_KhachHang_DatVe_RepeatableRead_KhacPhuc @MaSuatChieu = 1;

-- Session 2 (Admin - chạy ngay sau Session 1 1-2 giây):
EXEC sp_Admin_CapNhatGiaVe @MaSuatChieu = 1, @GiaMoi = 120000;

-- Kết quả: Session 2 sẽ bị chặn (chờ) cho đến khi Session 1 đọc xong lần 2 và COMMIT. Hai lần đọc của T1 đều là 90,000!
*/
