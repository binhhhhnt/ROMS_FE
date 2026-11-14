import axios from 'axios'

export const SYSTEM_ERROR_MESSAGE =
  'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.'

const SYSTEM_ERROR_CODES = new Set<string>([
  'INTERNAL_SERVER_ERROR',
  'TAX_CATEGORY_CREATION_FAILED',
  'EXCEL_GENERATE_ERROR',
  'EXCEL_EXPORT_ERROR',
])

export const ERROR_CODE_MESSAGES: Record<string, string> = {
  // 1. Auth & Tài khoản
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  ACCOUNT_INACTIVE: 'Tài khoản đã bị khóa hoặc tạm ngưng hoạt động.',
  INVALID_OTP: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.',
  OTP_EXPIRED_OR_INVALID: 'Mã OTP đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu mã mới.',
  OTP_MAX_ATTEMPTS_EXCEEDED: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới.',
  INVALID_CURRENT_PASSWORD: 'Mật khẩu hiện tại không đúng.',
  PASSWORD_UNCHANGED: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  CANNOT_DEACTIVATE_SELF: 'Bạn không thể tự khóa tài khoản của chính mình.',
  DUPLICATE_USERNAME: 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác.',
  DUPLICATE_EMAIL: 'Địa chỉ email này đã được sử dụng bởi tài khoản khác.',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản người dùng.',

  // 2. Bàn & Phiên phục vụ
  TABLE_NOT_FOUND: 'Không tìm thấy thông tin bàn ăn yêu cầu.',
  DUPLICATE_TABLE_CODE: 'Mã bàn này đã tồn tại. Vui lòng chọn mã bàn khác.',
  TABLE_INACTIVE: 'Bàn ăn đang tạm ngưng hoạt động.',
  TABLE_HAS_ACTIVE_SESSION: 'Không thể thao tác khi bàn đang có phiên phục vụ hoạt động.',
  TABLE_ALREADY_ASSIGNED: 'Bàn ăn này đã được liên kết với một tài khoản máy tính bảng khác.',
  INVALID_TABLE_ASSIGNMENT: 'Tài khoản nhân viên không được phép gán bàn ăn.',
  SESSION_NOT_ACTIVE: 'Phiên phục vụ hiện không còn hoạt động.',
  SESSION_ALREADY_ACTIVE: 'Bàn này đang có phiên phục vụ hoạt động.',
  SESSION_ALREADY_CLOSED: 'Phiên phục vụ đã được đóng trước đó.',
  SESSION_HAS_UNFINISHED_ITEMS: 'Không thể đóng phiên khi vẫn còn món ăn chưa hoàn tất.',
  SESSION_CANNOT_CLOSE_WITHOUT_BILL: 'Vui lòng tạo và thanh toán hóa đơn trước khi đóng phiên.',
  TRANSFER_SAME_TABLE: 'Vui lòng chọn một bàn đích khác với bàn hiện tại.',
  TARGET_TABLE_OCCUPIED: 'Bàn đích hiện đang có khách. Vui lòng chọn bàn trống.',
  TARGET_TABLE_INACTIVE: 'Bàn đích đang tạm ngưng hoạt động.',
  TARGET_TABLE_ACCOUNT_LOCKED: 'Tài khoản máy tính bảng của bàn đích đang bị khóa.',

  // 3. Gọi món QR
  QR_ORDERING_DISABLED: 'Chức năng gọi món qua QR hiện đang tạm tắt.',
  PENDING_QR_ORDERS_EXIST:
    'Bàn vẫn còn yêu cầu gọi món QR đang chờ xác nhận. Vui lòng xác nhận hoặc hủy trước.',
  QR_ORDER_ALREADY_PROCESSED: 'Yêu cầu gọi món QR này đã được nhân viên khác xử lý.',
  EMPTY_ITEMS: 'Danh sách món gọi không được để trống.',

  // 4. Thực đơn, Danh mục, Công thức & Excel
  CATEGORY_IN_USE: 'Danh mục đang chứa món ăn. Vui lòng chuyển hoặc xóa món trước.',
  MENU_ITEM_IN_USE: 'Món ăn đã phát sinh đơn hàng, không thể xóa. Bạn có thể chọn Ngưng phục vụ.',
  MENU_ITEM_NOT_SELLABLE: 'Món ăn hiện không đủ nguyên liệu hoặc đang tạm ngưng phục vụ.',
  MENU_ITEM_UNAVAILABLE: 'Món ăn hiện đang tạm hết hoặc không thể phục vụ.',
  NO_RECIPE: 'Món ăn chưa có công thức định lượng (BOM). Vui lòng thiết lập công thức trước.',
  DUPLICATE_RECIPE_ITEM: 'Nguyên liệu này đã có trong công thức của món ăn.',
  INACTIVE_INGREDIENT: 'Nguyên liệu đã ngưng sử dụng, không thể thêm vào công thức.',
  INVALID_FILE: 'File tải lên không hợp lệ hoặc bị rỗng.',
  INVALID_FILE_FORMAT: 'Định dạng file không được hỗ trợ. Vui lòng kiểm tra lại.',
  EMPTY_SHEET: 'File Excel không có dữ liệu. Vui lòng kiểm tra lại.',
  EXCEL_PARSE_ERROR: 'Không đọc được nội dung file Excel. Vui lòng dùng đúng file mẫu.',
  EXCEL_DUPLICATES_CONFIRMATION_REQUIRED: 'Phát hiện dữ liệu trùng lặp trong file Excel cần xác nhận.',

  // 5. Order & Bếp
  EMPTY_ORDER_ITEMS: 'Đơn hàng phải có ít nhất một món.',
  INVALID_ORDER_STATUS: 'Trạng thái đơn hàng không hợp lệ cho thao tác này.',
  INVALID_ORDER_ITEM: 'Món trong đơn hàng không hợp lệ.',
  INVALID_ORDER_ITEM_STATUS: 'Trạng thái món không hợp lệ cho thao tác này.',
  INVALID_ORDER_ITEM_TRANSITION: 'Không thể chuyển trạng thái món theo thao tác này.',
  INVALID_CANCEL_QUANTITY: 'Số lượng hủy không hợp lệ.',
  INVALID_RETURN_QUANTITY: 'Số lượng trả món không hợp lệ.',
  RETURN_EXCEEDS_QUANTITY: 'Số lượng trả vượt quá số lượng đã gọi.',
  NOT_DIRECT_SALE: 'Chỉ có thể trả các món bán trực tiếp.',
  ITEM_CANCELLED: 'Món này đã được hủy trước đó.',

  // 6. Thanh toán, Hóa đơn, Thuế & Khuyến mãi
  BILL_ALREADY_EXISTS: 'Phiên phục vụ này đã được xuất hóa đơn trước đó.',
  EMPTY_BILL: 'Không thể tạo hóa đơn khi phiên chưa có món hợp lệ.',
  PAYMENT_REQUIRED: 'Vui lòng hoàn tất thanh toán trước khi thực hiện thao tác này.',
  PAYMENT_AMOUNT_MISMATCH: 'Số tiền thanh toán không khớp với tổng tiền hóa đơn.',
  TAX_CATEGORY_NOT_FOUND: 'Không tìm thấy cấu hình thuế yêu cầu.',
  TAX_RATE_ALREADY_EXISTS: 'Mức thuế này đã tồn tại trong hệ thống.',
  INVALID_TAX_RATE: 'Mức thuế suất không hợp lệ.',
  PROMOTION_CODE_ALREADY_EXISTS: 'Mã khuyến mãi này đã tồn tại trong hệ thống.',
  INVALID_DISCOUNT_PERCENT: 'Phần trăm giảm giá phải nằm trong khoảng từ 0% đến 100%.',
  INVALID_DATE_RANGE: 'Ngày kết thúc không được trước ngày bắt đầu.',
  INVALID_PROMOTION_CODE: 'Mã khuyến mãi không tồn tại hoặc không hợp lệ.',
  PROMOTION_INACTIVE: 'Mã khuyến mãi đã bị tạm ngưng.',
  PROMOTION_NOT_STARTED: 'Mã khuyến mãi chưa đến ngày bắt đầu áp dụng.',
  PROMOTION_EXPIRED: 'Mã khuyến mãi đã hết hạn sử dụng.',
  PROMOTION_MAX_USES_REACHED: 'Mã khuyến mãi đã hết lượt sử dụng.',

  // 7. Kho & Nhập hàng
  INSUFFICIENT_STOCK: 'Nguyên liệu trong kho không đủ để đáp ứng yêu cầu.',
  INGREDIENT_IN_USE: 'Nguyên liệu đang được sử dụng trong công thức món, không thể xóa.',
  INGREDIENT_INACTIVE: 'Nguyên liệu đang tạm ngưng sử dụng.',
  DUPLICATE_INGREDIENT_NAME: 'Tên nguyên liệu này đã tồn tại.',
  INVALID_MINIMUM_STOCK: 'Mức tồn kho tối thiểu không hợp lệ.',
  INVALID_QUANTITY: 'Số lượng phải lớn hơn 0.',
}

