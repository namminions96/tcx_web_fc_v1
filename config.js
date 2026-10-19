/* =====================================================================
   CẤU HÌNH ĐỒNG BỘ GOOGLE SHEET (Version 4 - Apps Script v3)
   =====================================================================

   File này ai mở web cũng tải về được, nên chỉ đặt ở đây những thứ BẮT BUỘC
   trình duyệt phải biết để ĐỌC dữ liệu: Web App URL và token đọc.
   Đây không phải sơ hở vá được bằng cách mã hoá — mọi kiểu mã hoá trong file
   tĩnh đều giải ngược được, và chỉ cần mở F12 > Network là thấy nguyên URL.

   >>> MẬT KHẨU QUẢN TRỊ KHÔNG NẰM Ở ĐÂY <<<
   Nó nằm ở biến ADMIN_PASSWORD trong google-apps-script.gs (phía máy chủ Google).
   Mọi thao tác GHI đè lên Sheet đều bị Apps Script kiểm tra mật khẩu đó, nên người
   lạ dù có URL + token cũng chỉ XEM được chứ không sửa/xoá được dữ liệu.

   LƯU Ý: URL phải được điền ngay trong file này thì MỌI trình duyệt (Chrome ẩn danh,
   Safari, trình duyệt trong Zalo, điện thoại của thành viên khác...) mới tải được
   dữ liệu. Nếu để trống, web chỉ chạy đúng trên trình duyệt đã từng nhập URL thủ công,
   các trình duyệt còn lại sẽ hiển thị toàn số 0.
   ===================================================================== */

window.SHEET_SYNC_CONFIG = {
  // Web App URL của Apps Script, dạng: https://script.google.com/macros/s/AKfycb..../exec
  url: 'https://script.google.com/macros/s/AKfycbyOCKWMiPmw8-nHrW5PoRY9jePkO-BzTZn5qBHpfWtlEqBhu_GUzwZbDmUGIrjnHm2c/exec',
  // Phải trùng với SECRET_TOKEN trong google-apps-script.gs
  token: 'doiboi-fc-2026',
  // 1 = tự động đẩy dữ liệu lên Sheet mỗi khi admin có thay đổi, 0 = tắt
  autoPush: 1
};

window.getSheetSyncConfig = function () {
  var c = window.SHEET_SYNC_CONFIG || {};
  return {
    url: String(c.url || '').trim(),
    token: c.token || '',
    autoPush: Number(c.autoPush) === 1 ? 1 : 0
  };
};

window.ADMIN_CONFIG = {
  // Chỉ là tên tài khoản hiển thị ở màn hình đăng nhập.
  // Mật khẩu được kiểm tra trên Apps Script, không lưu ở đây.
  username: 'admin'
};

window.BANK_CONFIG = {
  bankName: 'Ngân hàng MSB',
  accountNumber: '0901324666',
  accountName: 'QUỸ FC VUI VẺ',
  qrImage: 'https://img.vietqr.io/image/MSB-0901324666-compact2.jpg?amount=0&addInfo=Dong%20quy%20FC'
};

