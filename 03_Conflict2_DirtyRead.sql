-- ====================================================================
-- XUNG ĐỘT 2: DIRTY READ (ĐỌC DỮ LIỆU RÁC / CHƯA ĐƯỢC COMMIT)
-- ====================================================================
-- Tình huống (gắn với bước THANH TOÁN bắt buộc của website):
-- - Giao dịch 1 (T1 - Khách A): chọn ghế B02 và bấm thanh toán. Hệ thống UPDATE ghế sang
--   "Đã Đặt" rồi chờ cổng ngân hàng xác thực OTP (transaction CHƯA COMMIT). Ngân hàng từ
--   chối thẻ nên T1 ROLLBACK -> ghế thực tế vẫn "Trống".
-- - Giao dịch 2 (T2 - Khách B): màn hình sơ đồ ghế chạy ở mức READ UNCOMMITTED
--   (hoặc dùng gợi ý WITH (NOLOCK)) nên đọc xuyên qua X-Lock của T1 và thấy B02 = "Đã Đặt".
-- - Khách B tưởng ghế đã bán nên bỏ qua. Trạng thái "Đã Đặt" đó CHƯA TỪNG được COMMIT
--   -> Khách B đã đọc dữ liệu "rác", cửa hàng mất một ghế có thể bán.
--
-- Cách khắc phục: READ COMMITTED (mặc định của SQL Server). T2 phải xin S-Lock, bị chặn
-- bởi X-Lock của T1 cho đến khi T1 COMMIT/ROLLBACK, nên chỉ đọc dữ liệu đã COMMIT.
-- ====================================================================

USE RapChieuPhimDB;
GO

-- Reset: đưa ghế B02 của Suất chiếu 1 về "Trống"
UPDATE Ve
SET TrangThai = N'Trống', MaKH = NULL, ThoiGianDat = NULL
WHERE MaSuatChieu = 1
  AND MaGhe = (SELECT MaGhe FROM Ghe WHERE MaPhong = 1 AND SoGhe = 'B02');
GO

-- ====================================================================
-- 1. THỦ TỤC CHO GIAO DỊCH 1 (THANH TOÁN THẤT BẠI -> ROLLBACK)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_ThanhToan_ThatBai_Rollback
    @MaSuatChieu INT,
    @SoGhe VARCHAR(10),
    @MaKH INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaGhe INT = (SELECT MaGhe FROM Ghe WHERE MaPhong = 1 AND SoGhe = @SoGhe);

    BEGIN TRANSACTION;

    PRINT N'[T1] Khách A thanh toán: UPDATE ghế ' + @SoGhe + N' sang "Đã Đặt" (giữ X-Lock, chưa COMMIT)...';
    UPDATE Ve
    SET TrangThai = N'Đã Đặt', MaKH = @MaKH, ThoiGianDat = GETDATE()
    WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe;

    PRINT N'[T1] Đang chờ ngân hàng xác thực OTP (chờ 8 giây)...';
    WAITFOR DELAY '00:00:08';

    PRINT N'[T1] Ngân hàng TỪ CHỐI thẻ! Thực hiện ROLLBACK, ghế quay về "Trống".';
    ROLLBACK TRANSACTION;
END;
GO

-- ====================================================================
-- 2. THỦ TỤC CHO GIAO DỊCH 2 - BỊ LỖI DIRTY READ (READ UNCOMMITTED)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_XemSoDoGhe_DirtyRead_Loi
    @MaSuatChieu INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Cho phép đọc dữ liệu chưa COMMIT (tương đương WITH (NOLOCK) trên mọi bảng)
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    PRINT N'[T2-LỖI] Khách B xem sơ đồ ghế bằng READ UNCOMMITTED...';

    SELECT g.SoGhe, g.LoaiGhe, v.TrangThai
    FROM Ve v
    JOIN Ghe g ON g.MaGhe = v.MaGhe
    WHERE v.MaSuatChieu = @MaSuatChieu
    ORDER BY g.SoGhe;

    DECLARE @DaDat INT = (SELECT COUNT(*) FROM Ve WHERE MaSuatChieu = @MaSuatChieu AND TrangThai = N'Đã Đặt');
    PRINT N'[T2-LỖI] Tổng ghế "Đã Đặt" đọc được: ' + CAST(@DaDat AS NVARCHAR(10)) + N' (có thể gồm dữ liệu bẩn của T1)';
