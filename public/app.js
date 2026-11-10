// ====================================================================
// CINEMAX PREMIER - JAVASCRIPT ĐIỀU KHIỂN TOÀN BỘ WEBSITE RẠP PHIM
// ====================================================================

// ====================================================================
// CHẤT RIÊNG ĐỘC BẢN 1: WEB AUDIO SYNTHESIZER ENGINE (KHÔNG CẦN FILE NGOÀI)
// ====================================================================
let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function toggleSoundFx() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btnSoundToggle');
    if (btn) {
        btn.innerText = soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
        btn.style.color = soundEnabled ? '#93c5fd' : '#64748b';
    }
    showToast(soundEnabled ? 'Đã bật hiệu ứng âm thanh rạp phim!' : 'Đã tắt âm thanh!', 'info');
}

function playAudioFx(type) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        if (type === 'click') {
            // Âm thanh click cơ học mượt mà khi chạm ghế
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'success') {
            // Hợp âm thính phòng vang lên khi xuất vé hoặc giao dịch an toàn
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
                gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.07);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.07 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.07);
                osc.stop(ctx.currentTime + idx * 0.07 + 0.3);
            });
        } else if (type === 'lock') {
            // Âm thanh Buzz cảnh báo khóa Exclusive/Shared Lock đang chặn
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.setValueAtTime(190, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.32);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.32);
        } else if (type === 'deadlock') {
            // Còi báo động Deadlock Victim bị hủy tiến trình
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(750, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.45);
            gain.gain.setValueAtTime(0.22, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
        }
    } catch (e) {
        // Trình duyệt chưa cho phép autoplay
    }
}

