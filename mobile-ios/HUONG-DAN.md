# Đưa app FC Vui Vẻ lên App Store (iPhone)

App iPhone dùng **lại nguyên** `index.html` + `config.js` của web (đóng gói bằng Capacitor).
Sửa web xong → build lại app là có bản mới. Dữ liệu vẫn đọc/ghi Google Sheet như cũ.

Trong app có thêm (file `native/native-bridge.js`):
- **Nhắc lịch đá**: thông báo 20:00 tối hôm trước và 2 tiếng trước giờ đá (tự cập nhật khi lịch đổi, bỏ qua trận bị huỷ).
- **Chia sẻ đội hình**: bấm "Sao chép" đội hình → mở luôn bảng Chia sẻ để gửi vào Zalo/Messenger.
- Rung nhẹ khi bấm, giao diện tràn màn hình chừa tai thỏ, tự tải dữ liệu mới khi mở lại app.

---

## 0. Chạy thử miễn phí trên Appetize.io (chưa cần tài khoản Apple)

Appetize là máy iPhone ảo chạy trong trình duyệt. Thử được hết tính năng của app, trừ thông báo đẩy ra ngoài màn hình khoá.

1. Đưa code lên GitHub (repo **Private**, xem bước 4 bên dưới, phần Secrets Apple chưa cần).
2. Đăng ký tài khoản free ở **appetize.io** → Account → **API Token** → tạo token.
3. GitHub → Settings → Secrets and variables → Actions → **New repository secret**: tên `APPETIZE_API_TOKEN`, giá trị là token vừa tạo.
4. Tab **Actions → "iOS - Chạy thử trên Appetize" → Run workflow**. Khoảng 10 phút sau, mở lượt chạy đó: link chạy thử nằm ở phần **Summary**.
5. (Tuỳ chọn) Để lần build sau vẫn giữ nguyên link: copy `publicKey` hiện ở Summary vào tab **Variables** (cùng trang Secrets), tên `APPETIZE_PUBLIC_KEY`.

Không muốn tạo token? Bỏ qua bước 2–3, chạy workflow xong thì tải file **App-simulator** ở mục *Artifacts* về, giải nén ra file `App-simulator.zip` bên trong, rồi kéo thả lên **appetize.io/upload**.

## 1. Chuẩn bị (1 lần)

| Cần | Ghi chú |
|---|---|
| Tài khoản **Apple Developer** | 99 USD/năm – developer.apple.com/programs. Đăng ký cá nhân mất 1–2 ngày duyệt. |
| Tài khoản **GitHub** | Để dùng máy Mac miễn phí của GitHub build app (Windows không build được iOS). Tạo repo **Private**. |
| Node.js 22 (tuỳ chọn) | Chỉ cần nếu muốn chạy thử `npm run build` trên máy. |

> ⚠️ File `google-apps-script.gs` chứa mật khẩu admin đã được loại khỏi Git (`.gitignore`). Đừng đưa nó lên GitHub.

## 2. Tạo khoá API App Store Connect

1. Vào **appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API** → tạo key, quyền **Admin**.
2. Ghi lại **Issuer ID**, **Key ID**, tải file `AuthKey_XXXX.p8` (chỉ tải được 1 lần).
3. Lấy **Team ID** ở developer.apple.com → Membership details.

## 3. Tạo app trên App Store Connect

**Apps → + → New App**: Platform iOS, tên `FC Vui Vẻ`, ngôn ngữ Vietnamese,
Bundle ID `com.fcvuive.app` (nếu chưa có trong danh sách: tạo ở developer.apple.com → Identifiers),
SKU tuỳ ý (VD `fcvuive001`).

> Muốn đổi Bundle ID: sửa ở `capacitor.config.json` và `BUNDLE_ID` trong `.github/workflows/ios-testflight.yml`.

## 4. Đưa code lên GitHub + khai báo Secrets

Đẩy cả thư mục `tcx_web_fc_v1` lên repo private. Vào **Settings → Secrets and variables → Actions** thêm:

| Secret | Giá trị |
|---|---|
| `APPLE_TEAM_ID` | Team ID |
| `ASC_KEY_ID` | Key ID |
| `ASC_ISSUER_ID` | Issuer ID |
| `ASC_KEY_P8_BASE64` | Nội dung file .p8 dạng base64. Trên Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXX.p8")) \| Set-Clipboard` rồi dán |

## 5. Build

GitHub → tab **Actions → iOS - Build & TestFlight → Run workflow**, nhập phiên bản (VD `1.0.0`).
Khoảng 10–15 phút sau, bản build xuất hiện ở App Store Connect → **TestFlight**.

- Cài app **TestFlight** trên iPhone để chạy thử ngay.
- Mời anh em trong đội test qua TestFlight (External Testing, tối đa 10.000 người) – nhiều đội chỉ cần dừng ở bước này.

## 6. Gửi duyệt App Store

Trong App Store Connect, tab **App Store** của app cần:
- **Ảnh chụp màn hình** iPhone 6.9" (1320×2868) – chụp từ TestFlight trên iPhone đời mới, tối thiểu 3 ảnh.
- **Privacy Policy URL** – có thể tạo 1 trang Google Sites/Notion ghi: app không thu thập dữ liệu cá nhân, dữ liệu đội lưu trên Google Sheet của quản lý.
- **App Privacy**: chọn "Data Not Collected".
- **Mô tả, từ khoá, danh mục** (Sports), độ tuổi 4+.
- **App Review Information**: ghi chú cho người duyệt "Thành viên xem dữ liệu không cần đăng nhập; mục Admin chỉ dành cho quản lý đội". Nếu Apple đòi tài khoản demo, đổi `ADMIN_PASSWORD` tạm thời trong Apps Script khi duyệt, duyệt xong đổi lại.

Chọn bản build → **Submit for Review** (thường 1–3 ngày).

### Lưu ý khả năng bị từ chối
- App chỉ dành cho 1 đội bóng → nên chọn **Unlisted App** (không hiện khi tìm kiếm, chỉ ai có link mới tải) – gửi yêu cầu tại developer.apple.com/support/unlisted-app-distribution. Đây là kênh Apple dành cho app nội bộ nhóm/tổ chức.
- Apple hay từ chối app "chỉ bọc trang web" (guideline 4.2). Các tính năng nhắc lịch, chia sẻ, rung… ở trên là để app có giá trị riêng; khi trả lời Apple hãy nêu rõ chúng.

---

## Cập nhật app khi sửa web

Sửa `index.html` / `config.js` như bình thường → push lên GitHub → chạy lại workflow với số phiên bản mới (VD `1.0.1`) → submit bản mới.

Nếu chỉ sửa **dữ liệu** (thành viên, lịch, thu chi) thì **không** cần build lại – app đọc trực tiếp từ Google Sheet.

## Có máy Mac? (tuỳ chọn)

```bash
cd mobile-ios
npm install
npm run build
npx cap add ios                        # lần đầu (cần CocoaPods)
npx cap sync ios
npx cap open ios                       # mở Xcode, chọn iPhone giả lập và bấm ▶
```
