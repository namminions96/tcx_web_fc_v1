#!/bin/bash
# Chạy 1 lệnh trên CI; nếu lỗi thì đưa các dòng lỗi + cuối log vào annotation (::error::)
# để xem được ngay ở trang Summary mà không cần mở log chi tiết.
LOG=$(mktemp)
"$@" 2>&1 | tee "$LOG"
code=${PIPESTATUS[0]}
if [ "$code" -ne 0 ]; then
  msg=$( { grep -E 'error:|Error|ERR!|\[error\]|failed' "$LOG" | tail -n 25; echo '----- cuối log -----'; tail -n 40 "$LOG"; } \
    | cut -c1-300 | sed 's/%/%25/g' | awk '{printf "%s%%0A", $0}')
  echo "::error title=Lỗi khi chạy: $1 $2 $3::$msg"
fi
exit "$code"