// Dữ liệu kịch bản xung đột học thuật
const CONFLICT_INFO = {
    1: {
        title: "Kịch bản 1: Lost Update (Mất dữ liệu cập nhật)",
        techFixed: "T-SQL: SELECT ... WITH (UPDLOCK, ROWLOCK)",
        techError: "T-SQL: READ COMMITTED (Mặc định không giữ S-Lock)",
        descError: "Hai khách hàng A và B cùng ấn đặt ghế B01. Cả 2 đều đọc thấy ghế 'Trống' do Shared Lock bị nhả ngay sau khi đọc. Sau đó cả 2 đều UPDATE, kết quả là cập nhật của Khách A bị Khách B ghi đè mất!",
        descFixed: "Khách A sử dụng khóa WITH (UPDLOCK, ROWLOCK) khi đọc ghế. Khách B muốn đọc để cập nhật sẽ bị CHẶN (BLOCK). Khách A đặt thành công, sau đó Khách B được mở khóa thì thấy ghế đã hết trống và báo thất bại an toàn.",
        sqlError: `-- THỦ TỤC GÂY LỖI:
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRAN;
  SELECT TrangThai FROM Ve WHERE SoGhe = 'B01';
  WAITFOR DELAY '00:00:05';
  UPDATE Ve SET TrangThai = N'Đã Đặt', MaKH = @MaKH;
COMMIT TRAN;`,
        sqlFixed: `-- THỦ TỤC KHẮC PHỤC (UPDLOCK):
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRAN;
  -- Khóa UPDLOCK giữ đến khi kết thúc giao dịch
  SELECT TrangThai FROM Ve WITH (UPDLOCK, ROWLOCK) 
  WHERE SoGhe = 'B01';
  WAITFOR DELAY '00:00:05';
  UPDATE Ve SET TrangThai = N'Đã Đặt', MaKH = @MaKH;
COMMIT TRAN;`
    },
    2: {
        title: "Kịch bản 2: Dirty Read (Đọc dữ liệu rác / Uncommitted Dependency)",
        techFixed: "T-SQL: SET TRANSACTION ISOLATION LEVEL READ COMMITTED",
        techError: "T-SQL: SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED (hoặc NOLOCK)",
        descError: "Admin bắt đầu giảm giá vé flash sale từ 90k xuống 50k. Khách hàng truy vấn ở mức READ UNCOMMITTED thấy giá 50k và quyết định mua. Nhưng sau đó quản lý không duyệt và Admin ROLLBACK. Khách đã đọc phải dữ liệu rác!",
        descFixed: "Áp dụng mức cô lập READ COMMITTED. Khi Admin đang giữ khóa Exclusive (X-Lock), giao tác đọc của Khách bắt buộc phải chờ đến khi giao dịch của Admin kết thúc (COMMIT hoặc ROLLBACK) mới được đọc giá chính xác.",
        sqlError: `-- T1: Cập nhật rồi Rollback
BEGIN TRAN;
  UPDATE SuatChieu SET GiaVeCoBan = 50000;
  WAITFOR DELAY '00:00:08';
  ROLLBACK; -- Dữ liệu không được lưu

-- T2: Đọc dữ liệu rác
SET ISOLATION LEVEL READ UNCOMMITTED;
SELECT GiaVeCoBan FROM SuatChieu; -- Đọc thấy 50k!`,
        sqlFixed: `-- T2 KHẮC PHỤC:
SET ISOLATION LEVEL READ COMMITTED;
-- Bắt buộc đợi T1 nhả Exclusive Lock:
SELECT GiaVeCoBan FROM SuatChieu; 
-- Sau Rollback, giá đọc ra đúng là 90,000đ.`
    },
    3: {
        title: "Kịch bản 3: Non-Repeatable Read (Đọc không lặp lại)",
        techFixed: "T-SQL: SET TRANSACTION ISOLATION LEVEL REPEATABLE READ",
        techError: "T-SQL: SET TRANSACTION ISOLATION LEVEL READ COMMITTED",
        descError: "Khách xem giá vé (Lần 1) thấy 90,000đ. Trong lúc khách điền thẻ và OTP, Admin cập nhật tăng giá vé lên 120,000đ và Commit. Khi khách bấm thanh toán, hệ thống đọc lại giá vé (Lần 2) thì bị biến thành 120,000đ!",
        descFixed: "Sử dụng mức cô lập REPEATABLE READ. Khóa Shared Lock (S-Lock) được duy trì trên bản ghi suốt thời gian giao dịch của Khách. Admin muốn UPDATE giá vé sẽ bị CHẶN cho đến khi khách hoàn tất thanh toán.",
        sqlError: `-- T1 (Khách) - READ COMMITTED
BEGIN TRAN;
  SELECT GiaVeCoBan FROM SuatChieu; -- Lần 1: 90k
  WAITFOR DELAY '00:00:06';
  SELECT GiaVeCoBan FROM SuatChieu; -- Lần 2: 120k (Bị đổi!)
COMMIT;`,
        sqlFixed: `-- T1 KHẮC PHỤC (REPEATABLE READ)
SET ISOLATION LEVEL REPEATABLE READ;
BEGIN TRAN;
  SELECT GiaVeCoBan FROM SuatChieu; -- Lần 1: 90k (Giữ S-Lock)
  WAITFOR DELAY '00:00:06';
  SELECT GiaVeCoBan FROM SuatChieu; -- Lần 2: Vẫn 90k
COMMIT;`
    },
    4: {
        title: "Kịch bản 4: Phantom Read (Bóng ma)",
        techFixed: "T-SQL: SET TRANSACTION ISOLATION LEVEL SERIALIZABLE (Range Lock)",
        techError: "T-SQL: SET TRANSACTION ISOLATION LEVEL REPEATABLE READ",
        descError: "Khách đoàn đếm số ghế VIP còn trống (ra 3 ghế). Dù dùng REPEATABLE READ, nó chỉ khóa các dòng hiện hữu. Admin INSERT thêm một ghế VIP phụ B04. Khi khách kiểm tra lại, số ghế bất ngờ tăng lên 4 ('bóng ma' xuất hiện).",
        descFixed: "Nâng mức cô lập lên SERIALIZABLE. Hệ thống áp dụng Key-Range Lock trên toàn bộ vùng dữ liệu thỏa điều kiện WHERE. Bất kỳ câu lệnh INSERT nào cố chèn thêm ghế VIP mới đều bị chặn đến khi giao dịch kết thúc.",
        sqlError: `-- T1 (REPEATABLE READ):
SET ISOLATION LEVEL REPEATABLE READ;
BEGIN TRAN;
  SELECT COUNT(*) FROM Ve WHERE LoaiGhe='VIP'; -- Lần 1: 3
  WAITFOR DELAY '00:00:06';
  -- T2 INSERT ghế VIP B04 thành công
  SELECT COUNT(*) FROM Ve WHERE LoaiGhe='VIP'; -- Lần 2: 4 (Bóng ma)
COMMIT;`,
        sqlFixed: `-- T1 KHẮC PHỤC (SERIALIZABLE):
SET ISOLATION LEVEL SERIALIZABLE;
BEGIN TRAN;
  -- Khóa Key-Range Lock toàn bộ phạm vi LoaiGhe = 'VIP'
  SELECT COUNT(*) FROM Ve WHERE LoaiGhe='VIP';
  WAITFOR DELAY '00:00:06';
  -- T2 bị chặn, không được INSERT dòng mới vào dải này
  SELECT COUNT(*) FROM Ve WHERE LoaiGhe='VIP'; -- Luôn bằng 3!
COMMIT;`
    },
    5: {
        title: "Kịch bản 5: Deadlock (Kẹt chết)",
        techFixed: "T-SQL: Lock Ordering (Sắp xếp thứ tự khóa ID tăng dần) + Retry Lỗi 1205",
        techError: "T-SQL: Khóa không theo thứ tự nhất quán giữa các Transaction",
        descError: "Khách 1 đặt cụm ghế (A01 trước, A02 sau). Khách 2 đặt cụm ghế ngược lại (A02 trước, A01 sau). Khách 1 giữ A01 chờ A02; Khách 2 giữ A02 chờ A01. Vòng lặp kẹt cứng! SQL Server buộc phải chọn 1 bên làm Deadlock Victim (Lỗi 1205).",
        descFixed: "1. Áp dụng chuẩn hóa thứ tự khóa (Lock Ordering): Bất kể khách chọn ghế nào trước, hệ thống luôn tự động sắp xếp khóa ghế có ID nhỏ trước rồi mới đến ghế lớn.<br>2. Bẫy lỗi TRY...CATCH bắt mã 1205 để tự động thử lại (Retry).",
        sqlError: `-- T1: Khóa 1 rồi chờ 2
UPDATE Ve SET TrangThai='Giữ' WHERE MaGhe=1;
WAITFOR DELAY '00:00:05';
UPDATE Ve SET TrangThai='Giữ' WHERE MaGhe=2;

-- T2: Khóa 2 rồi chờ 1
UPDATE Ve SET TrangThai='Giữ' WHERE MaGhe=2;
WAITFOR DELAY '00:00:05';
UPDATE Ve SET TrangThai='Giữ' WHERE MaGhe=1;
--> DEADLOCK ERROR 1205!`,
        sqlFixed: `-- KHẮC PHỤC: LOCK ORDERING
-- Luôn sắp xếp @GheNho = MIN(A,B), @GheLon = MAX(A,B)
BEGIN TRY
  UPDATE Ve SET ... WHERE MaGhe = @GheNho;
  UPDATE Ve SET ... WHERE MaGhe = @GheLon;
  COMMIT;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 1205 -- Deadlock
     RETRY; -- Tự động thử lại
END CATCH;`
    }
};

// Global App States
let appState = {
    currentUser: null,
    movies: [],
    combos: [],
    seats: [],
    selectedMovie: null,
    selectedShowtime: '19:30',
    selectedSeats: [], // danh sách mã ghế: ['B01']
    selectedComboId: null,
    currentConflictId: 1,
    isFixed: false,
    isRunningConflict: false
};

// ==========================================
// KHỞI ĐỘNG HỆ THỐNG
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();

    // Mặc định đăng nhập Khách A
    quickLogin('a.nguyen@email.com', '123456');

    // Khởi tạo các sự kiện cho phòng Lab
    initLabEvents();
});

