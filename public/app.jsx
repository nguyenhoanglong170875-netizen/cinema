// ====================================================================
// CINEMAX PREMIER - COMMERCIAL REACT CINEMA PLATFORM
// Powered by React 18, Tailwind CSS & Web Audio Synthesizer
// ====================================================================

const { useState, useEffect, useRef, useMemo } = React;

// --- Web Audio Synthesizer ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  }
  play(type) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.07);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.07 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.07);
          osc.stop(ctx.currentTime + idx * 0.07 + 0.3);
        });
      } else if (type === 'lock') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(190, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'deadlock') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(750, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn('Audio error', e);
    }
  }
}
const sound = new SoundEngine();

// --- Trạng thái trực quan của Lab (do server gửi kèm từng dòng log) ---
const EMPTY_LAB_VIEW = { seats: {}, extra: [], readouts: [] };
const LOCK_TONES = {
  x: 'bg-[#B3262E] text-[#F6ECE1] border border-[#D4AF37]',
  s: 'bg-[#C5A059] text-[#120F0D] font-bold border border-[#D4AF37]',
  range: 'bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40',
  dirty: 'bg-[#4A1215] text-[#F0C67E] border border-[#E5A84B] animate-pulse',
  phantom: 'bg-[#6B1D3A] text-[#F6D7E3] border border-[#C08497] animate-pulse',
  wait: 'bg-[#E5A84B] text-[#120F0D] font-bold',
  ok: 'bg-emerald-800 text-emerald-100 border border-emerald-500'
};

// --- So sánh nhanh 3 lỗi "đọc sai" (xung đột 2, 3, 4) ---
const READ_ANOMALY_COMPARE = [
  { id: 2, name: 'Dirty Read', icon: '📝', line: 'Đọc thứ CHƯA chốt (bản nháp) của người khác.' },
  { id: 3, name: 'Non-Repeatable Read', icon: '🏷️', line: 'Dòng ĐÃ CÓ bị người khác SỬA giữa 2 lần đọc.' },
  { id: 4, name: 'Phantom Read', icon: '👻', line: 'Có thêm DÒNG MỚI xuất hiện giữa 2 lần đọc.' }
];

// --- 5 SQL Conflicts Academic Details ---
const SQL_CONFLICTS = {
  1: {
    id: 1,
    sessions: ['Session 1 (Khách A)', 'Session 2 (Khách B)'],
    name: 'Lost Update',
    explain: {
      emoji: '✍️',
      analogyTitle: 'Giống 2 bạn cùng sửa 1 file Word rồi bấm Lưu',
      analogy: 'An và Bình cùng mở file "Danh sách lớp" lúc 8h, thấy ô số 5 đang để trống. An điền "An" rồi Lưu. Bình vẫn đang xem bản cũ (ô trống), điền "Bình" rồi Lưu sau. Kết quả: ô số 5 chỉ còn tên Bình, tên An biến mất mà không ai báo lỗi.',
      cinema: 'Ở rạp: Khách A và Khách B cùng thấy ghế B01 "Trống" và cùng bấm thanh toán trong vòng 1 giây. Máy báo "Đặt thành công" cho CẢ HAI, nhưng ghế chỉ thuộc về người bấm sau. Người bấm trước đã mất tiền mà mất luôn ghế.',
      stepsError: [
        { s: 1, text: 'Khách A mở trang, thấy ghế B01 đang "Trống".' },
        { s: 2, text: 'Khách B cũng mở trang, cũng thấy B01 "Trống" (vì A chưa kịp ghi gì).' },
        { s: 1, text: 'Khách A bấm thanh toán: hệ thống ghi "B01 thuộc Khách A" và báo thành công.' },
        { s: 2, text: 'Khách B bấm thanh toán: hệ thống ghi "B01 thuộc Khách B", đè lên bản ghi của A, cũng báo thành công.' },
        { s: 0, text: 'Kết quả: B01 chỉ còn thuộc Khách B. Cập nhật của Khách A bị MẤT.' }
      ],
      stepsFixed: [
        { s: 1, text: 'Khách A bắt đầu chọn B01: hệ thống "treo biển ĐANG XỬ LÝ" lên ghế này (UPDLOCK).' },
        { s: 2, text: 'Khách B cũng muốn B01, thấy biển nên phải đứng chờ.' },
        { s: 1, text: 'Khách A thanh toán xong, ghi "B01 thuộc Khách A" rồi gỡ biển.' },
        { s: 2, text: 'Khách B được vào, đọc lại thấy B01 "Đã Đặt" nên báo "Ghế đã có người mua, mời chọn ghế khác".' },
        { s: 0, text: 'Kết quả: không ai bị ghi đè, mỗi ghế đúng một chủ.' }
      ],
      plainError: 'Hai người cùng đọc một dữ liệu cũ rồi cùng ghi lại. Người ghi sau xoá mất kết quả của người ghi trước.',
      plainFix: 'Ai đọc để chuẩn bị sửa thì "treo biển" lên dòng đó (UPDLOCK). Người đến sau chờ, rồi đọc lại bản mới nhất.',
      remember: 'LOST UPDATE = "cập nhật bị mất": hai người cùng ghi, người sau đè người trước.'
    },
    sub: 'Ghi đè mất cập nhật khi 2 khách đặt cùng 1 ghế',
    techFixed: 'WITH (UPDLOCK, ROWLOCK) trên câu SELECT',
    techError: 'SELECT thông thường giải phóng Shared Lock sớm',
    descError: 'Hai khách A và B cùng mở màn hình và chọn ghế B01. Do câu SELECT chỉ giữ Shared Lock tạm thời rồi nhả ngay, cả 2 giao dịch đều đọc được trạng thái "Trống" và cùng ghi đè thanh toán. Giao dịch sau ghi đè lên giao dịch trước, một khách mất tiền nhưng mất ghế!',
    descFixed: 'Giao dịch T1 sử dụng gợi ý khóa WITH (UPDLOCK, ROWLOCK). Giao dịch T2 khi cố tình đọc cùng hàng dữ liệu sẽ bị chặn (Blocked) cho đến khi T1 COMMIT hoặc ROLLBACK, bảo đảm tính nhất quán tuyệt đối.',
    sqlError: `-- T1: Đọc và giữ thời gian giao dịch
BEGIN TRAN;
  SELECT TrangThai FROM Ve WHERE MaGhe=4; -- Đọc: 'Trống' (Nhả S-Lock ngay)
  WAITFOR DELAY '00:00:04';
  UPDATE Ve SET TrangThai=N'Đã Đặt', MaKH=1 WHERE MaGhe=4;
COMMIT;
-- T2 chạy song song cũng đọc 'Trống' và ghi đè!`,
    sqlFixed: `-- T1 KHẮC PHỤC: GIỮ KHÓA UPDLOCK
BEGIN TRAN;
  SELECT TrangThai FROM Ve WITH (UPDLOCK, ROWLOCK) WHERE MaGhe=4;
  WAITFOR DELAY '00:00:04';
  UPDATE Ve SET TrangThai=N'Đã Đặt', MaKH=1 WHERE MaGhe=4;
COMMIT;
-- T2 bị chặn đến khi T1 hoàn tất!`
  },
  2: {
    id: 2,
    sessions: ['Session 1 (Khách A - Thanh toán)', 'Session 2 (Khách B - Xem sơ đồ ghế)'],
    name: 'Dirty Read',
    explain: {
      emoji: '📝',
      analogyTitle: 'Giống đọc bản NHÁP của người khác rồi đem đi kể',
      analogy: 'Hoa đang viết nháp lên giấy: "Mình sẽ nghỉ việc". Lan liếc thấy và chạy đi kể cho cả phòng. 5 phút sau Hoa xé tờ nháp vì đổi ý. Cả phòng đã nghe một chuyện chưa từng xảy ra.',
      cinema: 'Ở rạp: Khách A bấm thanh toán ghế B02, hệ thống tạm ghi "B02 Đã Đặt" rồi chờ ngân hàng. Khách B xem sơ đồ đúng lúc đó, thấy B02 đã bán nên chọn ghế khác. Ngân hàng từ chối thẻ của A, hệ thống huỷ (ROLLBACK). Thực tế B02 vẫn trống, nhưng B đã bỏ lỡ vì tin vào một "bản nháp".',
      stepsError: [
        { s: 1, text: 'Khách A bấm thanh toán ghế B02: hệ thống tạm ghi "B02 = Đã Đặt" (CHƯA chốt, còn chờ ngân hàng).' },
        { s: 2, text: 'Khách B xem sơ đồ ghế ở mức READ UNCOMMITTED (cho phép đọc cả bản nháp) và thấy B02 "Đã Đặt".' },
        { s: 2, text: 'Khách B nghĩ ghế đã hết nên bỏ qua B02.' },
        { s: 1, text: 'Ngân hàng từ chối thẻ: hệ thống HUỶ (ROLLBACK), B02 trở lại "Trống".' },
        { s: 0, text: 'Kết quả: Khách B đã đọc một thông tin chưa từng thật sự tồn tại. Rạp mất một ghế lẽ ra bán được.' }
      ],
      stepsFixed: [
        { s: 1, text: 'Khách A bấm thanh toán B02: hệ thống ghi tạm "Đã Đặt" và khóa dòng này lại.' },
        { s: 2, text: 'Khách B xem sơ đồ ở mức READ COMMITTED (chỉ đọc bản đã chốt), thấy dòng đang bị khóa nên đứng chờ.' },
        { s: 1, text: 'Ngân hàng từ chối: hệ thống HUỶ và mở khóa.' },
        { s: 2, text: 'Khách B đọc được B02 = "Trống" (bản đã chốt, đúng sự thật) và vẫn mua được ghế.' },
        { s: 0, text: 'Kết quả: chỉ đọc dữ liệu đã chốt, không bao giờ nhìn thấy "bản nháp".' }
      ],
      plainError: 'Đọc phải dữ liệu mà người khác mới ghi tạm, chưa chốt. Sau đó họ huỷ nên thứ mình đọc là dữ liệu "ảo".',
      plainFix: 'Chỉ cho đọc dữ liệu đã chốt (READ COMMITTED). Nếu dòng đang bị ghi dở thì chờ.',
      remember: 'DIRTY = "bẩn": đọc thứ CHƯA được COMMIT.'
    },
    sub: 'Thấy ghế "Đã Đặt" từ giao dịch thanh toán chưa COMMIT rồi bị ROLLBACK',
    techFixed: 'READ COMMITTED (mặc định SQL Server): T2 chờ X-Lock của T1',
    techError: 'SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED (hoặc WITH (NOLOCK))',
    descError: 'Khách A chọn ghế B02 và bấm thanh toán: giao dịch T1 đã UPDATE ghế sang "Đã Đặt" nhưng chưa COMMIT vì còn chờ ngân hàng xác thực OTP. Màn hình sơ đồ ghế của Khách B chạy ở mức READ UNCOMMITTED nên đọc xuyên qua khóa và thấy B02 đã bán. Ngay sau đó ngân hàng từ chối thẻ, T1 ROLLBACK: ghế thực tế vẫn Trống nhưng Khách B đã bỏ qua ghế vì đọc phải dữ liệu "bẩn" chưa từng tồn tại.',
    descFixed: 'Giữ mức READ COMMITTED (mặc định). Khi T1 đang giữ X-Lock trên ghế B02, câu SELECT của Khách B phải xin S-Lock nên bị chặn cho tới khi T1 COMMIT hoặc ROLLBACK. Sau ROLLBACK, Khách B đọc được B02 = "Trống" (dữ liệu thật). Đánh đổi: T2 phải chờ, có thể bật READ_COMMITTED_SNAPSHOT để đọc bản đã COMMIT mà không bị chặn.',
    sqlError: `-- T1: Thanh toán (UPDATE rồi ROLLBACK)
BEGIN TRAN;
  UPDATE Ve SET TrangThai = N'Đã Đặt', MaKH = 1
  WHERE MaSuatChieu = 1 AND MaGhe = @MaGheB02; -- giữ X-Lock
  WAITFOR DELAY '00:00:08';                    -- chờ ngân hàng
ROLLBACK TRAN;                                 -- thẻ bị từ chối

-- T2 (LỖI): màn hình sơ đồ ghế của Khách B
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT g.SoGhe, v.TrangThai
FROM Ve v JOIN Ghe g ON g.MaGhe = v.MaGhe
WHERE v.MaSuatChieu = 1;
-- Thấy B02 = N'Đã Đặt' (dữ liệu bẩn!)`,
    sqlFixed: `-- T2 KHẮC PHỤC: READ COMMITTED
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT g.SoGhe, v.TrangThai
FROM Ve v JOIN Ghe g ON g.MaGhe = v.MaGhe
WHERE v.MaSuatChieu = 1;
-- Bị BLOCK đến khi T1 ROLLBACK, rồi đọc B02 = N'Trống'

-- Không muốn chờ? Bật phiên bản dòng:
-- ALTER DATABASE RapChieuPhimDB SET READ_COMMITTED_SNAPSHOT ON;`
  },
  3: {
    id: 3,
    sessions: ['Session 1 (Khách đang thanh toán)', 'Session 2 (Admin - Đổi giá vé)'],
    name: 'Non-Repeatable Read',
    explain: {
      emoji: '🏷️',
      analogyTitle: 'Giống xem giá món đồ rồi ra quầy thì giá đã đổi',
      analogy: 'Bạn thấy chiếc áo giá 90.000đ trên kệ rồi đi thử đồ 5 phút. Trong lúc đó nhân viên đổi bảng giá thành 120.000đ. Ra quầy tính tiền, thu ngân đọc lại thì ra 120.000đ. Cùng một chiếc áo, cùng một lần mua, bạn thấy hai giá khác nhau.',
      cinema: 'Ở rạp: Khách A xem giỏ hàng thấy vé giá 90.000đ và đang nhập OTP. Admin đổi giá lên 120.000đ rồi lưu. Khi A bấm xác nhận, hệ thống đọc lại giá để tính tiền thì ra 120.000đ. Cùng một giao dịch nhưng 2 lần đọc ra 2 con số, tiền hiển thị và tiền bị trừ lệch nhau.',
      stepsError: [
        { s: 1, text: 'Khách A xem giỏ hàng: vé giá 90.000đ (lần đọc 1).' },
        { s: 1, text: 'A đang nhập thông tin thẻ và OTP, giao dịch chưa xong.' },
        { s: 2, text: 'Admin đổi giá vé lên 120.000đ và lưu luôn (COMMIT).' },
        { s: 1, text: 'A bấm xác nhận: hệ thống đọc lại giá để tính tiền (lần đọc 2) và ra 120.000đ.' },
        { s: 0, text: 'Kết quả: cùng một giao dịch nhưng 2 lần đọc ra 90k rồi 120k.' }
      ],
      stepsFixed: [
        { s: 1, text: 'Khách A xem giá 90.000đ: hệ thống GIỮ khóa đọc trên dòng giá này đến hết giao dịch (REPEATABLE READ).' },
        { s: 2, text: 'Admin muốn đổi giá nhưng bị chặn, phải chờ A xong.' },
        { s: 1, text: 'A xác nhận, đọc lại vẫn là 90.000đ và thanh toán xong.' },
        { s: 2, text: 'Sau khi A xong, Admin mới đổi được giá lên 120.000đ (áp dụng cho khách sau).' },
        { s: 0, text: 'Kết quả: trong một giao dịch, đọc bao nhiêu lần cũng ra cùng một giá.' }
      ],
      plainError: 'Một dòng dữ liệu đã có sẵn bị người khác SỬA giữa 2 lần mình đọc, nên 2 lần đọc ra 2 giá trị khác nhau.',
      plainFix: 'Giữ khóa đọc tới hết giao dịch (REPEATABLE READ) để không ai sửa được dòng mình đã đọc.',
      remember: 'NON-REPEATABLE = "đọc lại không ra như cũ": dòng cũ bị SỬA.'
    },
    sub: 'Giá vé bị đổi giữa 2 lần đọc trong cùng giao dịch',
    techFixed: 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ',
    techError: 'READ COMMITTED giải phóng S-Lock ngay sau lệnh SELECT',
    descError: 'Khách hàng A mở giỏ hàng xem giá vé là 90k. Trong khi khách đang nhập thông tin, Admin chạy giao dịch đổi giá lên 120k và COMMIT. Khách bấm xác nhận thanh toán thì hệ thống đọc lại thấy giá đã thành 120k. Cùng một giao dịch nhưng 2 lần đọc ra 2 kết quả khác nhau!',
    descFixed: 'Nâng mức cô lập lên REPEATABLE READ. Shared Lock (S-Lock) được giữ xuyên suốt từ lúc bắt đầu cho tới khi COMMIT. Bất kỳ giao dịch nào cố UPDATE giá vé đều bị chặn.',
    sqlError: `-- T1 (READ COMMITTED):
BEGIN TRAN;
  SELECT GiaVeCoBan FROM SuatChieu; -- 90k (Nhả S-Lock)
  WAITFOR DELAY '00:00:05';
  -- T2 UPDATE thành 120k thành công!
  SELECT GiaVeCoBan FROM SuatChieu; -- Thành 120k!
COMMIT;`,
    sqlFixed: `-- T1 KHẮC PHỤC (REPEATABLE READ):
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRAN;
  SELECT GiaVeCoBan FROM SuatChieu; -- Giữ S-Lock
  WAITFOR DELAY '00:00:05';
  -- T2 bị chặn, không thể đổi giá
  SELECT GiaVeCoBan FROM SuatChieu; -- Vẫn 90k!
COMMIT;`
  },
  4: {
    id: 4,
    sessions: ['Session 1 (Khách đoàn - Chốt ghế VIP)', 'Session 2 (Admin - Mở thêm ghế)'],
    name: 'Phantom Read',
    explain: {
      emoji: '👻',
      analogyTitle: 'Giống cô giáo điểm danh lần 2 thì thấy thêm 1 bạn lạ',
      analogy: 'Cô giáo đếm hàng ghế đầu có 3 bạn. Cô đi một vòng, quay lại đếm lần hai thì thấy 4 bạn vì có bạn mới chuyển vào ngồi giữa chừng. Ba bạn cũ không đổi gì, nhưng xuất hiện thêm một người "từ đâu ra" như bóng ma.',
      cinema: 'Ở rạp: Trưởng đoàn đếm ghế VIP trống ra 3 ghế và tạm tính hóa đơn cho 3 ghế. Trong lúc đó Admin mở thêm ghế VIP B04. Lúc chốt, đếm lại ra 4 ghế. Số liệu trong cùng một giao dịch không còn khớp nhau.',
      stepsError: [
        { s: 1, text: 'Trưởng đoàn đếm ghế VIP trống: 3 ghế (B01, B02, B03). Hệ thống khóa 3 dòng này lại.' },
        { s: 1, text: 'Tạm tính hóa đơn cho 3 ghế, đang chọn người ngồi.' },
        { s: 2, text: 'Admin thêm ghế VIP mới B04. Không bị chặn vì B04 là dòng chưa tồn tại, chưa có khóa nào áp lên nó.' },
        { s: 1, text: 'Đếm lại để chốt: ra 4 ghế! Xuất hiện dòng "bóng ma" B04.' },
        { s: 0, text: 'Kết quả: 2 lần đếm trong cùng một giao dịch ra 3 rồi 4.' }
      ],
      stepsFixed: [
        { s: 1, text: 'Trưởng đoàn đếm ghế VIP: 3 ghế. Lần này hệ thống khóa CẢ KHOẢNG "ghế VIP" (SERIALIZABLE), kể cả chỗ trống để chèn ghế mới.' },
        { s: 2, text: 'Admin muốn thêm B04 vào khoảng đó nên bị chặn, phải chờ.' },
        { s: 1, text: 'Đếm lại vẫn là 3 ghế. Chốt vé xong thì mở khóa.' },
        { s: 2, text: 'Lúc này Admin mới thêm được B04 (khách sau sẽ thấy 4 ghế).' },
        { s: 0, text: 'Kết quả: trong một giao dịch, số lượng không thay đổi.' }
      ],
      plainError: 'Các dòng cũ không đổi, nhưng có thêm dòng MỚI khớp điều kiện lọt vào giữa 2 lần đếm.',
      plainFix: 'Khóa cả khoảng dữ liệu (SERIALIZABLE), không chỉ khóa các dòng đang có.',
      remember: 'PHANTOM = "bóng ma": xuất hiện thêm DÒNG MỚI. Khác Non-Repeatable ở chỗ: ở đó dòng cũ bị sửa.'
    },
    sub: 'Ghế VIP "bóng ma" xuất hiện giữa 2 lần đếm trong cùng giao dịch',
    techFixed: 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE (Key-Range Lock)',
    techError: 'REPEATABLE READ chỉ khóa các dòng đã tồn tại, không khóa khoảng',
    descError: 'Khách đoàn đếm số ghế VIP còn trống (ví dụ 3 ghế B01, B02, B03) để tạm tính hóa đơn. Trong lúc trưởng đoàn chọn người ngồi, Admin INSERT thêm ghế VIP dự phòng (B04) và COMMIT. REPEATABLE READ chỉ giữ khóa trên 3 dòng đã đọc nên không chặn được lệnh INSERT. Lần đếm thứ hai ra 4 ghế: cùng một giao dịch nhưng xuất hiện dòng "bóng ma", hóa đơn không còn khớp.',
    descFixed: 'Nâng lên SERIALIZABLE. SQL Server đặt Key-Range Lock lên toàn bộ dải [MaPhong = 1, LoaiGhe = VIP], gồm cả khoảng trống nơi dòng mới sẽ được chèn. Lệnh INSERT của Admin bị chặn cho đến khi T1 COMMIT nên hai lần đếm luôn bằng nhau. Đánh đổi: T2 phải chờ, độ đồng thời thấp hơn.',
    sqlError: `-- T1: Khách đoàn (REPEATABLE READ)
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRAN;
  SELECT COUNT(*)
  FROM Ve v JOIN Ghe g ON g.MaGhe = v.MaGhe
  WHERE v.MaSuatChieu = 1 AND g.LoaiGhe = N'VIP'
    AND v.TrangThai = N'Trống';          -- Lần 1: 3 ghế
  WAITFOR DELAY '00:00:06';

  -- T2 (Admin): INSERT Ghe B04 (VIP) + INSERT Ve (Trống)
  -- COMMIT -> KHÔNG bị chặn

  SELECT COUNT(*) ... ;                  -- Lần 2: 4 ghế (bóng ma!)
COMMIT;`,
    sqlFixed: `-- T1 KHẮC PHỤC: SERIALIZABLE
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRAN;
  -- Key-Range Lock lên dải [MaPhong=1, LoaiGhe='VIP']
  -- (dựa trên index IX_Ghe_Phong_Loai)
  SELECT COUNT(*)
  FROM Ve v JOIN Ghe g ON g.MaGhe = v.MaGhe
  WHERE v.MaSuatChieu = 1 AND g.LoaiGhe = N'VIP'
    AND v.TrangThai = N'Trống';          -- Lần 1: 3 ghế
  WAITFOR DELAY '00:00:06';

  -- T2 INSERT ghế VIP mới -> BỊ BLOCK

  SELECT COUNT(*) ... ;                  -- Lần 2: vẫn 3 ghế
COMMIT;                                  -- T2 chạy tiếp sau đó`
  },
  5: {
    id: 5,
    sessions: ['Session 1 (Khách A)', 'Session 2 (Khách B)'],
    name: 'Deadlock',
    explain: {
      emoji: '🚗',
      analogyTitle: 'Giống 2 chiếc xe kẹt ở ngã tư, chờ nhau nhường',
      analogy: 'Xe A rẽ vào làn của xe B, xe B rẽ vào làn của xe A, cả hai đều chờ xe kia lùi trước. Không ai chịu lùi nên đứng yên mãi. Phải có cảnh sát giao thông đến bắt một xe lùi.',
      cinema: 'Ở rạp: Khách A muốn đặt cặp ghế A01 rồi A02, Khách B muốn đặt A02 rồi A01. A giữ A01 chờ A02, B giữ A02 chờ A01. Cả hai chờ nhau mãi. SQL Server phải chọn một người làm "nạn nhân" (lỗi 1205) và huỷ giao dịch của người đó.',
      stepsError: [
        { s: 1, text: 'Khách A khóa ghế A01.' },
        { s: 2, text: 'Khách B khóa ghế A02.' },
        { s: 1, text: 'A cần thêm A02 nhưng A02 đang do B giữ, nên A chờ B.' },
        { s: 2, text: 'B cần thêm A01 nhưng A01 đang do A giữ, nên B chờ A. Hai bên chờ nhau theo vòng tròn!' },
        { s: 0, text: 'Kết quả: SQL Server phát hiện vòng chờ, chọn B làm nạn nhân (lỗi 1205) và huỷ giao dịch của B. A mới đi tiếp được.' }
      ],
      stepsFixed: [
        { s: 0, text: 'Đặt quy tắc chung: luôn khóa ghế có số nhỏ trước (A01 rồi mới A02).' },
        { s: 1, text: 'Khách A khóa A01 rồi A02.' },
        { s: 2, text: 'Khách B (dù chọn A02 trước) cũng bị đổi thành khóa A01 trước, thấy A01 đang bận nên xếp hàng chờ.' },
        { s: 1, text: 'A đặt xong cả 2 ghế, mở khóa.' },
        { s: 2, text: 'B vào sau, thấy ghế đã có chủ nên báo hết ghế. Không có vòng chờ nên không có Deadlock.' }
      ],
      plainError: 'Hai người mỗi người giữ một thứ và cùng chờ thứ của người kia, nên chờ nhau mãi.',
      plainFix: 'Mọi người khóa tài nguyên theo cùng một thứ tự (nhỏ trước, lớn sau) để không tạo ra vòng chờ.',
      remember: 'DEADLOCK = "kẹt cứng": A chờ B, B chờ A.'
    },
    sub: 'Kẹt chết hai chiều khi 2 khách đặt cặp ghế chéo nhau',
    techFixed: 'Lock Ordering (Sắp xếp thứ tự khóa ID tăng dần) + Retry',
    techError: 'Khóa không theo thứ tự nhất quán giữa các tiến trình',
    descError: 'Khách 1 đặt cặp ghế (A01 trước, A02 sau). Khách 2 đặt cặp ghế ngược lại (A02 trước, A01 sau). Khách 1 giữ A01 chờ A02; Khách 2 giữ A02 chờ A01. Vòng lặp kẹt cứng! SQL Server buộc phải can thiệp giết chết 1 giao dịch (Lỗi 1205 Deadlock Victim).',
    descFixed: 'Áp dụng nguyên tắc Lock Ordering: Luôn chuẩn hóa thứ tự khóa ghế có ID nhỏ trước rồi mới đến ghế lớn (MIN -> MAX). Loại bỏ hoàn toàn điều kiện hình thành chu trình khóa.',
    sqlError: `-- T1: Khóa 1 rồi chờ 2
UPDATE Ve SET TrangThai=N'Giữ' WHERE MaGhe=1;
WAITFOR DELAY '00:00:04';
UPDATE Ve SET TrangThai=N'Giữ' WHERE MaGhe=2;

-- T2: Khóa 2 rồi chờ 1 (DEADLOCK 1205!)`,
    sqlFixed: `-- KHẮC PHỤC: LOCK ORDERING
-- Luôn sắp xếp @GheNho = MIN(A,B), @GheLon = MAX(A,B)
BEGIN TRY
  UPDATE Ve SET TrangThai=N'Giữ' WHERE MaGhe=@GheNho;
  UPDATE Ve SET TrangThai=N'Giữ' WHERE MaGhe=@GheLon;
  COMMIT;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 1205 RETRY;
END CATCH;`
  }
};

