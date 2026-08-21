'use strict';

const dict = {
  vi: {
    shop_name: 'CyberShop', tagline: 'Cửa hàng thiết bị an ninh mạng #1 Việt Nam',
    nav_shop: 'Sản phẩm', nav_cart: 'Giỏ hàng', nav_objectives: 'Mục tiêu', nav_orders: 'Đơn hàng', nav_profile: 'Tài khoản',
    nav_admin: 'Quản trị', nav_login: 'Đăng nhập', nav_register: 'Đăng ký', nav_logout: 'Thoát',
    search_placeholder: 'Tìm sản phẩm...', search_btn: 'Tìm',
    login_title: 'Đăng nhập', email: 'Email', password: 'Mật khẩu', login_btn: 'Đăng nhập',
    demo_account: 'Tài khoản demo: demo@cybershop.vn / demo123',
    register_title: 'Đăng ký tài khoản', name: 'Họ tên', register_btn: 'Đăng ký',
    otp_title: 'Xác thực OTP', otp_code: 'Mã OTP (4 số)', otp_verify: 'Xác nhận',
    add_to_cart: 'Thêm vào giỏ', price: 'Giá', reviews: 'Đánh giá', write_review: 'Viết đánh giá', submit: 'Gửi',
    cart_title: 'Giỏ hàng', checkout: 'Thanh toán', empty_cart: 'Giỏ hàng trống', remove: 'Xóa',
    orders_title: 'Đơn hàng của tôi', order_id: 'Mã đơn', status: 'Trạng thái', total: 'Tổng cộng', note: 'Ghi chú',
    profile_title: 'Tài khoản', change_password: 'Đổi mật khẩu', new_password: 'Mật khẩu mới',
    bio_placeholder: 'Giới thiệu bản thân...', save: 'Lưu',
    avatar_url: 'URL ảnh đại diện (server sẽ tải về)', fetch_avatar: 'Tải ảnh',
    import_title: 'Nhập sản phẩm từ XML', import_btn: 'Import XML',
    invoice_title: 'Hóa đơn', layout_tpl: 'Template hóa đơn',
    admin_panel: 'Bảng điều khiển quản trị', admin_audit: 'Nhật ký kiểm toán', admin_diag: 'Chẩn đoán mạng',
    admin_reviews: 'Kiểm duyệt đánh giá', admin_users_api: 'Danh sách người dùng (API)',
    diag_target: 'Tên miền/IP cần tra cứu', run: 'Chạy',
    
    not_found: 'Không tìm thấy trang', back_home: 'Về trang chủ',
    obj_title: 'Mục tiêu nhiệm vụ',
    obj_intro: 'Mỗi mục tiêu dưới đây mô tả một kết quả, không phải phương pháp. Khi thu được evidence token, nộp tại đây để xác nhận mục tiêu và xem bạn vừa chứng minh được điều gì. Ghi mọi finding vào journal của bạn.',
    obj_number: '#', obj_objective: 'Mục tiêu', obj_status: 'Trạng thái', obj_unknown: 'chưa xác nhận',
    obj_submit_label: 'Nộp evidence token', obj_verify: 'Xác nhận',
    obj_complete: 'HOÀN THÀNH MỤC TIÊU', obj_evidence: 'Bằng chứng:', obj_demonstrated: 'Bạn vừa chứng minh:',
    obj_technique: 'Kỹ thuật xác nhận:', obj_next: 'Bước tiếp theo:',
    obj_not_recognized: 'Không nhận diện được evidence token. Cứ khám phá tiếp — và ghi lại những gì đã thử.',
    welcome: 'Xin chào', lang_switch: 'EN', footer_note: 'Authorized Security Training Environment — Attacks outside this lab are prohibited.',
  },
  en: {
    shop_name: 'CyberShop', tagline: "Vietnam's #1 cybersecurity gear store",
    nav_shop: 'Products', nav_cart: 'Cart', nav_objectives: 'Objectives', nav_orders: 'Orders', nav_profile: 'Account',
    nav_admin: 'Admin', nav_login: 'Login', nav_register: 'Register', nav_logout: 'Logout',
    search_placeholder: 'Search products...', search_btn: 'Search',
    login_title: 'Login', email: 'Email', password: 'Password', login_btn: 'Sign in',
    demo_account: 'Demo account: demo@cybershop.vn / demo123',
    register_title: 'Create account', name: 'Full name', register_btn: 'Register',
    otp_title: 'OTP Verification', otp_code: 'OTP code (4 digits)', otp_verify: 'Verify',
    add_to_cart: 'Add to cart', price: 'Price', reviews: 'Reviews', write_review: 'Write a review', submit: 'Submit',
    cart_title: 'Shopping Cart', checkout: 'Checkout', empty_cart: 'Your cart is empty', remove: 'Remove',
    orders_title: 'My Orders', order_id: 'Order ID', status: 'Status', total: 'Total', note: 'Note',
    profile_title: 'Account Settings', change_password: 'Change password', new_password: 'New password',
    bio_placeholder: 'Tell us about yourself...', save: 'Save',
    avatar_url: 'Avatar image URL (fetched server-side)', fetch_avatar: 'Fetch image',
    import_title: 'Import products from XML', import_btn: 'Import XML',
    invoice_title: 'Invoice', layout_tpl: 'Invoice template',
    admin_panel: 'Admin Dashboard', admin_audit: 'Audit Log', admin_diag: 'Network Diagnostics',
    admin_reviews: 'Review Moderation', admin_users_api: 'User List (API)',
    diag_target: 'Domain/IP to resolve', run: 'Run',
    
    not_found: 'Page not found', back_home: 'Back to home',
    obj_title: 'Mission Objectives',
    obj_intro: 'Each objective below describes an outcome, not a method. When you obtain an evidence token, submit it here to confirm the objective and see what you just demonstrated. Record every finding in your journal.',
    obj_number: '#', obj_objective: 'Objective', obj_status: 'Status', obj_unknown: 'unknown',
    obj_submit_label: 'Submit evidence token', obj_verify: 'Verify',
    obj_complete: 'OBJECTIVE COMPLETED', obj_evidence: 'Evidence:', obj_demonstrated: 'You demonstrated:',
    obj_technique: 'Technique confirmed:', obj_next: 'Next:',
    obj_not_recognized: 'Not a recognized evidence token. Keep exploring — and write down what you tried.',
    welcome: 'Welcome', lang_switch: 'VI', footer_note: 'Authorized Security Training Environment — Attacks outside this lab are prohibited.',
  },
};

module.exports = function i18n(req, res, next) {
  const lang = req.cookies.lang === 'en' ? 'en' : 'vi';
  res.locals.lang = lang;
  res.locals.t = (key) => dict[lang][key] || key;
  // NOTE: res.locals.user is set by sessionMiddleware (runs after this),
  // because req.user is only decoded there.
  next();
};
