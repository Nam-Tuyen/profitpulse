import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, TrendingUp, Database, Book, Target } from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadAboutData();
  }, []);
  
  const loadAboutData = async () => {
    try {
      const data = await apiService.getAbout();
      setAboutData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading about data:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Đang tải thông tin..." />;
  }
  
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 sm:p-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center">
          <Shield className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Về ProfitPulse
          </h1>
          <p className="text-indigo-100 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            ProfitPulse giúp người dùng theo dõi "sức khỏe lợi nhuận" của doanh nghiệp niêm yết 
            bằng cách kết hợp nhiều chỉ tiêu (ROA, ROE, ROC, EPS, NPM) thành một điểm tổng hợp 
            và dự báo rủi ro năm tới dựa trên Machine Learning.
          </p>
        </div>
      </div>
      
      {/* Mission Statement */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Sứ mệnh
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ProfitPulse ra đời với mục tiêu hỗ trợ nhà đầu tư cá nhân và phân tích viên 
              trong việc <strong>sàng lọc và theo dõi tình hình lợi nhuận</strong> của công ty niêm yết 
              một cách nhanh chóng và khách quan.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Thay vì phải phân tích thủ công từng chỉ tiêu tài chính, người dùng có thể dựa vào 
              <strong> ProfitScore</strong> (điểm tổng hợp) và <strong>dự báo Risk</strong> để ưu tiên xem công ty nào 
              cần quan tâm ngay, tiết kiệm thời gian và công sức.
            </p>
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="h-7 w-7 mr-3 text-purple-600" />
          Cách hoạt động
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Tổng hợp
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Kết hợp 5 chỉ tiêu lợi nhuận (ROA, ROE, ROC, EPS, NPM) bằng phương pháp PCA 
              để tạo ra <strong>ProfitScore</strong> - điểm tổng hợp phản ánh "sức khỏe lợi nhuận".
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg flex items-center justify-center font-bold mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Dự báo
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Sử dụng Machine Learning (SVM, Random Forest, XGBoost) để tính <strong>Chance</strong> - 
              xác suất duy trì trạng thái lợi nhuận tốt ở năm tiếp theo (t+1).
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-xl p-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg flex items-center justify-center font-bold mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Giải thích
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Đưa ra <strong>lý do ngắn</strong> dựa trên ngưỡng các chỉ tiêu (ProfitScore < -0.5, ROA < 0.02, NPM < 0.03) 
              và <strong>gợi ý hành động</strong> cụ thể cho người dùng.
            </p>
          </div>
        </div>
      </div>
      
      {/* Trust & Transparency */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Shield className="h-7 w-7 mr-3 text-green-600" />
          Độ tin cậy & Minh bạch
        </h2>
        
        {aboutData && (
          <div className="space-y-6">
            {/* Model Performance */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Chất lượng mô hình
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(aboutData.model_metrics?.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">F1-Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(aboutData.model_metrics?.f1_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">AUC</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(aboutData.model_metrics?.auc * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Train/Test Split theo thời gian:</strong> Mô hình được huấn luyện trên dữ liệu 
                đến năm {aboutData.methodology?.train_period || '2020'}, sau đó kiểm tra trên dữ liệu từ 
                năm {aboutData.methodology?.test_start_year || '2021'} trở đi. 
                Điều này đảm bảo mô hình <strong>không nhìn trước tương lai</strong>.
              </p>
            </div>
            
            {/* Methodology */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Book className="h-5 w-5 mr-2 text-blue-600" />
                Phương pháp
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Tiền xử lý:
                  </p>
                  <p className="text-sm text-gray-700">
                    {aboutData.methodology?.preprocessing || 'Chuẩn hóa (Z-score), loại bỏ outliers, PCA'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Đặc trưng chính:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aboutData.methodology?.features?.map((feature, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {feature}
                      </span>
                    )) || ['ROA', 'ROE', 'ROC', 'EPS', 'NPM'].map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Mô hình:
                  </p>
                  <p className="text-sm text-gray-700">
                    Ensemble của SVM, Random Forest, XGBoost với vote đa số hoặc trung bình xác suất
                  </p>
                </div>
              </div>
            </div>
            
            {/* Data Coverage */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-600" />
                Phạm vi dữ liệu
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tổng số công ty</p>
                  <p className="text-xl font-bold text-gray-900">
                    {aboutData.data_coverage?.total_firms || '900+'} mã
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Khoảng thời gian</p>
                  <p className="text-xl font-bold text-gray-900">
                    {aboutData.data_coverage?.years || '2008-2024'}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mt-4">
                <strong>Chính sách dữ liệu thiếu:</strong> {aboutData.data_coverage?.missing_data_policy || 'Strict mode'} - 
                Không impute giá trị thiếu, chỉ báo cáo coverage để người dùng tự đánh giá độ tin cậy.
              </p>
            </div>
            
            {/* Trust Badges */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Cam kết minh bạch
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {aboutData.trust_indicators?.train_test_split || 'Train ≤ 2020, Test 2021+'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Temporal split đảm bảo không data leakage
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Không có preprocessing leakage
                    </p>
                    <p className="text-xs text-gray-600">
                      Mọi bước chuẩn hóa học từ TRAIN và áp nguyên cho TEST
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Cross-validation & hyperparameter tuning
                    </p>
                    <p className="text-xs text-gray-600">
                      Lựa chọn tham số dựa trên validation set độc lập
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Limitations */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
          <AlertCircle className="h-6 w-6 mr-2" />
          Giới hạn & Khuyến cáo
        </h2>
        
        <div className="space-y-3 text-sm text-red-800 leading-relaxed">
          <p>
            ⚠️ <strong>Không thay thế phân tích định tính:</strong> ProfitPulse chỉ là công cụ sàng lọc nhanh. 
            Người dùng cần đọc thuyết minh báo cáo tài chính, tin tức ngành, và phân tích định tính để có quyết định đầy đủ.
          </p>
          
          <p>
            ⚠️ <strong>Không phải khuyến nghị mua/bán:</strong> Risk High không đồng nghĩa với "nên bán ngay", 
            và Risk Low không đồng nghĩa với "nên mua ngay". Đây chỉ là dự báo xác suất dựa trên dữ liệu lịch sử.
          </p>
          
          <p>
            ⚠️ <strong>Giới hạn dữ liệu:</strong> Chất lượng dự báo phụ thuộc vào độ đầy đủ và chính xác của dữ liệu đầu vào. 
            Dữ liệu thiếu sẽ được báo cáo rõ trong phần Data Coverage của từng công ty.
          </p>
          
          <p>
            ⚠️ <strong>Biến động thị trường:</strong> Mô hình học từ dữ liệu quá khứ và có thể không phản ánh 
            kịp các sự kiện đột ngột (khủng hoảng, thay đổi chính sách, M&A lớn).
          </p>
        </div>
      </div>
      
      {/* Contact/Feedback */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-xl p-6 sm:p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Đóng góp ý kiến
        </h2>
        <p className="text-indigo-100 mb-6">
          ProfitPulse vẫn đang trong quá trình cải thiện. Mọi phản hồi và đề xuất tính năng mới 
          đều được đón nhận để phục vụ cộng đồng tốt hơn.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <span className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium">
            📧 profitpulse@example.com
          </span>
          <span className="px-6 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium">
            🐛 GitHub Issues
          </span>
        </div>
      </div>
    </div>
  );
};

export default About;
