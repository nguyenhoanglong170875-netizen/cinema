// ====================================================================
// CINEMAX PREMIER - WEB SERVER HỆ THỐNG RẠP CHIẾU PHIM CHUẨN QUỐC TẾ
// Tích hợp Phòng Lab Mô Phỏng & Xử Lý 5 Tranh Chấp Dữ Liệu SQL Server
// ====================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Danh sách phim đang chiếu & sắp chiếu chuẩn thương mại
const MOVIES = [
    {
        id: 1,
        tenPhim: 'Avatar: Dòng Chảy Của Nước',
        tenGoc: 'Avatar: The Way of Water',
        thoiLuong: 192,
        theLoai: 'Khoa Học Viễn Tưởng, Hành Động, Phiêu Lưu',
        doTuoi: 'C13 - Khán giả từ 13 tuổi trở lên',
        diemIMDb: '8.9/10',
        daoDien: 'James Cameron',
        dienVien: 'Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang',
        banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&auto=format&fit=crop&q=85',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=85',
        moTa: 'Lấy bối cảnh hơn một thập kỷ sau các sự kiện của phần phim đầu tiên, gia đình Sully phải đối mặt với những bi kịch tàn khốc và cuộc chiến sinh tồn bảo vệ đại dương kỳ vĩ của hành tinh Pandora trước sự xâm lược tàn bạo của người Trái Đất.',
        status: 'now_showing',
        ngayKhoiChieu: '14/11/2026',
        trailerId: 'd9MyW72ELq0',
        dinhDang: ['IMAX 3D Laser', 'Dolby Atmos', '4DX', 'ScreenX'],
        suatChieu: ['10:00', '13:30', '16:45', '19:30', '22:15'],
        reviews: [
            { user: 'Hoàng Long (Reviewer)', rating: 5, comment: 'Đỉnh cao kỹ xảo IMAX 3D thế kỷ 21, hình ảnh đại dương Pandora đẹp nghẹt thở!' },
            { user: 'Minh Thảo', rating: 5, comment: 'Âm thanh Dolby Atmos tại CineMax làm rung chuyển cả ghế ngồi, siêu mãn nhãn!' }
        ]
    },
    {
        id: 2,
        tenPhim: 'Oppenheimer',
        tenGoc: 'Oppenheimer: The Father of Atomic Bomb',
        thoiLuong: 180,
        theLoai: 'Lịch Sử, Tiểu Sử, Tâm Lý, Chính Kịch',
        doTuoi: 'C18 - Khán giả từ 18 tuổi trở lên',
        diemIMDb: '9.2/10',
        daoDien: 'Christopher Nolan',
        dienVien: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
        banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1920&auto=format&fit=crop&q=85',
        poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=85',
        moTa: 'Tác phẩm đoạt 7 giải Oscar của đạo diễn Christopher Nolan tái hiện cuộc đời đầy giằng xé của nhà vật lý lý thuyết J. Robert Oppenheimer - người đứng đầu Dự án Manhattan khai sinh vũ khí hạt nhân định hình vận mệnh nhân loại.',
        status: 'now_showing',
        ngayKhoiChieu: '10/11/2026',
        trailerId: 'uYPbbksJxIg',
        dinhDang: ['IMAX 70mm Laser', 'Dolby Atmos', '2D Phụ Đề'],
        suatChieu: ['11:00', '14:30', '18:00', '21:15'],
        reviews: [
            { user: 'Trần Đăng', rating: 5, comment: 'Một kiệt tác điện ảnh không thể bỏ lỡ! Phân cảnh thử nghiệm bom Trinity nghẹt thở tuyệt đối.' }
        ]
    },
    {
        id: 3,
        tenPhim: 'Dune: Hành Tinh Cát - Phần 2',
        tenGoc: 'Dune: Part Two',
        thoiLuong: 166,
        theLoai: 'Hành Động, Viễn Tưởng, Sử Thi, Phiêu Lưu',
        doTuoi: 'C16 - Khán giả từ 16 tuổi trở lên',
        diemIMDb: '9.0/10',
        daoDien: 'Denis Villeneuve',
        dienVien: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Austin Butler',
        banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1920&auto=format&fit=crop&q=85',
        poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&auto=format&fit=crop&q=85',
        moTa: 'Paul Atreides liên minh cùng Chani và tộc người Fremen để trả thù đế chế tàn bạo đã hủy diệt gia tộc mình, đồng thời đối diện với viễn cảnh định mệnh có thể đẩy vũ trụ vào cuộc thánh chiến vĩ đại.',
        status: 'now_showing',
        ngayKhoiChieu: '12/11/2026',
        trailerId: 'Way9Dexny3w',
        dinhDang: ['IMAX Laser 4K', 'Dolby Atmos', 'Sweetbox'],
        suatChieu: ['10:30', '14:00', '17:30', '20:45'],
        reviews: [
            { user: 'Thành Nam', rating: 5, comment: 'Phần 2 nâng tầm điện ảnh khoa học viễn tưởng lên một đẳng cấp vũ trụ mới!' }
        ]
    },
    {
        id: 4,
        tenPhim: 'Deadpool & Wolverine',
        tenGoc: 'Deadpool & Wolverine: Multiverse Chaos',
        thoiLuong: 128,
        theLoai: 'Hành Động, Hài Hước, Siêu Anh Hùng, Viễn Tưởng',
        doTuoi: 'C18 - Khán giả từ 18 tuổi trở lên',
        diemIMDb: '8.8/10',
        daoDien: 'Shawn Levy',
        dienVien: 'Ryan Reynolds, Hugh Jackman, Emma Corrin, Matthew Macfadyen',
        banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&auto=format&fit=crop&q=85',
        poster: 'https://images.unsplash.com/photo-1568876694728-451bbf694b83?w=800&auto=format&fit=crop&q=85',
        moTa: 'Tổ chức TVA lôi kéo Wade Wilson vào nhiệm vụ cứu vãn đa vũ trụ, buộc anh phải hợp tác cùng một Wolverine suy sụp để đối đầu với mối hiểm họa diệt vong mang tên Cassandra Nova.',
        status: 'now_showing',
        ngayKhoiChieu: '08/11/2026',
        trailerId: '73_1biulkYk',
        dinhDang: ['IMAX 3D', '4DX', '2D Lồng Tiếng'],
        suatChieu: ['12:15', '15:45', '18:30', '21:45'],
        reviews: [
            { user: 'Vũ Phong', rating: 5, comment: 'Cười đau bụng từ đầu đến cuối, màn cameo đỉnh nóc kịch trần!' }
        ]
    },
    {
        id: 5,
        tenPhim: 'Spider-Man: Du Hành Vũ Trụ Nhện',
        tenGoc: 'Spider-Man: Across the Spider-Verse',
        thoiLuong: 140,
        theLoai: 'Hoạt Hình, Hành Động, Phiêu Lưu, Siêu Anh Hùng',
        doTuoi: 'P - Dành cho mọi độ tuổi',
        diemIMDb: '8.9/10',
        daoDien: 'Joaquim Dos Santos, Kemp Powers',
        dienVien: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac, Daniel Kaluuya',
        banner: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1920&auto=format&fit=crop&q=85',
        poster: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fc8436?w=800&auto=format&fit=crop&q=85',
        moTa: 'Miles Morales du hành xuyên đa vũ trụ Nhện và chạm trán với Liên minh Người Nhện do Miguel O’Hara lãnh đạo. Một cuộc xung đột dữ dội nổ ra khi Miles quyết định phá vỡ quy luật số phận để cứu người thân.',
        status: 'coming_soon',
        ngayKhoiChieu: '28/11/2026',
        trailerId: 'shW9i6k8cB0',
        dinhDang: ['IMAX 2D', 'Dolby Vision', '2D Lồng Tiếng'],
        suatChieu: ['13:00', '16:00', '19:00'],
        reviews: []
    },
    {
        id: 6,
        tenPhim: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc',
        tenGoc: 'Inside Out 2',
        thoiLuong: 96,
        theLoai: 'Hoạt Hình, Gia Đình, Hài Hước, Tâm Lý',
        doTuoi: 'P - Phim dành cho mọi gia đình',
        diemIMDb: '8.7/10',
        daoDien: 'Kelsey Mann',
        dienVien: 'Amy Poehler, Maya Hawke, Phyllis Smith, Lewis Black',
        banner: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1920&auto=format&fit=crop&q=85',
        poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=85',
        moTa: 'Bước vào tuổi dậy thì, trụ sở cảm xúc của Riley rung chuyển bởi sự xuất hiện của những nhân vật cảm xúc mới toanh: Lo Âu (Anxiety), Ganh Tị (Envy), Ngượng Ngùng (Embarrassment) và Chán Nản (Ennui).',
        status: 'coming_soon',
        ngayKhoiChieu: '05/12/2026',
        trailerId: 'LEjhY15eCx0',
        dinhDang: ['2D Lồng Tiếng', '2D Phụ Đề', 'Starium'],
        suatChieu: ['09:30', '11:45', '14:15', '16:30'],
        reviews: []
    },
    {
        id: 7,
        tenPhim: 'Godzilla x Kong: Đế Chế Mới',
        tenGoc: 'Godzilla x Kong: The New Empire',
        thoiLuong: 115,
        theLoai: 'Quái Thú, Hành Động, Viễn Tưởng',
        doTuoi: 'C13 - Dành cho khán giả từ 13 tuổi trở lên',
        diemIMDb: '8.4/10',
        daoDien: 'Adam Wingard',
        dienVien: 'Rebecca Hall, Brian Tyree Henry, Dan Stevens, Kaylee Hottle',
        banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&auto=format&fit=crop&q=85',
        poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=85',
        moTa: 'Hai siêu quái thú Kong và Godzilla buộc phải gác lại mối thù truyền kiếp để hợp lực chống lại vị vua Skar King độc ác ẩn sâu trong lòng Trái Đất Rỗng, kẻ đe dọa sự sống còn của toàn nhân loại.',
        status: 'coming_soon',
        ngayKhoiChieu: '15/12/2026',
        trailerId: 'qqrpMRDuPfc',
        dinhDang: ['IMAX 3D Laser', 'ScreenX 270°', '4DX'],
        suatChieu: ['14:00', '17:00', '20:00'],
        reviews: []
    },
    {
        id: 8,
        tenPhim: 'Joker: Điên Có Đôi',
        tenGoc: 'Joker: Folie à Deux',
        thoiLuong: 138,
        theLoai: 'Tâm Lý, Tội Phạm, Âm Nhạc, Giật Gân',
        doTuoi: 'C18 - Khán giả từ 18 tuổi trở lên',
        diemIMDb: '8.6/10',
        daoDien: 'Todd Phillips',
        dienVien: 'Joaquin Phoenix, Lady Gaga, Brendan Gleeson, Catherine Keener',
        banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1920&auto=format&fit=crop&q=85',
        poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=85',
        moTa: 'Arthur Fleck bị giam giữ tại Viện Tâm thần Arkham để chờ xét xử cho những tội ác của Joker. Tại đây, anh gặp gỡ tình yêu định mệnh Harley Quinn và tìm thấy bản giao hưởng điên loạn bên trong tâm trí.',
        status: 'coming_soon',
        ngayKhoiChieu: '22/12/2026',
        trailerId: 'pBk4NYhWNMM',
        dinhDang: ['IMAX Laser 70mm', 'Dolby Atmos'],
        suatChieu: ['18:30', '21:30'],
        reviews: []
    }
];

