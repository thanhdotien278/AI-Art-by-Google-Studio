import { UsageStats } from '../types';

/**
 * =====================================================================================
 * == HƯỚNG DẪN CÀI ĐẶT GOOGLE APPS SCRIPT ==
 * =====================================================================================
 * 1. Mở Google Sheet, vào "Tiện ích mở rộng" > "Apps Script".
 * 2. Dán mã nguồn cho Code.gs (được cung cấp ở phần sau) vào trình soạn thảo.
 * 3. Nhấn "Triển khai" > "Tạo mục triển khai mới".
 * - Chọn loại: "Ứng dụng web".
 * - Ai có quyền truy cập: "Bất kỳ ai".
 * 4. Sao chép URL ứng dụng web mới và dán vào biến GOOGLE_APP_SCRIPT_URL bên dưới.
 * =====================================================================================
 */
const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnrjbQ52dV3QbpydExm0ZRCkh3GtyAZrpGL1nPVeySAMOh9A1WTj1R35cxMYeB03br/exec';

// Hàm ghi log tối giản để đếm lượt sử dụng
export const logToSheet = (logData: { type: 'Image' | 'Video' }): void => {
  if (!GOOGLE_APP_SCRIPT_URL || GOOGLE_APP_SCRIPT_URL.includes('YOUR_GOOGLE')) {
    console.warn("Chức năng ghi log ra Google Sheet đang tắt. Vui lòng cập nhật URL Apps Script của bạn.");
    return;
  }

  const payload = {
    type: logData.type,
  };

  fetch(GOOGLE_APP_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors', 
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  }).catch(error => {
    console.error("Ghi log ra Google Sheet thất bại:", error);
  });
};

// Hàm lấy thông số sử dụng
export const getUsageStats = async (): Promise<UsageStats | null> => {
   if (!GOOGLE_APP_SCRIPT_URL || GOOGLE_APP_SCRIPT_URL.includes('YOUR_GOOGLE')) {
    console.warn("Chức năng thống kê đang tắt. Vui lòng cập nhật URL Apps Script.");
    return null;
  }
  
  try {
    // We are changing this from a GET to a POST request.
    // The "Failed to fetch" error is characteristic of a CORS (Cross-Origin Resource Sharing)
    // issue. It's likely the Google Apps Script backend handles CORS correctly for POST
    // requests (as other POSTs in the app work) but not for GET requests.
    // By sending a POST with a specific action, we use the working CORS path.
    const payload = {
      action: 'getStats'
    };

    const response = await fetch(GOOGLE_APP_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
    }
    
    const result = await response.json();

    if (result.status === 'success') {
      return result.data;
    } else {
      console.error('Lỗi từ Apps Script:', result.message);
      throw new Error(result.message || 'Không thể lấy dữ liệu thống kê từ Apps Script.');
    }
  } catch (error) {
    console.error("Không thể lấy dữ liệu thống kê:", error);
    return null;
  }
};