// Chuyển Tab trong website
function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    const targetSection = document.getElementById(`view-${tabId}`);
    if (targetSection) targetSection.classList.add('active');

    const activeLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
    if (activeLink) activeLink.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === 'tickets') loadUserTickets();
    if (tabId === 'booking') renderBookingStep();
    if (tabId === 'lab') renderSeatsLab(appState.seats);
    if (tabId === 'staff') {
        if (!appState.currentUser || !['NhanVien', 'Admin'].includes(appState.currentUser.vaiTro)) {
            showToast('Từ chối truy cập: Chỉ nhân viên hoặc Admin mới có quyền vào bàn soát vé!', 'error');
            switchTab('home');
            return;
        }
        loadStaffTickets();
    }
    if (tabId === 'admin') {
        if (!appState.currentUser || appState.currentUser.vaiTro !== 'Admin') {
            showToast('Từ chối truy cập: Bạn không có quyền Quản trị viên (Admin)!', 'error');
            switchTab('home');
            return;
        }
        loadAdminData();
    }
}

// ==========================================
// NẠP DỮ LIỆU TỪ SERVER
// ==========================================
async function loadInitialData() {
    try {
        const [resMovies, resCombos, resState] = await Promise.all([
            fetch('/api/movies').then(r => r.json()),
            fetch('/api/combos').then(r => r.json()),
            fetch('/api/state').then(r => r.json())
        ]);

        appState.movies = resMovies;
        appState.combos = resCombos;
        appState.seats = resState.seats;
        appState.selectedMovie = resMovies[0];

        renderHomeMovies();
        renderCombosPage();
        renderBookingStep();
        renderSeatsLab(appState.seats);
        updateConflictView();
    } catch (e) {
        console.error('Lỗi khi tải dữ liệu ban đầu:', e);
    }
}