// Danh sách Cụm Rạp Chiếu Phim Cao Cấp
const CINEMAS = [
    { id: 1, ten: 'CineMax Landmark 81 (IMAX Laser & VIP Lounge)', diaChi: 'Tầng B1, Vincom Landmark 81, Bình Thạnh, TP.HCM', hotline: '1900 6017', phong: ['Phòng 01 (IMAX Laser)', 'Phòng 02 (Gold Class VIP)', 'Phòng 03 (Dolby Atmos)'] },
    { id: 2, ten: 'CineMax Saigon Centre (Sweetbox Luxury)', diaChi: 'Tầng 5, Saigon Centre, 65 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', hotline: '1900 6018', phong: ['Phòng 01 (Dolby Atmos)', 'Phòng 02 (Sweetbox Couple)'] },
    { id: 3, ten: 'CineMax Crescent Mall (Laser 4K & Starium)', diaChi: 'Tầng 5, Crescent Mall, Nguyễn Văn Linh, Tân Phú, Quận 7, TP.HCM', hotline: '1900 6019', phong: ['Phòng 01 (Starium Screen)', 'Phòng 02 (Laser 4K)'] },
    { id: 4, ten: 'CineMax Lotte Tây Hồ (IMAX 3D Laser)', diaChi: 'Tầng 4, Lotte Mall Tây Hồ, 272 Võ Chí Công, Tây Hồ, Hà Nội', hotline: '1900 6020', phong: ['Phòng 01 (IMAX Laser)', 'Phòng 02 (ScreenX 270°)'] }
];

