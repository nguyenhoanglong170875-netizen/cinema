-- ====================================================================
-- XUNG ĐỘT 4: PHANTOM READ (BÓNG MA)
-- ====================================================================
-- Tình huống:
-- - Khách hàng đặt vé đoàn (T1) muốn thống kê số lượng ghế VIP còn trống cho Suất chiếu 1.
-- - T1 chạy truy vấn đếm số ghế VIP trống và nhận kết quả là 3 ghế.
-- - Trong lúc T1 đang xử lý danh sách (độ trễ 6 giây), Admin (T2) bổ sung thêm một ghế VIP
--   dự phòng vào phòng chiếu và thêm vé cho Suất chiếu 1, sau đó COMMIT.
-- - T1 thực hiện lại câu lệnh đếm/lấy danh sách thì thấy xuất hiện thêm 1 dòng dữ liệu "bóng ma" (thành 4 ghế).
-- LƯU Ý: Mức REPEATABLE READ chỉ khóa trên các dòng đã tồn tại, KHÔNG chặn được INSERT mới!
-- ====================================================================

USE RapChieuPhimDB;
GO

-- Xóa ghế phụ B04 nếu đã tồn tại từ lần test trước
DELETE FROM Ve WHERE MaGhe IN (SELECT MaGhe FROM Ghe WHERE SoGhe = 'B04' AND MaPhong = 1);
DELETE FROM Ghe WHERE SoGhe = 'B04' AND MaPhong = 1;
GO

-- Index theo (MaPhong, LoaiGhe): SERIALIZABLE sẽ đặt Key-Range Lock lên đúng dải
-- [MaPhong = 1, LoaiGhe = 'VIP'] của index này, nên lệnh INSERT ghế VIP mới luôn bị chặn
-- (kết quả demo ổn định, không phụ thuộc vào kế hoạch thực thi).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ghe_Phong_Loai' AND object_id = OBJECT_ID('Ghe'))
    CREATE INDEX IX_Ghe_Phong_Loai ON Ghe (MaPhong, LoaiGhe);
GO

-- ====================================================================
-- 1. THỦ TỤC THỐNG KÊ GHẾ (GÂY LỖI KHI DÙNG REPEATABLE READ)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_KiemTraGheVIP_Phantom_Loi
    @MaSuatChieu INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Dù dùng REPEATABLE READ, Phantom Read vẫn xảy ra vì chỉ khóa dòng hiện hữu!
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    BEGIN TRANSACTION;

    PRINT N'[T1] Lần 1: Kiểm tra số lượng ghế VIP còn trống...';
    DECLARE @SoLuong1 INT;
    SELECT @SoLuong1 = COUNT(*)
    FROM Ve v
    JOIN Ghe g ON v.MaGhe = g.MaGhe
    WHERE v.MaSuatChieu = @MaSuatChieu 
      AND g.LoaiGhe = N'VIP' 
      AND v.TrangThai = N'Trống';

    PRINT N'[T1] Số ghế VIP trống lần 1: ' + CAST(@SoLuong1 AS NVARCHAR(10));

    PRINT N'[T1] Đang chờ đoàn khách chốt vé (6 giây)...';
    WAITFOR DELAY '00:00:06';

    PRINT N'[T1] Lần 2: Kiểm tra lại số lượng ghế VIP...';
    DECLARE @SoLuong2 INT;
    SELECT @SoLuong2 = COUNT(*)
    FROM Ve v
    JOIN Ghe g ON v.MaGhe = g.MaGhe
    WHERE v.MaSuatChieu = @MaSuatChieu 
      AND g.LoaiGhe = N'VIP' 
      AND v.TrangThai = N'Trống';

    PRINT N'[T1] Số ghế VIP trống lần 2: ' + CAST(@SoLuong2 AS NVARCHAR(10));

    IF @SoLuong2 > @SoLuong1
    BEGIN
        PRINT N'[T1-CẢNH BÁO] Phát hiện PHANTOM READ! Dữ liệu xuất hiện dòng mới (tăng từ ' 
              + CAST(@SoLuong1 AS NVARCHAR(10)) + N' lên ' + CAST(@SoLuong2 AS NVARCHAR(10)) + N')!';
    END

    COMMIT TRANSACTION;
END;
GO