// ==========================================
// TAB 1: RENDER TRANG CHỦ & PHIM
// ==========================================
function renderHomeMovies() {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    grid.innerHTML = appState.movies.map(movie => `
        <div class="movie-card">
            <div class="movie-poster-wrap">
                <img src="${movie.poster}" alt="${movie.tenPhim}" class="movie-poster">
                <span class="movie-score-badge">⭐ ${movie.diemIMDb}</span>
            </div>
            <div class="movie-details">
                <h4 class="movie-name">${movie.tenPhim}</h4>
                <p class="movie-genre">${movie.theLoai} • ${movie.thoiLuong} phút</p>
                <div class="movie-card-footer">
                    <span class="tag-age">${movie.doTuoi.split(' ')[0]}</span>
                    <button class="btn btn-primary btn-sm" onclick="startBooking(${movie.id})">
                        🎟 ĐẶT VÉ
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Khi bấm Đặt vé từ Home
function startBooking(movieId) {
    const movie = appState.movies.find(m => m.id === movieId);
    if (movie) {
        appState.selectedMovie = movie;
        appState.selectedShowtime = movie.suatChieu[0] || '19:30';
        appState.selectedSeats = [];
    }
    switchTab('booking');
}

// ==========================================
// TAB 2: ĐẶT VÉ, CHỌN GHẾ & COMBO
// ==========================================
function renderBookingStep() {
    // 1. Render dropdown phim
    const select = document.getElementById('bookingMovieSelect');
    if (select) {
        select.innerHTML = appState.movies.map(m => `
            <option value="${m.id}" ${appState.selectedMovie && appState.selectedMovie.id === m.id ? 'selected' : ''}>
                ${m.tenPhim} (${m.thoiLuong} phút)
            </option>
        `).join('');
    }

    // 2. Render suất chiếu
    renderShowtimes();

    // 3. Render sơ đồ ghế
    renderCinemaSeats();

    // 4. Render danh sách combo
    renderComboSelection();

    // 5. Cập nhật hóa đơn sidebar
    updateCheckoutSummary();
}

function onMovieSelectChange() {
    const select = document.getElementById('bookingMovieSelect');
    const movieId = Number(select.value);
    appState.selectedMovie = appState.movies.find(m => m.id === movieId);
    appState.selectedShowtime = appState.selectedMovie.suatChieu[0] || '19:30';
    appState.selectedSeats = [];
    renderShowtimes();
    updateCheckoutSummary();
}

function renderShowtimes() {
    const wrap = document.getElementById('showtimePills');
    if (!wrap || !appState.selectedMovie) return;

    wrap.innerHTML = appState.selectedMovie.suatChieu.map(time => `
        <button class="showtime-pill ${appState.selectedShowtime === time ? 'active' : ''}" onclick="selectShowtime('${time}')">
            ${time}
        </button>
    `).join('');
}

function selectShowtime(time) {
    appState.selectedShowtime = time;
    renderShowtimes();
    updateCheckoutSummary();
}

function renderCinemaSeats() {
    const grid = document.getElementById('seatGridCinema');
    if (!grid) return;

    grid.innerHTML = appState.seats.map(seat => {
        let cls = 'seat-btn available';
        if (seat.trangThai === 'Đã Đặt') cls = 'seat-btn booked';
        else if (seat.trangThai === 'Đang giao dịch' || seat.trangThai === 'Đang Giữ') cls = 'seat-btn holding';
        else if (appState.selectedSeats.includes(seat.soGhe)) cls = 'seat-btn selected';

        if (seat.loai === 'VIP') cls += ' vip-tier';

        return `
            <div class="${cls}" onclick="toggleSeat('${seat.soGhe}')">
                <span class="s-num">${seat.soGhe}</span>
                <span class="s-type">${seat.loai}</span>
            </div>
        `;
    }).join('');
}

function toggleSeat(seatNum) {
    const seat = appState.seats.find(s => s.soGhe === seatNum);
    if (!seat || seat.trangThai === 'Đã Đặt') {
        playAudioFx('lock');
        showToast(`Ghế ${seatNum} đã được đặt trước đó!`, 'error');
        return;
    }

    playAudioFx('click');
    const idx = appState.selectedSeats.indexOf(seatNum);
    if (idx > -1) {
        appState.selectedSeats.splice(idx, 1);
    } else {
        appState.selectedSeats.push(seatNum);
    }

    renderCinemaSeats();
    updateCheckoutSummary();
}

function renderComboSelection() {
    const list = document.getElementById('comboSelectionList');
    if (!list) return;

    list.innerHTML = `
        <div class="combo-radio-item ${appState.selectedComboId === null ? 'active' : ''}" onclick="selectCombo(null)">
            <input type="radio" name="comboRadio" ${appState.selectedComboId === null ? 'checked' : ''}>
            <div class="combo-info">
                <span class="combo-name">Không dùng bắp nước</span>
                <p class="combo-desc">Chỉ mua vé xem phim</p>
            </div>
            <strong class="combo-price">0 đ</strong>
        </div>
    ` + appState.combos.map(c => `
        <div class="combo-radio-item ${appState.selectedComboId === c.id ? 'active' : ''}" onclick="selectCombo(${c.id})">
            <input type="radio" name="comboRadio" ${appState.selectedComboId === c.id ? 'checked' : ''}>
            <div class="combo-info">
                <span class="combo-name">🍿 ${c.ten}</span>
                <p class="combo-desc">${c.moTa}</p>
            </div>
            <strong class="combo-price">${c.gia.toLocaleString('vi-VN')} đ</strong>
        </div>
    `).join('');
}

function selectCombo(comboId) {
    appState.selectedComboId = comboId;
    renderComboSelection();
    updateCheckoutSummary();
}

function updateCheckoutSummary() {
    if (!appState.selectedMovie) return;

    document.getElementById('checkoutPoster').src = appState.selectedMovie.poster;
    document.getElementById('checkoutMovieTitle').innerText = appState.selectedMovie.tenPhim;
    document.getElementById('checkoutShowtime').innerText = `${appState.selectedShowtime} - Hôm nay`;

    // Ghế
    let seatTotal = 0;
    if (appState.selectedSeats.length > 0) {
        document.getElementById('checkoutSeatsText').innerText = appState.selectedSeats.join(', ');
        appState.selectedSeats.forEach(sn => {
            const s = appState.seats.find(x => x.soGhe === sn);
            if (s) seatTotal += s.gia;
        });
    } else {
        document.getElementById('checkoutSeatsText').innerText = 'Chưa chọn';
    }
    document.getElementById('checkoutSeatPrice').innerText = seatTotal.toLocaleString('vi-VN') + ' đ';

    // Combo
    let comboTotal = 0;
    if (appState.selectedComboId) {
        const c = appState.combos.find(x => x.id === appState.selectedComboId);
        if (c) {
            document.getElementById('checkoutComboText').innerText = c.ten;
            comboTotal = c.gia;
        }
    } else {
        document.getElementById('checkoutComboText').innerText = 'Không chọn';
    }
    document.getElementById('checkoutComboPrice').innerText = comboTotal.toLocaleString('vi-VN') + ' đ';

    // Tổng tiền
    const grandTotal = seatTotal + comboTotal;
    document.getElementById('checkoutTotalPrice').innerText = grandTotal.toLocaleString('vi-VN') + ' đ';

    // User status
    const statusBox = document.getElementById('userCheckoutStatus');
    if (appState.currentUser) {
        statusBox.innerHTML = `👤 Khách đặt: <strong>${appState.currentUser.hoTen}</strong> (Nhận +25 điểm khi thanh toán)`;
    } else {
        statusBox.innerHTML = `⚠️ Bạn chưa đăng nhập. <a href="#" onclick="openAuthModal('login')" style="color:#f59e0b;font-weight:700">Đăng nhập ngay</a>`;
    }
}

// XÁC NHẬN THANH TOÁN TOÀN BỘ (FULL BOOKING FLOW)
async function executeFullBooking() {
    if (!appState.currentUser) {
        showToast('Vui lòng đăng nhập trước khi thanh toán!', 'error');
        openAuthModal('login');
        return;
    }

    if (appState.selectedSeats.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 chiếc ghế ngồi!', 'error');
        return;
    }

    const btn = document.getElementById('btnConfirmPayment');
    btn.disabled = true;
    btn.innerText = '⏳ Đang kết nối SQL Server & Khóa ghế...';

    try {
        const res = await fetch('/api/book-full', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: appState.currentUser.id,
                tenPhim: appState.selectedMovie.tenPhim,
                suatChieu: appState.selectedShowtime,
                phongChieu: 'Phòng 01 (IMAX)',
                seats: appState.selectedSeats,
                comboId: appState.selectedComboId
            })
        });
        const data = await res.json();

        if (data.success) {
            playAudioFx('success');
            showToast(data.message, 'success');
            appState.currentUser.diem = data.user.diem;
            updateNavUserUI();

            // Reset state booking
            appState.selectedSeats = [];
            await loadInitialData();

            // Chuyển sang tab Vé của tôi
            switchTab('tickets');
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = '💳 XÁC NHẬN THANH TOÁN & XUẤT VÉ';
    }
}

// ==========================================
// TAB 3: DANH SÁCH COMBO BẮP NƯỚC
// ==========================================
function renderCombosPage() {
    const grid = document.getElementById('fullCombosGrid');
    if (!grid) return;

    grid.innerHTML = appState.combos.map(c => `
        <div class="combo-showcase-card">
            <span class="combo-icon-big">🍿🥤</span>
            <h4 style="font-size: 1.15rem; font-weight:800; color:#fff;">${c.ten}</h4>
            <p style="font-size: 0.85rem; color:#94a3b8;">${c.moTa}</p>
            <strong style="color:var(--gold); font-size:1.3rem; font-family:var(--font-mono);">${c.gia.toLocaleString('vi-VN')} đ</strong>
            <button class="btn btn-outline btn-block" onclick="switchTab('booking'); selectCombo(${c.id})">
                + Thêm Vào Đặt Vé
            </button>
        </div>
    `).join('');
}

// ==========================================
// TAB 4: VÉ CỦA TÔI & THẺ THÀNH VIÊN
// ==========================================
async function loadUserTickets() {
    const list = document.getElementById('userTicketsList');
    if (!list) return;

    if (!appState.currentUser) {
        list.innerHTML = `<div style="text-align:center; padding: 40px; color:#94a3b8;">Vui lòng đăng nhập để xem lịch sử vé đã đặt.</div>`;
        return;
    }

    // Cập nhật thẻ VIP
    document.getElementById('cardMemberName').innerText = appState.currentUser.hoTen.toUpperCase();
    document.getElementById('cardMemberPoints').innerText = `${appState.currentUser.diem} ĐIỂM`;
    document.getElementById('cardMemberTier').innerText = appState.currentUser.diem >= 400 ? 'VIP MEMBER' : 'STANDARD';

    try {
        const res = await fetch(`/api/user/tickets?userId=${appState.currentUser.id}`);
        const tickets = await res.json();

        if (tickets.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding: 40px; color:#94a3b8;">Bạn chưa có vé nào. Hãy chọn một bộ phim và đặt vé ngay!</div>`;
            return;
        }

        list.innerHTML = tickets.map(t => `
            <div class="hologram-ticket">
                <div class="ticket-main-part">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span class="holo-badge">✦ VÉ ĐIỆN TỬ CHÍNH HÃNG</span>
                        <span style="font-family:var(--font-mono); font-weight:800; color:var(--gold); font-size:0.85rem;">MÃ: ${t.maVe}</span>
                    </div>
                    <div>
                        <h3 style="color:#fff; font-size:1.25rem; font-weight:800; margin-bottom:4px;">${t.tenPhim}</h3>
                        <p style="font-size:0.82rem; color:var(--gold);">${t.phongChieu} • Suất: <strong>${t.suatChieu}</strong></p>
                    </div>
                    <div style="display:flex; gap:24px; margin: 12px 0; background:rgba(0,0,0,0.25); padding:10px 14px; border-radius:8px;">
                        <div>
                            <small style="color:#94a3b8; font-size:0.7rem; display:block;">VỊ TRÍ GHẾ</small>
                            <strong style="color:#00f0ff; font-size:1.15rem; font-family:var(--font-mono);">${t.ghe.join(', ')}</strong>
                        </div>
                        <div>
                            <small style="color:#94a3b8; font-size:0.7rem; display:block;">TỔNG TIỀN</small>
                            <strong style="color:#f59e0b; font-size:1.15rem; font-family:var(--font-mono);">${(t.tongTien || 0).toLocaleString()} đ</strong>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; color:#64748b;">${t.combo} • Ngày đặt: ${t.ngayDat}</span>
                        <button class="btn-print-ticket" onclick="window.print()">🖨 In Vé Cứng</button>
                    </div>
                </div>

                <!-- Vạch răng cưa xé vé -->
                <div class="ticket-tear-line">
                    <div class="ticket-notch-dash"></div>
                </div>

                <!-- Cuống vé (Stub) -->
                <div class="ticket-stub-part">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=${t.maVe}" alt="QR" style="border-radius:6px; background:#fff; padding:4px;">
                    <div style="font-size:0.65rem; color:#64748b; font-family:var(--font-mono);">SOÁT VÉ QR</div>
                    <div style="font-size:0.7rem; font-weight:800; color:#34d399;">✔ ĐÃ XÁC THỰC</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

// ==========================================
// TAB 5: PHÒNG LAB TRANH CHẤP DỮ LIỆU SQL
// ==========================================
function initLabEvents() {
    const toggleFix = document.getElementById('toggleFix');
    const labelLoi = document.getElementById('labelLoi');
    const labelKhacPhuc = document.getElementById('labelKhacPhuc');
    const conflictBtns = document.querySelectorAll('.conflict-btn');
    const btnRunSimulation = document.getElementById('btnRunSimulation');
    const btnClearLog = document.getElementById('btnClearLog');

    if (toggleFix) {
        toggleFix.addEventListener('change', () => {
            appState.isFixed = toggleFix.checked;
            labelLoi.classList.toggle('active', !appState.isFixed);
            labelKhacPhuc.classList.toggle('active', appState.isFixed);
            updateConflictView();
        });
    }

    conflictBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            conflictBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.currentConflictId = Number(btn.getAttribute('data-id'));
            updateConflictView();
        });
    });

    if (btnRunSimulation) btnRunSimulation.addEventListener('click', runSimulation);
    if (btnClearLog) btnClearLog.addEventListener('click', () => document.getElementById('logStream').innerHTML = '');
}

function updateConflictView() {
    const info = CONFLICT_INFO[appState.currentConflictId];
    if (!info) return;

    document.getElementById('conflictTitle').innerText = info.title;
    document.getElementById('conflictDesc').innerHTML = appState.isFixed ? info.descFixed : info.descError;
    const badge = document.getElementById('techBadge');
    badge.innerText = appState.isFixed ? info.techFixed : info.techError;
    badge.style.color = appState.isFixed ? '#34d399' : '#f87171';

    document.getElementById('academicContent').innerHTML = `
        <div class="academic-col">
            <h4>🔴 Trường Hợp Chưa Khắc Phục (Gây Lỗi)</h4>
            <p style="font-size: 0.82rem; color: #94a3b8; margin-bottom: 8px;">${info.descError}</p>
            <pre><code>${escapeHtml(info.sqlError)}</code></pre>
        </div>
        <div class="academic-col">
            <h4>🟢 Cơ Chế Đã Khắc Phục (An Toàn)</h4>
            <p style="font-size: 0.82rem; color: #94a3b8; margin-bottom: 8px;">${info.descFixed}</p>
            <pre><code>${escapeHtml(info.sqlFixed)}</code></pre>
        </div>
    `;
}

function renderSeatsLab(seats, activeLocks = {}) {
    const grid = document.getElementById('seatGridLab');
    if (!grid) return;

    grid.innerHTML = seats.map(s => {
        let cls = 'seat available';
        if (s.trangThai === 'Đã Đặt') cls = 'seat booked';
        else if (s.trangThai === 'Đang giao dịch' || s.trangThai === 'Đang Giữ') cls = 'seat holding';
        if (s.loai === 'VIP') cls += ' vip-border';

        const lockInfo = activeLocks[s.soGhe];
        let lockBadgeHtml = '';
        if (lockInfo) {
            lockBadgeHtml = `<span class="seat-lock-badge ${lockInfo.badgeClass}">${lockInfo.text}</span>`;
            if (lockInfo.holding) cls += ' holding';
        }

        return `
            <div class="${cls}">
                ${lockBadgeHtml}
                <span class="seat-name">${s.soGhe}</span>
                <span class="seat-type">${s.loai}</span>
            </div>
        `;
    }).join('');
}

// Chạy mô phỏng tranh chấp đồng thời
async function runSimulation() {
    if (appState.isRunningConflict) return;
    appState.isRunningConflict = true;

    const btnRun = document.getElementById('btnRunSimulation');
    const indicator = document.getElementById('runningIndicator');
    btnRun.disabled = true;
    indicator.style.display = 'inline';

    const statusA = document.getElementById('clientStatusA');
    const statusB = document.getElementById('clientStatusB');
    statusA.innerHTML = '<span style="color:#f59e0b">⏳ Đang chạy Transaction 1...</span>';
    statusB.innerHTML = '<span style="color:#f59e0b">⏳ Đang chạy Transaction 2...</span>';

    appendLog(new Date().toLocaleTimeString('vi-VN'), 'SYSTEM', `--- BẮT ĐẦU MÔ PHỎNG TRANH CHẤP #${appState.currentConflictId} (${appState.isFixed ? 'ĐÃ KHẮC PHỤC' : 'CHƯA KHẮC PHỤC'}) ---`, 'info');

    try {
        const res = await fetch('/api/run-conflict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conflictId: appState.currentConflictId,
                isFixed: appState.isFixed
            })
        });
        const data = await res.json();

        if (data.success) {
            const activeLocks = {};
            for (let i = 0; i < data.logs.length; i++) {
                const log = data.logs[i];
                await new Promise(r => setTimeout(r, 450));
                appendLog(log.time, log.tag, log.message, log.level);

                if (log.tag.includes('T1')) statusA.innerText = log.message;
                else if (log.tag.includes('T2')) statusB.innerText = log.message;

                // Visualizer huy hiệu khóa CSDL trực quan trên ghế (Chất riêng CineMax)
                const msg = log.message;
                if (msg.includes('UPDLOCK')) {
                    activeLocks['B01'] = { text: 'U-LOCK', badgeClass: 'lock-updlock', holding: true };
                } else if (msg.includes('X-Lock') || msg.includes('khóa Độc quyền')) {
                    if (msg.includes('B01')) activeLocks['B01'] = { text: 'X-LOCK', badgeClass: 'lock-xlock', holding: true };
                    if (msg.includes('A01')) activeLocks['A01'] = { text: 'X-LOCK', badgeClass: 'lock-xlock', holding: true };
                    if (msg.includes('A02')) activeLocks['A02'] = { text: 'X-LOCK', badgeClass: 'lock-xlock', holding: true };
                } else if (msg.includes('SERIALIZABLE') || msg.includes('Range Lock')) {
                    activeLocks['B01'] = { text: 'RANGE-LOCK', badgeClass: 'lock-range' };
                    activeLocks['B02'] = { text: 'RANGE-LOCK', badgeClass: 'lock-range' };
                    activeLocks['B03'] = { text: 'RANGE-LOCK', badgeClass: 'lock-range' };
                } else if (msg.includes('DEADLOCK') || msg.includes('1205')) {
                    activeLocks['A01'] = { text: 'DEADLOCK 💥', badgeClass: 'lock-deadlock', holding: true };
                    activeLocks['A02'] = { text: 'VICTIM ❌', badgeClass: 'lock-deadlock', holding: true };
                } else if (msg.includes('REPEATABLE READ') || msg.includes('S-Lock')) {
                    activeLocks['B01'] = { text: 'S-LOCK', badgeClass: 'lock-slock' };
                }
                renderSeatsLab(appState.seats, activeLocks);

                // Phát âm thanh cảnh báo chất riêng
                if (log.message.includes('DEADLOCK') || log.message.includes('1205')) {
                    playAudioFx('deadlock');
                } else if (log.message.includes('BLOCK') || log.message.includes('khóa')) {
                    playAudioFx('lock');
                }
            }

            appState.seats = data.dbState.seats;
            renderSeatsLab(appState.seats);
            renderCinemaSeats();

            if (appState.isFixed) playAudioFx('success');

            statusA.innerHTML = '<span style="color:#10b981">✔ Hoàn tất</span>';
            statusB.innerHTML = appState.isFixed 
                ? '<span style="color:#10b981">✔ Hoàn tất (An toàn)</span>' 
                : '<span style="color:#ef4444">✘ Kết thúc giao dịch lỗi</span>';
        }
    } catch (e) {
        appendLog(new Date().toLocaleTimeString('vi-VN'), 'LỖI', e.message, 'danger');
    } finally {
        appState.isRunningConflict = false;
        btnRun.disabled = false;
        indicator.style.display = 'none';
    }
}