// Danh sách Khuyến Mãi Đặc Quyền
const PROMOTIONS = [
    { id: 1, tieuDe: 'Thứ Tư Vui Vẻ - Vé Đồng Giá 65K', moTa: 'Áp dụng cho mọi suất chiếu 2D vào Thứ Tư hàng tuần trên toàn hệ thống CineMax.', code: 'HAPPYWED', discount: 'Đồng giá 65K', tag: 'HOT DEAL', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80' },
    { id: 2, tieuDe: 'Học Sinh - Sinh Viên & U22: Giá Vé 55K', moTa: 'Xuất trình thẻ HSSV hoặc CCCD dưới 22 tuổi nhận ngay vé xem phim chỉ 55.000 đ.', code: 'STUDENT', discount: 'Giảm 15%', tag: 'HSSV', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80' },
    { id: 3, tieuDe: 'Đặc Quyền Thành Viên VIP: Tích 10% Điểm', moTa: 'Nhận ngay 100 điểm khi đăng ký, đổi bắp nước và nâng cấp hạng ghế miễn phí.', code: 'CINEMAXVIP', discount: 'Giảm 20%', tag: 'VIP MEMBER', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80' },
    { id: 4, tieuDe: 'Combo Couple Tình Nhân Tiết Kiệm 30%', moTa: 'Mua 2 vé ghế đôi Sweetbox kèm 1 bắp khổng lồ + 2 nước ngọt cỡ đại.', code: 'COUPLE30', discount: 'Tiết kiệm 30%', tag: 'SWEETBOX', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80' }
];

// Danh sách Combo Bắp Nước
const COMBOS = [
    { id: 1, ten: 'Combo Bắp Nước Solo', gia: 75000, moTa: '1 Bắp rang bơ thơm lừng (Vị ngọt/phô mai) + 1 Nước ngọt cỡ vừa (Pepsi/Coke/7Up)' },
    { id: 2, ten: 'Combo Couple Tình Nhân', gia: 105000, moTa: '1 Bắp rang bơ cỡ lớn + 2 Nước ngọt cỡ lớn' },
    { id: 3, ten: 'Combo Gia Đình Family', gia: 175000, moTa: '2 Bắp rang bơ cỡ lớn + 4 Nước ngọt cỡ lớn + 1 Snack khoai tây' }
];

// Trạng thái ghế mẫu ban đầu
function getInitialSeats() {
    return [
        { id: 1, soGhe: 'A01', loai: 'Thường', trangThai: 'Trống', gia: 90000, maKH: null, thoiGianDat: null },
        { id: 2, soGhe: 'A02', loai: 'Thường', trangThai: 'Trống', gia: 90000, maKH: null, thoiGianDat: null },
        { id: 3, soGhe: 'A03', loai: 'Thường', trangThai: 'Trống', gia: 90000, maKH: null, thoiGianDat: null },
        { id: 4, soGhe: 'B01', loai: 'VIP',    trangThai: 'Trống', gia: 110000, maKH: null, thoiGianDat: null },
        { id: 5, soGhe: 'B02', loai: 'VIP',    trangThai: 'Trống', gia: 110000, maKH: null, thoiGianDat: null },
        { id: 6, soGhe: 'B03', loai: 'VIP',    trangThai: 'Trống', gia: 110000, maKH: null, thoiGianDat: null },
        { id: 7, soGhe: 'C01', loai: 'Sweetbox', trangThai: 'Trống', gia: 160000, maKH: null, thoiGianDat: null },
        { id: 8, soGhe: 'C02', loai: 'Sweetbox', trangThai: 'Trống', gia: 160000, maKH: null, thoiGianDat: null }
    ];
}

let dbState = {
    suatChieu: {
        id: 1,
        phim: 'Avatar: Dòng Chảy Của Nước',
        phong: 'Phòng 01 (IMAX)',
        gioChieu: '19:30',
        giaCoBan: 90000
    },
    seats: getInitialSeats(),
    khachHang: [
        { id: 1, hoTen: 'Nguyễn Văn A', email: 'a.nguyen@email.com', matKhau: '123456', sdt: '0901234567', diem: 500, vaiTro: 'KhachHang' },
        { id: 2, hoTen: 'Trần Thị B',   email: 'b.tran@email.com',   matKhau: '123456', sdt: '0912345678', diem: 300, vaiTro: 'KhachHang' },
        { id: 3, hoTen: 'Lê Thu Ngân (Staff)', email: 'staff@cinema.vn', matKhau: 'staff123', sdt: '0988888888', diem: 200, vaiTro: 'NhanVien' },
        { id: 4, hoTen: 'Vũ Quản Trị (Admin)', email: 'admin@cinema.vn', matKhau: 'admin123', sdt: '0999999999', diem: 9999, vaiTro: 'Admin' }
    ],
    tickets: [
        {
            maVe: 'CNX-88219',
            maKH: 1,
            tenPhim: 'Avatar: Dòng Chảy Của Nước',
            phongChieu: 'Phòng 01 (IMAX)',
            suatChieu: '19:30 - Hôm nay',
            ghe: ['A03'],
            tongTien: 90000,
            combo: 'Không chọn combo',
            ngayDat: '14/11/2026 10:15',
            trangThai: 'Đã Thanh Toán'
        }
    ],
    logs: []
};

// Phục vụ file tĩnh
function serveStaticFile(reqPath, res) {
    let filePath = path.join(PUBLIC_DIR, reqPath === '/' ? 'index.html' : reqPath);
    const ext = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.jsx': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('500 Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (e) {
                resolve({});
            }
        });
    });
}

