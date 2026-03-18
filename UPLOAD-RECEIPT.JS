// api/upload-receipt.js
import { createRouter } from 'next-connect';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';

const router = createRouter();

// Cấu hình CORS
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Cấu hình multer cho upload file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)'));
    }
  }
});

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hàm xử lý OCR với tiếng Việt
async function processOCR(imageBuffer) {
  try {
    console.log('🔄 Đang xử lý OCR...');
    
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'vie', // Ngôn ngữ tiếng Việt
      {
        logger: progress => {
          if (progress.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(progress.progress * 100)}%`);
          }
        },
        tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ.,-/ '
      }
    );

    console.log('✅ OCR hoàn thành');
    return text;
  } catch (error) {
    console.error('❌ OCR Error:', error);
    throw new Error('Không thể đọc được hóa đơn. Vui lòng thử lại với ảnh rõ hơn.');
  }
}

// Hàm phân tích bằng AI
async function analyzeWithAI(text) {
  try {
    console.log('🔄 Đang phân tích bằng AI...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Bạn là chuyên gia phân tích hóa đơn tiếng Việt. Hãy phân tích nội dung hóa đơn sau và trả về JSON với các trường:
      {
        "date": "YYYY-MM-DD", // Ngày trên hóa đơn, nếu không có thì dùng ngày hiện tại
        "vendor": "Tên nhà cung cấp/cửa hàng",
        "total": 0, // Tổng tiền (chỉ lấy số, không bao gồm ký tự đặc biệt)
        "category": "food/utilities/salary/transport/office/other", // Phân loại chi phí
        "description": "Mô tả ngắn về hóa đơn (tiếng Việt)",
        "items": [] // Danh sách các mặt hàng nếu có
      }

      Quy tắc phân loại:
      - food: Nguyên liệu, thực phẩm, đồ uống, nhà hàng
      - utilities: Điện, nước, internet, điện thoại
      - salary: Lương, thưởng, phụ cấp
      - transport: Xăng xe, vận chuyển, giao hàng
      - office: Văn phòng phẩm, thiết bị văn phòng
      - other: Các chi phí khác

      Nội dung hóa đơn:
      ${text}

      CHỈ TRẢ VỀ JSON, KHÔNG THÊM TEXT KHÁC.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    // Parse JSON từ response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Không thể phân tích được định dạng JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Chuẩn hóa dữ liệu
    return {
      date: analysis.date || new Date().toISOString().split('T')[0],
      vendor: analysis.vendor || 'Không xác định',
      total: parseFloat(analysis.total) || 0,
      category: analysis.category || 'other',
      description: analysis.description || text.substring(0, 200),
      items: analysis.items || [],
      raw_text: text.substring(0, 1000)
    };

  } catch (error) {
    console.error('❌ AI Analysis Error:', error);
    // Fallback nếu AI lỗi
    return {
      date: new Date().toISOString().split('T')[0],
      vendor: 'Không xác định',
      total: 0,
      category: 'other',
      description: text.substring(0, 200),
      items: [],
      raw_text: text.substring(0, 1000)
    };
  }
}

// API endpoint
router.post(upload.single('receipt'), async (req, res) => {
  try {
    // Set charset cho response
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vui lòng chọn file hóa đơn' 
      });
    }

    console.log('📄 Nhận file:', req.file.originalname);
    console.log('📏 Kích thước:', req.file.size, 'bytes');

    // Bước 1: OCR
    const ocrText = await processOCR(req.file.buffer);
    
    if (!ocrText || ocrText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Không đọc được nội dung từ ảnh. Vui lòng chụp ảnh rõ hơn.'
      });
    }

    console.log('📝 OCR Text:', ocrText.substring(0, 200) + '...');

    // Bước 2: Phân tích bằng AI
    const analysis = await analyzeWithAI(ocrText);

    // Bước 3: Trả về kết quả
    res.json({
      success: true,
      data: analysis,
      message: 'Đọc và phân loại hóa đơn thành công'
    });

  } catch (error) {
    console.error('❌ Upload Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Có lỗi xảy ra khi xử lý hóa đơn' 
    });
  }
});

// Xử lý OPTIONS request
router.options((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

export default router.handler({
  onError: (err, req, res) => {
    console.error('❌ Router Error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Internal Server Error' 
    });
  }
});