async function resetDb() {
    try {
        const res = await fetch('/api/reset', { method: 'POST' });
        const data = await res.json();
        showToast(data.message, 'success');
        await loadInitialData();
    } catch (e) {
        console.error(e);
    }
}

function appendLog(time, tag, msg, level = 'info') {
    const stream = document.getElementById('logStream');
    if (!stream) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    entry.innerHTML = `<span class="time">[${time}] <strong>${tag}:</strong></span> <span>${escapeHtml(msg)}</span>`;
    stream.appendChild(entry);
    stream.scrollTop = stream.scrollHeight;
}

// ==========================================
// AUTHENTICATION (ĐĂNG KÝ / ĐĂNG NHẬP)
// ==========================================
function openAuthModal(mode = 'login') {
    document.getElementById('authModal').style.display = 'flex';
    switchAuthTab(mode);
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function switchAuthTab(mode) {
    const isLogin = mode === 'login';
    document.getElementById('tabBtnLogin').classList.toggle('active', isLogin);
    document.getElementById('tabBtnRegister').classList.toggle('active', !isLogin);
    document.getElementById('formLogin').style.display = isLogin ? 'flex' : 'none';
    document.getElementById('formRegister').style.display = isLogin ? 'none' : 'flex';
}

function fillLogin(email, pass) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = pass;
}

