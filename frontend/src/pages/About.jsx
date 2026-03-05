import { ShieldCheck, AlertTriangle, Database, BarChart3, Tag, LineChart } from 'lucide-react';

const About = () => {
  const steps = [
    { label: 'Thu thập', desc: 'Dữ liệu thô được thu thập từ báo cáo tài chính đã kiểm toán.' },
    { label: 'Tiền xử lý', desc: 'Dữ liệu được tiền xử lý để đảm bảo đúng định dạng và giảm ảnh hưởng của giá trị bất thường.' },
    { label: 'PCA', desc: 'Thực hiện phân tích thành phần chính (Principal Component Analysis) để tạo ra PC1, PC2, PC3.' },
    { label: 'Scoring', desc: 'Tính điểm ProfitScore từ các thành phần PC.' },
    { label: 'Labeling', desc: 'Gán nhãn rủi ro dựa trên dấu của lợi nhuận tổng hợp P_t: label = 1 khi P_t > 0 → Rủi ro thấp (xanh, doanh nghiệp có khả năng duy trì lợi nhuận); label = 0 khi P_t < 0 → Rủi ro cao (đỏ, doanh nghiệp không có khả năng duy trì lợi nhuận).' },
    { label: 'Dashboard', desc: 'Kết quả được cung cấp qua giao diện lập trình ứng dụng (API) và hiển thị trên bảng điều khiển (Dashboard).' },
  ];

  const methodCards = [
    {
      icon: Database,
      accent: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      iconBg: 'bg-cyan-500/15',
      title: 'Dữ liệu gốc',
      desc: 'ProfitPulse sử dụng dữ liệu từ báo cáo tài chính đã kiểm toán của các doanh nghiệp niêm yết trên thị trường chứng khoán Việt Nam. Dữ liệu được chuẩn hóa và kiểm tra chất lượng trước khi đưa vào hệ thống tính toán nhằm đảm bảo các chỉ số được so sánh nhất quán giữa các doanh nghiệp và giữa các năm.',
    },
    {
      icon: BarChart3,
      accent: 'text-primary-400',
      bg: 'bg-primary-600/10 border-primary-500/20',
      iconBg: 'bg-primary-600/15',
      title: 'Điểm ProfitScore',
      desc: 'Điểm ProfitScore là điểm lợi nhuận tổng hợp dùng để so sánh nhanh giữa các doanh nghiệp trong cùng một năm. Điểm này được tạo bằng phương pháp phân tích thành phần chính (Principal Component Analysis), trong đó nhiều chỉ số tài chính được rút gọn thành ba thành phần PC1, PC2, PC3 rồi kết hợp thành thang điểm duy nhất.',
    },
    {
      icon: Tag,
      accent: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      iconBg: 'bg-amber-500/15',
      title: 'Xếp hạng phân vị & Nhãn rủi ro',
      desc: 'Mỗi doanh nghiệp được xếp hạng theo phân vị (Percentile) trong năm để bạn biết doanh nghiệp đang đứng ở đâu so với toàn thị trường. Nhãn rủi ro được gán theo dấu của lợi nhuận tổng hợp P_t — label = 1 (P_t > 0) là Rủi ro thấp (xanh): doanh nghiệp có khả năng duy trì lợi nhuận năm sau; label = 0 (P_t < 0) là Rủi ro cao (đỏ): doanh nghiệp không có khả năng duy trì lợi nhuận. Quy tắc này được áp dụng nhất quán cho toàn bộ thị trường và mọi năm.',
    },
    {
      icon: LineChart,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      iconBg: 'bg-emerald-500/15',
      title: 'Chuẩn hóa nhất quán',
      desc: 'Toàn bộ quy trình tính toán được áp dụng đồng nhất cho tất cả các doanh nghiệp và tất cả các năm. Điều này đảm bảo bạn có thể so sánh điểm ProfitScore giữa các doanh nghiệp trong cùng năm một cách công bằng và đáng tin cậy.',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ===== Giới thiệu ===== */}
      <section className="relative overflow-hidden rounded-2xl border border-primary-500/25 bg-gradient-to-br from-primary-600/10 via-surface-card to-surface-card p-5 sm:p-8">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary-600/10 blur-3xl pointer-events-none" />
        <div className="relative space-y-4 sm:space-y-5">
          <div>
            <span className="inline-block text-xs font-semibold text-primary-400 tracking-widest uppercase mb-2">Về chúng tôi</span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white leading-tight">Giới thiệu</h2>
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-primary-500 to-transparent" />
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            ProfitPulse là website giúp bạn theo dõi và phân tích sức khỏe lợi nhuận của các doanh nghiệp được niêm yết trên sàn chứng khoán tại Việt Nam theo từng năm bằng một bộ chỉ báo đơn giản và dễ quan sát. Thay vì phải đọc nhiều bảng báo cáo tài chính rời rạc, hệ thống tổng hợp các chỉ số lợi nhuận cốt lõi thành một điểm lợi nhuận duy nhất gọi là&nbsp;<span className="text-primary-400 font-semibold">điểm ProfitScore</span>&nbsp;giúp bạn có thể so sánh các doanh nghiệp trong cùng một năm, nhận diện doanh nghiệp nổi bật và phát hiện sớm các tín hiệu rủi ro.
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Khi sử dụng ProfitPulse, bạn có thể bắt đầu từ trang chủ để xem tổng quan thị trường theo từng năm, sau đó tìm mã cổ phiếu bạn quan tâm để mở trang doanh nghiệp và xem chi tiết điểm lợi nhuận, vị trí của doanh nghiệp so với thị trường và xu hướng trong nhiều năm. Trang bộ lọc cho phép bạn chọn năm và khoảng điểm để tìm ra danh sách phù hợp, rồi chuyển sang trang so sánh để đối chiếu nhiều doanh nghiệp trên cùng một thang đo. Trang cảnh báo giúp bạn theo dõi các doanh nghiệp có sự thay đổi đáng chú ý về điểm số và nhãn rủi ro để ưu tiên đi sâu phân tích.
          </p>
        </div>
      </section>

      {/* ===== Phương pháp luận ===== */}
      <section className="space-y-3 sm:space-y-4">
        <div className="px-1">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Phương pháp luận</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {methodCards.map(({ icon: Icon, accent, bg, iconBg, title, desc }, i) => (
            <div key={i} className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${bg}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon className={`h-5 w-5 ${accent}`} />
              </div>
              <h3 className={`text-base font-display font-bold ${accent}`}>{title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Quy ước nhãn rủi ro ===== */}
      <section className="card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="h-5 w-5 text-amber-400" />
          <h3 className="text-base sm:text-lg font-display font-bold text-white">Quy ước nhãn rủi ro</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Nhãn rủi ro được xác định dựa trên <span className="text-white font-medium">dấu</span> của lợi nhuận tổng hợp <span className="text-primary-400 font-semibold">P_t</span> — đây là thước đo tổng hợp nhiều chỉ số tài chính lại thành một con số duy nhất để phán đoán xu hướng lợi nhuận năm sau.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Label = 1 — Rủi ro thấp */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm font-extrabold text-emerald-400">1</span>
            <div className="space-y-1">
              <p className="text-sm font-display font-bold text-emerald-400">Rủi ro thấp</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">P_t &gt; 0</span> — Lợi nhuận tổng hợp dương. Doanh nghiệp <span className="text-emerald-400 font-medium">có khả năng duy trì lợi nhuận</span> trong năm tiếp theo.
              </p>
              <p className="text-[10px] text-muted font-mono">label_t = 1</p>
            </div>
          </div>
          {/* Label = 0 — Rủi ro cao */}
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/8 p-4 flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-sm font-extrabold text-rose-400">0</span>
            <div className="space-y-1">
              <p className="text-sm font-display font-bold text-rose-400">Rủi ro cao</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">P_t &lt; 0</span> — Lợi nhuận tổng hợp âm. Doanh nghiệp <span className="text-rose-400 font-medium">không có khả năng duy trì lợi nhuận</span> trong năm tiếp theo.
              </p>
              <p className="text-[10px] text-muted font-mono">label_t = 0</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Quy tắc gán nhãn này được áp dụng nhất quán cho toàn bộ doanh nghiệp và tất cả các năm. Đây là tín hiệu cảnh báo sớm dựa trên dữ liệu — không phải đánh giá chủ quan hay khuyến nghị đầu tư.
        </p>
      </section>

      {/* ===== Quy trình xử lý dữ liệu ===== */}
      <section className="card p-4 sm:p-6 space-y-4 sm:space-y-5">
        <h3 className="text-base sm:text-lg font-display font-bold text-white">Quy trình xử lý dữ liệu</h3>
        <div className="flex flex-col items-center gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center w-full max-w-xl">
              {/* Step card */}
              <div className="w-full flex items-start gap-3 sm:gap-4 bg-white/3 border border-white/8 rounded-xl px-4 py-3 sm:py-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600/25 border border-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-400">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide mb-0.5">{step.label}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {/* Arrow connector (not after last) */}
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-px h-4 bg-primary-500/30" />
                  <svg className="w-4 h-4 text-primary-500/50" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 12L2 6h12z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Cam kết minh bạch */}
      <section className="card p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base sm:text-lg font-display font-bold text-white">Cam kết minh bạch</h3>
        </div>
        <ul className="space-y-2 text-sm sm:text-base text-slate-300">
          {[
            'ProfitPulse không sử dụng dữ liệu nhạy cảm hoặc dữ liệu nội bộ chưa công bố.',
            'Quy trình có thể tái tạo kết quả khi dùng cùng nguồn dữ liệu đầu vào.',
            'Các thông tin PCA như trọng số và tỷ lệ giải thích được lưu để kiểm tra và đối chiếu.',
            'Nhãn rủi ro dựa trên ngưỡng thống kê và được áp dụng nhất quán theo thời gian.',
            'Mỗi biểu đồ đều có mô tả ngắn để người dùng hiểu biểu đồ cung cấp thông tin gì.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tuyên bố miễn trừ trách nhiệm */}
      <section className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-display font-bold text-white">Tuyên bố miễn trừ trách nhiệm</h3>
            <p className="text-sm sm:text-base text-amber-200/90 leading-relaxed">
              ProfitPulse là công cụ phân tích dữ liệu và không phải công cụ tư vấn đầu tư. Kết quả chỉ mang tính tham khảo và không nên là căn cứ duy nhất cho quyết định mua hoặc bán. Người dùng tự chịu trách nhiệm với mọi quyết định đầu tư của mình.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
