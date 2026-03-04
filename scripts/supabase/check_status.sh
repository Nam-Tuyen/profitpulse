#!/bin/bash
# Kiểm tra kết quả upload lên Supabase

echo "🔍 Kiểm tra kết quả upload Supabase"
echo "======================================"
echo ""

# Kiểm tra log file
if [ -f "upload_log_full.txt" ]; then
    echo "📊 Tổng kết từ log file:"
    echo ""
    grep "==> TABLE:" upload_log_full.txt | wc -l | xargs echo "  - Số tables đã xử lý:"
    grep "Uploaded:" upload_log_full.txt | tail -20
    echo ""
    
    # Kiểm tra errors
    ERROR_COUNT=$(grep -c "❌ ERROR" upload_log_full.txt || echo "0")
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "⚠️  Có $ERROR_COUNT lỗi trong quá trình upload"
        echo "  Chi tiết:"
        grep "❌ ERROR" upload_log_full.txt | head -10
    else
        echo "✅ Không có lỗi trong quá trình upload"
    fi
    
    echo ""
    
    # Kiểm tra completion
    if grep -q "🎉 DONE" upload_log_full.txt; then
        echo "✅ Upload hoàn tất thành công!"
    else
        echo "⏳ Upload vẫn đang trong quá trình..."
    fi
else
    echo "❌ Không tìm thấy log file. Có thể upload chưa chạy."
fi

echo ""
echo "======================================"
echo "Để xem log đầy đủ: cat upload_log_full.txt"
echo "Để chạy lại upload: ./upload.sh"
