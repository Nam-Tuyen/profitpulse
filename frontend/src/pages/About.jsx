import { ShieldCheck, AlertTriangle } from 'lucide-react';

const About = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Giới thiệu */}
      <section className="card p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Giới thiệu</h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          ProfitPulse là website giúp bạn theo dõi và phân tích sức khỏe lợi nhuận của các doanh nghiệp được niêm yết trên sàn chứng khoán tại Việt Nam theo từng năm bằng một bộ chỉ báo đơn giản và dễ quan sát. Thay vì phải đọc nhiều bảng báo cáo tài chính rời rạc, hệ thống tổng hợp các chỉ số lợi nhuận cốt lõi thành một điểm lợi nhuận duy nhất gọi là điểm ProfitScore giúp bạn có thể so sánh các doanh nghiệp trong cùng một năm từ đó nhận diện doanh nghiệp nổi bật và phát hiện sớm các tín hiệu rủi ro.
        </p>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Khi sử dụng ProfitPulse, bạn có thể bắt đầu từ trang chủ để xem tổng quan thị trường theo từng năm, sau đó tìm mã cổ phiếu bạn quan tâm để mở trang doanh nghiệp và xem chi tiết điểm lợi nhuận, vị trí của doanh nghiệp so với thị trường và xu hướng của doanh nghiệp đó trong nhiều năm. Nếu bạn muốn lọc nhanh một nhóm doanh nghiệp, trang bộ lọc cho phép bạn chọn năm và khoảng điểm để tìm ra danh sách phù hợp, rồi chuyển sang trang so sánh để có thể đưa nhiều doanh nghiệp lên cùng một thang đo để đối chiếu và đánh giá mức ổn định theo thời gian. Trang cảnh báo giúp bạn theo dõi các doanh nghiệp có sự thay đổi đáng chú ý về điểm số và nhãn rủi ro để ưu tiên đi sâu vào kiểm tra và phân tích
        </p>
      </section>

      {/* Phương pháp luận */}
      <section className="card p-4 sm:p-6 space-y-4 sm:space-y-5">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Phương pháp luận</h2>

        {/* Dữ liệu gốc */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-display font-bold text-white">Dữ liệu gốc</h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            ProfitPulse sử dụng dữ liệu từ báo cáo tài chính đã kiểm toán của các doanh nghiệp niêm yết trên thị trường chứng khoán Việt Nam. Dữ liệu được chuẩn hóa và kiểm tra chất lượng trước khi đưa vào hệ thống tính toán nhằm đảm bảo các chỉ số được so sánh nhất quán giữa các doanh nghiệp và giữa các năm.
          </p>
        </div>

        {/* Điểm ProfitScore */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-display font-bold text-white">Điểm ProfitScore</h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Điểm ProfitScore là điểm lợi nhuận tổng hợp dùng để so sánh nhanh giữa các doanh nghiệp trong cùng một năm. Điểm này được tạo bằng phương pháp phân tích thành phần chính gọi là phân tích thành phần chính (Principal Component Analysis), trong đó nhiều chỉ số tài chính được rút gọn thành ba thành phần đại diện là PC1, PC2, PC3. Ba thành phần này giúp tóm tắt phần lớn thông tin quan trọng của dữ liệu và sau đó được kết hợp để tạo ra thang điểm ProfitScore.
          </p>
        </div>

        {/* Xếp hạng phân vị */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-display font-bold text-white">Xếp hạng phân vị và nhãn rủi ro</h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Mỗi doanh nghiệp được xếp hạng theo phân vị trong năm, còn gọi là phân vị (Percentile), để bạn biết doanh nghiệp đang đứng ở đâu so với toàn thị trường trong đúng năm đó. Hệ thống cũng gán nhãn rủi ro theo quy tắc thống kê nhất quán nhằm hỗ trợ theo dõi sớm các trường hợp cần chú ý, trong đó nhãn rủi ro được hiểu là mức cảnh báo dựa trên dữ liệu chứ không phải đánh giá chủ quan.
          </p>
        </div>
      </section>

      {/* Quy trình xử lý dữ liệu */}
      <section className="card p-4 sm:p-6 space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-display font-bold text-white">Quy trình xử lý dữ liệu</h3>
        <div className="space-y-2.5 text-sm sm:text-base text-slate-300">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs font-bold">1</span>
            <p className="leading-relaxed pt-0.5">Dữ liệu thô được thu thập từ báo cáo tài chính đã kiểm toán.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs font-bold">2</span>
            <p className="leading-relaxed pt-0.5">Dữ liệu được tiền xử lý để đảm bảo đúng định dạng và giảm ảnh hưởng của giá trị bất thường.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs font-bold">3</span>
            <p className="leading-relaxed pt-0.5">Thực hiện phân tích thành phần chính (Principal Component Analysis) để tạo ra PC1, PC2, PC3.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs font-bold">4</span>
            <p className="leading-relaxed pt-0.5">Tính điểm ProfitScore từ các thành phần PC.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs font-bold">5</span>
            <p className="leading-relaxed pt-0.5">Gán nhãn rủi ro theo quy tắc đã công bố.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center text-xs font-bold">6</span>
            <p className="leading-relaxed pt-0.5">Kết quả được cung cấp qua giao diện lập trình ứng dụng (API) và hiển thị trên bảng điều khiển (Dashboard).</p>
          </div>
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

      {/* Footer */}
      <div className="text-center text-sm text-muted py-4">
        Phát triển bởi <span className="text-primary-400 font-medium">ProfitPulse Team</span> và dữ liệu được cập nhật định kỳ.
      </div>
    </div>
  );
};

export default About;