async function handleLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const matKhau = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, matKhau })
        });
        const data = await res.json();

        if (data.success) {
            appState.currentUser = data.user;
            updateNavUserUI();
            closeAuthModal();
            showToast(`Chào mừng trở lại, ${data.user.hoTen}!`, 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleRegisterForm(e) {
    e.preventDefault();
    const hoTen = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const sdt = document.getElementById('regPhone').value;
    const matKhau = document.getElementById('regPassword').value;

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hoTen, email, sdt, matKhau })
        });
        const data = await res.json();

        if (data.success) {
            appState.currentUser = data.user;
            updateNavUserUI();
            closeAuthModal();
            showToast(data.message, 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function quickLogin(email, matKhau) {
    document.querySelectorAll('.btn-quick-tag').forEach(b => b.classList.remove('active'));
    if (email.includes('a.nguyen')) document.getElementById('btnQuickA').classList.add('active');
    else if (email.includes('b.tran')) document.getElementById('btnQuickB').classList.add('active');
    else if (email.includes('staff')) document.getElementById('btnQuickStaff').classList.add('active');
    else if (email.includes('admin')) document.getElementById('btnQuickAdmin').classList.add('active');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, matKhau })
        });
        const data = await res.json();
        if (data.success) {
            appState.currentUser = data.user;
            updateNavUserUI();
            updateCheckoutSummary();
        }
    } catch (e) {
        console.error(e);
    }
}

