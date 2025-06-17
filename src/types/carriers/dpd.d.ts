export interface DPDCredentials {
  username: string;
  password: string;
}

export interface DPDAuthBody {
  UsernameOrEmailAddress: string;
  Password: string;
}

export interface DPDAuthResponse {
  result: string | null;
  targetUrl: null;
  success: boolean;
  error: DPDAuthError;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

export interface DPDAuthError {
  code: number;
  message: string;
  details?: string;
  validationErrors?: any[];
}

// 定义 shipmentType 枚举
export enum ShipmentType {
  Document = 10,
  NonDocument = 20
}

// 定义 HawbItem 接口
export interface HawbItem {
  Content: string; // 申报品名（必填）
  ContentCN?: string; // 申报品名中文（可选）
  Price: number; // 单价（必填）
  Pieces: number; // 数量（必填）
  Weight: number; // 重量/KG（必填）
  HsCode?: string; // HS编码（可选）
  SKU?: string; // SKU（可选）
  WebSite?: string; // 网址（可选）
  Brand?: string; // 品牌（可选）
  Unit?: string; // 单位（可选）
  Specification?: string; // 规格（可选）
}

// 定义 HawbChild 接口（用于多包裹运输）
export interface HawbChild {
  ChildHawbNumber?: string; // 子运单号（可选）
  ChildCustomerHawb: string; // 客户子参考号（必填）
  Weight: number; // 重量/KG（必填）
  Height?: number; // 高度/CM（可选）
  Width?: number; // 宽度/CM（可选）
  Length?: number; // 长度/CM（可选）
}

// 主接口定义
export interface DPDOrderRequestBody {
  CustomerHawb?: string; // 客户参考号（可选）
  HawbNumber?: string; // 运单号（可选）
  SenderName?: string; // 发件人姓名（可选）
  SenderCompany?: string; // 发件公司（可选）
  SenderAddress?: string; // 发件地址（可选）
  SenderPhone?: string; // 发件人电话（可选）
  ReceiverName: string; // 收件公司名（必填）
  ReceiverAddress1: string; // 收件地址（必填）
  ReceiverTown?: string; // 收件人城镇（可选）
  ReceiverTel: string; // 收件人电话（必填）
  ReceiverContactPerson?: string; // 收件联系人（可选）
  ReceiverCountry: string; // 收件国家代码（必填）
  ReceiverProvince?: string; // 收件省份（可选）
  ReceiverCity?: string; // 收件城市（可选）
  ReceiverZip: string; // 收件邮编（必填）
  Weight: number; // 总重量/KG（必填）
  DeclareCurrency: string; // 申报货币（必填）
  DeclareValue: number; // 申报价值（必填）
  ServiceCode: string; // 服务代码（必填）
  DutyType: string; // 关税类型（必填）
  Content: string; // 货物描述（必填）
  ReceiverEmail?: string; // 收件人邮箱（可选）
  ReceiverId?: string; // 收件人ID（可选）
  ImportBatchId?: string; // 导入批次ID（可选）
  ShipmentType?: ShipmentType; // 货物类型（可选）
  PaymentType?: string; // 支付类型（可选）
  Pieces?: number; // 包裹总数（可选）
  Height?: number; // 高度/CM（可选）
  Width?: number; // 宽度/CM（可选）
  Length?: number; // 长度/CM（可选）
  Remark?: string; // 备注（可选）
  ReceiverVATNumber?: string; // 收件人增值税号（可选）
  ReceiverEORINumber?: string; // 收件人EORI号（可选）
  ShipperEoriNumber?: string; // 发件人EORI号（可选）
  shipperVATNumber?: string; // 发件人增值税号（可选）
  exportTaxId?: string; // 出口税号（可选）
  CIFCost?: number; // CIF成本（可选）
  CIFCostCurrency?: string; // CIF货币（可选）
  InsuranceValue?: number; // 保险价值（可选）
  GenerateShippingLabel?: boolean; // 生成标签（可选）
  HawbItems: HawbItem[]; // 货物详情（必填）
  HawbChildren?: HawbChild[]; // 子包裹信息（可选）
}

export interface DPDOrderResponse {
  result: {
    hawbNumber: string;
    result: boolean;
    resultMsg: string | null;
    childHawbNumber: string;
  };
  targetUrl: string | null;
  success: boolean;
  error: any | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

export interface DPDLabelResponse {
  result: Array<{
    hawbNumber: string;
    result: boolean;
    labelUrl: string | null;
    resultMsg: string | null;
  }>;
  targetUrl: string | null;
  success: boolean;
  error: any | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

export interface DPDCancelResponse {
  result: Array<{
    hawbNumber: string;
    result: boolean;
    resultMsg: string;
  }>;
  targetUrl: string | null;
  success: boolean;
  error: any | null;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}
