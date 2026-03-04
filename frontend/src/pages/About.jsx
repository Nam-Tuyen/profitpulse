import { Database, BookOpen, ShieldCheck, AlertTriangle, BarChart3, Layers } from 'lucide-react';
import ModelContextBar from '../components/ModelContextBar';
import PageIntro from '../components/PageIntro';

const About = () => {
  const methodologyCards = [
    {
      icon: Database,
      title: 'Dữ liệu gốc',
      desc: 'ProfitPulse sử dụng dữ liệu báo cáo tài chính đã kiểm toán từ các công ty niêm yết trên sàn chứng khoán Việt Nam. Dữ liệu được chuẩn hóa và kiểm tra trước khi đưa vào pipeline.',
    },
    {
      icon: Layers,
      title: 'PCA & Scoring',
      desc: 'Điểm ProfitScore được tính dựa trên PCA (Phân tích Thành phần Chính) từ 3 thành phần (PC1, PC2, PC3) của các chỉ tiêu tài chính, giúp nén nhiều chiều xuống thành một thang điểm duy nhất.',
    },
    {
      icon: BarChart3,
      title: 'Percentile & Label',
      desc: 'Mỗi doanh nghiệp được xếp hạng theo percentile trong năm tương ứng. Nhãn rủi ro (Very High, High, Medium, Low) được gán dựa vào ngưỡng percentile, không phải đánh giá chủ quan.',
    },
    {
      icon: BookOpen,
      title: 'Minh bạch',
      desc: 'Toàn bộ pipeline có thể tái tạo lại kết quả. Các hệ số PCA, artifact, và ngưỡng đều được lưu dưới dạng JSON để kiểm chứng và audit.',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <ModelContextBar />
      <PageIntro
        text="Trang giới thiệu giải thích phương pháp luận, cách tính điểm, và các nguyên tắc minh bạch mà ProfitPulse tuân thủ."
        note="Nội dung trên ProfitPulse chỉ phục vụ phân tích và không phải khuyến nghị mua bán."
      />

      {/* Methodology */}
      <section>
        <h2 className="text-base sm:text-lg font-display font-bold text-white mb-3 sm:mb-4">Phương pháp luận</h2>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {methodologyCards.map(({ icon: Icon, title, desc }, idx) => (
            <div key={idx} className="card card-hover p-4 sm:p-5 space-y-2 sm:space-y-3 anim-stagger" style={{ '--i': idx }}>
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary-400" />
              </div>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Flow */}
      <section className="card p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-display font-bold text-white mb-3 sm:mb-4">Quy trình pipeline</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          {['Dữ liệu thô', 'Tiền xử lý', 'PCA fit', 'Scoring', 'Labeling', 'API / Dashboard'].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 text-white font-medium">
                <span className="w-6 h-6 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                {step}
              </span>
              {i < 5 && <span className="text-muted">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="card p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="text-base sm:text-lg font-display font-bold text-white">Cam kết minh bạch</h3>
        </div>
        <ul className="space-y-2 text-sm text-slate-300">
          {[
            'Không sử dụng dữ liệu nhạy cảm hoặc dữ liệu nội bộ chưa công bố.',
            'Pipeline có thể tái tạo 100% kết quả nếu cùng dữ liệu đầu vào.',
            'Các artifact PCA (loadings, variance) được lưu trữ minh bạch.',
            'Nhãn rủi ro dựa trên ngưỡng thống kê, không phải nhận định chủ quan.',
            'Tất cả biểu đồ đều ghi chú nguồn và giải thích.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Disclaimer */}
      <section className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h3 className="text-white font-semibold">Tuyên bố miễn trừ trách nhiệm</h3>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              ProfitPulse là công cụ phân tích dữ liệu, <span className="font-semibold text-amber-400">không phải khuyến nghị đầu tư</span>.
              Kết quả chỉ mang tính tham khảo và không nên được sử dụng làm căn cứ duy nhất cho quyết định mua/bán.
              Người dùng chịu hoàn toàn trách nhiệm với các quyết định đầu tư của mình.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center text-sm text-muted py-4">
        Phát triển bởi <span className="text-primary-400 font-medium">ProfitPulse Team</span> — Dữ liệu cập nhật định kỳ.
      </div>
    </div>
  );
};

export default About;