function updateNavUserUI() {
    const guestBox = document.getElementById('navGuestBox');
    const userBox = document.getElementById('navUserBox');
    const linkStaff = document.getElementById('navLinkStaff');
    const linkAdmin = document.getElementById('navLinkAdmin');
    const roleBadge = document.getElementById('navRoleBadge');

    if (appState.currentUser) {
        guestBox.style.display = 'none';
        userBox.style.display = 'flex';
        document.getElementById('navName').innerText = appState.currentUser.hoTen;
        document.getElementById('navAvatar').innerText = appState.currentUser.hoTen.charAt(0).toUpperCase();

        // Cập nhật phân quyền Menu điều hướng
        const role = appState.currentUser.vaiTro;
        if (role === 'Admin') {
            roleBadge.innerHTML = `<span class="badge-role Admin">👑 Quản Trị Viên</span>`;
            if (linkStaff) linkStaff.style.display = 'inline-flex';
            if (linkAdmin) linkAdmin.style.display = 'inline-flex';
        } else if (role === 'NhanVien') {
            roleBadge.innerHTML = `<span class="badge-role NhanVien">🎫 Nhân Viên Rạp</span>`;
            if (linkStaff) linkStaff.style.display = 'inline-flex';
            if (linkAdmin) linkAdmin.style.display = 'none';
        } else {
            roleBadge.innerHTML = `<span class="badge-role KhachHang">⭐ ${appState.currentUser.diem} điểm</span>`;
            if (linkStaff) linkStaff.style.display = 'none';
            if (linkAdmin) linkAdmin.style.display = 'none';
        }
    } else {
        guestBox.style.display = 'block';
        userBox.style.display = 'none';
        if (linkStaff) linkStaff.style.display = 'none';
        if (linkAdmin) linkAdmin.style.display = 'none';
    }
}

