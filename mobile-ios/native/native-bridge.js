/* =====================================================================
   CẦU NỐI TÍNH NĂNG IPHONE (chỉ chạy khi mở trong app, web thường bỏ qua)
   - Sao chép đội hình / số tài khoản -> dùng clipboard native + mở bảng Chia sẻ (Zalo, Messenger...)
   - Nhắc lịch đá: thông báo trước giờ đá 2 tiếng và tối hôm trước
   - Rung nhẹ khi bấm nút, thanh trạng thái tối, nút Back của iPhone đóng modal
   ===================================================================== */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return;

  var P = Cap.Plugins;
  var REMIND_BEFORE_MIN = 120;   // nhắc trước giờ đá
  var EVENING_BEFORE_HOUR = 20;  // nhắc lúc 20:00 tối hôm trước
  var MAX_NOTI = 20;

  document.documentElement.classList.add('native-ios');

  // ---------- Thanh trạng thái + splash ----------
  if (P.StatusBar) {
    P.StatusBar.setStyle({ style: 'DARK' }).catch(function () {});
  }
  if (P.SplashScreen) {
    setTimeout(function () { P.SplashScreen.hide().catch(function () {}); }, 300);
  }

  // ---------- Rung nhẹ khi bấm ----------
  if (P.Haptics) {
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('button, .nav-item, [data-tab], .btn');
      if (el) P.Haptics.impact({ style: 'LIGHT' }).catch(function () {});
    }, true);
  }

  // ---------- Sao chép + Chia sẻ ----------
  // Web gốc gọi navigator.clipboard.writeText(...). Trong app ta chép bằng clipboard native,
  // và với văn bản dài (đội hình) thì mở luôn bảng Chia sẻ để gửi thẳng vào nhóm Zalo.
  if (P.Clipboard) {
    var clip = navigator.clipboard || {};
    var nativeWrite = function (text) {
      text = String(text);
      return P.Clipboard.write({ string: text }).then(function () {
        if (P.Share && text.indexOf('\n') !== -1) {
          P.Share.share({ title: 'Đội hình FC', text: text, dialogTitle: 'Gửi đội hình' })
            .catch(function () { /* người dùng đóng bảng chia sẻ */ });
        }
      });
    };
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: Object.assign(Object.create(clip), { writeText: nativeWrite })
      });
    } catch (e) {
      try { clip.writeText = nativeWrite; } catch (e2) {}
    }
  }

  // ---------- Nhắc lịch đá ----------
  function buildReminders() {
    if (typeof getUpcomingMatches !== 'function') return [];
    var now = Date.now();
    var list = [];
    var team = (typeof state !== 'undefined' && state && state.teamName) || 'FC Vui Vẻ';
    getUpcomingMatches(8).forEach(function (m) {
      if (m.isCancelled || !m.date) return;
      var hm = String(m.time || '19:00').split(':');
      var start = new Date(m.date + 'T00:00:00');
      start.setHours(Number(hm[0]) || 0, Number(hm[1]) || 0, 0, 0);
      var where = m.location ? ' tại ' + m.location : '';
      var label = (m.opponent || 'Trận đấu') + ' - ' + (m.time || '') + where;

      var eve = new Date(start);
      eve.setDate(eve.getDate() - 1);
      eve.setHours(EVENING_BEFORE_HOUR, 0, 0, 0);
      if (eve.getTime() > now) {
        list.push({ at: eve, title: '⚽ Mai đá bóng!', body: label + '. Vào app vote tham gia nhé.' });
      }
      var soon = new Date(start.getTime() - REMIND_BEFORE_MIN * 60000);
      if (soon.getTime() > now) {
        list.push({ at: soon, title: '⏰ ' + team + ' - còn 2 tiếng', body: label + '. Chuẩn bị giày, áo nhé!' });
      }
    });
    list.sort(function (a, b) { return a.at - b.at; });
    return list.slice(0, MAX_NOTI).map(function (r, i) {
      return { id: 1000 + i, title: r.title, body: r.body, schedule: { at: r.at, allowWhileIdle: true } };
    });
  }

  var lastSignature = '';
  var scheduling = false;
  function rescheduleReminders() {
    var LN = P.LocalNotifications;
    if (!LN || scheduling) return;
    var items;
    try { items = buildReminders(); } catch (e) { return; }
    var sig = JSON.stringify(items.map(function (n) { return [n.schedule.at.getTime(), n.body]; }));
    if (sig === lastSignature) return;
    scheduling = true;
    LN.checkPermissions().then(function (perm) {
      if (perm.display === 'granted') return perm;
      if (perm.display === 'denied') throw new Error('denied');
      return LN.requestPermissions();
    }).then(function (perm) {
      if (perm.display !== 'granted') throw new Error('denied');
      return LN.getPending();
    }).then(function (pending) {
      var old = (pending.notifications || []).map(function (n) { return { id: n.id }; });
      return old.length ? LN.cancel({ notifications: old }) : null;
    }).then(function () {
      return items.length ? LN.schedule({ notifications: items }) : null;
    }).then(function () {
      lastSignature = sig;
    }).catch(function () {}).then(function () {
      scheduling = false;
    });
  }

  // Lên lịch lại mỗi khi dữ liệu được vẽ lại (sau khi tải từ Google Sheet, admin sửa lịch...)
  if (typeof window.renderAll === 'function') {
    var origRenderAll = window.renderAll;
    var timer = null;
    window.renderAll = function () {
      var r = origRenderAll.apply(this, arguments);
      clearTimeout(timer);
      timer = setTimeout(rescheduleReminders, 1500);
      return r;
    };
  }
  setTimeout(rescheduleReminders, 3000);

  // ---------- Quay lại app sau >1 phút: tải dữ liệu mới ----------
  if (P.App) {
    var backgroundAt = 0;
    P.App.addListener('appStateChange', function (s) {
      if (!s.isActive) { backgroundAt = Date.now(); return; }
      if (!backgroundAt || Date.now() - backgroundAt < 60000) return;
      try {
        if (typeof app !== 'undefined' && typeof app.pullFromSheet === 'function' &&
            state.sheetSync && state.sheetSync.url) {
          app.pullFromSheet(true);
        }
      } catch (e) {}
    });
  }
})();
