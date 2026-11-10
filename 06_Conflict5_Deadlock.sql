-- ====================================================================
-- XUNG ĐỘT 5: DEADLOCK (KẸT CHẾT)
-- ====================================================================
-- Tình huống:
-- - Khách hàng 1 (T1) muốn đặt cụm 2 ghế: Ghế A01 (MaGhe = 1) và Ghế A02 (MaGhe = 2).
--   T1 tiến hành khóa Ghế 1 trước, sau đó chờ 5 giây rồi mới khóa tiếp Ghế 2.
-- - Cùng lúc đó, Khách hàng 2 (T2) cũng muốn đặt 2 ghế này nhưng thứ tự chọn lại ngược lại:
--   T2 khóa Ghế 2 (MaGhe = 2) trước, sau đó chờ 5 giây rồi xin khóa Ghế 1.
-- - Kết quả: T1 giữ Ghế 1 chờ Ghế 2; T2 giữ Ghế 2 chờ Ghế 1 -> VÒNG CHỜ BẤT TẬN (Deadlock).
--   SQL Server sẽ tự động phát hiện và hủy (KILL) một trong hai giao tác làm Deadlock Victim (Error 1205).
-- ====================================================================

USE RapChieuPhimDB;
GO

-- Reset trạng thái của 2 ghế A01 và A02
UPDATE Ve 
SET TrangThai = N'Trống', MaKH = NULL, ThoiGianDat = NULL 
WHERE MaSuatChieu = 1 AND MaGhe IN (1, 2);
GO

-- ====================================================================
-- 1. THỦ TỤC GÂY DEADLOCK (KHÔNG CỐ ĐỊNH THỨ TỰ KHÓA)
-- ====================================================================

-- Giao tác 1: Khóa Ghế 1 trước, Ghế 2 sau
CREATE OR ALTER PROCEDURE sp_Deadlock_GiaoDich1_Loi
    @MaSuatChieu INT,
    @MaGhe1 INT,
    @MaGhe2 INT,
    @MaKH INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    PRINT N'[T1] 1. Cập nhật và khóa Ghế: ' + CAST(@MaGhe1 AS NVARCHAR(10));
    UPDATE Ve
    SET TrangThai = N'Đang Giữ', MaKH = @MaKH
    WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe1;

    PRINT N'[T1] 2. Đang chờ 5 giây trước khi cập nhật tiếp ghế thứ hai...';
    WAITFOR DELAY '00:00:05';

    PRINT N'[T1] 3. Xin khóa Ghế tiếp theo: ' + CAST(@MaGhe2 AS NVARCHAR(10));
    UPDATE Ve
    SET TrangThai = N'Đang Giữ', MaKH = @MaKH
    WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe2;

    COMMIT TRANSACTION;
    PRINT N'[T1] ĐẶT THÀNH CÔNG CẢ 2 GHẾ!';
END;
GO

-- Giao tác 2: Khóa Ghế 2 trước, Ghế 1 sau (Ngược thứ tự)
CREATE OR ALTER PROCEDURE sp_Deadlock_GiaoDich2_Loi
    @MaSuatChieu INT,
    @MaGhe1 INT,
    @MaGhe2 INT,
    @MaKH INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    PRINT N'[T2] 1. Cập nhật và khóa Ghế: ' + CAST(@MaGhe2 AS NVARCHAR(10));
    UPDATE Ve
    SET TrangThai = N'Đang Giữ', MaKH = @MaKH
    WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe2;

    PRINT N'[T2] 2. Đang chờ 5 giây trước khi cập nhật tiếp ghế thứ nhất...';
    WAITFOR DELAY '00:00:05';

    PRINT N'[T2] 3. Xin khóa Ghế tiếp theo: ' + CAST(@MaGhe1 AS NVARCHAR(10));
    UPDATE Ve
    SET TrangThai = N'Đang Giữ', MaKH = @MaKH
    WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @MaGhe1;

    COMMIT TRANSACTION;
    PRINT N'[T2] ĐẶT THÀNH CÔNG CẢ 2 GHẾ!';
END;
GO

