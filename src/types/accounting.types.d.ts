export interface ReconciliationRecord {
  date: Date;
  name: string;
  status: number; // 0: pending, 1: finished
  sucessCount: number;
  failedCount: number;
}

export interface ReconciliationRecordDocument
  extends ReconciliationRecord,
    Document {}

export interface AccountingItemData {
  weight: number;
  weightType: string;
  uspsState: string;
  pieceId: string;
  trackingNumber: string;
  amount: number; // total amount (应收账款)
  baseAmount: number; // base amount
  servicePayment: number; // service payment (应付账款)
  channel: string;
  orderId: string;
  orderDate: string;
  recordRef: string;
  userRef?: string;
  userName?: string;
  remark?: string;
  zone?: string;
  docName?: string;
  status: number; // 0: success, 1: failed
}

export interface AccountingItemDocument extends AccountingItemData, Document {}
