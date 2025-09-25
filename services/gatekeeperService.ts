import { FormData } from '../types';

/**
 * =====================================================================================
 * == HƯỚNG DẪN CẤU HÌNH GATEKEEPER SERVICE ==
 * =====================================================================================
 * 1.  Triển khai mã nguồn Google Apps Script (được cung cấp riêng) dưới dạng Web App.
 * 2.  Trong file Script, đặt một MASTER_KEY (chuỗi bí mật) của riêng bạn.
 * 3.  Sao chép URL của Web App đã triển khai và dán vào biến GATEKEEPER_URL bên dưới.
 * 4.  Sao chép chuỗi MASTER_KEY từ Script và dán vào biến SECRET_KEY bên dưới.
 * Chúng phải khớp nhau để xác thực thành công.
 * =====================================================================================
 */
const GATEKEEPER_URL = 'https://script.google.com/macros/s/AKfycbxnrjbQ52dV3QbpydExm0ZRCkh3GtyAZrpGL1nPVeySAMOh9A1WTj1R35cxMYeB03br/exec';

// Khóa này phải khớp với MASTER_KEY được đặt trong Google Apps Script của bạn.
// Đây là một mã bí mật đơn giản để xác thực cơ bản.
const SECRET_KEY = 'HoaSiSieuThuc_Anhtuanpsu_@2024!'; // <-- THAY BẰNG MÃ BÍ MẬT CỦA BẠN

interface GatekeeperResponse {
    status: 'success' | 'error';
    prompt?: string;
    techDetails?: string;
    message?: string;
}

/**
 * Lấy một prompt được tạo an toàn từ dịch vụ "người gác cổng" (gatekeeper) ở backend.
 * @param formData Dữ liệu từ form của người dùng.
 * @param hasReferenceImage Cho biết có ảnh tham chiếu bối cảnh hay không.
 * @param language Ngôn ngữ mong muốn cho prompt (backend sẽ xử lý việc dịch).
 * @returns Một promise trả về prompt và chi tiết kỹ thuật đã được tạo.
 */
export const getSecurePrompt = async (
    formData: FormData, 
    hasReferenceImage: boolean,
    language: 'vi' | 'en'
): Promise<{ prompt: string; techDetails: string }> => {

    if (!GATEKEEPER_URL || GATEKEEPER_URL.includes('YOUR_GOOGLE')) {
        throw new Error("Dịch vụ tạo prompt chưa được cấu hình. Vui lòng liên hệ nhà phát triển.");
    }

    const payload = {
        action: 'generatePrompt', // Action cụ thể cho việc tạo prompt
        secret: SECRET_KEY,
        language,
        hasReferenceImage,
        formData,
    };

    try {
        const response = await fetch(GATEKEEPER_URL, {
            method: 'POST',
            mode: 'cors', // Apps Script cần CORS
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script web apps thường hoạt động tốt nhất với text/plain
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        if (!response.ok) {
             throw new Error(`Lỗi mạng khi giao tiếp với dịch vụ prompt. Trạng thái: ${response.status}`);
        }
        
        const result: GatekeeperResponse = await response.json();

        if (result.status === 'success' && result.prompt && result.techDetails) {
            return { prompt: result.prompt, techDetails: result.techDetails };
        } else {
             if (result.message === 'UNAUTHORIZED') {
                 // Ném một mã lỗi cụ thể để UI có thể bắt và dịch
                 throw new Error("GATEKEEPER_UNAUTHORIZED");
             }
            throw new Error(result.message || 'Không thể tạo prompt từ dịch vụ an toàn.');
        }

    } catch (error) {
        console.error("Lỗi khi lấy prompt an toàn:", error);
        if (error instanceof Error) {
            // "Bắt" lỗi mạng (như lỗi CORS trên các app bị sao chép)
            // và coi đó là hành vi truy cập trái phép. Điều này ngăn việc
            // hiển thị lỗi "Failed to fetch" chung chung cho người dùng.
            if (error.message.includes('Failed to fetch')) {
                throw new Error("GATEKEEPER_UNAUTHORIZED");
            }
            // Ném lại các lỗi cụ thể khác (ví dụ: từ logic phía máy chủ).
            throw error;
        }
        // Fallback cho các lỗi không xác định.
        throw new Error('Đã xảy ra lỗi không mong muốn khi liên hệ với dịch vụ tạo prompt.');
    }
};