END;
GO

-- ====================================================================
-- 3. THỦ TỤC CHO GIAO DỊCH 2 - ĐÃ KHẮC PHỤC (READ COMMITTED)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_XemSoDoGhe_KhacPhuc
    @MaSuatChieu INT
AS
BEGIN
    SET NOCOUNT ON;
    -- READ COMMITTED: SELECT phải xin S-Lock. Khi T1 đang giữ X-Lock, T2 bị BLOCK
    -- cho đến khi T1 COMMIT/ROLLBACK nên không bao giờ đọc dữ liệu chưa COMMIT.
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

    PRINT N'[T2-KHẮC PHỤC] Khách B xem sơ đồ ghế bằng READ COMMITTED...';

    SELECT g.SoGhe, g.LoaiGhe, v.TrangThai
    FROM Ve v
    JOIN Ghe g ON g.MaGhe = v.MaGhe
    WHERE v.MaSuatChieu = @MaSuatChieu
    ORDER BY g.SoGhe;

    DECLARE @DaDat INT = (SELECT COUNT(*) FROM Ve WHERE MaSuatChieu = @MaSuatChieu AND TrangThai = N'Đã Đặt');
    PRINT N'[T2-KHẮC PHỤC] Tổng ghế "Đã Đặt" (chỉ tính dữ liệu đã COMMIT): ' + CAST(@DaDat AS NVARCHAR(10));
END;
GO

/*
-- ====================================================================
-- HƯỚNG DẪN TEST (mở 2 cửa sổ query trong SSMS)
-- ====================================================================

--- TEST KỊCH BẢN LỖI (DIRTY READ) ---
-- Cửa sổ 1 (T1) - chạy trước:
EXEC sp_ThanhToan_ThatBai_Rollback @MaSuatChieu = 1, @SoGhe = 'B02', @MaKH = 1;

-- Cửa sổ 2 (T2) - chạy NGAY khi T1 đang WAITFOR DELAY:
EXEC sp_XemSoDoGhe_DirtyRead_Loi @MaSuatChieu = 1;

-- Kết quả: T2 thấy B02 = "Đã Đặt". Sau 8 giây T1 ROLLBACK, kiểm tra lại:
SELECT g.SoGhe, v.TrangThai FROM Ve v JOIN Ghe g ON g.MaGhe = v.MaGhe
WHERE v.MaSuatChieu = 1 AND g.SoGhe = 'B02';   -- B02 thực tế vẫn "Trống"


--- TEST KỊCH BẢN ĐÃ KHẮC PHỤC ---
-- Cửa sổ 1 (T1):
EXEC sp_ThanhToan_ThatBai_Rollback @MaSuatChieu = 1, @SoGhe = 'B02', @MaKH = 1;

-- Cửa sổ 2 (T2) - chạy NGAY khi T1 đang WAITFOR DELAY:
EXEC sp_XemSoDoGhe_KhacPhuc @MaSuatChieu = 1;

-- Kết quả: T2 bị BLOCK cho đến khi T1 ROLLBACK xong, rồi đọc B02 = "Trống" (dữ liệu thật).

--- PHƯƠNG ÁN KHÁC: KHÔNG MUỐN T2 PHẢI CHỜ ---
-- Bật READ_COMMITTED_SNAPSHOT: T2 đọc phiên bản đã COMMIT gần nhất mà không bị chặn.
-- ALTER DATABASE RapChieuPhimDB SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
*/
