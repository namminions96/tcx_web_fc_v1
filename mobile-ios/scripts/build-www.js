/* =====================================================================
   Copy web gốc (../index.html, ../config.js, ../anhbia.png) vào www/
   rồi chèn thêm phần dành riêng cho iPhone. KHÔNG sửa file web gốc,
   nên web vẫn chạy như cũ; chỉ cần chạy lại script này mỗi khi web đổi.
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const APP = path.resolve(__dirname, '..');
const WWW = path.join(APP, 'www');

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

for (const f of ['config.js', 'anhbia.png']) {
  fs.copyFileSync(path.join(ROOT, f), path.join(WWW, f));
}
fs.copyFileSync(path.join(APP, 'native', 'native-bridge.js'), path.join(WWW, 'native-bridge.js'));
fs.copyFileSync(path.join(APP, 'native', 'native.css'), path.join(WWW, 'native.css'));

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function inject(pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error('Không tìm thấy chỗ chèn: ' + label);
  html = html.replace(pattern, replacement);
}

// Cho nội dung tràn tới tai thỏ / thanh home, rồi tự đệm bằng safe-area trong native.css
inject(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">',
  'meta viewport'
);
inject(/<\/head>/, '  <link rel="stylesheet" href="native.css">\n</head>', '</head>');
// Capacitor tự tiêm window.Capacitor trước khi trang chạy; native-bridge.js phải chạy sau script chính
inject(/<\/body>/, '  <script src="native-bridge.js"></script>\n</body>', '</body>');

fs.writeFileSync(path.join(WWW, 'index.html'), html);
console.log('✔ Đã tạo www/ từ web gốc (' + Math.round(html.length / 1024) + ' KB)');