const wait = ms => new Promise(r => setTimeout(r, ms));

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ==========================================
    // API ROUTES RẠP PHIM
    // ==========================================

    // Lấy danh sách phim
    if (pathname === '/api/movies' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(MOVIES));
        return;
    }

    // Lấy danh sách cụm rạp
    if (pathname === '/api/cinemas' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(CINEMAS));
        return;
    }

    // Lấy danh sách khuyến mãi
    if (pathname === '/api/promotions' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(PROMOTIONS));
        return;
    }

    // Lấy danh sách combo bắp nước
    if (pathname === '/api/combos' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(COMBOS));
        return;
    }

    // Lấy trạng thái hiện tại (Ghế, Suất chiếu)
    if (pathname === '/api/state' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(dbState));
        return;
    }

    // Lấy lịch sử vé của 1 khách hàng
    if (pathname === '/api/user/tickets' && req.method === 'GET') {
        const userId = Number(parsedUrl.query.userId || 1);
        const userTickets = dbState.tickets.filter(t => t.maKH === userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(userTickets));
        return;
    }

    // API ĐĂNG KÝ
    if (pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await parseBody(req);
        const { hoTen, email, sdt, matKhau } = body;

        if (!hoTen || !email || !sdt || !matKhau) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Vui lòng điền đầy đủ tất cả thông tin!' }));
            return;
        }

        const existsEmail = dbState.khachHang.find(k => k.email.toLowerCase() === email.toLowerCase());
        if (existsEmail) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Email này đã được đăng ký!' }));
            return;
        }

        const existsSdt = dbState.khachHang.find(k => k.sdt === sdt);
        if (existsSdt) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Số điện thoại này đã được sử dụng!' }));
            return;
        }

        const newId = dbState.khachHang.length + 1;
        const newUser = {
            id: newId,
            hoTen,
            email,
            matKhau,
            sdt,
            diem: 100, // Tặng 100 điểm thưởng chào mừng
            vaiTro: 'KhachHang'
        };
        dbState.khachHang.push(newUser);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Đăng ký thành viên thành công! Bạn nhận được 100 điểm tích lũy.',
            user: { id: newUser.id, hoTen: newUser.hoTen, email: newUser.email, sdt: newUser.sdt, diem: newUser.diem, vaiTro: newUser.vaiTro }
        }));
        return;
    }

    // API ĐĂNG NHẬP
    if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await parseBody(req);
        const { email, matKhau } = body;

        const user = dbState.khachHang.find(k => k.email.toLowerCase() === (email || '').toLowerCase() && k.matKhau === matKhau);
        if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Email hoặc mật khẩu không chính xác!' }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Đăng nhập thành công!',
            user: { id: user.id, hoTen: user.hoTen, email: user.email, sdt: user.sdt, diem: user.diem, vaiTro: user.vaiTro }
        }));
        return;
    }

    // API ĐẶT VÉ ĐẦY ĐỦ (Full Booking Flow: Phim + Ghế + Combo + Phương Thức Thanh Toán)
    if (pathname === '/api/book-full' && req.method === 'POST') {
        const body = await parseBody(req);
        const { userId, tenPhim, suatChieu, phongChieu, seats, comboId, phuongThucTT, giamGia } = body;

        const user = dbState.khachHang.find(k => k.id === Number(userId));
        if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Vui lòng đăng nhập tài khoản để đặt vé!' }));
            return;
        }

        if (!seats || seats.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Vui lòng chọn ít nhất 1 chiếc ghế ngồi!' }));
            return;
        }

        // Kiểm tra ghế còn trống không
        for (const seatName of seats) {
            const s = dbState.seats.find(x => x.soGhe === seatName);
            if (!s || s.trangThai === 'Đã Đặt') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: `Ghế ${seatName} đã được người khác đặt trước đó!` }));
                return;
            }
        }

        // Tính tiền vé
        let seatTotal = 0;
        seats.forEach(seatName => {
            const s = dbState.seats.find(x => x.soGhe === seatName);
            s.trangThai = 'Đã Đặt';
            s.maKH = user.id;
            s.thoiGianDat = new Date().toISOString();
            seatTotal += s.gia;
        });

        // Tính tiền combo
        let comboName = 'Không chọn combo';
        let comboTotal = 0;
        if (comboId) {
            const c = COMBOS.find(x => x.id === Number(comboId));
            if (c) {
                comboName = c.ten;
                comboTotal = c.gia;
            }
        }

        const discountAmt = Math.max(0, Number(giamGia) || 0);
        const totalMoney = Math.max(0, seatTotal + comboTotal - discountAmt);
        const newTicketCode = 'CNX-' + Math.floor(10000 + Math.random() * 90000);

        const newTicket = {
            maVe: newTicketCode,
            maKH: user.id,
            tenPhim: tenPhim || dbState.suatChieu.phim,
            phongChieu: phongChieu || dbState.suatChieu.phong,
            suatChieu: (suatChieu || dbState.suatChieu.gioChieu) + ' - Hôm nay',
            ghe: seats,
            tongTien: totalMoney,
            combo: comboName,
            phuongThucTT: phuongThucTT || 'Thẻ Tín Dụng / Ghi Nợ Quốc Tế',
            ngayDat: new Date().toLocaleString('vi-VN'),
            trangThai: 'Đã Thanh Toán'
        };

        dbState.tickets.unshift(newTicket);
        user.diem += 25; // Tích 25 điểm thưởng

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: `Thanh toán thành công qua ${newTicket.phuongThucTT}! Mã vé của bạn là: ${newTicketCode}`,
            ticket: newTicket,
            user: { id: user.id, hoTen: user.hoTen, diem: user.diem, vaiTro: user.vaiTro }
        }));
        return;
    }

    // API ĐẶT VÉ TRỰC TIẾP TỪ SƠ ĐỒ GHẾ
    if (pathname === '/api/book-seat-direct' && req.method === 'POST') {
        const body = await parseBody(req);
        const { soGhe, userId } = body;

        const user = dbState.khachHang.find(k => k.id === Number(userId));
        if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Vui lòng đăng nhập trước khi đặt vé!' }));
            return;
        }

        const seat = dbState.seats.find(s => s.soGhe === soGhe);
        if (!seat) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Ghế không tồn tại!' }));
            return;
        }

        if (seat.trangThai === 'Đã Đặt') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: `Ghế ${soGhe} đã được người khác đặt trước đó!` }));
            return;
        }

        seat.trangThai = 'Đang giao dịch';
        await wait(600);

        seat.trangThai = 'Đã Đặt';
        seat.maKH = user.id;
        seat.thoiGianDat = new Date().toISOString();
        user.diem += 20;

        const ticketCode = 'CNX-' + Math.floor(10000 + Math.random() * 90000);
        dbState.tickets.unshift({
            maVe: ticketCode,
            maKH: user.id,
            tenPhim: dbState.suatChieu.phim,
            phongChieu: dbState.suatChieu.phong,
            suatChieu: dbState.suatChieu.gioChieu + ' - Hôm nay',
            ghe: [soGhe],
            tongTien: seat.gia,
            combo: 'Không chọn combo',
            ngayDat: new Date().toLocaleString('vi-VN'),
            trangThai: 'Đã Thanh Toán'
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: `Chúc mừng ${user.hoTen}! Bạn đã đặt thành công ghế ${soGhe}. Mã vé: ${ticketCode}.`,
            user: { id: user.id, hoTen: user.hoTen, diem: user.diem },
            seat
        }));
        return;
    }

    // RESET DỮ LIỆU
    if (pathname === '/api/reset' && req.method === 'POST') {
        dbState.seats = getInitialSeats();
        dbState.suatChieu.giaCoBan = 90000;
        dbState.logs = [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Đã reset lại toàn bộ dữ liệu CSDL về trạng thái ban đầu!' }));
        return;
    }

    // ==========================================
    // PHÂN HỆ PHÂN QUYỀN: STAFF & ADMIN APIS
    // ==========================================

    // Hàm kiểm tra quyền
    function checkPermission(userId, allowedRoles) {
        const u = dbState.khachHang.find(k => k.id === Number(userId));
        if (!u) return { ok: false, status: 401, error: 'Chưa đăng nhập hoặc tài khoản không tồn tại!' };
        if (!allowedRoles.includes(u.vaiTro)) {
            return { ok: false, status: 403, error: `Từ chối truy cập (403 Forbidden): Tài khoản [${u.hoTen}] thuộc vai trò [${u.vaiTro}], bạn không có quyền thực hiện chức năng này!` };
        }
        return { ok: true, user: u };
    }

    // [STAFF] Lấy tất cả vé hôm nay để soát vé
    if (pathname === '/api/staff/tickets-today' && req.method === 'GET') {
        const authHeaderUserId = parsedUrl.query.userId;
        const check = checkPermission(authHeaderUserId, ['NhanVien', 'Admin']);
        if (!check.ok) {
            res.writeHead(check.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: check.error }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, tickets: dbState.tickets }));
        return;
    }

    // [STAFF] Soát vé (Check-in mã QR / Mã vé)
    if (pathname === '/api/staff/check-in' && req.method === 'POST') {
        const body = await parseBody(req);
        const { ticketCode, userId } = body;

        const check = checkPermission(userId, ['NhanVien', 'Admin']);
        if (!check.ok) {
            res.writeHead(check.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: check.error }));
            return;
        }

        const ticket = dbState.tickets.find(t => t.maVe === ticketCode);
        if (!ticket) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: `Mã vé ${ticketCode} không tồn tại trên hệ thống!` }));
            return;
        }

        if (ticket.trangThai === 'Đã Soát Vé (Checked-in)') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: `CẢNH BÁO: Vé ${ticketCode} đã được soát vé trước đó lúc ${ticket.thoiGianSoatVe}!` }));
            return;
        }

        ticket.trangThai = 'Đã Soát Vé (Checked-in)';
        ticket.thoiGianSoatVe = new Date().toLocaleTimeString('vi-VN');
        ticket.nhanVienSoat = check.user.hoTen;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: `✔ SOÁT VÉ HỢP LỆ! Khách: ${ticket.tenPhim} - Ghế: ${ticket.ghe.join(', ')}. Chúc khách xem phim vui vẻ!`,
            ticket
        }));
        return;
    }

    // [ADMIN] Lấy danh sách tất cả tài khoản và vai trò
    if (pathname === '/api/admin/users' && req.method === 'GET') {
        const userId = parsedUrl.query.userId;
        const check = checkPermission(userId, ['Admin']);
        if (!check.ok) {
            res.writeHead(check.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: check.error }));
            return;
        }

        const safeUsers = dbState.khachHang.map(u => ({
            id: u.id,
            hoTen: u.hoTen,
            email: u.email,
            sdt: u.sdt,
            vaiTro: u.vaiTro,
            diem: u.diem
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, users: safeUsers }));
        return;
    }

    // [ADMIN] Phân quyền / Đổi vai trò tài khoản (Chỉ Admin có Mã PIN bảo mật mới được phép)
    if (pathname === '/api/admin/change-role' && req.method === 'POST') {
        const body = await parseBody(req);
        const { adminId, targetUserId, newRole, adminPin } = body;

        // 1. Kiểm tra quyền Admin
        const check = checkPermission(adminId, ['Admin']);
        if (!check.ok) {
            res.writeHead(check.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: `[NGUY HIỂM] Từ chối truy cập 403: Chỉ Quản Trị Viên (Admin) mới có thẩm quyền phân quyền người dùng!`
            }));
            return;
        }

        // 2. Xác thực Mã PIN Bảo Mật Tối Cao (Master Security PIN: 8888)
        if (adminPin !== '8888' && adminPin !== 'admin123') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Mã PIN bảo mật quản trị (Admin Security PIN) không chính xác! (Gợi ý PIN mặc định: 8888)'
            }));
            return;
        }

        const target = dbState.khachHang.find(u => u.id === Number(targetUserId));
        if (!target) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Người dùng cần phân quyền không tồn tại!' }));
            return;
        }

        const oldRole = target.vaiTro;
        target.vaiTro = newRole;

        // Ghi log nhật ký kiểm toán hệ thống (Audit Log)
        dbState.logs.push({
            time: new Date().toLocaleTimeString('vi-VN'),
            tag: 'SECURITY AUDIT',
            message: `Admin [${check.user.hoTen}] đã thay đổi vai trò của [${target.hoTen}] từ [${oldRole}] thành [${newRole}].`,
            level: 'warning'
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: `✔ XÁC THỰC THÀNH CÔNG: Đã phân quyền tài khoản [${target.hoTen}] sang vai trò: ${newRole}!`,
            user: target
        }));
        return;
    }

    // [ADMIN] Đổi giá vé cơ bản của suất chiếu (Tác nhân gây Non-Repeatable Read & Dirty Read)
    if (pathname === '/api/admin/update-price' && req.method === 'POST') {
        const body = await parseBody(req);
        const { adminId, newPrice } = body;

        const check = checkPermission(adminId, ['Admin']);
        if (!check.ok) {
            res.writeHead(check.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: check.error }));
            return;
        }

        const oldPrice = dbState.suatChieu.giaCoBan;
        dbState.suatChieu.giaCoBan = Number(newPrice);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: `Admin đã điều chỉnh giá vé suất chiếu từ ${oldPrice.toLocaleString()} đ thành ${Number(newPrice).toLocaleString()} đ!`,
            newPrice: dbState.suatChieu.giaCoBan
        }));
        return;
    }

    // [ADMIN] Thêm ghế VIP phụ (Tác nhân gây Phantom Read)
    if (pathname === '/api/admin/add-vip-seat' && req.method === 'POST') {
        const body = await parseBody(req);
        const { adminId } = body;

        const check = checkPermission(adminId, ['Admin']);
        if (!check.ok) {
            res.writeHead(check.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: check.error }));
            return;
        }

        const existingB04 = dbState.seats.find(s => s.soGhe === 'B04');
        if (existingB04) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Ghế VIP B04 đã tồn tại trong phòng chiếu rồi!' }));
            return;
        }

        const newSeat = { id: 9, soGhe: 'B04', loai: 'VIP', trangThai: 'Trống', gia: 110000, maKH: null, thoiGianDat: null };
        dbState.seats.push(newSeat);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: `Admin đã thêm ghế VIP dự phòng B04 vào Phòng 01 (IMAX)!`,
            seats: dbState.seats
        }));
        return;
    }

    // [ADMIN] Thống kê doanh thu và báo cáo hệ thống
    if (pathname === '/api/admin/stats' && req.method === 'GET') {
        const userId = parsedUrl.query.userId;
        const check = checkPermission(userId, ['Admin']);
        if (!check.ok) {
            res.writeHead(check.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: check.error }));
            return;
        }

        const totalTickets = dbState.tickets.length;
        const totalRevenue = dbState.tickets.reduce((sum, t) => sum + (t.tongTien || 0), 0);
        const bookedSeatsCount = dbState.seats.filter(s => s.trangThai === 'Đã Đặt').length;
        const totalSeats = dbState.seats.length;
        const occupancyRate = Math.round((bookedSeatsCount / totalSeats) * 100);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            stats: {
                totalTickets,
                totalRevenue,
                totalSeats,
                bookedSeatsCount,
                occupancyRate,
                userCount: dbState.khachHang.length
            }
        }));
        return;
    }

    // ==========================================
    // API PHÒNG LAB TRANH CHẤP DỮ LIỆU (5 XUNG ĐỘT)
    // ==========================================
    if (pathname === '/api/run-conflict' && req.method === 'POST') {
        const body = await parseBody(req);
        const { conflictId, isFixed } = body;
        
        const logs = [];
        // view (tuỳ chọn): trạng thái trực quan của Lab tại bước này
        //   { locks: {soGhe: {text, tone}}, seats: {soGhe: trạngThái phiên đọc được},
        //     extra: [{soGhe, loai, status, mode}], readouts: [{who, label, value, tone}] }
        const addLog = (tag, message, level = 'info', view) => {
            logs.push({
                time: new Date().toLocaleTimeString('vi-VN'),
                tag,
                message,
                level,
                view
            });
        };

        try {
            switch (Number(conflictId)) {
                // 1. LOST UPDATE
                case 1: {
                    const targetSeat = dbState.seats.find(s => s.soGhe === 'B01');
                    targetSeat.trangThai = 'Trống';
                    targetSeat.maKH = null;

                    addLog('BẮT ĐẦU', `Kịch bản Lost Update: 2 khách hàng cùng đặt ghế B01 (${isFixed ? 'ĐÃ KHẮC PHỤC với UPDLOCK' : 'CHƯA KHẮC PHỤC'})`);

                    if (!isFixed) {
                        addLog('T1 (Khách A)', 'Bước 1: SELECT TrangThai FROM Ve WHERE SoGhe="B01" -> Thấy "Trống"', 'info');
                        addLog('T2 (Khách B)', 'Bước 1: SELECT TrangThai FROM Ve WHERE SoGhe="B01" -> Thấy "Trống"', 'info');
                        addLog('HỆ THỐNG', 'Cả 2 transaction đều đọc thấy ghế còn trống (do READ COMMITTED nhả S-Lock ngay).', 'warning');
                        
                        targetSeat.trangThai = 'Đang giao dịch';
                        await wait(1000);

                        addLog('T1 (Khách A)', 'Bước 2: UPDATE Ve SET TrangThai="Đã Đặt", MaKH=1 -> Báo ĐẶT THÀNH CÔNG!', 'success');
                        targetSeat.trangThai = 'Đã Đặt';
                        targetSeat.maKH = 1;

                        await wait(800);
                        addLog('T2 (Khách B)', 'Bước 2: UPDATE Ve SET TrangThai="Đã Đặt", MaKH=2 -> Báo ĐẶT THÀNH CÔNG!', 'success');
                        targetSeat.maKH = 2;

                        addLog('KẾT QUẢ', 'LỖI LOST UPDATE XẢY RA! Cập nhật của Khách A đã bị Khách B ghi đè mất hoàn toàn!', 'danger');
                    } else {
                        addLog('T1 (Khách A)', 'Bước 1: SELECT WITH (UPDLOCK, ROWLOCK) -> Giữ khóa Update Lock trên ghế B01', 'info');
                        targetSeat.trangThai = 'Đang giao dịch';

                        await wait(600);
                        addLog('T2 (Khách B)', 'Bước 1: SELECT WITH (UPDLOCK, ROWLOCK) -> BỊ CHẶN (BLOCK)! Phải xếp hàng chờ T1 giải phóng khóa...', 'warning');

                        await wait(1000);
                        addLog('T1 (Khách A)', 'Bước 2: UPDATE Ve SET TrangThai="Đã Đặt", MaKH=1 -> COMMIT! Hoàn tất đặt vé.', 'success');
                        targetSeat.trangThai = 'Đã Đặt';
                        targetSeat.maKH = 1;

                        await wait(600);
                        addLog('T2 (Khách B)', 'Bước 2: Được mở khóa, đọc lại thấy TrangThai="Đã Đặt" -> Thông báo ĐẶT THẤT BẠI!', 'danger');
                        addLog('KẾT QUẢ', 'KHẮC PHỤC THÀNH CÔNG! Ghế B01 thuộc về Khách A đúng thứ tự, không bị ghi đè dữ liệu.', 'success');
                    }
                    break;
                }

                // 2. DIRTY READ: thanh toán thất bại -> ROLLBACK nhưng sơ đồ ghế đã hiện "Đã Đặt"
                case 2: {
                    // Lab chạy trên BẢN SAO sơ đồ ghế, không làm thay đổi ghế thật của khách đang đặt vé
                    const labSeats = dbState.seats.map(s => ({ ...s }));
                    const target = labSeats.find(s => s.soGhe === 'B02' && s.trangThai === 'Trống')
                        || labSeats.find(s => s.trangThai === 'Trống');
                    if (!target) {
                        addLog('LỖI', 'Phòng chiếu đã hết ghế trống. Hãy bấm "Reset Ghế" rồi chạy lại mô phỏng!', 'danger');
                        break;
                    }
                    const seat = target.soGhe;
                    const bookedCommitted = labSeats.filter(s => s.trangThai === 'Đã Đặt').length;
                    const R = (who, label, value, tone = 'info') => ({ who, label, value, tone });
                    const rowCommitted = R('CSDL', `Ghế ${seat} (đã COMMIT)`, 'Trống', 'ok');
                    const T1TAG = 'T1 (Thanh toán - Khách A)';
                    const T2TAG = 'T2 (Khách B - Xem sơ đồ ghế)';

                    addLog('BẮT ĐẦU', `Kịch bản Dirty Read: Khách A thanh toán ghế ${seat} nhưng ngân hàng từ chối -> ROLLBACK, trong khi Khách B đang xem sơ đồ ghế (${isFixed ? 'ĐÃ KHẮC PHỤC với READ COMMITTED' : 'CHƯA KHẮC PHỤC - READ UNCOMMITTED'})`, 'info',
                        { locks: {}, seats: {}, extra: [], readouts: [rowCommitted] });

                    const t1View = {
                        locks: { [seat]: { text: 'X-LOCK', tone: 'x' } },
                        seats: {},
                        extra: [],
                        readouts: [rowCommitted, R('T1', `Ghế ${seat} (chưa COMMIT)`, 'Đã Đặt', 'warn')]
                    };
                    addLog(T1TAG, `BEGIN TRAN; UPDATE Ve SET TrangThai=N'Đã Đặt', MaKH=1 (ghế ${seat}) -> T1 giữ X-Lock (Exclusive), CHƯA COMMIT.`, 'info', t1View);
                    addLog(T1TAG, 'Chuyển sang cổng thanh toán, đang chờ ngân hàng xác thực OTP (transaction vẫn đang mở)...', 'info', t1View);

                    if (!isFixed) {
                        const dirtyView = {
                            locks: { [seat]: { text: 'DIRTY READ', tone: 'dirty' } },
                            seats: { [seat]: 'Đã Đặt' },
                            extra: [],
                            readouts: [
                                rowCommitted,
                                R('T2', `Ghế ${seat} (T2 đọc được)`, 'Đã Đặt (dữ liệu bẩn)', 'bad'),
                                R('T2', 'Tổng ghế đã đặt (T2 đọc)', bookedCommitted + 1, 'bad')
                            ]
                        };
                        addLog(T2TAG, `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SELECT TrangThai ... (ghế ${seat}) -> đọc xuyên qua X-Lock, thấy "Đã Đặt"!`, 'warning', dirtyView);
                        addLog(T2TAG, `Khách B tưởng ghế ${seat} đã có người mua -> bỏ qua ghế này (có thể rời trang đặt vé).`, 'warning', dirtyView);

                        const afterRollback = {
                            locks: { [seat]: { text: 'ROLLBACK', tone: 'ok' } },
                            seats: { [seat]: 'Đã Đặt' },
                            extra: [],
                            readouts: [
                                rowCommitted,
                                R('T2', `Ghế ${seat} (T2 đã đọc trước đó)`, 'Đã Đặt (chưa từng tồn tại)', 'bad'),
                                R('CSDL', 'Tổng ghế đã đặt (thực tế)', bookedCommitted, 'ok')
                            ]
                        };
                        addLog(T1TAG, 'Ngân hàng TỪ CHỐI thẻ (không đủ số dư) -> ROLLBACK TRANSACTION! Ghế quay về "Trống".', 'danger', afterRollback);
                        addLog('KẾT QUẢ', `LỖI DIRTY READ! Khách B đã đọc trạng thái "Đã Đặt" chưa từng được COMMIT. Ghế ${seat} thực tế vẫn Trống nhưng đã bị bỏ lỡ -> mất doanh thu.`, 'danger', afterRollback);
                    } else {
                        const waitView = {
                            locks: { [seat]: { text: 'X-LOCK · T2 CHỜ', tone: 'x' } },
                            seats: {},
                            extra: [],
                            readouts: [rowCommitted, R('T2', `Ghế ${seat} (T2)`, 'Đang bị BLOCK, chờ T1...', 'warn')]
                        };
                        addLog(T2TAG, `SET TRANSACTION ISOLATION LEVEL READ COMMITTED; SELECT TrangThai ... (ghế ${seat}) -> cần S-Lock nhưng T1 đang giữ X-Lock -> BỊ BLOCK, xếp hàng chờ!`, 'warning', waitView);

                        addLog(T1TAG, 'Ngân hàng TỪ CHỐI thẻ -> ROLLBACK TRANSACTION! Giải phóng X-Lock, ghế vẫn "Trống".', 'danger', {
                            locks: { [seat]: { text: 'ROLLBACK', tone: 'ok' } },
                            seats: {},
                            extra: [],
                            readouts: [rowCommitted]
                        });

                        const okView = {
                            locks: {},
                            seats: {},
                            extra: [],
                            readouts: [
                                rowCommitted,
                                R('T2', `Ghế ${seat} (T2 đọc được)`, 'Trống', 'ok'),
                                R('T2', 'Tổng ghế đã đặt (T2 đọc)', bookedCommitted, 'ok')
                            ]
                        };
                        addLog(T2TAG, `Hết bị chặn, T2 đọc ghế ${seat} = "Trống" (dữ liệu đã COMMIT). Khách B vẫn đặt được ghế này.`, 'success', okView);
                        addLog('KẾT QUẢ', 'KHẮC PHỤC THÀNH CÔNG! T2 chỉ đọc dữ liệu đã COMMIT nên không bao giờ thấy trạng thái "rác". Đánh đổi: T2 phải chờ T1 (có thể bật READ_COMMITTED_SNAPSHOT để đọc không bị chặn).', 'success', okView);
                    }
                    break;
                }

                // 3. UNREPEATABLE READ
                case 3: {
                    dbState.suatChieu.giaCoBan = 90000;
                    addLog('BẮT ĐẦU', `Kịch bản Non-Repeatable Read: Giá vé bị sửa giữa 2 lần đọc (${isFixed ? 'ĐÃ KHẮC PHỤC với REPEATABLE READ' : 'CHƯA KHẮC PHỤC'})`);

                    if (!isFixed) {
                        addLog('T1 (Khách)', 'Lần đọc 1 (READ COMMITTED): Xem giá vé Suất chiếu 1 -> Giá là 90,000đ.', 'info');
                        addLog('T1 (Khách)', 'Đang chờ khách nhập thông tin thanh toán & OTP...', 'info');

                        await wait(800);
                        addLog('T2 (Admin)', 'Admin thực hiện UPDATE tăng giá vé lên 120,000đ và COMMIT ngay!', 'warning');
                        dbState.suatChieu.giaCoBan = 120000;

                        await wait(800);
                        addLog('T1 (Khách)', 'Lần đọc 2 (Trong cùng Transaction): Lấy giá vé để tính tổng hóa đơn -> Giá là 120,000đ!', 'danger');
                        addLog('KẾT QUẢ', 'LỖI NON-REPEATABLE READ! Trong cùng một Transaction, 2 lần đọc ra 2 kết quả khác nhau (90k != 120k)!', 'danger');
                    } else {
                        addLog('T1 (Khách)', 'Lần đọc 1 (REPEATABLE READ): Đọc giá vé 90,000đ và GIỮ Shared Lock đến hết giao dịch.', 'info');
                        addLog('T1 (Khách)', 'Khách đang nhập OTP...', 'info');

                        await wait(800);
                        addLog('T2 (Admin)', 'Admin muốn UPDATE giá lên 120,000đ -> BỊ CHẶN (BLOCK) do T1 đang giữ Shared Lock!', 'warning');

                        await wait(1000);
                        addLog('T1 (Khách)', 'Lần đọc 2: Đọc lại giá vé để tính tiền -> Vẫn là 90,000đ! Thanh toán thành công & COMMIT.', 'success');

                        await wait(600);
                        addLog('T2 (Admin)', 'Sau khi T1 commit, T2 mới được phép UPDATE giá thành 120,000đ.', 'info');
                        dbState.suatChieu.giaCoBan = 120000;
                        addLog('KẾT QUẢ', 'KHẮC PHỤC THÀNH CÔNG! Dữ liệu của Khách đọc 2 lần luôn nhất quán tuyệt đối.', 'success');
                    }
                    break;
                }

                // 4. PHANTOM READ: đếm ghế VIP 2 lần, Admin chèn thêm ghế VIP vào giữa
                case 4: {
                    // Lab chạy trên BẢN SAO sơ đồ ghế, không làm thay đổi ghế thật của khách đang đặt vé
                    const labSeats = dbState.seats.map(s => ({ ...s }));
                    const vipAll = labSeats.filter(s => s.loai === 'VIP');
                    const vipFree = vipAll.filter(s => s.trangThai === 'Trống');
                    const n1 = vipFree.length;
                    const names = vipFree.map(s => s.soGhe).join(', ') || 'không có ghế nào';
                    const ph = ['B04', 'B05', 'B06', 'B07'].find(n => !labSeats.some(s => s.soGhe === n)) || 'B99';
                    const tamTinh = vipFree.reduce((sum, s) => sum + (s.gia || 0), 0);
                    const R = (who, label, value, tone = 'info') => ({ who, label, value, tone });
                    const lockMap = (list, text, tone) => list.reduce((acc, s) => {
                        acc[s.soGhe] = { text, tone };
                        return acc;
                    }, {});
                    const T1TAG = 'T1 (Khách đoàn - Chốt ghế VIP)';
                    const T2TAG = 'T2 (Admin - Mở thêm ghế)';
                    const read1 = R('T1', 'Lần 1 · đếm ghế VIP trống', n1, 'ok');

                    addLog('BẮT ĐẦU', `Kịch bản Phantom Read: Khách đoàn đếm ghế VIP 2 lần trong cùng giao dịch, Admin chèn thêm ghế VIP ở giữa (${isFixed ? 'ĐÃ KHẮC PHỤC với SERIALIZABLE' : 'CHƯA KHẮC PHỤC - REPEATABLE READ'})`, 'info',
                        { locks: {}, seats: {}, extra: [], readouts: [] });

                    if (!isFixed) {
                        const t1View = { locks: lockMap(vipFree, 'S-LOCK', 's'), seats: {}, extra: [], readouts: [read1] };
                        addLog(T1TAG, `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; BEGIN TRAN; Lần 1: SELECT COUNT(*) ghế VIP còn trống -> ${n1} ghế (${names}). T1 giữ S-Lock trên ${n1} dòng đã đọc.`, 'info', t1View);
                        addLog(T1TAG, `Trưởng đoàn đang chọn người ngồi, hóa đơn tạm tính cho ${n1} ghế VIP = ${tamTinh.toLocaleString('vi-VN')} đ...`, 'info', t1View);

                        const insertView = {
                            locks: { ...lockMap(vipFree, 'S-LOCK', 's'), [ph]: { text: 'INSERT OK', tone: 'phantom' } },
                            seats: {},
                            extra: [{ soGhe: ph, loai: 'VIP', status: 'Trống', mode: 'ghost' }],
                            readouts: [read1]
                        };
                        addLog(T2TAG, `INSERT INTO Ghe (MaPhong=1, SoGhe='${ph}', LoaiGhe=N'VIP') + INSERT INTO Ve (Trống); COMMIT -> KHÔNG bị chặn: REPEATABLE READ chỉ khóa dòng đã tồn tại, không khóa khoảng dữ liệu!`, 'warning', insertView);

                        const finalView = {
                            locks: insertView.locks,
                            seats: {},
                            extra: insertView.extra,
                            readouts: [read1, R('T1', 'Lần 2 · đếm ghế VIP trống', n1 + 1, 'bad')]
                        };
                        addLog(T1TAG, `Lần 2: SELECT COUNT(*) ghế VIP còn trống -> ${n1 + 1} ghế! Xuất hiện thêm ghế "bóng ma" ${ph}.`, 'danger', finalView);
                        addLog('KẾT QUẢ', `LỖI PHANTOM READ! Cùng một giao dịch, 2 lần đếm ra ${n1} rồi ${n1 + 1}. Hóa đơn tạm tính cho ${n1} ghế nhưng lúc chốt lại thấy ${n1 + 1} ghế -> số liệu không còn khớp.`, 'danger', finalView);
                    } else {
                        const rangeView = { locks: lockMap(vipAll, 'RANGE-LOCK', 'range'), seats: {}, extra: [], readouts: [read1] };
                        addLog(T1TAG, `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRAN; Lần 1: SELECT COUNT(*) ghế VIP còn trống -> ${n1} ghế (${names}). T1 đặt Key-Range Lock lên dải [MaPhong=1, LoaiGhe='VIP'], khóa cả dòng hiện có LẪN khoảng trống nơi dòng mới có thể chèn vào.`, 'info', rangeView);
                        addLog(T1TAG, `Trưởng đoàn đang chọn người ngồi, hóa đơn tạm tính cho ${n1} ghế VIP = ${tamTinh.toLocaleString('vi-VN')} đ...`, 'info', rangeView);

                        const blockedView = {
                            locks: { ...lockMap(vipAll, 'RANGE-LOCK', 'range'), [ph]: { text: 'INSERT CHỜ', tone: 'wait' } },
                            seats: {},
                            extra: [{ soGhe: ph, loai: 'VIP', status: 'Đang chờ', mode: 'pending' }],
                            readouts: [read1]
                        };
                        addLog(T2TAG, `INSERT INTO Ghe (MaPhong=1, SoGhe='${ph}', LoaiGhe=N'VIP') -> vị trí chèn nằm trong dải đang bị Key-Range Lock -> BỊ BLOCK, xếp hàng chờ T1!`, 'warning', blockedView);

                        const read2 = R('T1', 'Lần 2 · đếm ghế VIP trống', n1, 'ok');
                        addLog(T1TAG, `Lần 2: SELECT COUNT(*) ghế VIP còn trống -> vẫn ${n1} ghế! Không có dòng bóng ma. Chốt vé và COMMIT, giải phóng Range-Lock.`, 'success', {
                            locks: {},
                            seats: {},
                            extra: blockedView.extra,
                            readouts: [read1, read2]
                        });

                        const doneView = {
                            locks: { [ph]: { text: 'INSERT OK', tone: 'ok' } },
                            seats: {},
                            extra: [{ soGhe: ph, loai: 'VIP', status: 'Trống', mode: 'new' }],
                            readouts: [read1, read2, R('Giao dịch mới', 'Lần 3 · đếm ghế VIP trống', n1 + 1, 'info')]
                        };
                        addLog(T2TAG, `Sau khi T1 COMMIT, T2 được cấp quyền: INSERT ghế ${ph} thực hiện thành công (giao dịch mới sẽ thấy ${n1 + 1} ghế).`, 'info', doneView);
                        addLog('KẾT QUẢ', `KHẮC PHỤC THÀNH CÔNG! Suốt giao dịch của Khách đoàn, 2 lần đếm đều ra ${n1} ghế. Ghế mới ${ph} chỉ xuất hiện SAU khi T1 kết thúc. Đánh đổi: T2 phải chờ, độ đồng thời thấp hơn.`, 'success', doneView);
                    }
                    break;
                }

                // 5. DEADLOCK
                case 5: {
                    const seat1 = dbState.seats.find(s => s.soGhe === 'A01');
                    const seat2 = dbState.seats.find(s => s.soGhe === 'A02');
                    seat1.trangThai = 'Trống'; seat1.maKH = null;
                    seat2.trangThai = 'Trống'; seat2.maKH = null;

                    addLog('BẮT ĐẦU', `Kịch bản Deadlock: 2 khách đặt cặp ghế A01 và A02 theo thứ tự ngược nhau (${isFixed ? 'ĐÃ KHẮC PHỤC (Lock Ordering + Retry)' : 'CHƯA KHẮC PHỤC'})`);

                    if (!isFixed) {
                        addLog('T1 (Khách A)', 'Bước 1: UPDATE Ve A01 -> Giữ khóa trên Ghế A01.', 'info');
                        seat1.trangThai = 'Đang giao dịch';
                        
                        await wait(500);
                        addLog('T2 (Khách B)', 'Bước 1: UPDATE Ve A02 -> Giữ khóa trên Ghế A02.', 'info');
                        seat2.trangThai = 'Đang giao dịch';

                        await wait(800);
                        addLog('T1 (Khách A)', 'Bước 2: Yêu cầu khóa Ghế A02 -> ĐANG CHỜ T2 nhả A02...', 'warning');
                        
                        await wait(500);
                        addLog('T2 (Khách B)', 'Bước 2: Yêu cầu khóa Ghế A01 -> ĐANG CHỜ T1 nhả A01...', 'warning');

                        await wait(1000);
                        addLog('SQL SERVER DETECTOR', 'PHÁT HIỆN CHU TRÌNH CHỜ VÔ HẠN (DEADLOCK CYCLE)!', 'danger');
                        addLog('SQL SERVER DETECTOR', 'Tự động chọn T2 làm DEADLOCK VICTIM (Error 1205) và ROLLBACK T2!', 'danger');
                        
                        seat2.trangThai = 'Trống';
                        await wait(500);
                        addLog('T1 (Khách A)', 'T1 thoát khỏi thế kẹt, tiếp tục hoàn tất đặt cả 2 ghế A01 & A02! COMMIT.', 'success');
                        seat1.trangThai = 'Đã Đặt'; seat1.maKH = 1;
                        seat2.trangThai = 'Đã Đặt'; seat2.maKH = 1;
                        addLog('KẾT QUẢ', 'LỖI DEADLOCK ĐÃ XẢY RA! Một phiên người dùng bị văng lỗi 1205 gián đoạn trải nghiệm.', 'danger');
                    } else {
                        addLog('HỆ THỐNG', 'Áp dụng quy tắc Lock Ordering: Luôn sắp xếp ID ghế tăng dần (A01 trước -> A02 sau).', 'info');

                        addLog('T1 (Khách A)', 'Yêu cầu đặt (A01, A02) -> Hệ thống khóa A01 trước...', 'info');
                        seat1.trangThai = 'Đang giao dịch';

                        await wait(500);
                        addLog('T2 (Khách B)', 'Yêu cầu đặt (A02, A01) -> Hệ thống tự động đổi thứ tự thành (A01 trước, A02 sau)!', 'info');
                        addLog('T2 (Khách B)', 'T2 muốn khóa A01 -> Bị chặn xếp hàng chờ T1 (chờ tuần tự, KHÔNG TẠO VÒNG LẶP).', 'warning');

                        await wait(1000);
                        addLog('T1 (Khách A)', 'T1 khóa tiếp A02 -> Đặt thành công cả 2 ghế (A01, A02) và COMMIT.', 'success');
                        seat1.trangThai = 'Đã Đặt'; seat1.maKH = 1;
                        seat2.trangThai = 'Đã Đặt'; seat2.maKH = 1;

                        await wait(600);
                        addLog('T2 (Khách B)', 'T2 được xử lý sau, kiểm tra thấy A01 đã được đặt -> Báo đặt thất bại an toàn, không có Deadlock!', 'info');
                        addLog('KẾT QUẢ', 'KHẮC PHỤC HOÀN TOÀN DEADLOCK! Không còn xung đột chéo, hệ thống xếp hàng tuần tự mượt mà.', 'success');
                    }
                    break;
                }

                default:
                    addLog('LỖI', 'Mã xung đột không hợp lệ!', 'danger');
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                logs,
                dbState
            }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
    }

    // Static files
    serveStaticFile(pathname, res);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🎬 CINEMAX PREMIER - HỆ THỐNG RẠP CHIẾU PHIM CHUẨN ĐANG CHẠY!`);
    console.log(`🌐 Truy cập cục bộ (Local):     http://localhost:${PORT}`);
    console.log(`🌐 Truy cập mạng LAN/Công khai: http://192.168.1.7:${PORT}`);
    console.log(`=======================================================`);
});