-- ====================================================================
-- 2. THỦ TỤC ADMIN THÊM GHẾ VIP MỚI (T2)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_Admin_ThemGheVIP
    @MaSuatChieu INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    PRINT N'[T2-Admin] Bắt đầu thêm ghế VIP phụ B04 vào phòng...';
    
    INSERT INTO Ghe (MaPhong, SoGhe, LoaiGhe)
    VALUES (1, 'B04', N'VIP');

    DECLARE @NewMaGhe INT = SCOPE_IDENTITY();

    INSERT INTO Ve (MaSuatChieu, MaGhe, GiaTien, TrangThai)
    VALUES (@MaSuatChieu, @NewMaGhe, 90000, N'Trống');

    COMMIT TRANSACTION;
    PRINT N'[T2-Admin] Thêm ghế VIP B04 và vé mới thành công!';
END;
GO

-- ====================================================================
-- 3. THỦ TỤC ĐÃ KHẮC PHỤC (SỬ DỤNG SERIALIZABLE)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_KiemTraGheVIP_Serializable_KhacPhuc
    @MaSuatChieu INT
AS
BEGIN
    SET NOCOUNT ON;
    -- SERIALIZABLE sử dụng Range Lock (Key-Range Lock), khóa toàn bộ dải thỏa điều kiện WHERE
    -- Ngăn chặn bất kỳ ai INSERT bản ghi mới lọt vào dải điều kiện đó!
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    BEGIN TRANSACTION;

    PRINT N'[T1-KHẮC PHỤC] Lần 1: Kiểm tra số lượng ghế VIP với khóa Range Lock...';
    DECLARE @SoLuong1 INT;
    SELECT @SoLuong1 = COUNT(*)
    FROM Ve v
    JOIN Ghe g ON v.MaGhe = g.MaGhe
    WHERE v.MaSuatChieu = @MaSuatChieu 
      AND g.LoaiGhe = N'VIP' 
      AND v.TrangThai = N'Trống';

    PRINT N'[T1-KHẮC PHỤC] Số ghế VIP trống lần 1: ' + CAST(@SoLuong1 AS NVARCHAR(10));

    PRINT N'[T1-KHẮC PHỤC] Đang chờ đoàn khách chốt vé (6 giây)...';
    WAITFOR DELAY '00:00:06';

    PRINT N'[T1-KHẮC PHỤC] Lần 2: Đọc lại số lượng ghế VIP...';
    DECLARE @SoLuong2 INT;
    SELECT @SoLuong2 = COUNT(*)
    FROM Ve v
    JOIN Ghe g ON v.MaGhe = g.MaGhe
    WHERE v.MaSuatChieu = @MaSuatChieu 
      AND g.LoaiGhe = N'VIP' 
      AND v.TrangThai = N'Trống';

    PRINT N'[T1-KHẮC PHỤC] Số ghế VIP trống lần 2: ' + CAST(@SoLuong2 AS NVARCHAR(10));

    COMMIT TRANSACTION;
    PRINT N'[T1-KHẮC PHỤC] Giao dịch an toàn tuyệt đối! Số lượng không bị thay đổi.';
END;
GO

/*
-- ====================================================================
-- HƯỚNG DẪN TEST:
-- ====================================================================

--- TEST KỊCH BẢN LỖI (PHANTOM READ) ---
-- Xóa ghế test B04 trước:
DELETE FROM Ve WHERE MaGhe IN (SELECT MaGhe FROM Ghe WHERE SoGhe = 'B04' AND MaPhong = 1);
DELETE FROM Ghe WHERE SoGhe = 'B04' AND MaPhong = 1;

-- Session 1 (Khách kiểm tra ghế):
EXEC sp_KiemTraGheVIP_Phantom_Loi @MaSuatChieu = 1;

-- Session 2 (Admin thêm ghế - chạy ngay sau Session 1 1-2 giây):
EXEC sp_Admin_ThemGheVIP @MaSuatChieu = 1;

-- Kết quả: Session 2 INSERT thành công ngay. Session 1 ở lần đọc 2 phát hiện số ghế tăng từ 3 lên 4!


--- TEST KỊCH BẢN ĐÃ KHẮC PHỤC ---
-- Xóa ghế test B04 trước:
DELETE FROM Ve WHERE MaGhe IN (SELECT MaGhe FROM Ghe WHERE SoGhe = 'B04' AND MaPhong = 1);
DELETE FROM Ghe WHERE SoGhe = 'B04' AND MaPhong = 1;

-- Session 1 (Khách kiểm tra ghế với SERIALIZABLE):
EXEC sp_KiemTraGheVIP_Serializable_KhacPhuc @MaSuatChieu = 1;

-- Session 2 (Admin thêm ghế - chạy ngay sau Session 1 1-2 giây):
EXEC sp_Admin_ThemGheVIP @MaSuatChieu = 1;

-- Kết quả: Session 2 sẽ bị chặn (Block) và phải chờ Session 1 hoàn tất. Hai lần đếm của Session 1 đều bằng 3!
*/