-- ====================================================================
-- 2. THỦ TỤC ĐÃ KHẮC PHỤC
-- Giải pháp 1: Chuẩn hóa thứ tự truy cập tài nguyên (Lock Ordering - luôn sắp xếp ID tăng dần)
-- Giải pháp 2: Cơ chế TRY...CATCH bắt lỗi 1205 và tự động Retry (Thử lại)
-- ====================================================================
CREATE OR ALTER PROCEDURE sp_DatVeDoi_KhacPhucDeadlock
    @MaSuatChieu INT,
    @MaGheA INT,
    @MaGheB INT,
    @MaKH INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- BƯỚC 1: SẮP XẾP THỨ TỰ TÀI NGUYÊN (Lock Ordering)
    -- Đảm bảo mọi giao tác luôn khóa theo cùng 1 thứ tự (ví dụ: Ghế có ID nhỏ khóa trước)
    DECLARE @GheNho INT, @GheLon INT;
    IF @MaGheA < @MaGheB
    BEGIN
        SET @GheNho = @MaGheA;
        SET @GheLon = @MaGheB;
    END
    ELSE
    BEGIN
        SET @GheNho = @MaGheB;
        SET @GheLon = @MaGheA;
    END

    -- BƯỚC 2: CƠ CHẾ RETRY NẾU XẢY RA TRANH CHẤP
    DECLARE @RetryCount INT = 0;
    DECLARE @MaxRetries INT = 3;

    WHILE @RetryCount < @MaxRetries
    BEGIN
        BEGIN TRY
            BEGIN TRANSACTION;

            PRINT N'[RETRY ' + CAST(@RetryCount AS NVARCHAR(5)) + N'] Bắt đầu đặt cặp ghế theo thứ tự: ' 
                  + CAST(@GheNho AS NVARCHAR(10)) + N' -> ' + CAST(@GheLon AS NVARCHAR(10));

            -- 1. Khóa ghế nhỏ trước với UPDLOCK
            UPDATE Ve
            SET TrangThai = N'Đã Đặt', MaKH = @MaKH, ThoiGianDat = GETDATE()
            WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @GheNho AND TrangThai = N'Trống';

            IF @@ROWCOUNT = 0
            BEGIN
                PRINT N'Ghế ' + CAST(@GheNho AS NVARCHAR(10)) + N' không còn trống!';
                ROLLBACK TRANSACTION;
                RETURN;
            END

            -- Giả lập xử lý ngắn
            WAITFOR DELAY '00:00:03';

            -- 2. Khóa ghế lớn tiếp theo
            UPDATE Ve
            SET TrangThai = N'Đã Đặt', MaKH = @MaKH, ThoiGianDat = GETDATE()
            WHERE MaSuatChieu = @MaSuatChieu AND MaGhe = @GheLon AND TrangThai = N'Trống';

            IF @@ROWCOUNT = 0
            BEGIN
                PRINT N'Ghế ' + CAST(@GheLon AS NVARCHAR(10)) + N' không còn trống!';
                ROLLBACK TRANSACTION;
                RETURN;
            END

            COMMIT TRANSACTION;
            PRINT N'==> Khách ' + CAST(@MaKH AS NVARCHAR(10)) + N' đặt thành công cả 2 ghế: ' 
                  + CAST(@GheNho AS NVARCHAR(10)) + N' & ' + CAST(@GheLon AS NVARCHAR(10));
            BREAK; -- Thành công, thoát vòng lặp
        END TRY
        BEGIN CATCH
            ROLLBACK TRANSACTION;

            -- Nếu lỗi là Deadlock (mã lỗi 1205)
            IF ERROR_NUMBER() = 1205
            BEGIN
                SET @RetryCount = @RetryCount + 1;
                PRINT N'[CẢNH BÁO] Phát hiện Deadlock (Lỗi 1205)! Đang tự động thử lại lần ' + CAST(@RetryCount AS NVARCHAR(5)) + '...';
                WAITFOR DELAY '00:00:01'; -- Đợi 1 giây rồi thử lại
            END
            ELSE
            BEGIN
                -- Nếu là lỗi khác thì ném ra lỗi
                THROW;
            END
        END CATCH
    END
END;
GO

/*
-- ====================================================================
-- HƯỚNG DẪN TEST:
-- ====================================================================

--- TEST KỊCH BẢN LỖI (DEADLOCK) ---
-- Reset trạng thái vé trước:
UPDATE Ve SET TrangThai = N'Trống', MaKH = NULL, ThoiGianDat = NULL WHERE MaSuatChieu = 1 AND MaGhe IN (1, 2);

-- Session 1 (Khách A - đặt ghế 1 rồi ghế 2):
EXEC sp_Deadlock_GiaoDich1_Loi @MaSuatChieu = 1, @MaGhe1 = 1, @MaGhe2 = 2, @MaKH = 1;

-- Session 2 (Khách B - chạy cùng lúc tại Session khác, đặt ghế 2 rồi ghế 1):
EXEC sp_Deadlock_GiaoDich2_Loi @MaSuatChieu = 1, @MaGhe1 = 1, @MaGhe2 = 2, @MaKH = 2;

-- Kết quả: Sau 5 giây, SQL Server sẽ báo lỗi:
-- "Transaction (Process ID ...) was deadlocked on lock resources with another process and has been chosen as the deadlock victim. Rerun the transaction."


--- TEST KỊCH BẢN ĐÃ KHẮC PHỤC ---
-- Reset trạng thái:
UPDATE Ve SET TrangThai = N'Trống', MaKH = NULL, ThoiGianDat = NULL WHERE MaSuatChieu = 1 AND MaGhe IN (1, 2);

-- Session 1: Truyền ghế (1, 2)
EXEC sp_DatVeDoi_KhacPhucDeadlock @MaSuatChieu = 1, @MaGheA = 1, @MaGheB = 2, @MaKH = 1;

-- Session 2: Truyền thứ tự ngược lại (2, 1) cùng lúc
EXEC sp_DatVeDoi_KhacPhucDeadlock @MaSuatChieu = 1, @MaGheA = 2, @MaGheB = 1, @MaKH = 2;

-- Kết quả: Không còn Deadlock! Cả hai thủ tục đều tự sắp xếp khóa ghế 1 trước rồi mới đến ghế 2.
-- Giao tác nào đến trước sẽ giữ ghế 1, giao tác sau phải xếp hàng đợi tuần tự mà không kẹt vòng.
*/