// ====================================================================
// MAIN APPLICATION COMPONENT
// ====================================================================
function CineMaxApp() {
  // Navigation & View State
  const [currentTab, setCurrentTab] = useState('home');
  const [activeGenre, setActiveGenre] = useState('Tất Cả');
  const [movieFilterTab, setMovieFilterTab] = useState('now_showing'); // 'now_showing' | 'coming_soon'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Data Collections
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [combos, setCombos] = useState([]);
  const [dbState, setDbState] = useState({ seats: [], tickets: [], suatChieu: {} });

  // User State: Public Guest by Default (null)
  const [currentUser, setCurrentUser] = useState(null);
  const [userTickets, setUserTickets] = useState([]);
  const [pendingMovie, setPendingMovie] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardData, setCardData] = useState({ number: '4111 5689 3342 8821', holder: 'NGUYEN VAN A', exp: '12/28', cvv: '888' });

  // Modals
  const [trailerModal, setTrailerModal] = useState({ open: false, youtubeId: '', title: '' });
  const [movieDetailModal, setMovieDetailModal] = useState({ open: false, movie: null });
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Booking Flow State
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState('CineMax Landmark 81 (IMAX Laser & VIP Lounge)');
  const [selectedDate, setSelectedDate] = useState('14/11 - Hôm nay');
  const [selectedShowtime, setSelectedShowtime] = useState('19:30');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedComboId, setSelectedComboId] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('momo');

  // Academic Lab State
  const [currentConflictId, setCurrentConflictId] = useState(1);
  const [isConflictFixed, setIsConflictFixed] = useState(false);
  const [isRunningConflict, setIsRunningConflict] = useState(false);
  const [labLogs, setLabLogs] = useState([]);
  const [activeLocks, setActiveLocks] = useState({});
  const [t1Status, setT1Status] = useState('Sẵn sàng');
  const [t2Status, setT2Status] = useState('Sẵn sàng');
  const [labView, setLabView] = useState(EMPTY_LAB_VIEW);

  // Staff Desk State
  const [staffScanCode, setStaffScanCode] = useState('');

  // Admin Center State
  const [adminStats, setAdminStats] = useState({ totalRevenue: 0, totalTickets: 0, occupancyRate: 0, bookedSeatsCount: 0, totalSeats: 8, userCount: 4 });
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminNewPrice, setAdminNewPrice] = useState(120000);

  // Sound Mute Toggle
  const [isSoundOn, setIsSoundOn] = useState(true);

  // =============================================================
  // DUAL-TRANSACTION SPLIT SCREEN (HAI GIAO TÁC SONG SONG) STATE
  // =============================================================
  const INITIAL_DUAL_SEATS = [
    { id: 'A01', soGhe: 'A01', loai: 'STANDARD', hang: 'A', gia: 90000, trangThai: 'TRONG', holder: null, lockType: null },
    { id: 'A02', soGhe: 'A02', loai: 'STANDARD', hang: 'A', gia: 90000, trangThai: 'TRONG', holder: null, lockType: null },
    { id: 'A03', soGhe: 'A03', loai: 'STANDARD', hang: 'A', gia: 90000, trangThai: 'TRONG', holder: null, lockType: null },
    { id: 'B01', soGhe: 'B01', loai: 'VIP', hang: 'B', gia: 120000, trangThai: 'TRONG', holder: null, lockType: null },
    { id: 'B02', soGhe: 'B02', loai: 'VIP', hang: 'B', gia: 120000, trangThai: 'TRONG', holder: null, lockType: null },
    { id: 'B03', soGhe: 'B03', loai: 'VIP', hang: 'B', gia: 120000, trangThai: 'TRONG', holder: null, lockType: null },
    { id: 'C01', soGhe: 'C01', loai: 'COUPLE', hang: 'C', gia: 200000, trangThai: 'TRONG', holder: null, lockType: null },
    { id: 'C02', soGhe: 'C02', loai: 'COUPLE', hang: 'C', gia: 200000, trangThai: 'TRONG', holder: null, lockType: null },
  ];

  const [dualSeats, setDualSeats] = useState(INITIAL_DUAL_SEATS);
  const [dualExtraSeats, setDualExtraSeats] = useState([]);
  const [dualTicketPrice, setDualTicketPrice] = useState(90000);
  const [dualIsFixed, setDualIsFixed] = useState(true);
  const [dualRunningPreset, setDualRunningPreset] = useState(false);
  const [dualSelectedScenario, setDualSelectedScenario] = useState('free');
  const [hoveredDualSeat, setHoveredDualSeat] = useState('B01');
  const [dualClickEffect, setDualClickEffect] = useState(false);
  const [dualSimulateTwoCursors, setDualSimulateTwoCursors] = useState(false);
  const [dualMirrorCursor, setDualMirrorCursor] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [dualT1, setDualT1] = useState({
    user: 'Nguyễn Hoàng Long',
    spid: 52,
    role: 'VIP',
    status: 'IDLE',
    selectedSeats: ['B01'],
    heldSeats: [],
    logs: ['[Session SPID 52] Kết nối thành công đến RapChieuPhimDB.'],
    alert: null,
    alertType: 'info'
  });

  const [dualT2, setDualT2] = useState({
    user: 'Trần Thị B',
    spid: 53,
    role: 'Khách Thường',
    status: 'IDLE',
    selectedSeats: ['B01'],
    heldSeats: [],
    logs: ['[Session SPID 53] Kết nối thành công đến RapChieuPhimDB.'],
    alert: null,
    alertType: 'info'
  });

  const [dualTimeline, setDualTimeline] = useState([
    { time: '00:00:00', source: 'SQL_ENGINE', text: 'SQL Server: Đã khởi tạo Connection Pool cho 2 Sessions song song (SPID 52 & SPID 53).' }
  ]);

  // Dual Transaction Handlers
  const addDualTimeline = (source, text) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setDualTimeline(prev => [{ time: timeStr, source, text }, ...prev.slice(0, 49)]);
  };

  // Keyboard listener for T2 (Space = Hold Seat, 1..4 = Actions)
  useEffect(() => {
    if (currentTab !== 'dual') return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleDualHoldSeats('T2');
      } else if (e.key === '1') {
        handleDualBeginTran('T2');
      } else if (e.key === '2') {
        handleDualHoldSeats('T2');
      } else if (e.key === '3') {
        handleDualCommit('T2');
      } else if (e.key === '4') {
        handleDualRollback('T2');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, dualSeats, dualT1, dualT2, dualIsFixed]);

  const handleMouseMoveDual = (e) => {
    if (!dualMirrorCursor) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleDualSimultaneousHold = async () => {
    sound.play('beep');
    setDualSimulateTwoCursors(true);
    addDualTimeline('SQL_ENGINE', '⚡ [RACE CONDITION] Hai con chuột T1 và T2 cùng click tranh ghế tại cùng một mili-giây (09:00:00.000)!');
    
    await new Promise(r => setTimeout(r, 450));
    
    // Auto-begin if idle
    if (dualT1.status === 'IDLE') handleDualBeginTran('T1');
    if (dualT2.status === 'IDLE') handleDualBeginTran('T2');
    
    await new Promise(r => setTimeout(r, 350));
    
    // Both hold seats simultaneously
    handleDualHoldSeats('T1');
    handleDualHoldSeats('T2');
    
    setTimeout(() => setDualSimulateTwoCursors(false), 1200);
  };

  // LÀM LIỀN: Tranh chấp tức thì không delay
  const handleDualInstantRace = (seatCode = 'B01') => {
    sound.play('beep');
    setDualClickEffect(true);
    setTimeout(() => setDualClickEffect(false), 600);

    setHoveredDualSeat(seatCode);

    if (dualIsFixed) {
      // ĐÃ SỬA: T1 giữ UPDLOCK, T2 bị BLOCKED
      setDualSeats(prev => prev.map(s => {
        if (s.soGhe === seatCode) {
          return { ...s, trangThai: 'DANG_GIU', holder: 'T1', lockType: 'UPDLOCK' };
        }
        return s;
      }));

      setDualT1(prev => ({
        ...prev,
        status: 'ACTIVE',
        selectedSeats: [seatCode],
        heldSeats: [seatCode],
        alert: `🔒 Khách A (T1) đã giữ thành công ghế ${seatCode} với khóa UPDLOCK!`,
        alertType: 'success',
        logs: [`SELECT * FROM Ghe WITH (UPDLOCK, ROWLOCK) WHERE MaGhe = '${seatCode}'; -- THÀNH CÔNG`, ...prev.logs]
      }));

      setDualT2(prev => ({
        ...prev,
        status: 'ACTIVE',
        selectedSeats: [seatCode],
        heldSeats: [],
        alert: `⏳ BLOCKED! Ghế ${seatCode} đang bị T1 giữ khóa UPDLOCK. SQL Server bắt T2 phải CHỜ T1 Commit hoặc Rollback!`,
        alertType: 'warning',
        logs: [`BLOCKED: Chờ khóa RID trên ghế ${seatCode} (do T1 nắm giữ)...`, ...prev.logs]
      }));

      addDualTimeline('SQL_ENGINE', `⚡ [LÀM LIỀN] Cả 2 cùng tranh ghế ${seatCode}: T1 giữ UPDLOCK -> T2 BỊ CHẶN (BLOCKED)!`);
    } else {
      // CHƯA SỬA: Lost Update ghi đè
      setDualSeats(prev => prev.map(s => {
        if (s.soGhe === seatCode) {
          return { ...s, trangThai: 'DANG_GIU', holder: 'T2', lockType: 'NONE' };
        }
        return s;
      }));

      setDualT1(prev => ({
        ...prev,
        status: 'ACTIVE',
        selectedSeats: [seatCode],
        heldSeats: [seatCode],
        alert: `⚠️ Khách A vừa giữ ghế ${seatCode} nhưng bị Khách B ghi đè!`,
        alertType: 'warning',
        logs: [`UPDATE Ghe SET ... MaKH='T1'; -- BỊ T2 GHI ĐÈ!`, ...prev.logs]
      }));

      setDualT2(prev => ({
        ...prev,
        status: 'ACTIVE',
        selectedSeats: [seatCode],
        heldSeats: [seatCode],
        alert: `💥 XUNG ĐỘT (LOST UPDATE)! T2 đã GHI ĐÈ lên ghế ${seatCode} của T1 do thiếu cơ chế khóa!`,
        alertType: 'error',
        logs: [`UPDATE Ghe SET ... MaKH='T2'; -- GHI ĐÈ LÊN T1 THÀNH CÔNG (MẤT DỮ LIỆU T1)`, ...prev.logs]
      }));

      addDualTimeline('SQL_ENGINE', `💥 [LỖI LOST UPDATE] Cả 2 cùng bấm: T2 ghi đè lên ghế ${seatCode} của T1!`);
    }
  };

  const handleDualReset = () => {
    sound.play('click');
    setDualSeats(INITIAL_DUAL_SEATS);
    setDualExtraSeats([]);
    setDualTicketPrice(90000);
    setDualT1({
      user: 'Nguyễn Hoàng Long',
      spid: 52,
      role: 'VIP',
      status: 'IDLE',
      selectedSeats: ['B01'],
      heldSeats: [],
      logs: ['[Session SPID 52] Reset phiên giao dịch.'],
      alert: null,
      alertType: 'info'
    });
    setDualT2({
      user: 'Trần Thị B',
      spid: 53,
      role: 'Khách Thường',
      status: 'IDLE',
      selectedSeats: ['B01'],
      heldSeats: [],
      logs: ['[Session SPID 53] Reset phiên giao dịch.'],
      alert: null,
      alertType: 'info'
    });
    addDualTimeline('SQL_ENGINE', 'Đã reset toàn bộ ghế và trạng thái 2 giao tác về ban đầu.');
  };

  const handleDualSelectSeat = (session, seatId) => {
    sound.play('click');
    if (session === 'T1') {
      setDualT1(prev => ({
        ...prev,
        selectedSeats: prev.selectedSeats.includes(seatId) 
          ? prev.selectedSeats.filter(s => s !== seatId)
          : [...prev.selectedSeats, seatId]
      }));
    } else {
      setDualT2(prev => ({
        ...prev,
        selectedSeats: prev.selectedSeats.includes(seatId) 
          ? prev.selectedSeats.filter(s => s !== seatId)
          : [...prev.selectedSeats, seatId]
      }));
    }
  };

  const handleDualBeginTran = (session) => {
    sound.play('click');
    if (session === 'T1') {
      setDualT1(prev => ({
        ...prev,
        status: 'ACTIVE',
        logs: [`BEGIN TRANSACTION; (Session SPID 52)`, ...prev.logs],
        alert: 'Đã mở giao dịch. Ghế được chọn sẽ được bảo vệ khi bấm Giữ Chỗ.',
        alertType: 'info'
      }));
      addDualTimeline('T1', 'BEGIN TRANSACTION: Khách A (SPID 52) mở phiên giao dịch.');
    } else {
      setDualT2(prev => ({
        ...prev,
        status: 'ACTIVE',
        logs: [`BEGIN TRANSACTION; (Session SPID 53)`, ...prev.logs],
        alert: 'Đã mở giao dịch. Bạn có thể chọn ghế để kiểm tra khóa.',
        alertType: 'info'
      }));
      addDualTimeline('T2', 'BEGIN TRANSACTION: Khách B (SPID 53) mở phiên giao dịch.');
    }
  };

  const handleDualHoldSeats = (session) => {
    const isT1 = session === 'T1';
    const myState = isT1 ? dualT1 : dualT2;
    const otherSession = isT1 ? 'T2' : 'T1';
    const otherState = isT1 ? dualT2 : dualT1;
    const seatsToHold = myState.selectedSeats;

    if (seatsToHold.length === 0) {
      sound.play('error');
      if (isT1) setDualT1(prev => ({ ...prev, alert: 'Vui lòng chọn ít nhất 1 ghế!', alertType: 'warning' }));
      else setDualT2(prev => ({ ...prev, alert: 'Vui lòng chọn ít nhất 1 ghế!', alertType: 'warning' }));
      return;
    }

    // Check if already booked
    const alreadyBooked = dualSeats.filter(s => seatsToHold.includes(s.soGhe) && s.trangThai === 'DA_DAT');
    if (alreadyBooked.length > 0) {
      sound.play('error');
      const msg = `Ghế ${alreadyBooked.map(s => s.soGhe).join(', ')} ĐÃ BÁN, không thể giữ!`;
      if (isT1) setDualT1(prev => ({ ...prev, alert: msg, alertType: 'error' }));
      else setDualT2(prev => ({ ...prev, alert: msg, alertType: 'error' }));
      return;
    }

    // Check if held by the other session
    const heldByOther = dualSeats.filter(s => seatsToHold.includes(s.soGhe) && s.holder === otherSession && s.trangThai === 'DANG_GIU');
    
    if (heldByOther.length > 0) {
      if (dualIsFixed) {
        // Safe: Blocked!
        sound.play('error');
        const conflictSeats = heldByOther.map(s => s.soGhe).join(', ');
        const blockMsg = `⏳ BLOCKED! Ghế ${conflictSeats} đang bị ${otherSession} giữ khóa UPDLOCK/X-Lock. SQL Server bắt ${session} phải CHỜ cho đến khi ${otherSession} COMMIT hoặc ROLLBACK!`;
        if (isT1) {
          setDualT1(prev => ({
            ...prev,
            status: 'ACTIVE',
            alert: blockMsg,
            alertType: 'warning',
            logs: [`BLOCKED: Chờ khóa RID trên ghế ${conflictSeats}...`, ...prev.logs]
          }));
        } else {
          setDualT2(prev => ({
            ...prev,
            status: 'ACTIVE',
            alert: blockMsg,
            alertType: 'warning',
            logs: [`BLOCKED: Chờ khóa RID trên ghế ${conflictSeats}...`, ...prev.logs]
          }));
        }
        addDualTimeline('SQL_ENGINE', `🔴 XUNG ĐỘT KHÓA: ${session} bị chặn (BLOCKED) khi cố truy cập ghế ${conflictSeats} của ${otherSession}.`);
        return;
      } else {
        // Unsafe: Simulate Lost Update overwrite!
        sound.play('error');
        const conflictSeats = heldByOther.map(s => s.soGhe).join(', ');
        const warnMsg = `💥 XUNG ĐỘT (LOST UPDATE)! Do không dùng UPDLOCK, ${session} đã GHI ĐÈ lên ghế ${conflictSeats} mà ${otherSession} đang giữ! Cập nhật của ${otherSession} bị mất!`;
        if (isT1) setDualT1(prev => ({ ...prev, alert: warnMsg, alertType: 'error' }));
        else setDualT2(prev => ({ ...prev, alert: warnMsg, alertType: 'error' }));
        addDualTimeline('SQL_ENGINE', `⚠️ [LỖI LOST UPDATE] ${session} ghi đè dữ liệu của ${otherSession} trên ghế ${conflictSeats}!`);
      }
    }

    // Successfully hold seats
    sound.play('beep');
    setDualSeats(prev => prev.map(s => {
      if (seatsToHold.includes(s.soGhe)) {
        return {
          ...s,
          trangThai: 'DANG_GIU',
          holder: session,
          lockType: dualIsFixed ? 'UPDLOCK' : 'NONE'
        };
      }
      return s;
    }));

    const successMsg = `🔒 Đã giữ ghế ${seatsToHold.join(', ')} với khóa ${dualIsFixed ? 'UPDLOCK (Update Lock)' : 'Không khóa (NOLOCK)'}.`;
    if (isT1) {
      setDualT1(prev => ({
        ...prev,
        status: 'ACTIVE',
        heldSeats: [...new Set([...prev.heldSeats, ...seatsToHold])],
        alert: successMsg,
        alertType: 'success',
        logs: [`SELECT * FROM Ghe WITH (${dualIsFixed ? 'UPDLOCK, ROWLOCK' : 'NOLOCK'}) WHERE MaGhe IN ('${seatsToHold.join("','")}'); -- GIỮ KHÓA`, ...prev.logs]
      }));
    } else {
      setDualT2(prev => ({
        ...prev,
        status: 'ACTIVE',
        heldSeats: [...new Set([...prev.heldSeats, ...seatsToHold])],
        alert: successMsg,
        alertType: 'success',
        logs: [`SELECT * FROM Ghe WITH (${dualIsFixed ? 'UPDLOCK, ROWLOCK' : 'NOLOCK'}) WHERE MaGhe IN ('${seatsToHold.join("','")}'); -- GIỮ KHÓA`, ...prev.logs]
      }));
    }
    addDualTimeline(session, `Nắm giữ ghế ${seatsToHold.join(', ')} (${dualIsFixed ? 'UPDLOCK' : 'NOLOCK'}).`);
  };

  const handleDualCommit = (session) => {
    const isT1 = session === 'T1';
    const myState = isT1 ? dualT1 : dualT2;
    const otherSession = isT1 ? 'T2' : 'T1';
    const seatsToCommit = myState.heldSeats;

    if (seatsToCommit.length === 0) {
      sound.play('error');
      const msg = 'Bạn chưa giữ ghế nào để thanh toán!';
      if (isT1) setDualT1(prev => ({ ...prev, alert: msg, alertType: 'warning' }));
      else setDualT2(prev => ({ ...prev, alert: msg, alertType: 'warning' }));
      return;
    }

    sound.play('success');
    // Change to DA_DAT
    setDualSeats(prev => prev.map(s => {
      if (seatsToCommit.includes(s.soGhe)) {
        return { ...s, trangThai: 'DA_DAT', holder: session, lockType: null };
      }
      return s;
    }));

    // Notify current session
    const okMsg = `🎉 THANH TOÁN THÀNH CÔNG! Đã xuất vé ${seatsToCommit.join(', ')}. Giao dịch đã COMMIT vĩnh viễn vào CSDL.`;
    if (isT1) {
      setDualT1(prev => ({
        ...prev,
        status: 'COMMITTED',
        alert: okMsg,
        alertType: 'success',
        logs: [`UPDATE Ghe SET TrangThai = 'DA_DAT'; COMMIT TRANSACTION; -- LƯU VĨNH VIỄN`, ...prev.logs]
      }));
      // Notify other session
      setDualT2(prev => ({
        ...prev,
        selectedSeats: prev.selectedSeats.filter(s => !seatsToCommit.includes(s)),
        alert: `⚠️ Ghế ${seatsToCommit.join(', ')} vừa được T1 thanh toán thành công! Ghế đã chuyển sang ĐÃ BÁN.`,
        alertType: 'info'
      }));
    } else {
      setDualT2(prev => ({
        ...prev,
        status: 'COMMITTED',
        alert: okMsg,
        alertType: 'success',
        logs: [`UPDATE Ghe SET TrangThai = 'DA_DAT'; COMMIT TRANSACTION; -- LƯU VĨNH VIỄN`, ...prev.logs]
      }));
      setDualT1(prev => ({
        ...prev,
        selectedSeats: prev.selectedSeats.filter(s => !seatsToCommit.includes(s)),
        alert: `⚠️ Ghế ${seatsToCommit.join(', ')} vừa được T2 thanh toán thành công! Ghế đã chuyển sang ĐÃ BÁN.`,
        alertType: 'info'
      }));
    }
    addDualTimeline(session, `COMMIT TRANSACTION: Đặt vé ${seatsToCommit.join(', ')} thành công.`);
  };

  const handleDualRollback = (session) => {
    const isT1 = session === 'T1';
    const myState = isT1 ? dualT1 : dualT2;
    const otherSession = isT1 ? 'T2' : 'T1';
    const seatsToRollback = myState.heldSeats;

    sound.play('vintage');
    // Release held seats back to TRONG
    setDualSeats(prev => prev.map(s => {
      if (seatsToRollback.includes(s.soGhe) && s.holder === session && s.trangThai !== 'DA_DAT') {
        return { ...s, trangThai: 'TRONG', holder: null, lockType: null };
      }
      return s;
    }));

    const rollMsg = `↩ ĐÃ HỦY ĐƠN (ROLLBACK)! Thẻ lỗi hoặc hủy thao tác. Ghế ${seatsToRollback.join(', ')} đã được nhả lại thành TRỐNG.`;
    if (isT1) {
      setDualT1(prev => ({
        ...prev,
        status: 'ROLLED_BACK',
        heldSeats: [],
        alert: rollMsg,
        alertType: 'warning',
        logs: [`ROLLBACK TRANSACTION; -- HOÀN TÁC TOÀN BỘ, NHẢ KHÓA`, ...prev.logs]
      }));
      setDualT2(prev => ({
        ...prev,
        alert: `🟢 Ghế ${seatsToRollback.join(', ')} vừa được T1 nhả ra do hủy đơn! Bạn có thể đặt ngay bây giờ.`,
        alertType: 'success'
      }));
    } else {
      setDualT2(prev => ({
        ...prev,
        status: 'ROLLED_BACK',
        heldSeats: [],
        alert: rollMsg,
        alertType: 'warning',
        logs: [`ROLLBACK TRANSACTION; -- HOÀN TÁC TOÀN BỘ, NHẢ KHÓA`, ...prev.logs]
      }));
      setDualT1(prev => ({
        ...prev,
        alert: `🟢 Ghế ${seatsToRollback.join(', ')} vừa được T2 nhả ra do hủy đơn! Bạn có thể đặt ngay bây giờ.`,
        alertType: 'success'
      }));
    }
    addDualTimeline(session, `ROLLBACK TRANSACTION: Hủy giao dịch, nhả ghế ${seatsToRollback.join(', ')} về TRỐNG.`);
  };

  const handleDualRunScenario = async (scenarioKey) => {
    if (dualRunningPreset) return;
    setDualRunningPreset(true);
    setDualSelectedScenario(scenarioKey);
    handleDualReset();

    const wait = ms => new Promise(r => setTimeout(r, ms));

    if (scenarioKey === 'lost_update') {
      addDualTimeline('SCENARIO', '▶ BẮT ĐẦU KỊCH BẢN 1: LOST UPDATE (Cả 2 khách cùng chọn ghế B01)');
      await wait(600);
      handleDualBeginTran('T1');
      await wait(600);
      handleDualBeginTran('T2');
      await wait(800);
      handleDualHoldSeats('T1');
      await wait(1000);
      handleDualHoldSeats('T2');
    } else if (scenarioKey === 'dirty_read') {
      addDualTimeline('SCENARIO', '▶ BẮT ĐẦU KỊCH BẢN 2: DIRTY READ (T1 giữ ghế A01, T2 đọc, rồi T1 Rollback)');
      await wait(600);
      setDualT1(prev => ({ ...prev, selectedSeats: ['A01'] }));
      setDualT2(prev => ({ ...prev, selectedSeats: ['A01'] }));
      await wait(600);
      handleDualBeginTran('T1');
      await wait(600);
      handleDualHoldSeats('T1');
      await wait(1200);
      if (!dualIsFixed) {
        addDualTimeline('T2', 'Đọc trộm (DIRTY READ): Thấy A01 đang giữ bởi T1 dù chưa COMMIT!');
      } else {
        addDualTimeline('SQL_ENGINE', 'READ COMMITTED: T2 bị chặn, bắt buộc phải đợi T1 kết thúc!');
      }
      await wait(1200);
      handleDualRollback('T1');
    } else if (scenarioKey === 'unrepeatable_read') {
      addDualTimeline('SCENARIO', '▶ BẮT ĐẦU KỊCH BẢN 3: NON-REPEATABLE READ (T1 đọc giá 90k, Admin T2 đổi thành 120k)');
      await wait(600);
      handleDualBeginTran('T1');
      addDualTimeline('T1', 'Lần 1: Khách A đọc giá vé = 90.000đ.');
      await wait(1000);
      setDualTicketPrice(120000);
      addDualTimeline('T2', 'Admin T2 UPDATE SuatChieu SET GiaVe = 120.000đ; COMMIT;');
      await wait(1000);
      if (!dualIsFixed) {
        addDualTimeline('T1', 'Lần 2: Khách A đọc lại giá vé = 120.000đ! (BỊ THAY ĐỔI)');
      } else {
        addDualTimeline('T1', 'REPEATABLE READ: Khóa S-Lock giữ nguyên giá 90.000đ cho Khách A đến hết giao tác!');
      }
    } else if (scenarioKey === 'phantom_read') {
      addDualTimeline('SCENARIO', '▶ BẮT ĐẦU KỊCH BẢN 4: PHANTOM READ (T1 đếm ghế VIP, T2 lắp thêm ghế B04)');
      await wait(600);
      addDualTimeline('T1', 'Lần 1: Khách A đếm số ghế VIP trống: SELECT COUNT(*) => 3 ghế (B01, B02, B03).');
      await wait(1200);
      setDualExtraSeats([{ id: 'B04', soGhe: 'B04', loai: 'VIP', hang: 'B', gia: 120000, trangThai: 'TRONG', holder: null, lockType: null }]);
      addDualTimeline('T2', 'Kỹ thuật viên T2 INSERT INTO Ghe VALUES (B04, VIP); COMMIT;');
      await wait(1200);
      if (!dualIsFixed) {
        addDualTimeline('T1', 'Lần 2: Khách A đếm lại => 4 ghế! (XUẤT HIỆN BÓNG MA B04)');
      } else {
        addDualTimeline('T1', 'SERIALIZABLE (RangeS-S): Chặn đứng lệnh INSERT B04 cho đến khi T1 đếm xong!');
      }
    } else if (scenarioKey === 'deadlock') {
      addDualTimeline('SCENARIO', '▶ BẮT ĐẦU KỊCH BẢN 5: DEADLOCK (T1 giữ A01 đòi A02; T2 giữ A02 đòi A01)');
      await wait(600);
      setDualT1(prev => ({ ...prev, selectedSeats: ['A01'] }));
      setDualT2(prev => ({ ...prev, selectedSeats: ['A02'] }));
      await wait(600);
      handleDualBeginTran('T1');
      handleDualBeginTran('T2');
      await wait(600);
      handleDualHoldSeats('T1');
      await wait(600);
      handleDualHoldSeats('T2');
      await wait(1000);
      addDualTimeline('SQL_ENGINE', 'T1 xin khóa A02 (chờ T2) <---> T2 xin khóa A01 (chờ T1) => CHU TRÌNH VÒNG LẶP!');
      await wait(1200);
      addDualTimeline('SQL_ENGINE', '⚡ DEADLOCK MONITOR: Phát hiện chu trình, bắn hạ T1 bằng Msg 1205 (Deadlock Victim)!');
    }
    setDualRunningPreset(false);
  };


  // Toast Helper
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3800);
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [resMovies, resCinemas, resPromos, resCombos, resState] = await Promise.all([
        fetch('/api/movies').then(r => r.json()).catch(() => []),
        fetch('/api/cinemas').then(r => r.json()).catch(() => []),
        fetch('/api/promotions').then(r => r.json()).catch(() => []),
        fetch('/api/combos').then(r => r.json()).catch(() => []),
        fetch('/api/state').then(r => r.json()).catch(() => ({ seats: [], suatChieu: {} }))
      ]);
      setMovies(resMovies);
      setCinemas(resCinemas);
      setPromotions(resPromos);
      setCombos(resCombos);
      setDbState(resState);
      if (resMovies.length > 0) setSelectedMovie(resMovies[0]);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  // Fetch Tickets When Tab Changes
  useEffect(() => {
    if (currentTab === 'tickets' && currentUser) {
      fetchUserTickets(currentUser.id);
    }
    if (currentTab === 'admin' && currentUser?.vaiTro === 'Admin') {
      fetchAdminData();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab, currentUser]);

  const fetchUserTickets = async (uid) => {
    try {
      const res = await fetch(`/api/user/tickets?userId=${uid}`);
      const data = await res.json();
      setUserTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminData = async () => {
    try {
      if (!currentUser || currentUser.vaiTro !== 'Admin') return;
      const [resStats, resUsers] = await Promise.all([
        fetch(`/api/admin/stats?userId=${currentUser.id}`).then(r => r.json()),
        fetch(`/api/admin/users?userId=${currentUser.id}`).then(r => r.json())
      ]);
      if (resStats.success) setAdminStats(resStats.stats);
      if (resUsers.success) setAdminUsers(resUsers.users);
    } catch (e) {
      console.error(e);
    }
  };

  // Dedicated Login & Role-Based Authorization
  const handleLogin = async (email, matKhau) => {
    sound.play('click');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, matKhau })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setAuthModal({ open: false, mode: 'login' });
        showToast(`Đăng nhập thành công! Phân quyền: [${data.user.vaiTro}] ${data.user.hoTen}`, 'success');

        // If there was a pending movie booking intent, proceed directly to booking!
        if (pendingMovie) {
          setSelectedMovie(pendingMovie);
          setPendingMovie(null);
          setSelectedSeats([]);
          setSelectedShowtime(pendingMovie.suatChieu?.[0] || '19:30');
          setCurrentTab('booking');
        } else if (data.user.vaiTro === 'Admin') {
          // Admin can stay or view admin
        } else if (data.user.vaiTro === 'NhanVien') {
          // Staff can open check-in desk
        }
      } else {
        sound.play('lock');
        showToast(data.message || 'Email hoặc mật khẩu không chính xác!', 'error');
      }
    } catch (e) {
      sound.play('lock');
      showToast('Lỗi kết nối máy chủ khi đăng nhập', 'error');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    sound.play('click');
    setCurrentUser(null);
    setUserTickets([]);
    if (currentTab === 'admin' || currentTab === 'staff' || currentTab === 'tickets') {
      setCurrentTab('home');
    }
    showToast('Đã đăng xuất tài khoản thành công', 'info');
  };

  // Audio Toggle
  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    sound.enabled = next;
    showToast(next ? '🔊 Đã bật âm thanh rạp phim' : '🔇 Đã tắt âm thanh', 'info');
  };

  // Start Booking Flow - Strictly requires authenticated user
  const startBooking = (movie) => {
    sound.play('click');
    if (!currentUser) {
      sound.play('lock');
      setPendingMovie(movie);
      showToast('Quý khách vui lòng đăng nhập tài khoản trước khi vào đặt vé!', 'warning');
      setAuthModal({ open: true, mode: 'login' });
      return;
    }
    setSelectedMovie(movie);
    setSelectedSeats([]);
    setSelectedShowtime(movie.suatChieu?.[0] || '19:30');
    setCurrentTab('booking');
  };

  // Toggle Seat Selection
  const handleToggleSeat = (seat) => {
    if (seat.trangThai === 'Đã Đặt') {
      sound.play('lock');
      showToast(`Ghế ${seat.soGhe} đã được đặt trước đó!`, 'error');
      return;
    }
    sound.play('click');
    if (selectedSeats.includes(seat.soGhe)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat.soGhe));
    } else {
      setSelectedSeats([...selectedSeats, seat.soGhe]);
    }
  };

  // Calculate Prices
  const seatSubtotal = useMemo(() => {
    return selectedSeats.reduce((sum, sNo) => {
      const s = dbState.seats.find(x => x.soGhe === sNo);
      return sum + (s ? s.gia : 90000);
    }, 0);
  }, [selectedSeats, dbState.seats]);

  const comboSubtotal = useMemo(() => {
    if (!selectedComboId) return 0;
    const c = combos.find(x => x.id === selectedComboId);
    return c ? c.gia : 0;
  }, [selectedComboId, combos]);

  const grandTotal = useMemo(() => {
    const raw = seatSubtotal + comboSubtotal;
    return Math.max(0, raw - appliedDiscount);
  }, [seatSubtotal, comboSubtotal, appliedDiscount]);

  // Apply Discount Code
  const handleApplyDiscount = () => {
    sound.play('click');
    const code = discountCode.trim().toUpperCase();
    if (code === 'CINEMAXVIP') {
      const disc = Math.round((seatSubtotal + comboSubtotal) * 0.2);
      setAppliedDiscount(disc);
      sound.play('success');
      showToast(`Mã CINEMAXVIP hợp lệ: Giảm ngay 20% (-${disc.toLocaleString()} đ)!`, 'success');
    } else if (code === 'STUDENT') {
      const disc = Math.round((seatSubtotal + comboSubtotal) * 0.15);
      setAppliedDiscount(disc);
      sound.play('success');
      showToast(`Mã STUDENT hợp lệ: Giảm 15% (-${disc.toLocaleString()} đ)!`, 'success');
    } else if (code === 'HAPPYWED') {
      setAppliedDiscount(25000);
      sound.play('success');
      showToast('Áp dụng ưu đãi Thứ Tư Vui Vẻ: Giảm 25.000 đ!', 'success');
    } else {
      sound.play('lock');
      showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn!', 'error');
    }
  };

  // Confirm Full Booking with Mandatory Payment Processing
  const handleConfirmPayment = async () => {
    if (!currentUser) {
      sound.play('lock');
      showToast('Vui lòng đăng nhập tài khoản trước khi thanh toán!', 'error');
      setAuthModal({ open: true, mode: 'login' });
      return;
    }
    if (selectedSeats.length === 0) {
      sound.play('lock');
      showToast('Vui lòng chọn ít nhất một vị trí ghế ngồi!', 'error');
      return;
    }

    // Determine Payment Method Name
    let ptName = 'Thẻ Visa / MasterCard (Online)';
    if (paymentMethod === 'vietqr') ptName = 'Chuyển Khoản VietQR 24/7';
    else if (paymentMethod === 'momo') ptName = 'Ví Điện Tử MoMo';
    else if (paymentMethod === 'counter') ptName = 'Thanh Toán Tại Quầy Rạp';

    // Start payment processing animation
    setIsProcessingPayment(true);
    sound.play('click');

    setTimeout(async () => {
      try {
        const res = await fetch('/api/book-full', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            tenPhim: selectedMovie.tenPhim,
            suatChieu: selectedShowtime,
            phongChieu: 'Phòng 01 (Grand Theater)',
            seats: selectedSeats,
            comboId: selectedComboId,
            phuongThucTT: ptName,
            giamGia: appliedDiscount
          })
        });
        const data = await res.json();
        setIsProcessingPayment(false);

        if (data.success) {
          sound.play('success');
          showToast(data.message, 'success');
          if (data.user) {
            setCurrentUser(prev => ({ ...prev, diem: data.user.diem }));
          }
          setSelectedSeats([]);
          setSelectedComboId(null);
          await fetchInitialData();
          if (currentUser) {
            await fetchUserTickets(currentUser.id);
          }
          setCurrentTab('tickets');
        } else {
          sound.play('lock');
          showToast(data.message || 'Thanh toán không thành công!', 'error');
        }
      } catch (e) {
        setIsProcessingPayment(false);
        sound.play('lock');
        showToast('Lỗi kết nối máy chủ khi xử lý thanh toán', 'error');
      }
    }, 1200);
  };

  // Staff Check-In
  const handleStaffCheckIn = async (code) => {
    const tCode = code || staffScanCode.trim().toUpperCase();
    if (!tCode) {
      showToast('Vui lòng nhập mã vé!', 'error');
      return;
    }
    try {
      const res = await fetch('/api/staff/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: tCode, userId: currentUser.id })
      });
      const data = await res.json();
      if (data.success) {
        sound.play('success');
        showToast(data.message, 'success');
        setStaffScanCode('');
        fetchInitialData();
      } else {
        sound.play('lock');
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Admin Change Role (WITH PIN 8888 SECURITY)
  const handleAdminChangeRole = async (targetUserId, newRole) => {
    if (currentUser?.vaiTro !== 'Admin') {
      sound.play('lock');
      showToast('Từ chối truy cập: Bạn không phải Quản Trị Viên!', 'error');
      return;
    }
    const pin = prompt(`🔐 XÁC THỰC BẢO MẬT QUẢN TRỊ VIÊN:\n\nBạn đang đổi vai trò tài khoản #${targetUserId} thành [${newRole}].\nVui lòng nhập Mã PIN Quản Trị Tối Cao (Master Security PIN):\n(Mã PIN mặc định: 8888)`);
    if (pin === null) return;
    if (!pin.trim()) {
      showToast('Thao tác hủy: Vui lòng nhập mã PIN bảo mật!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: currentUser.id,
          targetUserId,
          newRole,
          adminPin: pin.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        sound.play('success');
        showToast(data.message, 'success');
        fetchAdminData();
      } else {
        sound.play('lock');
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Admin Update Price
  const handleAdminUpdatePrice = async () => {
    try {
      const res = await fetch('/api/admin/update-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id, newPrice: adminNewPrice })
      });
      const data = await res.json();
      if (data.success) {
        sound.play('success');
        showToast(data.message, 'success');
        fetchInitialData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Admin Add VIP Seat
  const handleAdminAddVipSeat = async () => {
    try {
      const res = await fetch('/api/admin/add-vip-seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id })
      });
      const data = await res.json();
      if (data.success) {
        sound.play('success');
        showToast(data.message, 'success');
        fetchInitialData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Run SQL Concurrency Lab Simulation
  const runSimulation = async () => {
    if (isRunningConflict) return;
    setIsRunningConflict(true);
    setT1Status('⏳ Đang khởi tạo Transaction 1...');
    setT2Status('⏳ Đang khởi tạo Transaction 2...');
    setLabLogs([]);
    setActiveLocks({});
    setLabView(EMPTY_LAB_VIEW);

    try {
      const res = await fetch('/api/run-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictId: currentConflictId,
          isFixed: isConflictFixed
        })
      });
      const data = await res.json();
      if (data.success) {
        const locks = {};
        const viewDriven = data.logs.some(l => l.view);
        for (let i = 0; i < data.logs.length; i++) {
          const log = data.logs[i];
          await new Promise(r => setTimeout(r, log.view ? 900 : 450));
          setLabLogs(prev => [...prev, log]);

          if (log.tag.includes('T1')) setT1Status(log.message);
          else if (log.tag.includes('T2')) setT2Status(log.message);

          const msg = log.message;
          if (log.view) {
            Object.keys(locks).forEach(k => delete locks[k]);
            Object.entries(log.view.locks || {}).forEach(([seatNo, l]) => {
              locks[seatNo] = { text: l.text, color: LOCK_TONES[l.tone] || LOCK_TONES.x };
            });
            setLabView({ seats: log.view.seats || {}, extra: log.view.extra || [], readouts: log.view.readouts || [] });
          } else if (viewDriven) {
            // Kịch bản dùng log.view: giữ nguyên trạng thái khóa của bước trước
          } else if (msg.includes('UPDLOCK')) {
            locks['B01'] = { text: 'U-LOCK', color: 'bg-amber-500 text-black' };
          } else if (msg.includes('X-Lock') || msg.includes('khóa Độc quyền')) {
            if (msg.includes('B01')) locks['B01'] = { text: 'X-LOCK', color: 'bg-red-600 text-white' };
            if (msg.includes('A01')) locks['A01'] = { text: 'X-LOCK', color: 'bg-red-600 text-white' };
            if (msg.includes('A02')) locks['A02'] = { text: 'X-LOCK', color: 'bg-red-600 text-white' };
          } else if (msg.includes('SERIALIZABLE') || msg.includes('Range Lock')) {
            locks['B01'] = { text: 'RANGE-LOCK', color: 'bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40' };
            locks['B02'] = { text: 'RANGE-LOCK', color: 'bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40' };
            locks['B03'] = { text: 'RANGE-LOCK', color: 'bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40' };
          } else if (msg.includes('DEADLOCK') || msg.includes('1205')) {
            locks['A01'] = { text: 'DEADLOCK 💥', color: 'bg-[#B3262E] animate-pulse text-[#F6ECE1] border border-[#D4AF37]' };
            locks['A02'] = { text: 'VICTIM ❌', color: 'bg-[#4A1215] text-[#F0C67E] border border-[#8E1E24]' };
          } else if (msg.includes('REPEATABLE READ') || msg.includes('S-Lock')) {
            locks['B01'] = { text: 'S-LOCK', color: 'bg-[#C5A059] text-[#120F0D] font-bold border border-[#D4AF37]' };
          }
          setActiveLocks({ ...locks });

          if (msg.includes('DEADLOCK') || msg.includes('1205')) {
            sound.play('deadlock');
          } else if (msg.includes('BLOCK') || msg.includes('khóa')) {
            sound.play('lock');
          }
        }

        setDbState(prev => ({ ...prev, seats: data.dbState.seats }));
        if (isConflictFixed) sound.play('success');

        setT1Status('✔ Hoàn tất giao dịch T1');
        setT2Status(isConflictFixed ? '✔ Hoàn tất (An toàn)' : '✘ Kết thúc lỗi tranh chấp');
      }
    } catch (e) {
      showToast('Lỗi khi thực thi mô phỏng: ' + e.message, 'error');
    } finally {
      setIsRunningConflict(false);
    }
  };

  // Reset Lab DB State
  const handleResetLabDb = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      sound.play('click');
      showToast(data.message, 'success');
      setActiveLocks({});
      setLabView(EMPTY_LAB_VIEW);
      setLabLogs([]);
      fetchInitialData();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Filtered Movies
  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const matchTab = movieFilterTab === 'all' || m.status === movieFilterTab;
      const matchGenre = activeGenre === 'Tất Cả' || (m.theLoai && m.theLoai.includes(activeGenre));
      const matchSearch = searchQuery.trim() === '' || 
        m.tenPhim.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (m.tenGoc && m.tenGoc.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchTab && matchGenre && matchSearch;
    });
  }, [movies, movieFilterTab, activeGenre, searchQuery]);

  return (
    <div className="cinema-bg min-h-screen text-[#F6ECE1] font-sans selection:bg-[#8E1E24] selection:text-[#F6ECE1]">
      {/* ============================================================= */}
      {/* TOP NOTIFICATION TICKER                                       */}
      {/* ============================================================= */}
      <div className="bg-[#080605] border-b border-[#D4AF37]/15 py-2 px-4 text-xs text-[#B8A898] flex justify-between items-center tracking-wide font-sans">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
          <span>Chào mừng quý khách đến với <strong className="text-[#D4AF37] font-cinzel font-bold">CineMax Premier • Est. 1926</strong> • Tặng <strong>100 điểm thưởng</strong> cho hội viên mới!</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <span>📞 Hotline: <strong className="text-[#F6ECE1]">1900 6017</strong> (8:00 - 23:00)</span>
          <span>🏛 Rạp chiếu: <span className="text-[#D4AF37] font-semibold">Grand Theater & 70mm Vintage Sound</span></span>
        </div>
      </div>

      {/* ============================================================= */}
      {/* LUXURY VINTAGE STICKY NAVBAR                                 */}
      {/* ============================================================= */}
      <header className="sticky top-0 z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div 
            onClick={() => { sound.play('click'); setCurrentTab('home'); }} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8E1E24] to-[#4A1215] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#8E1E24]/30 group-hover:scale-105 transition-transform">
              <span className="text-2xl">📽</span>
            </div>
            <div>
              <div className="text-2xl font-cinzel font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F6ECE1] via-[#D4AF37] to-[#E5A84B]">
                CINEMAX
              </div>
              <div className="text-[10px] font-mono tracking-[0.3em] text-[#D4AF37] font-semibold -mt-1">
                PREMIER CINEMAS • EST. 1926
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#14100D] p-1.5 rounded-full border border-[#D4AF37]/20">
            <button 
              onClick={() => { sound.play('click'); setCurrentTab('home'); }} 
              className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${currentTab === 'home' ? 'bg-gradient-to-r from-[#8E1E24] to-[#B3262E] text-[#F6ECE1] border border-[#D4AF37]/40 shadow-md shadow-[#8E1E24]/40' : 'text-[#B8A898] hover:text-[#F6ECE1] hover:bg-white/5'}`}
            >
              Trang Chủ
            </button>
            <button 
              onClick={() => { sound.play('click'); setCurrentTab('movies'); }} 
              className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${currentTab === 'movies' ? 'bg-gradient-to-r from-[#8E1E24] to-[#B3262E] text-[#F6ECE1] border border-[#D4AF37]/40 shadow-md shadow-[#8E1E24]/40' : 'text-[#B8A898] hover:text-[#F6ECE1] hover:bg-white/5'}`}
            >
              Phim & Lịch Chiếu
            </button>
            <button 
              onClick={() => { sound.play('click'); setCurrentTab('cinemas'); }} 
              className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${currentTab === 'cinemas' ? 'bg-gradient-to-r from-[#8E1E24] to-[#B3262E] text-[#F6ECE1] border border-[#D4AF37]/40 shadow-md shadow-[#8E1E24]/40' : 'text-[#B8A898] hover:text-[#F6ECE1] hover:bg-white/5'}`}
            >
              Cụm Rạp Hoàng Gia
            </button>
            <button 
              onClick={() => { sound.play('click'); setCurrentTab('promotions'); }} 
              className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${currentTab === 'promotions' ? 'bg-gradient-to-r from-[#8E1E24] to-[#B3262E] text-[#F6ECE1] border border-[#D4AF37]/40 shadow-md shadow-[#8E1E24]/40' : 'text-[#B8A898] hover:text-[#F6ECE1] hover:bg-white/5'}`}
            >
              Khuyến Mãi
            </button>
            <button 
              onClick={() => { sound.play('click'); setCurrentTab('tickets'); }} 
              className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${currentTab === 'tickets' ? 'bg-gradient-to-r from-[#8E1E24] to-[#B3262E] text-[#F6ECE1] border border-[#D4AF37]/40 shadow-md shadow-[#8E1E24]/40' : 'text-[#B8A898] hover:text-[#F6ECE1] hover:bg-white/5'}`}
            >
              Vé Của Tôi
            </button>

            {/* Role Restricted Tabs */}
            {['NhanVien', 'Admin'].includes(currentUser?.vaiTro) && (
              <button 
                onClick={() => { sound.play('click'); setCurrentTab('staff'); }} 
                className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all flex items-center gap-1.5 ${currentTab === 'staff' ? 'bg-[#D4AF37] text-[#120F0D] shadow-md shadow-[#D4AF37]/40' : 'text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}
              >
                <span>🎫</span> Bàn Soát Vé
              </button>
            )}

            {currentUser?.vaiTro === 'Admin' && (
              <button 
                onClick={() => { sound.play('click'); setCurrentTab('admin'); }} 
                className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all flex items-center gap-1.5 ${currentTab === 'admin' ? 'bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/50 shadow-md shadow-[#8E1E24]/40' : 'text-[#E5A84B] hover:bg-white/5'}`}
              >
                <span>🛠</span> Quản Trị
              </button>
            )}

            <button 
              onClick={() => { sound.play('click'); setCurrentTab('lab'); }} 
              className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all flex items-center gap-1.5 ${currentTab === 'lab' ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5A84B] text-[#120F0D] shadow-md shadow-[#D4AF37]/40' : 'text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}
            >
              <span>⚡</span> Lab SQL <span className="bg-[#14100D] text-[#D4AF37] text-[10px] px-1.5 py-0.5 rounded font-mono border border-[#D4AF37]/30">HQTCSDL</span>
            </button>

            <button 
              onClick={() => { sound.play('click'); setCurrentTab('dual'); }} 
              className={`px-4 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all flex items-center gap-1.5 ${currentTab === 'dual' ? 'bg-gradient-to-r from-[#8E1E24] via-[#D4AF37] to-[#E5A84B] text-[#120F0D] shadow-md shadow-[#D4AF37]/40' : 'text-[#E5A84B] hover:bg-[#D4AF37]/10'}`}
            >
              <span>👥</span> Hai Giao Tác Song Song
            </button>
          </nav>

          {/* Right Tools & Role Authorization State */}
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <button 
              onClick={toggleSound}
              className={`p-2.5 rounded-full border transition-all text-xs flex items-center justify-center ${isSoundOn ? 'border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 text-[#8B7C6E] bg-white/5'}`}
              title="Bật / Tắt âm thanh hiệu ứng Web Audio Synthesizer"
            >
              {isSoundOn ? '🔊' : '🔇'}
            </button>

            {/* User Profile or Login CTA */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-[#181410] pl-2.5 pr-2 py-1 rounded-full border border-[#D4AF37]/35 shadow-md">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8E1E24] to-[#D4AF37] flex items-center justify-center text-[#F6ECE1] font-bold text-xs uppercase shadow-sm border border-[#D4AF37]/40">
                  {currentUser.hoTen.charAt(0)}
                </div>
                <div className="text-left hidden sm:block pr-1">
                  <div className="text-xs font-bold text-[#F6ECE1] leading-tight font-cinzel">{currentUser.hoTen}</div>
                  <div className="text-[10px] text-[#D4AF37] font-mono">
                    {currentUser.vaiTro === 'Admin' ? '👑 Quản Trị Viên' : currentUser.vaiTro === 'NhanVien' ? '🎫 Nhân Viên Rạp' : `⭐ ${currentUser.diem} điểm`}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-1 px-2.5 py-1 bg-white/5 hover:bg-[#8E1E24] text-[#A8998A] hover:text-[#F6ECE1] rounded-full transition-all text-xs font-mono font-bold"
                  title="Đăng xuất tài khoản"
                >
                  🚪 Thoát
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setAuthModal({ open: true, mode: 'login' })}
                className="btn-vintage-wine px-5 py-2 rounded-full text-xs font-cinzel font-bold shadow-lg transition-all flex items-center gap-2"
              >
                <span>🗝</span> ĐĂNG NHẬP / PHÂN QUYỀN
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================= */}
      {/* TAB 1: HOMEPAGE (CINEMATIC HERO & BLOCKBUSTERS)               */}
      {/* ============================================================= */}
      {currentTab === 'home' && (
        <main>
          {/* 1. Cinematic Hero Banner */}
          {selectedMovie && (
            <section className="relative w-full h-[580px] lg:h-[660px] flex items-center overflow-hidden">
              {/* Giant Backdrop with Cinematic Vignette Gradient */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={selectedMovie.banner} 
                  alt={selectedMovie.tenPhim}
                  className="w-full h-full object-cover object-center scale-105 filter brightness-90 animate-pulse duration-[12000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0C0A08] via-[#0C0A08]/85 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A08] via-[#0C0A08]/40 to-transparent"></div>
              </div>

              {/* Hero Content */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 w-full">
                <div className="max-w-2xl space-y-5">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40 text-[11px] font-cinzel font-bold px-3 py-1 rounded-md tracking-widest uppercase shadow-md shadow-[#8E1E24]/40">
                      ROYAL 70MM GRAND SCREEN
                    </span>
                    <span className="bg-[#181410]/90 text-[#D4AF37] border border-[#D4AF37]/40 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 font-mono">
                      ⭐ IMDb {selectedMovie.diemIMDb}
                    </span>
                    <span className="bg-[#181410]/80 text-[#B8A898] border border-white/5 text-[11px] font-semibold px-2.5 py-1 rounded-md font-mono">
                      ⏱ {selectedMovie.thoiLuong} Phút
                    </span>
                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[11px] font-bold px-2 py-0.5 rounded font-mono">
                      {selectedMovie.doTuoi?.split(' ')[0] || 'C13'}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-cinzel font-black tracking-tight text-[#F6ECE1] leading-[1.15]">
                    {selectedMovie.tenPhim}
                  </h1>

                  {/* Original Title & Genre */}
                  <div className="text-sm font-semibold text-[#D4AF37] font-mono">
                    {selectedMovie.tenGoc || selectedMovie.tenPhim} • <span className="text-[#B8A898]">{selectedMovie.theLoai}</span>
                  </div>

                  {/* Synopsis */}
                  <p className="text-[#D5C5B5] text-sm sm:text-base line-clamp-3 leading-relaxed font-light">
                    {selectedMovie.moTa}
                  </p>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center gap-4">
                    <button 
                      onClick={() => startBooking(selectedMovie)}
                      className="btn-vintage-wine font-cinzel font-bold text-sm px-8 py-3.5 rounded-full flex items-center gap-2 tracking-wider"
                    >
                      <span>🎟</span> ĐẶT VÉ NGAY
                    </button>
                    <button 
                      onClick={() => {
                        sound.play('click');
                        setTrailerModal({ open: true, youtubeId: selectedMovie.trailerId || 'd9MyW72ELq0', title: selectedMovie.tenPhim });
                      }}
                      className="glass-panel hover:bg-white/10 text-[#F6ECE1] font-cinzel font-semibold text-sm px-7 py-3.5 rounded-full border border-[#D4AF37]/30 transition-all flex items-center gap-2"
                    >
                      <span>▶</span> Xem Trailer
                    </button>
                  </div>
                </div>
              </div>

              {/* Hero Movie Quick Thumbnails */}
              <div className="hidden lg:flex absolute bottom-8 right-8 z-10 items-center gap-3 bg-[#14100D]/90 p-2.5 rounded-2xl border border-[#D4AF37]/25 backdrop-blur-md">
                <span className="text-[11px] font-mono text-[#D4AF37] px-2">Phim nổi bật:</span>
                {movies.slice(0, 4).map(m => (
                  <button 
                    key={m.id}
                    onClick={() => { sound.play('click'); setSelectedMovie(m); }}
                    className={`relative w-16 h-22 rounded-xl overflow-hidden border-2 transition-all ${selectedMovie.id === m.id ? 'border-[#D4AF37] scale-105 shadow-md shadow-[#D4AF37]/40' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={m.poster} alt={m.tenPhim} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 2. Trending Section (Netflix-Style Ranked Cards) */}
          <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-[#D4AF37] font-mono text-xs font-bold tracking-widest uppercase mb-1">
                  TOP 5 BOM TẤN TRONG TUẦN
                </div>
                <h2 className="text-2xl lg:text-3xl font-cinzel font-extrabold text-[#F6ECE1]">
                  🔥 Phim Thịnh Hành Được Đặt Nhiều Nhất
                </h2>
              </div>
              <button 
                onClick={() => { sound.play('click'); setCurrentTab('movies'); }}
                className="text-xs font-bold text-[#D4AF37] hover:text-[#E5A84B] transition-colors flex items-center gap-1 font-mono"
              >
                Xem tất cả lịch chiếu ➜
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.slice(0, 4).map((m, idx) => (
                <div 
                  key={m.id}
                  className="glass-card rounded-2xl overflow-hidden group flex flex-col cursor-pointer border border-[#D4AF37]/20 hover:border-[#D4AF37]/60"
                  onClick={() => { sound.play('click'); setMovieDetailModal({ open: true, movie: m }); }}
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#16120E]">
                    <img 
                      src={m.poster} 
                      alt={m.tenPhim} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105" 
                    />
                    <div className="absolute top-3 left-3 bg-[#0E0C0A]/90 backdrop-blur-md text-[#D4AF37] text-xs font-extrabold px-2.5 py-1 rounded-lg border border-[#D4AF37]/35 flex items-center gap-1 font-mono">
                      ⭐ {m.diemIMDb}
                    </div>
                    <div className="absolute top-3 right-3 bg-[#8E1E24] text-[#F6ECE1] text-[10px] font-bold px-2 py-0.5 rounded border border-[#D4AF37]/30 font-cinzel">
                      TOP #{idx + 1}
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A08] via-[#0C0A08]/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startBooking(m); }}
                        className="btn-vintage-wine w-full font-cinzel font-bold text-xs py-2.5 rounded-xl shadow-lg transition-all"
                      >
                        🎟 MUA VÉ NGAY
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-cinzel font-bold text-base text-[#F6ECE1] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                        {m.tenPhim}
                      </h3>
                      <p className="text-xs text-[#B8A898] mt-1 line-clamp-1">{m.theLoai}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#D4AF37]/15 text-[11px] text-[#A8998A] font-mono">
                      <span>⏱ {m.thoiLuong}p</span>
                      <span className="text-[#D4AF37] font-semibold">70mm Laser</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Movie Catalog Tabs (Now Showing & Coming Soon) */}
          <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10 border-t border-[#D4AF37]/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              {/* Tab Switcher */}
              <div className="flex items-center gap-2 bg-[#16120E] p-1.5 rounded-full border border-[#D4AF37]/25 w-fit">
                <button 
                  onClick={() => { sound.play('click'); setMovieFilterTab('now_showing'); }}
                  className={`px-5 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${movieFilterTab === 'now_showing' ? 'bg-gradient-to-r from-[#8E1E24] to-[#B3262E] text-[#F6ECE1] border border-[#D4AF37]/40 shadow-md shadow-[#8E1E24]/30' : 'text-[#B8A898] hover:text-[#F6ECE1]'}`}
                >
                  Đang Chiếu Tại Rạp ({movies.filter(m => m.status === 'now_showing').length})
                </button>
                <button 
                  onClick={() => { sound.play('click'); setMovieFilterTab('coming_soon'); }}
                  className={`px-5 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${movieFilterTab === 'coming_soon' ? 'bg-gradient-to-r from-[#8E1E24] to-[#B3262E] text-[#F6ECE1] border border-[#D4AF37]/40 shadow-md shadow-[#8E1E24]/30' : 'text-[#B8A898] hover:text-[#F6ECE1]'}`}
                >
                  Sắp Khởi Chiếu ({movies.filter(m => m.status === 'coming_soon').length})
                </button>
              </div>

              {/* Genre Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                {['Tất Cả', 'Hành Động', 'Khoa Học Viễn Tưởng', 'Hoạt Hình', 'Tâm Lý'].map(genre => (
                  <button 
                    key={genre}
                    onClick={() => { sound.play('click'); setActiveGenre(genre); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeGenre === genre ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50' : 'border-[#D4AF37]/15 text-[#B8A898] hover:text-[#F6ECE1]'}`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredMovies.map(m => (
                <div 
                  key={m.id}
                  className="glass-card rounded-2xl overflow-hidden group flex flex-col cursor-pointer border border-[#D4AF37]/20 hover:border-[#D4AF37]/60"
                  onClick={() => { sound.play('click'); setMovieDetailModal({ open: true, movie: m }); }}
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#16120E]">
                    <img 
                      src={m.poster} 
                      alt={m.tenPhim} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105" 
                    />
                    <div className="absolute top-3 left-3 bg-[#0E0C0A]/90 backdrop-blur-md text-[#D4AF37] text-xs font-extrabold px-2.5 py-1 rounded-lg border border-[#D4AF37]/35 flex items-center gap-1 font-mono">
                      ⭐ {m.diemIMDb}
                    </div>
                    {m.status === 'coming_soon' && (
                      <div className="absolute top-3 right-3 bg-[#8E1E24] text-[#F6ECE1] text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-[#D4AF37]/30 font-cinzel">
                        {m.ngayKhoiChieu}
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A08] via-[#0C0A08]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); startBooking(m); }}
                        className="btn-vintage-wine w-full font-cinzel font-bold text-xs py-2.5 rounded-xl shadow-lg transition-all"
                      >
                        🎟 ĐẶT VÉ
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrailerModal({ open: true, youtubeId: m.trailerId || 'd9MyW72ELq0', title: m.tenPhim });
                        }}
                        className="w-full bg-[#181410]/80 hover:bg-[#2A241E] text-[#F6ECE1] font-cinzel font-semibold text-xs py-2 rounded-xl backdrop-blur-md border border-[#D4AF37]/30 transition-all"
                      >
                        ▶ Trailer
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-cinzel font-bold text-base text-[#F6ECE1] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                        {m.tenPhim}
                      </h3>
                      <p className="text-xs text-[#B8A898] mt-1 line-clamp-1">{m.theLoai}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#D4AF37]/15 text-[11px] text-[#A8998A] font-mono">
                      <span>⏱ {m.thoiLuong} Phút</span>
                      <span className="text-[#D4AF37] font-bold">{m.doTuoi?.split(' ')[0] || 'C13'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Luxury Vintage Experience Showcase */}
          <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-[#8E1E24] flex items-start gap-4">
                <span className="text-3xl">🍿</span>
                <div>
                  <h4 className="font-cinzel font-bold text-base text-[#F6ECE1]">Bắp Rang Bơ Gourmet</h4>
                  <p className="text-xs text-[#B8A898] mt-1 leading-relaxed">Vị phô mai Cheddar & Caramen thơm lừng chuẩn phong cách rạp phim cổ điển.</p>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-[#D4AF37] flex items-start gap-4">
                <span className="text-3xl">🔊</span>
                <div>
                  <h4 className="font-cinzel font-bold text-base text-[#F6ECE1]">Âm Thanh Vòm Analog & Dolby</h4>
                  <p className="text-xs text-[#B8A898] mt-1 leading-relaxed">Hệ thống âm thanh thính phòng tái tạo dải âm sâu lắng chuẩn điện ảnh Hollywood.</p>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-[#C08497] flex items-start gap-4">
                <span className="text-3xl">🛋</span>
                <div>
                  <h4 className="font-cinzel font-bold text-base text-[#F6ECE1]">Ghế Sweetbox Nhung Tình Nhân</h4>
                  <p className="text-xs text-[#B8A898] mt-1 leading-relaxed">Ghế sofa đôi bọc nhung đỏ sang trọng với vách ngăn riêng tư dành riêng cho các cặp đôi.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ============================================================= */}
      {/* TAB 2: ALL MOVIES & SCHEDULE VIEW                             */}
      {/* ============================================================= */}
      {currentTab === 'movies' && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-[#D4AF37] font-cinzel text-xs font-bold uppercase tracking-widest mb-1">
                LỊCH CHIẾU CHI TIẾT
              </div>
              <h2 className="text-3xl font-cinzel font-black text-[#F6ECE1]">
                Tất Cả Phim Đang & Sắp Chiếu
              </h2>
            </div>
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder="Tìm kiếm phim, diễn viên..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#14100D] border border-[#3A3026] rounded-full px-4 py-2.5 text-xs text-[#F6ECE1] placeholder-[#A8998A] focus:outline-none focus:border-[#D4AF37]"
              />
              <span className="absolute right-3.5 top-2.5 text-[#D4AF37] text-sm">🔍</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.map(m => (
              <div 
                key={m.id}
                className="glass-card rounded-2xl overflow-hidden group flex flex-col border border-[#D4AF37]/20 hover:border-[#D4AF37]/60"
              >
                <div 
                  className="relative aspect-[2/3] bg-[#16120E] cursor-pointer"
                  onClick={() => { sound.play('click'); setMovieDetailModal({ open: true, movie: m }); }}
                >
                  <img src={m.poster} alt={m.tenPhim} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105" />
                  <div className="absolute top-3 left-3 bg-[#0E0C0A]/90 backdrop-blur-md text-[#D4AF37] text-xs font-extrabold px-2.5 py-1 rounded-lg border border-[#D4AF37]/35 flex items-center gap-1 font-mono">
                    ⭐ {m.diemIMDb}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 
                      onClick={() => { sound.play('click'); setMovieDetailModal({ open: true, movie: m }); }}
                      className="font-cinzel font-bold text-base text-[#F6ECE1] hover:text-[#D4AF37] cursor-pointer transition-colors line-clamp-1"
                    >
                      {m.tenPhim}
                    </h3>
                    <p className="text-xs text-[#B8A898] mt-1 line-clamp-1">{m.theLoai}</p>
                    {/* Showtimes Pills */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.suatChieu?.map(time => (
                        <button 
                          key={time}
                          onClick={() => {
                            setSelectedMovie(m);
                            setSelectedShowtime(time);
                            setSelectedSeats([]);
                            setCurrentTab('booking');
                          }}
                          className="bg-[#1B1713] hover:bg-[#8E1E24] hover:text-[#F6ECE1] text-[#D5C5B5] font-mono text-[11px] px-2.5 py-1 rounded-md border border-[#3A3026] transition-all"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => startBooking(m)}
                    className="mt-4 w-full btn-vintage-wine font-cinzel font-bold text-xs py-2.5 rounded-xl transition-all"
                  >
                    🎟 ĐẶT VÉ PHIM NÀY
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* TAB 3: CINEMA LOCATIONS (CỤM RẠP)                             */}
      {/* ============================================================= */}
      {currentTab === 'cinemas' && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#D4AF37] font-cinzel text-xs font-bold uppercase tracking-widest">
              HỆ THỐNG PHÒNG CHIẾU CAO CẤP
            </span>
            <h2 className="text-3xl font-cinzel font-black text-[#F6ECE1] mt-2">
              Cụm Rạp CineMax Toàn Quốc
            </h2>
            <p className="text-[#B8A898] text-sm mt-2">
              Trang bị màn chiếu khổng lồ IMAX Laser 4K, ghế bọc nhung hoàng gia và phòng trà VIP phong cách Hollywood cổ điển.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cinemas.map(c => (
              <div key={c.id} className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-[#1F1913] text-[#D4AF37] border border-[#D4AF37]/40 text-[11px] font-cinzel font-bold px-2.5 py-0.5 rounded font-mono">
                      ROYAL 70MM GRAND SCREEN
                    </span>
                    <span className="text-xs text-[#B8A898] font-mono">Hotline: {c.hotline}</span>
                  </div>
                  <h3 className="text-xl font-cinzel font-extrabold text-[#F6ECE1]">{c.ten}</h3>
                  <p className="text-xs text-[#B8A898] mt-2 flex items-center gap-1.5">
                    <span>📍</span> {c.diaChi}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.phong?.map(p => (
                      <span key={p} className="bg-[#16120E] text-[#D5C5B5] text-xs px-2.5 py-1 rounded-lg border border-[#3A3026] font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCinema(c.ten);
                    setCurrentTab('booking');
                    showToast(`Đã chọn cụm rạp: ${c.ten}`, 'info');
                  }}
                  className="mt-6 w-full btn-vintage-wine font-cinzel font-bold text-xs py-2.5 rounded-xl transition-all"
                >
                  Chọn Rạp Này & Đặt Vé ➜
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* TAB 4: PROMOTIONS & DEALS                                     */}
      {/* ============================================================= */}
      {currentTab === 'promotions' && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#D4AF37] font-cinzel text-xs font-bold uppercase tracking-widest">
              ĐẶC QUYỀN ƯU ĐÃI
            </span>
            <h2 className="text-3xl font-cinzel font-black text-[#F6ECE1] mt-2">
              Khuyến Mãi & Voucher Giảm Giá
            </h2>
            <p className="text-[#B8A898] text-sm mt-2">
              Áp dụng mã giảm giá khi thanh toán vé xem phim hoặc mua combo bắp nước để nhận ưu đãi lên đến 30%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map(p => (
              <div key={p.id} className="glass-card rounded-2xl overflow-hidden flex flex-col sm:flex-row border border-[#D4AF37]/20">
                <img src={p.img} alt={p.tieuDe} className="sm:w-44 h-48 sm:h-auto object-cover" />
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-[#4A1215] text-[#F0C67E] border border-[#8E1E24]/60 text-[10px] font-cinzel font-bold px-2 py-0.5 rounded uppercase">
                        {p.tag}
                      </span>
                      <span className="text-[#D4AF37] text-xs font-extrabold font-mono">{p.discount}</span>
                    </div>
                    <h3 className="font-cinzel font-bold text-base text-[#F6ECE1]">{p.tieuDe}</h3>
                    <p className="text-xs text-[#B8A898] mt-2 leading-relaxed">{p.moTa}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between">
                    <span className="text-xs font-mono bg-[#14100D] px-2.5 py-1 rounded text-[#D4AF37] font-bold border border-[#D4AF37]/30">
                      MÃ: {p.code}
                    </span>
                    <button 
                      onClick={() => {
                        setDiscountCode(p.code);
                        showToast(`Đã sao chép mã ${p.code}! Hãy dán vào ô thanh toán.`, 'success');
                      }}
                      className="text-xs text-[#E5A84B] hover:text-[#D4AF37] font-cinzel font-bold"
                    >
                      Dùng mã này ➜
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* TAB 5: TICKET BOOKING EXPERIENCE (IMAX SEAT PICKER & CHECKOUT)*/}
      {/* ============================================================= */}
      {currentTab === 'booking' && !currentUser && (
        <section className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-[#D4AF37]/30 shadow-2xl">
            <span className="text-5xl">🗝</span>
            <div className="text-[#D4AF37] font-cinzel text-xs font-bold uppercase tracking-widest mt-4">
              XÁC THỰC DANH TÍNH ĐẶT VÉ • AUTHENTICATION REQUIRED
            </div>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-black text-[#F6ECE1] mt-2">
              Vui Lòng Đăng Nhập Để Vào Đặt Vé
            </h2>
            <p className="text-xs sm:text-sm text-[#B8A898] mt-3 leading-relaxed">
              Theo quy chuẩn rạp chiếu phim thương mại, quý khách cần đăng nhập để hệ thống cấp quyền đặt chỗ, giữ ghế theo thời gian thực (tránh xung đột CSDL) và tích lũy điểm thưởng thành viên VIP.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setAuthModal({ open: true, mode: 'login' })}
                className="btn-vintage-wine font-cinzel font-bold text-xs px-8 py-3.5 rounded-full shadow-lg"
              >
                Đăng Nhập Tài Khoản Ngay ➜
              </button>
              <button 
                onClick={() => setAuthModal({ open: true, mode: 'register' })}
                className="glass-panel hover:bg-white/10 text-[#F6ECE1] font-cinzel font-bold text-xs px-8 py-3.5 rounded-full border border-[#D4AF37]/30"
              >
                Đăng Ký Thành Viên Mới
              </button>
            </div>
          </div>
        </section>
      )}

      {currentTab === 'booking' && currentUser && selectedMovie && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Seat Selection & Combos */}
            <div className="lg:col-span-8 space-y-8">
              {/* Step 1: Movie & Showtime Config */}
              <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#D4AF37]/15">
                  <span className="w-7 h-7 rounded-full bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40 font-cinzel font-extrabold text-xs flex items-center justify-center">1</span>
                  <h3 className="font-cinzel font-extrabold text-base text-[#F6ECE1]">Chọn Suất Chiếu & Cụm Rạp</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A8998A] mb-1.5 font-mono">Phim đã chọn</label>
                    <select 
                      value={selectedMovie.id}
                      onChange={e => {
                        const m = movies.find(x => x.id === Number(e.target.value));
                        if (m) {
                          setSelectedMovie(m);
                          setSelectedShowtime(m.suatChieu?.[0] || '19:30');
                          setSelectedSeats([]);
                        }
                      }}
                      className="w-full bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2.5 text-xs text-[#F6ECE1] font-cinzel focus:outline-none focus:border-[#D4AF37]"
                    >
                      {movies.map(m => (
                        <option key={m.id} value={m.id}>{m.tenPhim} ({m.thoiLuong}p)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A8998A] mb-1.5 font-mono">Cụm Rạp Chiếu Phim</label>
                    <select 
                      value={selectedCinema}
                      onChange={e => setSelectedCinema(e.target.value)}
                      className="w-full bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2.5 text-xs text-[#F6ECE1] font-cinzel focus:outline-none focus:border-[#D4AF37]"
                    >
                      {cinemas.map(c => (
                        <option key={c.id} value={c.ten}>{c.ten}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Showtimes */}
                <div className="mt-5">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Giờ chiếu hôm nay</label>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedMovie.suatChieu?.map(time => (
                      <button 
                        key={time}
                        onClick={() => { sound.play('click'); setSelectedShowtime(time); }}
                        className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${selectedShowtime === time ? 'bg-red-600 text-white shadow-md shadow-red-600/40' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Vintage Grand Theater Screen & Velvet Seats Map */}
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/20">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D4AF37]/15">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40 font-cinzel font-extrabold text-xs flex items-center justify-center">2</span>
                    <h3 className="font-cinzel font-extrabold text-base text-[#F6ECE1]">Sơ Đồ Ghế Ngồi Rạp Hoàng Gia</h3>
                  </div>
                  <span className="bg-[#1C1713] text-[#D4AF37] border border-[#D4AF37]/40 text-[11px] font-mono font-bold px-2.5 py-1 rounded-md">
                    Phòng 01 (Grand Theater)
                  </span>
                </div>

                {/* Vintage Warm Screen with Projector Ambient Ray */}
                <div className="relative text-center my-8">
                  <div className="imax-screen-curve"></div>
                  <div className="imax-projector-ray"></div>
                  <div className="text-[11px] font-cinzel tracking-[0.3em] text-[#D4AF37] font-bold uppercase mt-3">
                    MÀN HÌNH CHIẾU PHIM HOÀNG GIA - ROYAL GRAND SCREEN
                  </div>
                </div>

                {/* Seats Grid (3 Rows: Regular, VIP Velvet, Couple) */}
                <div className="max-w-md mx-auto space-y-4 my-8">
                  {/* Row A: Standard */}
                  <div>
                    <div className="text-[10px] text-[#A8998A] font-mono mb-1 text-center uppercase tracking-wider">HÀNG A - GHẾ TIÊU CHUẨN CỔ ĐIỂN (90.000 đ)</div>
                    <div className="grid grid-cols-3 gap-3">
                      {dbState.seats.filter(s => s.soGhe.startsWith('A')).map(seat => {
                        const isSelected = selectedSeats.includes(seat.soGhe);
                        const isBooked = seat.trangThai === 'Đã Đặt';
                        const isHolding = seat.trangThai === 'Đang giao dịch';
                        return (
                          <div 
                            key={seat.id}
                            onClick={() => handleToggleSeat(seat)}
                            className={`cinema-seat-btn seat-standard ${isSelected ? 'seat-selected' : ''} ${isBooked ? 'seat-booked' : ''} ${isHolding ? 'seat-holding' : ''}`}
                          >
                            <div className="seat-cushion">
                              <span className="text-xs font-extrabold font-mono">{seat.soGhe}</span>
                              <span className="text-[9px] uppercase tracking-wider">{seat.loai}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row B: VIP Velvet */}
                  <div>
                    <div className="text-[10px] text-[#D4AF37] font-mono mb-1 text-center uppercase tracking-wider font-bold">HÀNG B - GHẾ VIP VELVET BURGUNDY (110.000 đ)</div>
                    <div className="grid grid-cols-3 gap-3">
                      {dbState.seats.filter(s => s.soGhe.startsWith('B')).map(seat => {
                        const isSelected = selectedSeats.includes(seat.soGhe);
                        const isBooked = seat.trangThai === 'Đã Đặt';
                        const isHolding = seat.trangThai === 'Đang giao dịch';
                        return (
                          <div 
                            key={seat.id}
                            onClick={() => handleToggleSeat(seat)}
                            className={`cinema-seat-btn seat-vip ${isSelected ? 'seat-selected' : ''} ${isBooked ? 'seat-booked' : ''} ${isHolding ? 'seat-holding' : ''}`}
                          >
                            <div className="seat-cushion">
                              <span className="text-xs font-extrabold font-mono">{seat.soGhe}</span>
                              <span className="text-[9px] uppercase tracking-wider">{seat.loai}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row C: Sweetbox Couple */}
                  <div>
                    <div className="text-[10px] text-[#C08497] font-mono mb-1 text-center uppercase tracking-wider font-bold">HÀNG C - GHẾ ĐÔI SWEETBOX LOGE (160.000 đ)</div>
                    <div className="grid grid-cols-2 gap-4">
                      {dbState.seats.filter(s => s.soGhe.startsWith('C')).map(seat => {
                        const isSelected = selectedSeats.includes(seat.soGhe);
                        const isBooked = seat.trangThai === 'Đã Đặt';
                        return (
                          <div 
                            key={seat.id}
                            onClick={() => handleToggleSeat(seat)}
                            className={`cinema-seat-btn seat-couple ${isSelected ? 'seat-selected' : ''} ${isBooked ? 'seat-booked' : ''}`}
                          >
                            <div className="seat-cushion py-2">
                              <span className="text-xs font-extrabold font-mono">💑 {seat.soGhe}</span>
                              <span className="text-[9px] uppercase tracking-wider">SWEETBOX</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-[#D4AF37]/15 text-xs text-[#B8A898]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-[#241E18] border border-[#4A3E31]"></span>
                    <span>Ghế trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-gradient-to-r from-[#F0C67E] to-[#C59B4B] shadow-sm"></span>
                    <span className="text-[#D4AF37] font-bold">Đang chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-[#4A1215] border border-[#D4AF37]"></span>
                    <span className="text-[#D4AF37] font-semibold">Ghế VIP Velvet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-[#171310] border border-[#2B231B] opacity-50"></span>
                    <span>Đã đặt</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Popcorn & Drinks Combos */}
              <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#D4AF37]/15">
                  <span className="w-7 h-7 rounded-full bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40 font-cinzel font-extrabold text-xs flex items-center justify-center">3</span>
                  <h3 className="font-cinzel font-extrabold text-base text-[#F6ECE1]">Bắp Rang Bơ & Nước Ngọt Gourmet</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {combos.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => {
                        sound.play('click');
                        setSelectedComboId(selectedComboId === c.id ? null : c.id);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedComboId === c.id ? 'bg-[#2A1810] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20' : 'bg-[#14100D] border-[#3A3026] hover:border-[#D4AF37]/30'}`}
                    >
                      <div className="text-2xl mb-2">🍿🥤</div>
                      <h4 className="font-cinzel font-bold text-sm text-[#F6ECE1]">{c.ten}</h4>
                      <p className="text-[11px] text-[#A8998A] mt-1 line-clamp-2 leading-relaxed">{c.moTa}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-extrabold font-mono text-[#D4AF37]">{c.gia.toLocaleString()} đ</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${selectedComboId === c.id ? 'bg-[#D4AF37] text-black font-bold' : 'bg-white/5 text-[#A8998A]'}`}>
                          {selectedComboId === c.id ? '✔ Đã chọn' : '+ Thêm'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: MANDATORY PAYMENT STEP (BƯỚC THANH TOÁN BẮT BUỘC) */}
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/25 shadow-xl">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D4AF37]/15">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40 font-cinzel font-extrabold text-xs flex items-center justify-center">4</span>
                    <h3 className="font-cinzel font-extrabold text-base text-[#F6ECE1]">Bước Thanh Toán Bắt Buộc (Mandatory Payment)</h3>
                  </div>
                  <span className="bg-[#181410] border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                    🔒 SSL 256-BIT ENCRYPTED
                  </span>
                </div>

                {/* 4 Payment Methods Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { id: 'card', name: 'Thẻ Quốc Tế', icon: '💳', sub: 'Visa, Master, JCB' },
                    { id: 'vietqr', name: 'VietQR 24/7', icon: '📱', sub: 'Chuyển khoản tức thì' },
                    { id: 'momo', name: 'Ví MoMo', icon: '👛', sub: 'Quét mã ví điện tử' },
                    { id: 'counter', name: 'Tại Quầy Rạp', icon: '🏢', sub: 'Tiền mặt hoặc POS' }
                  ].map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => { sound.play('click'); setPaymentMethod(pm.id); }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${paymentMethod === pm.id ? 'bg-[#2A1810] border-[#D4AF37] shadow-md shadow-[#D4AF37]/25 scale-[1.02]' : 'bg-[#14100D] border-[#3A3026] hover:border-[#D4AF37]/40 opacity-80'}`}
                    >
                      <div className="text-xl mb-1">{pm.icon}</div>
                      <div className="font-cinzel font-bold text-xs text-[#F6ECE1]">{pm.name}</div>
                      <div className="text-[10px] text-[#A8998A] mt-0.5">{pm.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Dynamic Content Per Method */}
                {paymentMethod === 'card' && (
                  <div className="p-5 rounded-2xl bg-[#14100D] border border-[#3A3026] space-y-4">
                    {/* Visual Card Replica */}
                    <div className="max-w-xs mx-auto p-4 rounded-xl bg-gradient-to-r from-[#241E18] via-[#3D3126] to-[#1F1913] border border-[#D4AF37]/40 text-[#F6ECE1] shadow-xl relative overflow-hidden font-mono text-xs">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-cinzel font-bold text-[#D4AF37]">CINEMAX PREMIER PASS</span>
                        <span className="font-bold text-xs tracking-wider text-[#F6ECE1]">VISA / MC</span>
                      </div>
                      <div className="text-sm tracking-widest font-black text-[#F6ECE1] my-2">{cardData.number || '•••• •••• •••• ••••'}</div>
                      <div className="flex justify-between items-end text-[10px] text-[#D5C5B5] mt-3">
                        <div>
                          <div className="text-[8px] text-[#A8998A] uppercase">Chủ Thẻ</div>
                          <div className="font-bold">{cardData.holder || 'NGUYEN VAN A'}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-[#A8998A] uppercase">Hết Hạn</div>
                          <div className="font-bold">{cardData.exp || '12/28'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-mono text-[#A8998A] mb-1">Số Thẻ Tín Dụng / Ghi Nợ</label>
                        <input 
                          type="text" 
                          value={cardData.number}
                          onChange={e => setCardData({ ...cardData, number: e.target.value })}
                          placeholder="4111 2222 3333 4444" 
                          className="w-full bg-[#0C0A08] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-[#A8998A] mb-1">Tên In Trên Thẻ (Không dấu)</label>
                        <input 
                          type="text" 
                          value={cardData.holder}
                          onChange={e => setCardData({ ...cardData, holder: e.target.value.toUpperCase() })}
                          placeholder="NGUYEN VAN A" 
                          className="w-full bg-[#0C0A08] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono uppercase focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-[#A8998A] mb-1">Ngày Hết Hạn (MM/YY)</label>
                        <input 
                          type="text" 
                          value={cardData.exp}
                          onChange={e => setCardData({ ...cardData, exp: e.target.value })}
                          placeholder="12/28" 
                          className="w-full bg-[#0C0A08] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-[#A8998A] mb-1">Mã Bảo Mật CVV/CVC</label>
                        <input 
                          type="password" 
                          value={cardData.cvv}
                          onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                          maxLength="4"
                          placeholder="888" 
                          className="w-full bg-[#0C0A08] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'vietqr' && (
                  <div className="p-5 rounded-2xl bg-[#14100D] border border-[#3A3026] flex flex-col sm:flex-row items-center gap-6">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VietQR-CINEMAX-${grandTotal}-${currentUser?.sdt || '0901234567'}`} 
                      alt="VietQR Code" 
                      className="w-36 h-36 bg-white p-2 rounded-xl shadow-md border border-[#D4AF37]/40"
                    />
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="text-[11px] text-[#D4AF37] font-bold font-cinzel">QUÉT MÃ VIETQR QUA APP NGÂN HÀNG BẤT KỲ</div>
                      <div className="text-[#A8998A]">Ngân hàng: <strong className="text-[#F6ECE1]">Vietcombank (VCB)</strong></div>
                      <div className="text-[#A8998A]">Số tài khoản: <strong className="text-[#F6ECE1]">999888666</strong></div>
                      <div className="text-[#A8998A]">Chủ tài khoản: <strong className="text-[#F6ECE1]">RAP PHIM HOANG GIA CINEMAX</strong></div>
                      <div className="text-[#A8998A]">Số tiền: <strong className="text-[#D4AF37] text-sm">{grandTotal.toLocaleString()} đ</strong></div>
                      <div className="text-[#A8998A]">Nội dung CK: <strong className="text-[#E5A84B]">CNX {currentUser?.sdt || '0901234567'}</strong></div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'momo' && (
                  <div className="p-5 rounded-2xl bg-[#14100D] border border-[#3A3026] flex flex-col sm:flex-row items-center gap-6">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MOMO-CINEMAX-${grandTotal}`} 
                      alt="MoMo QR" 
                      className="w-36 h-36 bg-white p-2 rounded-xl shadow-md border border-pink-500/40"
                    />
                    <div className="space-y-2 text-xs">
                      <div className="text-pink-400 font-bold font-cinzel text-sm">THANH TOÁN QUA VÍ ĐIỆN TỬ MOMO</div>
                      <p className="text-[#A8998A] leading-relaxed">
                        Mở ứng dụng MoMo trên điện thoại, chọn <strong>Quét Mã</strong> để hoàn tất thanh toán tức thời với mã giảm giá tự động.
                      </p>
                      <div className="font-mono text-[#D4AF37] font-bold">Số tiền: {grandTotal.toLocaleString()} đ</div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'counter' && (
                  <div className="p-5 rounded-2xl bg-[#14100D] border border-[#3A3026] text-xs space-y-2">
                    <div className="text-[#E5A84B] font-cinzel font-bold text-sm">🏢 THANH TOÁN TẠI QUẦY VÉ (BOX OFFICE POS)</div>
                    <p className="text-[#B8A898] leading-relaxed">
                      Hệ thống sẽ tạm khóa và giữ ghế của bạn trong vòng <strong>30 phút</strong>. Vui lòng có mặt tại quầy vé của rạp CineMax trước giờ chiếu ít nhất 15 phút để xuất vé và thanh toán bằng tiền mặt hoặc thẻ ngân hàng.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Cols: Vintage Order Summary & Checkout Card */}
            <div className="lg:col-span-4 sticky top-24">
              <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/25 shadow-2xl">
                <h3 className="font-cinzel font-extrabold text-lg text-[#F6ECE1] pb-3 mb-4 border-b border-[#D4AF37]/20 tracking-wider">
                  Hóa Đơn Đặt Vé Hoàng Gia
                </h3>

                {/* Movie Quick Summary */}
                <div className="flex gap-3 pb-4 mb-4 border-b border-[#D4AF37]/15">
                  <img src={selectedMovie.poster} alt={selectedMovie.tenPhim} className="w-16 h-22 object-cover rounded-lg border border-[#D4AF37]/20" />
                  <div>
                    <h4 className="font-cinzel font-bold text-sm text-[#F6ECE1] leading-tight">{selectedMovie.tenPhim}</h4>
                    <p className="text-xs text-[#D4AF37] mt-1 font-mono">70mm Grand Screen</p>
                    <p className="text-[11px] text-[#A8998A] font-mono mt-1">Suất: {selectedShowtime} - Hôm nay</p>
                  </div>
                </div>

                {/* Itemized list */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-[#A8998A]">
                    <span>Cụm rạp:</span>
                    <span className="text-[#F6ECE1] font-semibold text-right max-w-[160px] truncate">{selectedCinema}</span>
                  </div>
                  <div className="flex justify-between text-[#A8998A]">
                    <span>Ghế đã chọn ({selectedSeats.length}):</span>
                    <span className="text-[#D4AF37] font-mono font-bold">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}</span>
                  </div>
                  <div className="flex justify-between text-[#A8998A]">
                    <span>Tiền vé ghế:</span>
                    <span className="text-[#F6ECE1] font-mono font-bold">{seatSubtotal.toLocaleString()} đ</span>
                  </div>
                  {selectedComboId && (
                    <div className="flex justify-between text-[#A8998A]">
                      <span>Bắp nước:</span>
                      <span className="text-[#E5A84B] font-mono font-bold">+{comboSubtotal.toLocaleString()} đ</span>
                    </div>
                  )}
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Khuyến mãi:</span>
                      <span className="font-mono">-{appliedDiscount.toLocaleString()} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#A8998A] pt-1 border-t border-[#D4AF37]/10">
                    <span>Phương thức TT:</span>
                    <span className="text-[#D4AF37] font-bold">
                      {paymentMethod === 'card' ? '💳 Thẻ Quốc Tế' : paymentMethod === 'vietqr' ? '📱 VietQR 24/7' : paymentMethod === 'momo' ? '👛 Ví MoMo' : '🏢 Tại Quầy'}
                    </span>
                  </div>
                </div>

                {/* Discount Code Input */}
                <div className="mt-4 pt-4 border-t border-[#D4AF37]/15">
                  <label className="block text-[11px] font-semibold text-[#A8998A] mb-1.5 font-mono">Mã ưu đãi (VD: CINEMAXVIP, STUDENT)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nhập mã ưu đãi..."
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value)}
                      className="flex-1 bg-[#120F0D] border border-[#D4AF37]/20 rounded-xl px-3 py-2 text-xs text-[#F6ECE1] uppercase focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button 
                      onClick={handleApplyDiscount}
                      className="bg-[#1A1612] hover:bg-[#2A241E] text-[#D4AF37] font-bold text-xs px-3 py-2 rounded-xl border border-[#D4AF37]/30 transition-all font-cinzel"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="mt-5 pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F6ECE1] font-cinzel">TỔNG THANH TOÁN:</span>
                  <span className="text-2xl font-cinzel font-black text-[#D4AF37] font-mono">{grandTotal.toLocaleString()} đ</span>
                </div>

                {/* User Reward Points Preview */}
                <div className="mt-3 text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-800/30 p-2 rounded-lg text-center font-mono">
                  🎁 Nhận thêm <strong>+25 điểm thưởng thành viên</strong> khi xuất vé!
                </div>

                {/* Checkout CTA */}
                <button 
                  onClick={handleConfirmPayment}
                  disabled={isProcessingPayment}
                  className="mt-5 btn-vintage-wine w-full font-cinzel font-black text-sm py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 tracking-wider disabled:opacity-50"
                >
                  <span>💳</span> {isProcessingPayment ? 'ĐANG XỬ LÝ THANH TOÁN...' : `XÁC NHẬN THANH TOÁN (${grandTotal.toLocaleString()} đ)`}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* TAB 6: MY TICKETS (VINTAGE LETTERPRESS PASSES)                */}
      {/* ============================================================= */}
      {currentTab === 'tickets' && (
        <section className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-[#D4AF37] font-cinzel text-xs font-bold uppercase tracking-widest">
                VÍ VÉ ĐIỆN TỬ HOÀNG GIA • ROYAL TICKET VAULT
              </span>
              <h2 className="text-3xl font-cinzel font-black text-[#F6ECE1] mt-1">
                Vé Xem Phim Của Tôi
              </h2>
            </div>
            <div className="bg-[#181410] border border-[#D4AF37]/30 px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-2xl">👑</span>
              <div>
                <div className="text-xs font-bold text-[#F6ECE1] uppercase font-cinzel">{currentUser?.hoTen}</div>
                <div className="text-[10px] text-[#D4AF37] font-mono">{currentUser?.diem} ĐIỂM TÍCH LŨY • GOLDEN TIER</div>
              </div>
            </div>
          </div>

          {userTickets.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center border border-[#D4AF37]/20">
              <span className="text-4xl">🎟</span>
              <h3 className="text-lg font-cinzel font-bold text-[#F6ECE1] mt-3">Chưa có vé nào được đặt</h3>
              <p className="text-xs text-[#B8A898] mt-1">Hãy chọn một bộ phim kinh điển và thanh toán để nhận ngay phôi vé hoàng gia!</p>
              <button 
                onClick={() => setCurrentTab('home')}
                className="mt-6 btn-vintage-wine font-cinzel font-bold text-xs px-6 py-2.5 rounded-full"
              >
                Khám phá phim ngay ➜
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {userTickets.map((t, idx) => (
                <div key={idx} className="vintage-ticket-container flex flex-col md:flex-row">
                  {/* Left part: Movie & Show Details */}
                  <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40 text-[10px] font-cinzel font-extrabold px-3 py-1 rounded tracking-wider uppercase">
                          ✦ VÉ ĐIỆN TỬ HOÀNG GIA
                        </span>
                        <span className="text-xs font-mono font-extrabold text-[#D4AF37]">
                          MÃ VÉ: {t.maVe}
                        </span>
                      </div>
                      <h3 className="text-2xl font-cinzel font-black text-[#F6ECE1]">{t.tenPhim}</h3>
                      <p className="text-xs text-[#D4AF37] font-mono mt-1">
                        {t.phongChieu} • Suất: <strong>{t.suatChieu}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6 bg-black/40 p-4 rounded-xl border border-[#D4AF37]/20">
                      <div>
                        <div className="text-[10px] text-[#A8998A] font-mono">VỊ TRÍ GHẾ</div>
                        <div className="text-lg font-mono font-black text-[#D4AF37]">{t.ghe?.join(', ')}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#A8998A] font-mono">TỔNG TIỀN</div>
                        <div className="text-lg font-mono font-black text-[#E5A84B]">{t.tongTien?.toLocaleString()} đ</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#A8998A] font-mono">TRẠNG THÁI</div>
                        <div className="text-xs font-bold text-emerald-400 mt-1 font-mono">{t.trangThai}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#A8998A] pt-2 border-t border-[#D4AF37]/15">
                      <span>{t.combo || 'Không chọn combo'} • Ngày xuất: {t.ngayDat}</span>
                      <button 
                        onClick={() => window.print()}
                        className="bg-[#1A1612] hover:bg-[#2A241E] text-[#D4AF37] text-xs px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 font-mono"
                      >
                        🖨 In Vé Cứng
                      </button>
                    </div>
                  </div>

                  {/* Perforated Separator with Real Notches */}
                  <div className="hidden md:block relative w-8 bg-transparent">
                    <div className="ticket-notch-top"></div>
                    <div className="ticket-dashed-line"></div>
                    <div className="ticket-notch-bottom"></div>
                  </div>

                  {/* Right part: Scan Stub & QR Code */}
                  <div className="w-full md:w-44 bg-[#14100D] p-6 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-[#D4AF37]/20">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${t.maVe}`} 
                      alt="QR Code" 
                      className="w-24 h-24 p-1.5 bg-white rounded-lg shadow-md mb-2"
                    />
                    <div className="text-[10px] text-[#A8998A] font-mono tracking-widest uppercase">SOÁT VÉ QR</div>
                    <div className="text-[11px] font-extrabold text-[#D4AF37] mt-1 flex items-center gap-1 font-cinzel">
                      <span>✔</span> HỢP LỆ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================= */}
      {/* TAB 7: STAFF CHECK-IN DESK (BÀN SOÁT VÉ NHÂN VIÊN)           */}
      {/* ============================================================= */}
      {currentTab === 'staff' && (
        <section className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/25 mb-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D4AF37]/15">
              <div>
                <span className="bg-[#2B2015] text-[#E5A84B] border border-[#E5A84B]/40 text-[10px] font-cinzel font-bold px-2.5 py-0.5 rounded uppercase font-mono">
                  PHÂN HỆ NHÂN VIÊN • VINTAGE BOX OFFICE
                </span>
                <h2 className="text-2xl font-cinzel font-black text-[#F6ECE1] mt-1">Bàn Soát Vé Khách Vào Rạp (POS Scan)</h2>
              </div>
              <div className="text-xs text-[#B8A898] font-mono">
                Nhân viên trực: <strong className="text-[#D4AF37] font-cinzel">{currentUser.hoTen}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Nhập hoặc quét mã vé (VD: CNX-88219)..."
                value={staffScanCode}
                onChange={e => setStaffScanCode(e.target.value)}
                className="flex-1 bg-[#14100D] border border-[#3A3026] rounded-xl px-4 py-3 text-sm text-[#F6ECE1] font-mono uppercase focus:outline-none focus:border-[#D4AF37]"
              />
              <button 
                onClick={() => handleStaffCheckIn()}
                className="btn-vintage-wine font-cinzel font-extrabold text-sm px-8 py-3 rounded-xl transition-all"
              >
                QUÉT VÉ & CHECK-IN
              </button>
            </div>
          </div>

          {/* Today's Tickets Queue */}
          <div className="glass-panel rounded-2xl border border-[#D4AF37]/20 overflow-hidden">
            <div className="p-4 bg-white/[0.02] border-b border-[#D4AF37]/15 font-cinzel font-bold text-sm text-[#F6ECE1] flex justify-between items-center">
              <span>Danh Sách Vé Suất Chiếu Hôm Nay</span>
              <button onClick={fetchInitialData} className="text-xs text-[#D4AF37] hover:underline font-mono">🔄 Làm mới</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#16120E] text-[#B8A898] font-mono uppercase text-[10px] border-b border-[#3A3026]">
                  <tr>
                    <th className="p-3">Mã Vé</th>
                    <th className="p-3">Tên Phim</th>
                    <th className="p-3">Suất Chiếu</th>
                    <th className="p-3">Vị Trí Ghế</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3026]/40">
                  {dbState.tickets.map(t => (
                    <tr key={t.maVe} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono font-bold text-[#D4AF37]">{t.maVe}</td>
                      <td className="p-3 text-[#F6ECE1] font-cinzel font-semibold">{t.tenPhim}</td>
                      <td className="p-3 text-[#B8A898] font-mono">{t.suatChieu}</td>
                      <td className="p-3 font-mono text-[#E5A84B] font-bold">{t.ghe?.join(', ')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${t.trangThai.includes('Đã Soát') ? 'bg-[#18331E] text-emerald-300 border border-emerald-600/50' : 'bg-[#241E18] text-[#E5A84B] border border-[#E5A84B]/40'}`}>
                          {t.trangThai}
                        </span>
                      </td>
                      <td className="p-3">
                        {!t.trangThai.includes('Đã Soát') && (
                          <button 
                            onClick={() => handleStaffCheckIn(t.maVe)}
                            className="btn-vintage-gold text-xs px-3 py-1 rounded font-cinzel font-bold"
                          >
                            Soát Vé
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* TAB 8: ADMIN CONTROL CENTER (RBAC & PRICE CONTROLS)           */}
      {/* ============================================================= */}
      {currentTab === 'admin' && (
        <section className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="bg-[#4A1215] text-[#F0C67E] border border-[#8E1E24] text-[10px] font-cinzel font-bold px-2.5 py-0.5 rounded uppercase font-mono">
                QUẢN TRỊ VIÊN HỆ THỐNG • MASTER CONTROL
              </span>
              <h2 className="text-3xl font-cinzel font-black text-[#F6ECE1] mt-1">Trung Tâm Quản Trị & Phân Quyền</h2>
            </div>
            <button 
              onClick={fetchAdminData}
              className="glass-panel hover:bg-white/10 text-[#F6ECE1] px-4 py-2 rounded-xl text-xs font-cinzel font-bold border border-[#D4AF37]/30"
            >
              🔄 Cập Nhật Dữ Liệu
            </button>
          </div>

          {/* 4 KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-[#D4AF37]">
              <span className="text-[11px] text-[#A8998A] font-mono uppercase">TỔNG DOANH THU</span>
              <div className="text-2xl font-cinzel font-black text-[#D4AF37] mt-1">{adminStats.totalRevenue?.toLocaleString()} đ</div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-[#8E1E24]">
              <span className="text-[11px] text-[#A8998A] font-mono uppercase">VÉ ĐÃ XUẤT</span>
              <div className="text-2xl font-cinzel font-black text-[#F6ECE1] mt-1">{adminStats.totalTickets} vé</div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-[#C5A059]">
              <span className="text-[11px] text-[#A8998A] font-mono uppercase">TỶ LỆ LẤP ĐẦY</span>
              <div className="text-2xl font-cinzel font-black text-[#E5A84B] mt-1">{adminStats.occupancyRate}%</div>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-[#78151A]">
              <span className="text-[11px] text-[#A8998A] font-mono uppercase">TỔNG TÀI KHOẢN</span>
              <div className="text-2xl font-cinzel font-black text-[#E89C9E] mt-1">{adminStats.userCount} user</div>
            </div>
          </div>

          {/* Controls: Price Adjuster & Add VIP Seat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20">
              <h4 className="font-cinzel font-bold text-base text-[#F6ECE1] mb-2">💰 Điều Chỉnh Giá Vé Suất Chiếu</h4>
              <p className="text-xs text-[#B8A898] mb-4">Mô phỏng thay đổi giá vé giữa lúc giao dịch của khách đang diễn ra (gây Non-Repeatable Read).</p>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  value={adminNewPrice}
                  onChange={e => setAdminNewPrice(Number(e.target.value))}
                  step="5000"
                  className="flex-1 bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none"
                />
                <button 
                  onClick={handleAdminUpdatePrice}
                  className="btn-vintage-wine font-cinzel font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Áp Dụng Giá
                </button>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20">
              <h4 className="font-cinzel font-bold text-base text-[#F6ECE1] mb-2">💺 Bổ Sung Ghế VIP Dự Phòng</h4>
              <p className="text-xs text-[#B8A898] mb-4">Chèn thêm ghế VIP B04 vào phòng chiếu (mô phỏng Phantom Read bóng ma).</p>
              <button 
                onClick={handleAdminAddVipSeat}
                className="w-full bg-[#181410] hover:bg-[#8E1E24] hover:text-[#F6ECE1] text-[#D5C5B5] font-cinzel font-bold text-xs py-2.5 rounded-xl border border-[#3A3026] transition-all"
              >
                + Thêm Ghế VIP B04 Ngay
              </button>
            </div>
          </div>

          {/* RBAC Users Table with PIN Security Alert */}
          <div className="glass-panel rounded-2xl border border-[#D4AF37]/20 overflow-hidden">
            <div className="p-5 bg-white/[0.02] border-b border-[#D4AF37]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#F6ECE1]">Danh Sách Người Dùng & Phân Quyền Hạn (RBAC)</h3>
                <p className="text-xs text-[#B8A898]">Yêu cầu xác thực Master Security PIN <strong>(8888)</strong> khi thay đổi vai trò.</p>
              </div>
              <span className="bg-[#2B2015] border border-[#D4AF37]/40 text-[#D4AF37] text-xs px-3 py-1 rounded-full font-mono font-bold">
                MASTER PIN: 8888
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#16120E] text-[#B8A898] font-mono uppercase text-[10px] border-b border-[#3A3026]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Họ và Tên</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Số Điện Thoại</th>
                    <th className="p-3">Điểm</th>
                    <th className="p-3">Vai Trò Hiện Tại</th>
                    <th className="p-3">Thay Đổi Quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3026]/40">
                  {adminUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-[#B8A898]">#{u.id}</td>
                      <td className="p-3 font-cinzel font-bold text-[#F6ECE1]">{u.hoTen}</td>
                      <td className="p-3 text-[#B8A898] font-mono">{u.email}</td>
                      <td className="p-3 font-mono text-[#B8A898]">{u.sdt}</td>
                      <td className="p-3 font-mono text-[#D4AF37]">{u.diem} đ</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${u.vaiTro === 'Admin' ? 'bg-[#4A1215] text-[#F0C67E] border border-[#8E1E24]' : u.vaiTro === 'NhanVien' ? 'bg-[#2B2015] text-[#E5A84B] border border-[#E5A84B]/40' : 'bg-[#1F1913] text-[#B8A898] border border-[#3A3026]'}`}>
                          {u.vaiTro}
                        </span>
                      </td>
                      <td className="p-3">
                        <select 
                          value={u.vaiTro}
                          onChange={e => handleAdminChangeRole(u.id, e.target.value)}
                          className="bg-[#14100D] border border-[#3A3026] rounded-lg px-2 py-1 text-xs text-[#F6ECE1] focus:outline-none focus:border-[#D4AF37]"
                        >
                          <option value="KhachHang">Khách Hàng</option>
                          <option value="NhanVien">Nhân Viên</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* TAB 9: SQL SERVER CONCURRENCY CONFLICTS LAB (HQTCSDL MODULE)  */}
      {/* ============================================================= */}
      {currentTab === 'lab' && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          {/* Lab Header */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/25 mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <span className="bg-[#1C1713] text-[#D4AF37] border border-[#D4AF37]/40 text-[11px] font-mono font-bold px-3 py-1 rounded-md">
                ĐỒ ÁN HỌC THUẬT: HỆ QUẢN TRỊ CƠ SỞ DỮ LIỆU (HQTCSDL)
              </span>
              <h2 className="text-2xl sm:text-3xl font-cinzel font-black text-[#F6ECE1] mt-2">
                ⚡ Bộ Thực Nghiệm 5 Xung Đột Dữ Liệu SQL Server
              </h2>
              <p className="text-[#A8998A] text-xs sm:text-sm mt-1 leading-relaxed">
                Mô phỏng trực quan tranh chấp đồng thời giữa 2 Session và cơ chế kiểm soát khóa (UPDLOCK, REPEATABLE READ, SERIALIZABLE, DEADLOCK).
              </p>
            </div>

            {/* Toggle Fix Switch */}
            <div className="flex items-center gap-3 bg-[#120F0D] p-2 rounded-full border border-[#D4AF37]/30 self-stretch sm:self-auto justify-center">
              <span className={`text-xs font-bold px-3 py-1 rounded-full transition-all font-mono ${!isConflictFixed ? 'bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/30' : 'text-[#A8998A]'}`}>
                🔴 Chưa Khắc Phục (Lỗi)
              </span>
              <button 
                onClick={() => {
                  sound.play('click');
                  setIsConflictFixed(!isConflictFixed);
                  setActiveLocks({});
                  setLabView(EMPTY_LAB_VIEW);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${isConflictFixed ? 'bg-emerald-700' : 'bg-[#8E1E24]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-[#F6ECE1] transition-transform ${isConflictFixed ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
              <span className={`text-xs font-bold px-3 py-1 rounded-full transition-all font-mono ${isConflictFixed ? 'bg-emerald-700 text-[#F6ECE1] border border-[#D4AF37]/30' : 'text-[#A8998A]'}`}>
                🟢 Đã Khắc Phục (An Toàn)
              </span>
            </div>
          </div>

          {/* 5 Conflict Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[1, 2, 3, 4, 5].map(id => {
              const c = SQL_CONFLICTS[id];
              const isActive = currentConflictId === id;
              return (
                <button 
                  key={id}
                  onClick={() => {
                    sound.play('click');
                    setCurrentConflictId(id);
                    setActiveLocks({});
                    setLabView(EMPTY_LAB_VIEW);
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 ${isActive ? 'bg-gradient-to-br from-[#8E1E24]/35 to-[#D4AF37]/25 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15' : 'bg-[#181410] border-[#D4AF37]/15 hover:border-[#D4AF37]/40'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-[#D4AF37]">0{id}</span>
                    <span className="text-[10px] text-[#A8998A] font-mono">T-SQL</span>
                  </div>
                  <div>
                    <h4 className="font-cinzel font-extrabold text-sm text-[#F6ECE1]">{c.name}</h4>
                    <p className="text-[10px] text-[#A8998A] line-clamp-2 mt-0.5">{c.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail & Run Simulation Banner */}
          <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/25 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#D4AF37]/15">
              <div>
                <span className="text-[11px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider">
                  {isConflictFixed ? SQL_CONFLICTS[currentConflictId].techFixed : SQL_CONFLICTS[currentConflictId].techError}
                </span>
                <h3 className="text-xl font-cinzel font-black text-[#F6ECE1] mt-0.5">
                  Kịch bản #{currentConflictId}: {SQL_CONFLICTS[currentConflictId].name}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={runSimulation}
                  disabled={isRunningConflict}
                  className="btn-vintage-wine disabled:opacity-50 font-cinzel font-extrabold text-xs px-6 py-3 rounded-full shadow-lg flex items-center gap-2 tracking-wider"
                >
                  {isRunningConflict ? '⏳ ĐANG THỰC THI GIAO DỊCH...' : '🚀 CHẠY MÔ PHỎNG TRANH CHẤP'}
                </button>
                <button 
                  onClick={handleResetLabDb}
                  className="bg-[#181410] hover:bg-[#2A241E] text-[#D4AF37] font-bold text-xs px-4 py-3 rounded-full border border-[#D4AF37]/30 transition-all font-cinzel"
                >
                  🔄 Reset Ghế
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#D5C5B5] leading-relaxed">
              {isConflictFixed ? SQL_CONFLICTS[currentConflictId].descFixed : SQL_CONFLICTS[currentConflictId].descError}
            </p>
          </div>

          {/* Hiểu nhanh bằng ví dụ đời thường */}
          {(() => {
            const ex = SQL_CONFLICTS[currentConflictId].explain;
            const steps = isConflictFixed ? ex.stepsFixed : ex.stepsError;
            const badgeClass = { 1: 'bg-[#3D2510] text-[#E5A84B] border-[#E5A84B]/40', 2: 'bg-[#4A1215] text-[#F0C67E] border-[#8E1E24]', 0: isConflictFixed ? 'bg-emerald-900/60 text-emerald-200 border-emerald-600/50' : 'bg-[#4A1215] text-[#F28B82] border-[#B3262E]' };
            const badgeText = { 1: 'T1', 2: 'T2', 0: isConflictFixed ? 'OK' : 'LỖI' };
            return (
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/25 mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{ex.emoji}</span>
                  <div>
                    <div className="text-[11px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider">💡 Hiểu nhanh bằng ví dụ đời thường</div>
                    <h4 className="font-cinzel font-black text-lg text-[#F6ECE1]">{ex.analogyTitle}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#14100D] border border-[#3A3026] rounded-xl p-4">
                    <div className="text-[11px] font-mono font-bold text-[#E5A84B] mb-1.5">🏠 NGOÀI ĐỜI</div>
                    <p className="text-xs sm:text-sm text-[#D5C5B5] leading-relaxed">{ex.analogy}</p>
                  </div>
                  <div className="bg-[#14100D] border border-[#3A3026] rounded-xl p-4">
                    <div className="text-[11px] font-mono font-bold text-[#E5A84B] mb-1.5">🎬 TẠI RẠP CHIẾU PHIM</div>
                    <p className="text-xs sm:text-sm text-[#D5C5B5] leading-relaxed">{ex.cinema}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
                    {isConflictFixed ? '🟢 Diễn biến SAU KHI sửa' : '🔴 Diễn biến KHI CHƯA sửa (gây lỗi)'}
                  </div>
                  <div className="text-[10px] font-mono text-[#8B7C6E]">Gạt công tắc phía trên để so sánh</div>
                </div>
                <ol className="space-y-2.5 mb-6">
                  {steps.map((st, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#1F1913] border border-[#3A3026] text-[#A8998A] text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${badgeClass[st.s]}`}>{badgeText[st.s]}</span>
                      <span className={`text-xs sm:text-sm leading-relaxed ${st.s === 0 ? (isConflictFixed ? 'text-emerald-200 font-semibold' : 'text-[#F28B82] font-semibold') : 'text-[#D5C5B5]'}`}>{st.text}</span>
                    </li>
                  ))}
                </ol>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl p-3.5 bg-[#2A1215]/60 border border-[#8E1E24]/60">
                    <div className="text-[11px] font-mono font-bold text-[#F28B82] mb-1">❌ LỖI LÀ GÌ (NÓI ĐƠN GIẢN)</div>
                    <p className="text-xs text-[#D5C5B5] leading-relaxed">{ex.plainError}</p>
                  </div>
                  <div className="rounded-xl p-3.5 bg-emerald-950/30 border border-emerald-700/40">
                    <div className="text-[11px] font-mono font-bold text-emerald-300 mb-1">✅ CÁCH SỬA (NÓI ĐƠN GIẢN)</div>
                    <p className="text-xs text-[#D5C5B5] leading-relaxed">{ex.plainFix}</p>
                  </div>
                  <div className="rounded-xl p-3.5 bg-[#2B2015] border border-[#D4AF37]/30">
                    <div className="text-[11px] font-mono font-bold text-[#D4AF37] mb-1">🧠 MẸO NHỚ</div>
                    <p className="text-xs text-[#D5C5B5] leading-relaxed">{ex.remember}</p>
                  </div>
                </div>

                {[2, 3, 4].includes(currentConflictId) && (
                  <div className="mt-6 pt-5 border-t border-[#D4AF37]/15">
                    <div className="text-[11px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider mb-3">🔎 Phân biệt 3 lỗi "đọc sai" dễ nhầm</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {READ_ANOMALY_COMPARE.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => { sound.play('click'); setCurrentConflictId(a.id); setActiveLocks({}); setLabView(EMPTY_LAB_VIEW); }}
                          className={`text-left rounded-xl p-3 border transition-all ${currentConflictId === a.id ? 'bg-[#2B2015] border-[#D4AF37]' : 'bg-[#14100D] border-[#3A3026] hover:border-[#D4AF37]/40'}`}
                        >
                          <div className="font-cinzel font-bold text-xs text-[#F6ECE1]">{a.icon} {a.name}</div>
                          <div className="text-[11px] text-[#B8A898] mt-1 leading-relaxed">{a.line}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Interactive 2 Sessions & Seat Lock Visualizer & Live Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Left 6 Cols: Two Sessions & Live Seat Locks */}
            <div className="lg:col-span-6 space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20">
                <h4 className="font-cinzel font-bold text-sm text-[#F6ECE1] mb-4 flex items-center gap-2">
                  <span>👥</span> 2 PHIÊN GIAO DỊCH SQL SERVER ĐỒNG THỜI
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-[#14100D] p-3.5 rounded-xl border border-[#3A3026]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-[#F6ECE1]">{SQL_CONFLICTS[currentConflictId].sessions[0]}</span>
                      <span className="bg-[#3D2510] text-[#E5A84B] px-1.5 py-0.2 rounded font-mono border border-[#E5A84B]/40">T1</span>
                    </div>
                    <div className="text-[11px] text-[#E5A84B] font-mono line-clamp-2">{t1Status}</div>
                  </div>

                  <div className="bg-[#14100D] p-3.5 rounded-xl border border-[#3A3026]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-[#F6ECE1]">{SQL_CONFLICTS[currentConflictId].sessions[1]}</span>
                      <span className="bg-[#4A1215] text-[#F0C67E] px-1.5 py-0.2 rounded font-mono border border-[#8E1E24]">T2</span>
                    </div>
                    <div className="text-[11px] text-[#D4AF37] font-mono line-clamp-2">{t2Status}</div>
                  </div>
                </div>

                {/* Seats with Live Lock Badges */}
                <div className="text-center">
                  <div className="text-[10px] font-mono text-[#A8998A] mb-1">TRẠNG THÁI KHÓA DỮ LIỆU THỜI GIAN THỰC TRÊN GHẾ</div>
                  <div className="text-[10px] font-mono text-[#8B7C6E] mb-3">Nhãn cam = dữ liệu phiên đọc được KHÁC dữ liệu đã COMMIT</div>
                  <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                    {[
                      ...dbState.seats,
                      ...labView.extra.map(e => ({ id: 'extra-' + e.soGhe, soGhe: e.soGhe, loai: e.loai, trangThai: e.status, mode: e.mode }))
                    ].map(s => {
                      const lock = activeLocks[s.soGhe];
                      const shown = labView.seats[s.soGhe] || s.trangThai;
                      const diverges = !s.mode && shown !== s.trangThai;
                      const modeClass = s.mode === 'ghost'
                        ? 'border-2 border-dashed border-[#C08497] rounded-xl bg-[#3A1426]/40 animate-pulse'
                        : s.mode === 'pending'
                          ? 'border-2 border-dashed border-[#E5A84B]/60 rounded-xl opacity-60'
                          : s.mode === 'new'
                            ? 'border-2 border-dashed border-emerald-500/60 rounded-xl'
                            : '';
                      return (
                        <div key={s.id} className={`relative cinema-seat-btn seat-standard ${modeClass}`}>
                          {lock && (
                            <span className={`absolute -top-2.5 -right-2 text-[9px] font-mono font-black px-1.5 py-0.5 rounded shadow-lg z-20 whitespace-nowrap ${lock.color}`}>
                              {lock.text}
                            </span>
                          )}
                          <div className={`seat-cushion ${lock ? 'ring-2 ring-[#D4AF37] scale-105' : ''}`}>
                            <span className="text-xs font-bold font-mono">{s.soGhe}</span>
                            <span className="text-[9px] uppercase">{s.loai}</span>
                            <span className={`text-[8px] font-mono ${diverges ? 'text-[#F59E0B] font-black' : 'text-[#A8998A]'}`}>{shown}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {labView.readouts.length > 0 && (
                    <div className="mt-5 text-left bg-[#0C0A08] border border-[#3A3026] rounded-xl p-3 space-y-1.5">
                      {labView.readouts.map((r, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 text-[11px] font-mono">
                          <span className="text-[#A8998A]"><span className="text-[#D4AF37] font-bold">{r.who}</span> · {r.label}</span>
                          <span className={r.tone === 'bad' ? 'text-[#F28B82] font-bold' : r.tone === 'ok' ? 'text-emerald-300 font-bold' : r.tone === 'warn' ? 'text-[#E5A84B] font-bold' : 'text-[#D5C5B5]'}>{String(r.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Live SQL Server Timeline Logs */}
            <div className="lg:col-span-6">
              <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/20 h-full flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D4AF37]/15">
                  <span className="font-cinzel font-bold text-sm text-[#F6ECE1] flex items-center gap-2">
                    <span>📟</span> NHẬT KÝ KHÓA CSDL (LOCK TIMELINE STREAM)
                  </span>
                  <button onClick={() => setLabLogs([])} className="text-[11px] text-[#A8998A] hover:text-[#F6ECE1] font-mono">Xóa Log</button>
                </div>

                <div className="flex-1 bg-[#0C0A08] p-4 rounded-xl font-mono text-xs overflow-y-auto max-h-80 space-y-2 border border-[#3A3026]">
                  {labLogs.length === 0 ? (
                    <div className="text-[#A8998A] text-center py-10 font-mono">
                      Sẵn sàng. Hãy bấm "CHẠY MÔ PHỎNG TRANH CHẤP" để quan sát diễn biến khóa CSDL SQL Server!
                    </div>
                  ) : (
                    labLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-[#A8998A] whitespace-nowrap">[{log.time}]</span>
                        <span className={`font-bold font-mono ${log.tag.includes('T1') ? 'text-[#E5A84B]' : log.tag.includes('T2') ? 'text-[#F0C67E]' : 'text-[#D4AF37]'}`}>
                          {log.tag}:
                        </span>
                        <span className={log.level === 'danger' ? 'text-[#E50914] font-bold' : log.level === 'warning' ? 'text-[#E5A84B]' : 'text-[#D5C5B5]'}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Stored Procedure & T-SQL Code Comparison */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10">
            <h3 className="font-heading font-black text-lg text-white mb-4">
              📖 ĐỐI CHIẾU MÃ NGUỒN T-SQL (STORED PROCEDURE & ISOLATION LEVEL)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="bg-[#07090F] p-4 rounded-xl border border-red-900/40">
                <div className="text-red-400 font-bold mb-2 flex items-center gap-1.5">
                  <span>🔴</span> TRƯỜNG HỢP GẶP LỖI (CHƯA KHẮC PHỤC)
                </div>
                <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {SQL_CONFLICTS[currentConflictId].sqlError}
                </pre>
              </div>

              <div className="bg-[#07090F] p-4 rounded-xl border border-emerald-900/40">
                <div className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                  <span>🟢</span> CƠ CHẾ ĐÃ KHẮC PHỤC (AN TOÀN)
                </div>
                <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {SQL_CONFLICTS[currentConflictId].sqlFixed}
                </pre>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* TAB 10: DUAL-TRANSACTION SPLIT SCREEN (HAI GIAO TÁC SONG SONG)*/}
      {/* ============================================================= */}
      {currentTab === 'dual' && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          {/* Header & Controls */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/25 mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <span className="bg-[#1C1713] text-[#E5A84B] border border-[#E5A84B]/40 text-[11px] font-mono font-bold px-3 py-1 rounded-md">
                👥 MÔ HÌNH THỰC NGHIỆM ĐỒNG THỜI (CONCURRENCY SIMULATOR)
              </span>
              <h2 className="text-2xl sm:text-3xl font-cinzel font-black text-[#F6ECE1] mt-2">
                Màn Hình Hai Giao Tác Song Song (Dual-Session)
              </h2>
              <p className="text-[#A8998A] text-xs sm:text-sm mt-1 leading-relaxed">
                Quan sát thời gian thực cách 2 khách hàng đồng thời tương tác vào rạp chiếu phim, cơ chế cấp khóa (Locking Protocol), hiện tượng chờ khóa (Blocked) và giải quyết tranh chấp SQL Server.
              </p>
            </div>

            {/* Controls: Mode Switch & Reset */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#120F0D] p-1.5 rounded-full border border-[#D4AF37]/30">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all font-mono ${!dualIsFixed ? 'bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/30' : 'text-[#A8998A]'}`}>
                  🔴 Chưa Sửa (Lỗi)
                </span>
                <button 
                  onClick={() => {
                    sound.play('click');
                    setDualIsFixed(!dualIsFixed);
                    handleDualReset();
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${dualIsFixed ? 'bg-emerald-700' : 'bg-[#8E1E24]'}`}
                  title="Gạt công tắc để chuyển giữa chế độ Mô phỏng lỗi và Đã khắc phục an toàn"
                >
                  <div className={`w-4 h-4 rounded-full bg-[#F6ECE1] transition-transform ${dualIsFixed ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all font-mono ${dualIsFixed ? 'bg-emerald-700 text-[#F6ECE1] border border-[#D4AF37]/30' : 'text-[#A8998A]'}`}>
                  🟢 Đã Sửa (An Toàn)
                </span>
              </div>

              <button 
                onClick={handleDualReset}
                className="bg-[#181410] hover:bg-[#2A241E] text-[#D4AF37] font-bold text-xs px-4 py-2.5 rounded-full border border-[#D4AF37]/30 transition-all font-cinzel flex items-center gap-1.5"
              >
                <span>🔄</span> Reset 2 Giao Tác
              </button>
            </div>
          </div>

          {/* Quick Scenario Preset Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-[#D4AF37]/20 mb-8">
            <div className="text-[11px] font-mono font-bold text-[#D4AF37] mb-3 uppercase tracking-wider flex items-center gap-2">
              <span>⚡</span> CHỌN NHANH KỊCH BẢN TRANH CHẤP ĐỂ CHẠY THỬ NGHIỆM TỰ ĐỘNG:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { id: 'free', label: '🎮 Tự Do Thử Nghiệm', sub: 'Tự click ghế & bấm nút' },
                { id: 'lost_update', label: '1️⃣ Lost Update', sub: 'Cả 2 cùng tranh ghế B01' },
                { id: 'dirty_read', label: '2️⃣ Dirty Read', sub: 'T1 giữ ghế rồi Rollback' },
                { id: 'unrepeatable_read', label: '3️⃣ Unrepeatable', sub: 'Admin đổi giá vé lúc T1 xem' },
                { id: 'phantom_read', label: '4️⃣ Phantom Read', sub: 'T1 đếm ghế, T2 chèn B04' },
                { id: 'deadlock', label: '5️⃣ Deadlock', sub: 'T1 và T2 khóa chéo nhau' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    sound.play('click');
                    if (s.id === 'free') {
                      setDualSelectedScenario('free');
                      handleDualReset();
                    } else {
                      handleDualRunScenario(s.id);
                    }
                  }}
                  disabled={dualRunningPreset}
                  className={`p-3 rounded-xl text-left border transition-all ${dualSelectedScenario === s.id ? 'bg-[#3A2412] border-[#D4AF37] shadow-md' : 'bg-[#14100D] border-[#3A3026] hover:border-[#D4AF37]/40'} disabled:opacity-50`}
                >
                  <div className="font-cinzel font-bold text-xs text-[#F6ECE1]">{s.label}</div>
                  <div className="text-[10px] text-[#A8998A] mt-0.5 line-clamp-1">{s.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* BỘ NÚT LÀM LIỀN & 2 CON CHUỘT TRỰC QUAN */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border-2 border-[#D4AF37] mb-8 bg-gradient-to-r from-[#2A180E] via-[#1C1713] to-[#2B1014] shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-[#D4AF37]/25">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-lg shadow-lg border-2 border-[#120F0D]">
                    🖱️
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-black flex items-center justify-center text-lg shadow-lg border-2 border-[#120F0D]">
                    🖱️
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#E5A84B] uppercase tracking-wider">
                      ⚡ CHẾ ĐỘ 2 CON CHUỘT BẤM SONG SONG (LÀM LIỀN)
                    </span>
                    <span className="bg-[#120F0D] text-[#D4AF37] border border-[#D4AF37]/50 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <h3 className="font-cinzel font-black text-base sm:text-lg text-[#F6ECE1] mt-0.5">
                    Click Bất Kỳ Ghế Nào → Cả 2 Con Chuột Cùng Bấm Tranh Ghế Đó Tức Thì!
                  </h3>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 bg-[#120F0D] px-4 py-2 rounded-xl border border-[#3A3026] text-xs font-mono">
                <span className="text-[#A8998A]">Đang nhắm ghế:</span>
                <span className="text-[#E5A84B] font-black text-sm bg-[#2B2015] px-2.5 py-0.5 rounded border border-[#E5A84B]/40">
                  {hoveredDualSeat}
                </span>
              </div>
            </div>

            {/* Quick 1-Click Action Buttons (LÀM LIỀN) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleDualInstantRace(hoveredDualSeat)}
                className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-black font-cinzel font-black text-xs sm:text-sm p-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                <span className="text-lg animate-bounce">⚡</span>
                <span>TRANH GHẾ {hoveredDualSeat} (LÀM LIỀN)</span>
              </button>

              <button
                onClick={() => handleDualCommit('T1')}
                className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-cinzel font-bold text-xs sm:text-sm p-3.5 rounded-xl border border-emerald-500/50 shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                <span>💳</span>
                <span>T1 THANH TOÁN (COMMIT)</span>
              </button>

              <button
                onClick={() => handleDualRollback('T1')}
                className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-cinzel font-bold text-xs sm:text-sm p-3.5 rounded-xl border border-rose-500/50 shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                <span>↩</span>
                <span>T1 HỦY THẺ (ROLLBACK)</span>
              </button>
            </div>
          </div>
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border-2 border-[#D4AF37]/40 mb-8 bg-gradient-to-r from-[#2B1B10]/70 via-[#1C1713] to-[#2B1216]/70 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E5A84B] to-[#8E1E24] flex items-center justify-center text-2xl shadow-lg shadow-[#8E1E24]/30 animate-pulse">
                🖱️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#E5A84B] uppercase tracking-wider">
                    ⚡ BỘ ĐIỀU KHIỂN 2 CON CHUỘT ĐỒNG THỜI
                  </span>
                  <span className="bg-[#14100D] text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.2 rounded font-bold">
                    RACE CONDITION
                  </span>
                </div>
                <h4 className="font-cinzel font-black text-sm sm:text-base text-[#F6ECE1] mt-0.5">
                  Bấm Cùng Lúc 2 Bên (Hoặc Dùng 2 Tay: Chuột + Phím Space)
                </h4>
                <p className="text-[#A8998A] text-xs mt-0.5">
                  • <strong>Tay phải:</strong> Dùng chuột click T1 &nbsp;|&nbsp; • <strong>Tay trái:</strong> Bấm phím <kbd className="px-1.5 py-0.5 bg-[#14100D] border border-[#D4AF37]/40 rounded font-mono text-[#E5A84B] font-bold">SPACE</kbd> để T2 click cùng một tích tắc!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Toggle Mirror Cursor */}
              <button
                onClick={() => {
                  sound.play('click');
                  setDualMirrorCursor(!dualMirrorCursor);
                }}
                className={`px-4 py-2.5 rounded-full text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${dualMirrorCursor ? 'bg-[#D4AF37] text-[#120F0D] border-[#D4AF37] shadow-md shadow-[#D4AF37]/30' : 'bg-[#181410] text-[#B8A898] border-[#3A3026] hover:border-[#D4AF37]/40'}`}
                title="Bật con chuột ảo thứ hai tự động di chuyển đồng bộ"
              >
                <span>{dualMirrorCursor ? '🟢' : '⚪'}</span>
                <span>Chuột Ảo Đối Xứng</span>
              </button>

              {/* Instant Simultaneous Trigger Button */}
              <button
                onClick={handleDualSimultaneousHold}
                disabled={dualSimulateTwoCursors}
                className="bg-gradient-to-r from-[#E5A84B] via-[#D4AF37] to-[#8E1E24] hover:brightness-110 text-[#120F0D] font-cinzel font-black text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg shadow-[#D4AF37]/30 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
              >
                <span className="text-base">⚡</span>
                <span>{dualSimulateTwoCursors ? '⏳ ĐANG CLICK CÙNG LÚC...' : 'BẤM CẢ 2 CHUỘT CÙNG LÚC!'}</span>
              </button>
            </div>
          </div>

          {/* SIDE-BY-SIDE DUAL SESSIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* ========================================================= */}
            {/* PANEL 1 (LEFT): GIAO TÁC 1 - KHÁCH HÀNG A (VIP - SPID 52) */}
            {/* ========================================================= */}
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border-2 border-[#E5A84B]/40 bg-gradient-to-b from-[#1C1713] to-[#120F0D] flex flex-col justify-between shadow-2xl">
              <div>
                {/* Session Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E5A84B]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E5A84B] to-[#996515] text-[#120F0D] font-black font-mono flex items-center justify-center text-sm shadow-md">
                      T1
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-cinzel font-black text-base text-[#F6ECE1]">Giao Tác 1 (Session #52)</h3>
                        <span className="bg-[#3D2510] text-[#E5A84B] border border-[#E5A84B]/40 text-[10px] font-mono px-2 py-0.2 rounded font-bold">
                          VIP USER
                        </span>
                      </div>
                      <div className="text-[11px] text-[#B8A898] font-mono">
                        Khách: <strong className="text-[#E5A84B]">{dualT1.user}</strong> (SPID 52)
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${dualT1.status === 'ACTIVE' ? 'bg-amber-950/80 text-amber-300 border-amber-500 animate-pulse' : dualT1.status === 'COMMITTED' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500' : dualT1.status === 'ROLLED_BACK' ? 'bg-rose-950/80 text-rose-300 border-rose-500' : 'bg-[#14100D] text-[#8B7C6E] border-[#3A3026]'}`}>
                    {dualT1.status === 'ACTIVE' ? '🟢 TRAN ĐANG MỞ' : dualT1.status === 'COMMITTED' ? '✅ COMMITTED' : dualT1.status === 'ROLLED_BACK' ? '↩ ROLLED BACK' : '⚪ IDLE (CHƯA TRAN)'}
                  </span>
                </div>

                {/* Mini Cinema Curved Screen */}
                <div className="mb-4 text-center">
                  <div className="text-[10px] font-mono text-[#A8998A] tracking-[0.2em] uppercase mb-1">MÀN HÌNH CHIẾU PHIM ROYAL IMAX</div>
                  <div className="h-2 w-3/4 mx-auto rounded-t-full bg-gradient-to-r from-transparent via-[#E5A84B]/50 to-transparent shadow-[0_-4px_10px_rgba(229,168,75,0.3)]"></div>
                </div>

                {/* Seat Map for T1 */}
                <div className="bg-[#0E0C0A] p-4 rounded-xl border border-[#3A3026] mb-5">
                  <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                    {[...dualSeats, ...dualExtraSeats].map(seat => {
                      const isSelected = dualT1.selectedSeats.includes(seat.soGhe);
                      const isHeldByMe = dualT1.heldSeats.includes(seat.soGhe);
                      const isHeldByOther = seat.holder === 'T2' && seat.trangThai === 'DANG_GIU';
                      const isSold = seat.trangThai === 'DA_DAT';

                      let seatStyle = 'bg-[#1F1913] border-[#3A3026] text-[#D5C5B5]';
                      let statusText = `${seat.gia / 1000}k`;

                      if (isSold) {
                        seatStyle = 'bg-[#2A1215] border-[#8E1E24]/60 text-[#8B7C6E] opacity-60 cursor-not-allowed';
                        statusText = 'ĐÃ BÁN';
                      } else if (isHeldByMe) {
                        seatStyle = 'bg-[#3A2412] border-[#E5A84B] text-[#F6ECE1] shadow-[0_0_12px_rgba(229,168,75,0.4)] animate-pulse font-bold';
                        statusText = dualIsFixed ? 'UPDLOCK' : 'ĐANG GIỮ';
                      } else if (isHeldByOther) {
                        seatStyle = 'bg-[#2A1810] border-[#B3262E]/70 text-[#E5A84B] border-dashed';
                        statusText = '🔒 T2 GIỮ';
                      } else if (isSelected) {
                        seatStyle = 'bg-[#2B2015] border-[#E5A84B] text-[#E5A84B] font-bold shadow-sm';
                        statusText = 'T1 CHỌN';
                      }

                      return (
                        <button
                          key={seat.id}
                          onMouseEnter={() => setHoveredDualSeat(seat.soGhe)}
                          onClick={() => handleDualInstantRace(seat.soGhe)}
                          disabled={isSold}
                          className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center relative ${seatStyle} ${hoveredDualSeat === seat.soGhe ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black' : ''}`}
                          title={`Click để cả 2 con chuột cùng tranh ghế ${seat.soGhe}`}
                        >
                          {hoveredDualSeat === seat.soGhe && (
                            <div className="absolute -top-3 -left-3 z-20 flex items-center gap-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-black animate-bounce pointer-events-none">
                              <span>🖱️</span> T1
                            </div>
                          )}
                          <span className="font-mono text-xs font-black">{seat.soGhe}</span>
                          <span className="text-[9px] font-mono mt-0.5">{statusText}</span>
                          {isHeldByMe && (
                            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 rounded-full text-[9px] text-black font-bold flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#A8998A] mt-3 pt-2 border-t border-[#3A3026]">
                    <span>Ghế chọn: <strong className="text-[#E5A84B]">{dualT1.selectedSeats.join(', ') || 'Chưa chọn'}</strong></span>
                    <span>Đang giữ: <strong className="text-emerald-400">{dualT1.heldSeats.join(', ') || '0'}</strong></span>
                  </div>
                </div>

                {/* 4 Transaction Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <button
                    onClick={() => handleDualBeginTran('T1')}
                    className="bg-[#2B2015] hover:bg-[#3D2C1C] text-[#E5A84B] font-cinzel font-bold text-xs p-2.5 rounded-xl border border-[#E5A84B]/40 transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="text-sm">▶</span>
                    <span>1. BEGIN TRAN</span>
                  </button>

                  <button
                    onClick={() => handleDualHoldSeats('T1')}
                    className="bg-[#3D2510] hover:bg-[#523216] text-[#F6ECE1] font-cinzel font-bold text-xs p-2.5 rounded-xl border border-[#E5A84B] transition-all flex flex-col items-center justify-center gap-0.5 shadow-md shadow-[#E5A84B]/20"
                    title="Dùng chuột click nút này"
                  >
                    <span className="text-sm">🔒</span>
                    <span>2. GIỮ GHẾ</span>
                    <span className="text-[9px] font-mono text-[#E5A84B] font-bold">[Chuột Trái]</span>
                  </button>

                  <button
                    onClick={() => handleDualCommit('T1')}
                    className="bg-emerald-900/60 hover:bg-emerald-800/70 text-emerald-200 font-cinzel font-bold text-xs p-2.5 rounded-xl border border-emerald-500/50 transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="text-sm">💳</span>
                    <span>3. COMMIT</span>
                  </button>

                  <button
                    onClick={() => handleDualRollback('T1')}
                    className="bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 font-cinzel font-bold text-xs p-2.5 rounded-xl border border-rose-500/50 transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="text-sm">↩</span>
                    <span>4. ROLLBACK</span>
                  </button>
                </div>

                {/* Live Alert Box for T1 */}
                {dualT1.alert && (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed mb-4 flex items-start gap-2 ${dualT1.alertType === 'error' ? 'bg-rose-950/70 border-rose-600/70 text-rose-200' : dualT1.alertType === 'warning' ? 'bg-amber-950/70 border-amber-600/70 text-amber-200' : 'bg-[#181410] border-[#E5A84B]/40 text-[#E5A84B]'}`}>
                    <span className="text-base flex-shrink-0">
                      {dualT1.alertType === 'error' ? '❌' : dualT1.alertType === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div>{dualT1.alert}</div>
                  </div>
                )}
              </div>

              {/* T-SQL Console Logs */}
              <div className="bg-[#070605] p-3 rounded-xl border border-[#3A3026]">
                <div className="text-[10px] font-mono text-[#8B7C6E] uppercase mb-1 flex items-center justify-between">
                  <span>💻 CONSOLE T-SQL (SESSION 52)</span>
                  <span className="text-[#E5A84B]">T1 LOGS</span>
                </div>
                <div className="font-mono text-[11px] text-[#A8998A] space-y-1 max-h-24 overflow-y-auto pr-1">
                  {dualT1.logs.map((log, i) => (
                    <div key={i} className={log.includes('BLOCKED') ? 'text-amber-400 font-bold' : log.includes('COMMIT') ? 'text-emerald-400' : log.includes('ROLLBACK') ? 'text-rose-400' : 'text-[#D5C5B5]'}>
                      &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PANEL 2 (RIGHT): GIAO TÁC 2 - KHÁCH HÀNG B (SPID 53)      */}
            {/* ========================================================= */}
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border-2 border-[#8E1E24]/60 bg-gradient-to-b from-[#1C1214] to-[#120F0D] flex flex-col justify-between shadow-2xl">
              <div>
                {/* Session Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#8E1E24]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8E1E24] to-[#4A1215] text-[#F6ECE1] font-black font-mono flex items-center justify-center text-sm shadow-md border border-[#D4AF37]/30">
                      T2
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-cinzel font-black text-base text-[#F6ECE1]">Giao Tác 2 (Session #53)</h3>
                        <span className="bg-[#4A1215] text-[#F28B82] border border-[#8E1E24] text-[10px] font-mono px-2 py-0.2 rounded font-bold">
                          KHÁCH THƯỜNG
                        </span>
                      </div>
                      <div className="text-[11px] text-[#B8A898] font-mono">
                        Khách: <strong className="text-[#F28B82]">{dualT2.user}</strong> (SPID 53)
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${dualT2.status === 'ACTIVE' ? 'bg-amber-950/80 text-amber-300 border-amber-500 animate-pulse' : dualT2.status === 'COMMITTED' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500' : dualT2.status === 'ROLLED_BACK' ? 'bg-rose-950/80 text-rose-300 border-rose-500' : 'bg-[#14100D] text-[#8B7C6E] border-[#3A3026]'}`}>
                    {dualT2.status === 'ACTIVE' ? '🟢 TRAN ĐANG MỞ' : dualT2.status === 'COMMITTED' ? '✅ COMMITTED' : dualT2.status === 'ROLLED_BACK' ? '↩ ROLLED BACK' : '⚪ IDLE (CHƯA TRAN)'}
                  </span>
                </div>

                {/* Mini Cinema Curved Screen */}
                <div className="mb-4 text-center">
                  <div className="text-[10px] font-mono text-[#A8998A] tracking-[0.2em] uppercase mb-1">MÀN HÌNH CHIẾU PHIM ROYAL IMAX</div>
                  <div className="h-2 w-3/4 mx-auto rounded-t-full bg-gradient-to-r from-transparent via-[#8E1E24]/60 to-transparent shadow-[0_-4px_10px_rgba(142,30,36,0.3)]"></div>
                </div>

                {/* Seat Map for T2 */}
                <div className="bg-[#0E0C0A] p-4 rounded-xl border border-[#3A3026] mb-5">
                  <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                    {[...dualSeats, ...dualExtraSeats].map(seat => {
                      const isSelected = dualT2.selectedSeats.includes(seat.soGhe);
                      const isHeldByMe = dualT2.heldSeats.includes(seat.soGhe);
                      const isHeldByOther = seat.holder === 'T1' && seat.trangThai === 'DANG_GIU';
                      const isSold = seat.trangThai === 'DA_DAT';

                      let seatStyle = 'bg-[#1F1913] border-[#3A3026] text-[#D5C5B5]';
                      let statusText = `${seat.gia / 1000}k`;

                      if (isSold) {
                        seatStyle = 'bg-[#2A1215] border-[#8E1E24]/60 text-[#8B7C6E] opacity-60 cursor-not-allowed';
                        statusText = 'ĐÃ BÁN';
                      } else if (isHeldByMe) {
                        seatStyle = 'bg-[#4A1215] border-[#B3262E] text-[#F6ECE1] shadow-[0_0_12px_rgba(179,38,46,0.4)] animate-pulse font-bold';
                        statusText = dualIsFixed ? 'UPDLOCK' : 'ĐANG GIỮ';
                      } else if (isHeldByOther) {
                        seatStyle = 'bg-[#2B2015] border-[#E5A84B]/70 text-[#E5A84B] border-dashed';
                        statusText = '🔒 T1 GIỮ';
                      } else if (isSelected) {
                        seatStyle = 'bg-[#3A1418] border-[#B3262E] text-[#F28B82] font-bold shadow-sm';
                        statusText = 'T2 CHỌN';
                      }

                      return (
                        <button
                          key={seat.id}
                          onMouseEnter={() => setHoveredDualSeat(seat.soGhe)}
                          onClick={() => handleDualInstantRace(seat.soGhe)}
                          disabled={isSold}
                          className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center relative ${seatStyle} ${hoveredDualSeat === seat.soGhe ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-black' : ''}`}
                          title={`Click để cả 2 con chuột cùng tranh ghế ${seat.soGhe}`}
                        >
                          {hoveredDualSeat === seat.soGhe && (
                            <div className="absolute -top-3 -right-3 z-20 flex items-center gap-1 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white animate-bounce pointer-events-none">
                              <span>🖱️</span> T2
                            </div>
                          )}
                          <span className="font-mono text-xs font-black">{seat.soGhe}</span>
                          <span className="text-[9px] font-mono mt-0.5">{statusText}</span>
                          {isHeldByMe && (
                            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#A8998A] mt-3 pt-2 border-t border-[#3A3026]">
                    <span>Ghế chọn: <strong className="text-[#F28B82]">{dualT2.selectedSeats.join(', ') || 'Chưa chọn'}</strong></span>
                    <span>Đang giữ: <strong className="text-emerald-400">{dualT2.heldSeats.join(', ') || '0'}</strong></span>
                  </div>
                </div>

                {/* 4 Transaction Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <button
                    onClick={() => handleDualBeginTran('T2')}
                    className="bg-[#2A1417] hover:bg-[#3D1A1E] text-[#F28B82] font-cinzel font-bold text-xs p-2.5 rounded-xl border border-[#8E1E24]/60 transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="text-sm">▶</span>
                    <span>1. BEGIN TRAN</span>
                  </button>

                  <button
                    onClick={() => handleDualHoldSeats('T2')}
                    className="bg-[#4A1215] hover:bg-[#66181D] text-[#F6ECE1] font-cinzel font-bold text-xs p-2.5 rounded-xl border border-[#B3262E] transition-all flex flex-col items-center justify-center gap-0.5 shadow-md shadow-[#B3262E]/25"
                    title="Dùng chuột click hoặc bấm phím SPACE"
                  >
                    <span className="text-sm">🔒</span>
                    <span>2. TRANH MUA</span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">[Phím SPACE]</span>
                  </button>

                  <button
                    onClick={() => handleDualCommit('T2')}
                    className="bg-emerald-900/60 hover:bg-emerald-800/70 text-emerald-200 font-cinzel font-bold text-xs p-2.5 rounded-xl border border-emerald-500/50 transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="text-sm">💳</span>
                    <span>3. COMMIT</span>
                  </button>

                  <button
                    onClick={() => handleDualRollback('T2')}
                    className="bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 font-cinzel font-bold text-xs p-2.5 rounded-xl border border-rose-500/50 transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="text-sm">↩</span>
                    <span>4. ROLLBACK</span>
                  </button>
                </div>

                {/* Live Alert Box for T2 */}
                {dualT2.alert && (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed mb-4 flex items-start gap-2 ${dualT2.alertType === 'error' ? 'bg-rose-950/70 border-rose-600/70 text-rose-200' : dualT2.alertType === 'warning' ? 'bg-amber-950/70 border-amber-600/70 text-amber-200' : 'bg-[#181410] border-[#8E1E24]/50 text-[#F28B82]'}`}>
                    <span className="text-base flex-shrink-0">
                      {dualT2.alertType === 'error' ? '❌' : dualT2.alertType === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div>{dualT2.alert}</div>
                  </div>
                )}
              </div>

              {/* T-SQL Console Logs */}
              <div className="bg-[#070605] p-3 rounded-xl border border-[#3A3026]">
                <div className="text-[10px] font-mono text-[#8B7C6E] uppercase mb-1 flex items-center justify-between">
                  <span>💻 CONSOLE T-SQL (SESSION 53)</span>
                  <span className="text-[#F28B82]">T2 LOGS</span>
                </div>
                <div className="font-mono text-[11px] text-[#A8998A] space-y-1 max-h-24 overflow-y-auto pr-1">
                  {dualT2.logs.map((log, i) => (
                    <div key={i} className={log.includes('BLOCKED') ? 'text-amber-400 font-bold' : log.includes('COMMIT') ? 'text-emerald-400' : log.includes('ROLLBACK') ? 'text-rose-400' : 'text-[#D5C5B5]'}>
                      &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM: LIVE TRANSACTION TIMELINE STREAM & ACADEMIC EXPLANATION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Timeline Stream */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-[#D4AF37]/20">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D4AF37]/15">
                <h4 className="font-cinzel font-bold text-sm text-[#F6ECE1] flex items-center gap-2">
                  <span>📜</span> LIVE TRANSACTION TIMELINE STREAM (NHẬT KÝ 2 PHIÊN)
                </h4>
                <span className="text-[10px] font-mono text-[#D4AF37] bg-[#14100D] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                  REAL-TIME
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs pr-1">
                {dualTimeline.map((item, idx) => {
                  const isT1 = item.source === 'T1';
                  const isT2 = item.source === 'T2';
                  const isEngine = item.source === 'SQL_ENGINE';
                  return (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0E0C0A] border border-[#26201A]">
                      <span className="text-[10px] text-[#8B7C6E] flex-shrink-0 mt-0.5">{item.time}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold flex-shrink-0 ${isT1 ? 'bg-[#3D2510] text-[#E5A84B] border border-[#E5A84B]/40' : isT2 ? 'bg-[#4A1215] text-[#F28B82] border border-[#8E1E24]' : isEngine ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50' : 'bg-[#1C1713] text-[#A8998A]'}`}>
                        {item.source}
                      </span>
                      <span className="text-[#D5C5B5] leading-relaxed">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Academic Explainer Box */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-[#D4AF37]/20 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#D4AF37] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💡</span> BÍ KÍP BẢO VỆ ĐỒ ÁN TRƯỚC GIẢNG VIÊN:
                </div>
                <h4 className="font-cinzel font-black text-base text-[#F6ECE1] mb-3">
                  Cơ Chế Khóa Của SQL Server Xử Lý Tình Huống Này Thế Nào?
                </h4>
                <div className="space-y-3 text-xs text-[#D5C5B5] leading-relaxed">
                  <div className="p-3 bg-[#14100D] rounded-xl border border-[#3A3026]">
                    <strong className="text-[#E5A84B] block mb-1">1. Khi chưa sửa (Lost Update / Dirty Read):</strong>
                    Các câu lệnh SELECT chỉ xin S-Lock đọc xong nhả ngay ở READ COMMITTED, hoặc dùng NOLOCK. T2 có thể chen ngang đọc/ghi đè lên dữ liệu dở dang của T1.
                  </div>
                  <div className="p-3 bg-[#14100D] rounded-xl border border-emerald-900/40">
                    <strong className="text-emerald-400 block mb-1">2. Khi đã sửa (UPDLOCK / REPEATABLE READ):</strong>
                    T1 gắn khóa độc quyền UPDLOCK trên dòng ghế. Khi T2 muốn xin khóa để mua ghế, SQL Server phát hiện xung đột và bắt T2 vào hàng đợi <code className="text-amber-300 font-mono">BLOCKED</code> cho đến khi T1 Commit/Rollback!
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D4AF37]/15 flex items-center justify-between text-[11px] font-mono text-[#A8998A]">
                <span>Chuẩn ANSI SQL-92</span>
                <span className="text-[#D4AF37]">Môn: HQTCSDL</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: TRAILER VIEWER (YOUTUBE EMBED)                       */}
      {/* ============================================================= */}
      {trailerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-2xl">
            <div className="p-4 bg-[#14100D] border-b border-[#D4AF37]/20 flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-base text-[#F6ECE1] flex items-center gap-2">
                <span>🎬</span> Trailer Chiếu Bóng: {trailerModal.title}
              </h3>
              <button 
                onClick={() => setTrailerModal({ open: false, youtubeId: '', title: '' })}
                className="text-[#A8998A] hover:text-[#D4AF37] text-lg font-bold p-1 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe 
                src={`https://www.youtube.com/embed/${trailerModal.youtubeId}?autoplay=1`} 
                title={trailerModal.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: MOVIE DETAILS MODAL                                  */}
      {/* ============================================================= */}
      {movieDetailModal.open && movieDetailModal.movie && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-2xl my-8">
            {/* Banner */}
            <div className="relative h-64 sm:h-72 w-full">
              <img src={movieDetailModal.movie.banner} alt={movieDetailModal.movie.tenPhim} className="w-full h-full object-cover filter contrast-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14100D] via-[#14100D]/60 to-transparent"></div>
              <button 
                onClick={() => setMovieDetailModal({ open: false, movie: null })}
                className="absolute top-4 right-4 bg-black/70 hover:bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/30 w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 -mt-20 relative z-10">
              <div className="flex flex-col sm:flex-row gap-6">
                <img src={movieDetailModal.movie.poster} alt={movieDetailModal.movie.tenPhim} className="w-32 h-48 object-cover rounded-xl shadow-xl border border-[#D4AF37]/30 self-center sm:self-start filter contrast-105" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#8E1E24] text-[#F6ECE1] border border-[#D4AF37]/40 text-[10px] font-cinzel font-bold px-2.5 py-0.5 rounded uppercase">
                      ROYAL 70MM
                    </span>
                    <span className="text-[#D4AF37] text-xs font-bold font-mono">⭐ IMDb {movieDetailModal.movie.diemIMDb}</span>
                    <span className="text-[#B8A898] text-xs font-mono">⏱ {movieDetailModal.movie.thoiLuong}p</span>
                  </div>
                  <h3 className="text-2xl font-cinzel font-black text-[#F6ECE1]">{movieDetailModal.movie.tenPhim}</h3>
                  <div className="text-xs text-[#D4AF37] font-mono font-semibold">{movieDetailModal.movie.tenGoc}</div>
                  <p className="text-xs text-[#D5C5B5] leading-relaxed">{movieDetailModal.movie.moTa}</p>

                  <div className="pt-2 text-xs text-[#B8A898] space-y-1 font-mono">
                    <div><strong className="text-[#D4AF37]">Đạo diễn:</strong> {movieDetailModal.movie.daoDien}</div>
                    <div><strong className="text-[#D4AF37]">Diễn viên:</strong> {movieDetailModal.movie.dienVien}</div>
                    <div><strong className="text-[#D4AF37]">Độ tuổi:</strong> <span className="text-[#E5A84B] font-bold">{movieDetailModal.movie.doTuoi}</span></div>
                  </div>
                </div>
              </div>

              {/* Showtimes & CTA */}
              <div className="mt-8 pt-6 border-t border-[#D4AF37]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-cinzel font-bold text-[#D4AF37]">Suất chiếu:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {movieDetailModal.movie.suatChieu?.map(time => (
                      <span key={time} className="bg-[#181410] border border-[#3A3026] text-[#D5C5B5] text-xs font-mono px-2 py-0.5 rounded">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      setTrailerModal({ open: true, youtubeId: movieDetailModal.movie.trailerId || 'd9MyW72ELq0', title: movieDetailModal.movie.tenPhim });
                    }}
                    className="flex-1 sm:flex-none glass-panel hover:bg-white/10 text-[#F6ECE1] font-cinzel font-bold text-xs px-4 py-2.5 rounded-full border border-[#D4AF37]/30 transition-all"
                  >
                    ▶ Xem Trailer
                  </button>
                  <button 
                    onClick={() => {
                      setMovieDetailModal({ open: false, movie: null });
                      startBooking(movieDetailModal.movie);
                    }}
                    className="flex-1 sm:flex-none btn-vintage-wine font-cinzel font-extrabold text-xs px-6 py-2.5 rounded-full shadow-lg"
                  >
                    🎟 ĐẶT VÉ NGAY
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: AUTHENTICATION MODAL (LOGIN / REGISTER)              */}
      {/* ============================================================= */}
      {authModal.open && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/30 shadow-2xl relative">
            <button 
              onClick={() => setAuthModal({ open: false, mode: 'login' })}
              className="absolute top-4 right-4 text-[#A8998A] hover:text-[#D4AF37] text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex gap-2 p-1 bg-[#14100D] rounded-full mb-6 border border-[#D4AF37]/20">
              <button 
                onClick={() => setAuthModal({ ...authModal, mode: 'login' })}
                className={`flex-1 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${authModal.mode === 'login' ? 'btn-vintage-wine text-[#F6ECE1]' : 'text-[#A8998A]'}`}
              >
                Đăng Nhập
              </button>
              <button 
                onClick={() => setAuthModal({ ...authModal, mode: 'register' })}
                className={`flex-1 py-2 rounded-full text-xs font-cinzel font-bold tracking-wider transition-all ${authModal.mode === 'register' ? 'btn-vintage-wine text-[#F6ECE1]' : 'text-[#A8998A]'}`}
              >
                Đăng Ký Mới
              </button>
            </div>

            {authModal.mode === 'login' ? (
              <div>
                <form 
                  onSubmit={async e => {
                    e.preventDefault();
                    const email = e.target.email.value;
                    const pass = e.target.password.value;
                    handleLogin(email, pass);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-cinzel font-semibold text-[#D4AF37] mb-1">Email Đăng Nhập</label>
                    <input type="email" name="email" required defaultValue="a.nguyen@email.com" className="w-full bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-cinzel font-semibold text-[#D4AF37] mb-1">Mật khẩu</label>
                    <input type="password" name="password" required defaultValue="123456" className="w-full bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full btn-vintage-wine font-cinzel font-bold text-xs py-3 rounded-xl tracking-wider">
                    ĐĂNG NHẬP HỆ THỐNG
                  </button>
                </form>

                {/* Quick Demo Accounts for Easy Testing */}
                <div className="mt-6 pt-5 border-t border-[#D4AF37]/20">
                  <div className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider mb-2 text-center font-bold">
                    ⚡ CHỌN NHANH TÀI KHOẢN MẪU ĐỂ ĐĂNG NHẬP & PHÂN QUYỀN
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <button 
                      type="button"
                      onClick={() => handleLogin('a.nguyen@email.com', '123456')}
                      className="p-2.5 rounded-xl bg-[#14100D] hover:bg-[#251D16] border border-[#3A3026] hover:border-[#D4AF37]/50 transition-all text-left"
                    >
                      <div className="font-cinzel font-bold text-[11px] text-[#F6ECE1]">👤 Khách Hàng VIP</div>
                      <div className="text-[9px] text-[#A8998A] font-mono">a.nguyen@email.com</div>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleLogin('b.tran@email.com', '123456')}
                      className="p-2.5 rounded-xl bg-[#14100D] hover:bg-[#251D16] border border-[#3A3026] hover:border-[#D4AF37]/50 transition-all text-left"
                    >
                      <div className="font-cinzel font-bold text-[11px] text-[#F6ECE1]">👤 Khách Hàng B</div>
                      <div className="text-[9px] text-[#A8998A] font-mono">b.tran@email.com</div>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleLogin('staff@cinema.vn', 'staff123')}
                      className="p-2.5 rounded-xl bg-[#14100D] hover:bg-[#251D16] border border-[#3A3026] hover:border-[#D4AF37]/50 transition-all text-left"
                    >
                      <div className="font-cinzel font-bold text-[11px] text-[#D4AF37]">🎫 Nhân Viên Rạp</div>
                      <div className="text-[9px] text-[#A8998A] font-mono">staff@cinema.vn</div>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleLogin('admin@cinema.vn', 'admin123')}
                      className="p-2.5 rounded-xl bg-[#14100D] hover:bg-[#251D16] border border-[#3A3026] hover:border-[#D4AF37]/50 transition-all text-left"
                    >
                      <div className="font-cinzel font-bold text-[11px] text-[#E5A84B]">👑 Quản Trị Viên (Admin)</div>
                      <div className="text-[9px] text-[#A8998A] font-mono">admin@cinema.vn</div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={async e => {
                  e.preventDefault();
                  const hoTen = e.target.hoTen.value;
                  const email = e.target.email.value;
                  const sdt = e.target.sdt.value;
                  const matKhau = e.target.matKhau.value;
                  try {
                    const res = await fetch('/api/auth/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ hoTen, email, sdt, matKhau })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setCurrentUser(data.user);
                      showToast(data.message, 'success');
                      setAuthModal({ open: false, mode: 'login' });
                      if (pendingMovie) {
                        setSelectedMovie(pendingMovie);
                        setPendingMovie(null);
                        setCurrentTab('booking');
                      }
                    } else {
                      showToast(data.message, 'error');
                    }
                  } catch (err) {
                    showToast(err.message, 'error');
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-cinzel font-semibold text-[#D4AF37] mb-1">Họ và tên</label>
                  <input type="text" name="hoTen" required placeholder="Nguyễn Văn A" className="w-full bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-cinzel font-semibold text-[#D4AF37] mb-1">Email</label>
                  <input type="email" name="email" required placeholder="email@vi-du.com" className="w-full bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-cinzel font-semibold text-[#D4AF37] mb-1">Số điện thoại</label>
                  <input type="tel" name="sdt" required placeholder="0901234567" className="w-full bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-cinzel font-semibold text-[#D4AF37] mb-1">Mật khẩu</label>
                  <input type="password" name="matKhau" required placeholder="••••••••" className="w-full bg-[#14100D] border border-[#3A3026] rounded-xl px-3 py-2 text-xs text-[#F6ECE1] font-mono focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <button type="submit" className="w-full btn-vintage-wine font-cinzel font-bold text-xs py-3 rounded-xl tracking-wider">
                  ĐĂNG KÝ THÀNH VIÊN
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: PAYMENT PROCESSING OVERLAY                           */}
      {/* ============================================================= */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#D4AF37]/40 text-center max-w-sm space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <h3 className="font-cinzel font-bold text-lg text-[#F6ECE1]">Đang Xử Lý Thanh Toán...</h3>
            <p className="text-xs text-[#B8A898] leading-relaxed font-mono">
              Đang kết nối cổng thanh toán an toàn SSL 256-bit và khóa ghế phòng chiếu trên CSDL SQL Server...
            </p>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TOAST MESSAGE NOTIFICATION                                    */}
      {/* ============================================================= */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold transition-all duration-300 flex items-center gap-3 ${toast.type === 'success' ? 'bg-[#181410] border-emerald-500 text-emerald-300 shadow-emerald-950/50' : toast.type === 'error' ? 'bg-[#1E0F12] border-[#8E1E24] text-rose-300 shadow-red-950/50' : 'bg-[#181410] border-[#D4AF37] text-[#D4AF37] shadow-[#D4AF37]/20'}`}>
          <span className="text-base">{toast.type === 'success' ? '✔' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span className="font-sans">{toast.message}</span>
        </div>
      )}

      {/* ============================================================= */}
      {/* LUXURY VINTAGE FOOTER                                         */}
      {/* ============================================================= */}
      <footer className="bg-[#080605] border-t border-[#D4AF37]/20 mt-24 py-16 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📽</span>
              <span className="text-xl font-cinzel font-black tracking-widest text-[#F6ECE1]">CINEMAX PREMIER</span>
            </div>
            <p className="text-xs text-[#A8998A] leading-relaxed">
              Chuỗi rạp chiếu phim hoàng gia chuẩn Hollywood Golden Age với hệ thống ghế nhung tình nhân Sweetbox, màn chiếu 70mm Grand Screen và âm thanh thính phòng sống động.
            </p>
          </div>

          <div>
            <h4 className="font-cinzel font-bold text-sm text-[#D4AF37] mb-4 tracking-wider">ĐIỀU HƯỚNG NHANH</h4>
            <ul className="space-y-2 text-xs text-[#A8998A]">
              <li><button onClick={() => setCurrentTab('home')} className="hover:text-[#F6ECE1]">Phim Đang Chiếu</button></li>
              <li><button onClick={() => setCurrentTab('movies')} className="hover:text-[#F6ECE1]">Lịch Chiếu & Giá Vé</button></li>
              <li><button onClick={() => setCurrentTab('cinemas')} className="hover:text-[#F6ECE1]">Cụm Rạp Hoàng Gia</button></li>
              <li><button onClick={() => setCurrentTab('promotions')} className="hover:text-[#F6ECE1]">Khuyến Mãi & Voucher</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel font-bold text-sm text-[#D4AF37] mb-4 tracking-wider">CHĂM SÓC KHÁCH HÀNG</h4>
            <ul className="space-y-2 text-xs text-[#A8998A]">
              <li>Hotline CSKH: <strong className="text-[#F6ECE1]">1900 6017</strong></li>
              <li>Email: support@cinemax.premier.vn</li>
              <li>Giờ làm việc: 08:00 - 23:00 hàng ngày</li>
              <li>Chính sách hội viên & bảo mật</li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel font-bold text-sm text-[#D4AF37] mb-2 tracking-wider">ĐỒ ÁN MÔN HỌC</h4>
            <div className="text-xs text-[#A8998A] space-y-1">
              <div>Học phần: <strong>Hệ Quản Trị CSDL (HQTCSDL)</strong></div>
              <div>Đề tài: <strong>Xử lý 5 tranh chấp dữ liệu trên SQL Server</strong></div>
              <div className="text-[#6D5D50] text-[11px] pt-2 font-mono">© 2026 CineMax Premier Cinemas • Vintage Edition.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Render React App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CineMaxApp />);