const PATTERN_TRANSLATIONS: Array<[RegExp, string]> = [
  [/invalid username or password|bad credentials/i, 'Tên đăng nhập hoặc mật khẩu không đúng.'],
  [/account is inactive/i, 'Tài khoản đã bị khóa hoặc tạm ngưng hoạt động.'],
  [/session has expired|session has been revoked|refresh token is required/i, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'],
  [/cannot deactivate your own account/i, 'Bạn không thể tự khóa tài khoản của chính mình.'],
  [/already linked to user|already assigned/i, 'Bàn ăn này đã được liên kết với một tài khoản máy tính bảng khác.'],
  [/email is already in use|duplicate_email/i, 'Địa chỉ email này đã được sử dụng bởi tài khoản khác.'],
  [/username is already taken|duplicate_username/i, 'Tên đăng nhập này đã tồn tại trong hệ thống.'],
  [/table id is required/i, 'Bắt buộc phải chọn một bàn ăn cho máy tính bảng.'],
  [/cannot link account to an inactive table/i, 'Không thể liên kết tài khoản với bàn đang ngưng hoạt động.'],
  [/staff accounts cannot be linked to a table/i, 'Tài khoản nhân viên không được liên kết với bàn ăn.'],
  [/password must be at least|password length/i, 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.'],
  [/full name cannot be blank/i, 'Họ và tên không được để trống.'],
  [/email must be valid/i, 'Địa chỉ email không đúng định dạng.'],
  [/startdate cannot be after enddate/i, 'Ngày kết thúc không được trước ngày bắt đầu.'],
  [/access is denied|forbidden|is not permitted|cannot .* order|only .* can /i, 'Bạn không có quyền thực hiện thao tác này.'],
  [/unauthorized|authentication required/i, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'],
  [/must not be blank|must not be empty|must not be null|is required/i, 'Vui lòng nhập đầy đủ thông tin bắt buộc.'],
  [/must be positive|must be greater than 0/i, 'Giá trị nhập vào phải lớn hơn 0.'],
  [/network error|failed to fetch|timeout/i, 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'],
  [/unexpected internal server error/i, SYSTEM_ERROR_MESSAGE],
]

function hasVietnameseDiacritics(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
    text
  )
}

function looksTechnical(text: string): boolean {
  return /with id:|exception|constraint|sql|stack|request failed with status code|missing required parameter|invalid parameter format/i.test(
    text
  )
}

export function getHttpStatusFallback(status?: number): string {
  if (!status) return 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
  if (status === 400) return 'Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.'
  if (status === 401) return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện hành động này.'
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.'
  if (status === 409) return 'Dữ liệu đang có xung đột. Vui lòng kiểm tra lại.'
  if (status >= 500) return SYSTEM_ERROR_MESSAGE
  return 'Có lỗi xảy ra. Vui lòng thử lại sau.'
}

function translateRawMessage(message: string, status?: number): string {
  const trimmed = message.trim()
  if (!trimmed) return getHttpStatusFallback(status)

  for (const [pattern, viText] of PATTERN_TRANSLATIONS) {
    if (pattern.test(trimmed)) {
      return viText
    }
  }

  // Giữ lại thông báo tiếng Việt có ngữ cảnh (ví dụ lỗi từng dòng Excel) nếu không chứa lỗi kỹ thuật
  if (hasVietnameseDiacritics(trimmed) && !looksTechnical(trimmed)) {
    return trimmed
  }

  // Không để lọt message tiếng Anh/kỹ thuật nguyên văn từ BE lên UI
  return getHttpStatusFallback(status)
}

export function resolveApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status && status >= 500) {
      return SYSTEM_ERROR_MESSAGE
    }

    const responseData = error.response?.data as
      | { message?: string; error?: { code?: string; details?: unknown } }
      | undefined
    const errorCode = responseData?.error?.code
    const errorDetails = responseData?.error?.details
    const rawMessage = responseData?.message

    if (errorCode && SYSTEM_ERROR_CODES.has(errorCode)) {
      return SYSTEM_ERROR_MESSAGE
    }

    if (errorCode === 'VALIDATION_ERROR' && errorDetails && typeof errorDetails === 'object') {
      const firstDetail = Object.values(errorDetails as Record<string, unknown>).find(
        (val): val is string => typeof val === 'string' && val.trim().length > 0
      )
      if (firstDetail) {
        return translateRawMessage(firstDetail, status ?? 400)
      }
    }

    if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
      return ERROR_CODE_MESSAGES[errorCode]
    }

    if (rawMessage) {
      return translateRawMessage(rawMessage, status)
    }

    if (status) {
      return getHttpStatusFallback(status)
    }

    return translateRawMessage(error.message || '', undefined)
  }

  if (error instanceof Error) {
    return translateRawMessage(error.message, undefined)
  }

  return SYSTEM_ERROR_MESSAGE
}
