-- ====================================================================
-- XUNG ĐỘT 1: LOST UPDATE (MẤT DỮ LIỆU CẬP NHẬT)
-- ====================================================================
-- Tình huống: Hai khách hàng (T1 và T2) cùng lúc đặt cùng một ghế (B01).
-- Do mức cô lập mặc định (READ COMMITTED) chỉ giữ Shared Lock (S-lock)
-- trong tích tắc khi đọc rồi nhả ngay, cả 2 phiên đều đọc thấy ghế 'Trống'.
-- Sau đó cả hai đều ghi đè (UPDATE), dẫn đến cập nhật của người thứ nhất bị mất!
-- ====================================================================

USE RapChieuPhimDB;
GO

-- Đặt lại trạng thái ban đầu cho ghế B01 của Suất chiếu 1
UPDATE Ve 
SET TrangThai = N'Trống', MaKH = NULL, ThoiGianDat = NULL
WHERE MaSuatChieu = 1 AND MaGhe = 4; -- MaGhe 4 là B01
GO

-- ====================================================================
-- 1. THỦ TỤC GÂY LỖI (CHƯA XỬ LÝ KHÓA)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_DatVe_LostUpdate_Loi
    @MaSuatChieu INT,
    @MaGhe INT,
    @MaKH INT
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    BEGIN TRANSACTION;

    -- Bước 1: Đọc kiểm tra trạng thái ghế
    DECLARE @TrangThai NVARCHAR(30);
    SELECT @TrangThai = TrangThai 
    FROM Ve 
    WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe;

    -- Giả lập độ trễ xử lý (đợi người dùng xác nhận / mạng trễ)
    WAITFOR DELAY '00:00:05';

    -- Bước 2: Nếu còn trống thì cập nhật
    IF @TrangThai = N'Trống'
    BEGIN
        UPDATE Ve
        SET TrangThai = N'Đã Đặt',
            MaKH = @MaKH,
            ThoiGianDat = GETDATE()
        WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe;

        PRINT N'Khách hàng ' + CAST(@MaKH AS NVARCHAR(10)) + N' đặt vé THÀNH CÔNG!';
    END
    ELSE
    BEGIN
        PRINT N'Ghế đã có người đặt, khách hàng ' + CAST(@MaKH AS NVARCHAR(10)) + N' đặt THẤT BẠI!';
    END

    COMMIT TRANSACTION;
END;
GO

-- ====================================================================
-- 2. THỦ TỤC ĐÃ KHẮC PHỤC (SỬ DỤNG UPDLOCK + ROWLOCK HOẶC ATOMIC UPDATE)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_DatVe_LostUpdate_KhacPhuc
    @MaSuatChieu INT,
    @MaGhe INT,
    @MaKH INT
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    BEGIN TRANSACTION;

    BEGIN TRY
        -- Khắc phục: Sử dụng WITH (UPDLOCK, ROWLOCK) để giữ khóa cập nhật
        -- Ngăn phiên giao dịch khác đọc để UPDATE cùng lúc
        DECLARE @TrangThai NVARCHAR(30);
        
        SELECT @TrangThai = TrangThai 
        FROM Ve WITH (UPDLOCK, ROWLOCK)
        WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe;

        WAITFOR DELAY '00:00:05';

        IF @TrangThai = N'Trống'
        BEGIN
            UPDATE Ve
            SET TrangThai = N'Đã Đặt',
                MaKH = @MaKH,
                ThoiGianDat = GETDATE()
            WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe;

            PRINT N'[KHẮC PHỤC] Khách ' + CAST(@MaKH AS NVARCHAR(10)) + N' đặt vé THÀNH CÔNG!';
        END
        ELSE
        BEGIN
            PRINT N'[KHẮC PHỤC] Ghế đã được đặt trước đó! Khách ' + CAST(@MaKH AS NVARCHAR(10)) + N' đặt THẤT BẠI!';
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/*
-- ====================================================================
-- HƯỚNG DẪN TEST (MỞ 2 QUERY TABS TRÊN SSMS):
-- ====================================================================

--- TEST KỊCH BẢN LỖI ---
-- Session 1 (Khách A - MaKH=1):
EXEC sp_DatVe_LostUpdate_Loi @MaSuatChieu = 1, @MaGhe = 4, @MaKH = 1;

-- Session 2 (Khách B - MaKH=2) - Chạy ngay sau Session 1 1-2 giây:
EXEC sp_DatVe_LostUpdate_Loi @MaSuatChieu = 1, @MaGhe = 4, @MaKH = 2;

-- Kết quả kiểm tra: Cả 2 đều báo thành công, nhưng SELECT * FROM Ve WHERE MaGhe=4 sẽ thấy MaKH=2 (A bị ghi đè mất).


--- TEST KỊCH BẢN ĐÃ KHẮC PHỤC ---
-- Đặt lại vé về Trống trước khi test:
UPDATE Ve SET TrangThai = N'Trống', MaKH = NULL, ThoiGianDat = NULL WHERE MaSuatChieu = 1 AND MaGhe = 4;

-- Session 1 (Khách A - MaKH=1):
EXEC sp_DatVe_LostUpdate_KhacPhuc @MaSuatChieu = 1, @MaGhe = 4, @MaKH = 1;

-- Session 2 (Khách B - MaKH=2) - Chạy ngay sau Session 1 1-2 giây:
EXEC sp_DatVe_LostUpdate_KhacPhuc @MaSuatChieu = 1, @MaGhe = 4, @MaKH = 2;

-- Kết quả: Session 2 sẽ phải chờ Session 1 hoàn tất, sau đó kiểm tra thấy ghế không còn trống và báo THẤT BẠI!
*/