// ==========================================
// CÁC HÀM DÀNH CHO NHÂN VIÊN (STAFF)
// ==========================================
async function loadStaffTickets() {
    const tbody = document.getElementById('staffTicketsTbody');
    if (!tbody || !appState.currentUser) return;

    try {
        const res = await fetch(`/api/staff/tickets-today?userId=${appState.currentUser.id}`);
        const data = await res.json();

        if (data.success) {
            tbody.innerHTML = data.tickets.map(t => `
                <tr>
                    <td><strong style="color:var(--gold); font-family:var(--font-mono);">${t.maVe}</strong></td>
                    <td>${t.tenPhim}</td>
                    <td>${t.suatChieu}</td>
                    <td><strong style="color:#38bdf8;">${t.ghe.join(', ')}</strong></td>
                    <td>${(t.tongTien || 0).toLocaleString()} đ</td>
                    <td>
                        <span class="${t.trangThai.includes('Đã Soát') ? 'ticket-status' : 'tag-age'}">
                            ${t.trangThai}
                        </span>
                    </td>
                    <td>
                        ${t.trangThai.includes('Đã Soát') 
                            ? `<span style="color:#64748b; font-size:0.75rem;">Đã Check-in</span>` 
                            : `<button class="btn btn-primary btn-xs" onclick="quickCheckIn('${t.maVe}')">Soát Vé</button>`
                        }
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

async function handleScanTicket() {
    const input = document.getElementById('inputScanCode');
    const code = input.value.trim().toUpperCase();
    if (!code) {
        showToast('Vui lòng nhập mã vé cần soát!', 'error');
        return;
    }

    try {
        const res = await fetch('/api/staff/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketCode: code, userId: appState.currentUser.id })
        });
        const data = await res.json();

        const box = document.getElementById('scanResultBox');
        box.style.display = 'block';

        if (data.success) {
            showToast(data.message, 'success');
            box.style.borderColor = '#10b981';
            box.style.background = 'rgba(16, 185, 129, 0.1)';
            box.style.color = '#6ee7b7';
            box.innerHTML = `
                <strong>✔ SOÁT VÉ THÀNH CÔNG!</strong><br>
                Mã vé: <strong>${data.ticket.maVe}</strong> | Phim: <strong>${data.ticket.tenPhim}</strong><br>
                Phòng chiếu: <strong>${data.ticket.phongChieu}</strong> | Ghế ngồi: <strong>${data.ticket.ghe.join(', ')}</strong><br>
                <small>Nhân viên soát vé: ${data.ticket.nhanVienSoat} lúc ${data.ticket.thoiGianSoatVe}</small>
            `;
            loadStaffTickets();
        } else {
            showToast(data.message, 'error');
            box.style.borderColor = '#ef4444';
            box.style.background = 'rgba(239, 68, 68, 0.1)';
            box.style.color = '#fca5a5';
            box.innerHTML = `<strong>✘ SOÁT VÉ THẤT BẠI:</strong> ${data.message}`;
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function quickCheckIn(code) {
    document.getElementById('inputScanCode').value = code;
    handleScanTicket();
}

// ==========================================
// CÁC HÀM DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)
// ==========================================
async function loadAdminData() {
    if (!appState.currentUser || appState.currentUser.vaiTro !== 'Admin') return;

    try {
        // 1. Load Stats
        const resStats = await fetch(`/api/admin/stats?userId=${appState.currentUser.id}`);
        const dataStats = await resStats.json();
        if (dataStats.success) {
            const s = dataStats.stats;
            document.getElementById('kpiRevenue').innerText = s.totalRevenue.toLocaleString() + ' đ';
            document.getElementById('kpiTickets').innerText = s.totalTickets + ' vé';
            document.getElementById('kpiOccupancy').innerText = s.occupancyRate + '%';
            document.getElementById('kpiSeatsText').innerText = `${s.bookedSeatsCount} / ${s.totalSeats} ghế`;
            document.getElementById('kpiUsers').innerText = s.userCount + ' tài khoản';
        }

        // 2. Load Users for RBAC Table
        const resUsers = await fetch(`/api/admin/users?userId=${appState.currentUser.id}`);
        const dataUsers = await resUsers.json();
        if (dataUsers.success) {
            const tbody = document.getElementById('adminUsersTbody');
            tbody.innerHTML = dataUsers.users.map(u => `
                <tr>
                    <td>#${u.id}</td>
                    <td><strong>${u.hoTen}</strong></td>
                    <td>${u.email}</td>
                    <td>${u.sdt}</td>
                    <td>${u.diem} đ</td>
                    <td>
                        <span class="badge-role ${u.vaiTro}">${u.vaiTro}</span>
                    </td>
                    <td>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <select id="roleSelect_${u.id}" class="form-select" style="padding:4px 8px; font-size:0.75rem;">
                                <option value="KhachHang" ${u.vaiTro === 'KhachHang' ? 'selected' : ''}>Khách Hàng</option>
                                <option value="NhanVien" ${u.vaiTro === 'NhanVien' ? 'selected' : ''}>Nhân Viên</option>
                                <option value="Admin" ${u.vaiTro === 'Admin' ? 'selected' : ''}>Quản Trị Viên (Admin)</option>
                            </select>
                            <button class="btn btn-outline btn-xs" onclick="handleAdminChangeRole(${u.id})">Lưu</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

async function handleAdminChangeRole(targetUserId) {
    if (!appState.currentUser || appState.currentUser.vaiTro !== 'Admin') {
        playAudioFx('lock');
        showToast('Từ chối truy cập 403: Bạn không phải Quản Trị Viên (Admin)!', 'error');
        return;
    }

    const select = document.getElementById(`roleSelect_${targetUserId}`);
    const newRole = select.value;

    const adminPin = prompt(`🔐 XÁC THỰC BẢO MẬT QUẢN TRỊ VIÊN (ADMIN MASTER PIN):\n\nBạn đang phân quyền cho tài khoản ID #${targetUserId} thành [${newRole}].\nVui lòng nhập Mã PIN Bảo Mật Quản Trị Tối Cao để thực thi:\n(Gợi ý PIN mặc định: 8888)`);

    if (adminPin === null) return; // Người dùng ấn Hủy
    if (!adminPin.trim()) {
        showToast('Thao tác bị hủy: Vui lòng nhập mã PIN bảo mật quản trị!', 'error');
        return;
    }

    try {
        const res = await fetch('/api/admin/change-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adminId: appState.currentUser.id,
                targetUserId,
                newRole,
                adminPin: adminPin.trim()
            })
        });
        const data = await res.json();

        if (data.success) {
            playAudioFx('success');
            showToast(data.message, 'success');
            loadAdminData();
        } else {
            playAudioFx('lock');
            showToast(data.message, 'error');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function handleAdminUpdatePrice() {
    const newPrice = document.getElementById('adminNewPrice').value;
    if (!newPrice || Number(newPrice) <= 0) {
        showToast('Vui lòng nhập giá vé hợp lệ!', 'error');
        return;
    }

    try {
        const res = await fetch('/api/admin/update-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: appState.currentUser.id, newPrice })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            loadInitialData();
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function handleAdminAddVipSeat() {
    try {
        const res = await fetch('/api/admin/add-vip-seat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminId: appState.currentUser.id })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            loadInitialData();
            loadAdminData();
        } else {
            showToast(data.message, 'error');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function handleLogout() {
    appState.currentUser = null;
    updateNavUserUI();
    document.querySelectorAll('.btn-quick-tag').forEach(b => b.classList.remove('active'));
    showToast('Đã đăng xuất tài khoản!', 'success');
    updateCheckoutSummary();
}

// Modal Trailer
function openTrailerModal() {
    document.getElementById('trailerModal').style.display = 'flex';
}
function closeTrailerModal() {
    document.getElementById('trailerModal').style.display = 'none';
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.innerText = message;
    toast.className = `toast-box show ${type}`;
    setTimeout(() => {
        toast.className = 'toast-box';
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
