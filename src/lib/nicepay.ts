import crypto from 'crypto'

const NICEPAY_API = 'https://api.nicepay.co.kr'

function basicAuth() {
  const id  = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID!
  const key = process.env.NICEPAY_SECRET_KEY!
  return Buffer.from(`${id}:${key}`).toString('base64')
}

// returnUrl 위변조 검증: hex(sha256(authToken + clientId + amount + SecretKey))
export function verifyNicepaySignature(authToken: string, amount: number, receivedSig: string) {
  const clientId  = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID!
  const secretKey = process.env.NICEPAY_SECRET_KEY!
  const expected  = crypto
    .createHash('sha256')
    .update(authToken + clientId + String(amount) + secretKey)
    .digest('hex')
  return expected === receivedSig
}

// 승인 API: POST /v1/payments/{tid}
// signData: hex(sha256(tid + amount + ediDate + SecretKey))
export async function approveNicepayPayment(tid: string, amount: number) {
  const ediDate   = new Date().toISOString()
  const secretKey = process.env.NICEPAY_SECRET_KEY!
  const signData  = crypto
    .createHash('sha256')
    .update(tid + String(amount) + ediDate + secretKey)
    .digest('hex')

  const res = await fetch(`${NICEPAY_API}/v1/payments/${tid}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${basicAuth()}` },
    body:    JSON.stringify({ amount, ediDate, signData }),
  })
  return res.json() as Promise<NicepayApproveResponse>
}

// 취소 API: POST /v1/payments/{tid}/cancel
export async function cancelNicepayPayment(
  tid: string,
  cancelAmt: number,
  reason: string,
  orderId: string,
) {
  const ediDate   = new Date().toISOString()
  const secretKey = process.env.NICEPAY_SECRET_KEY!
  const signData  = crypto
    .createHash('sha256')
    .update(tid + String(cancelAmt) + ediDate + secretKey)
    .digest('hex')

  const res = await fetch(`${NICEPAY_API}/v1/payments/${tid}/cancel`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${basicAuth()}` },
    body:    JSON.stringify({ amount: cancelAmt, reason, orderId, ediDate, signData }),
  })
  return res.json() as Promise<NicepayCancelResponse>
}

// 거래 조회: GET /v1/payments/{tid}
export async function queryNicepayPayment(tid: string) {
  const res = await fetch(`${NICEPAY_API}/v1/payments/${tid}`, {
    headers: { 'Authorization': `Basic ${basicAuth()}` },
  })
  return res.json() as Promise<NicepayApproveResponse>
}

export function generateOrderId() {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// ── 응답 타입 ─────────────────────────────────────────────────
export interface NicepayApproveResponse {
  resultCode:  string
  resultMsg:   string
  tid:         string
  orderId:     string
  status:      string   // paid / ready / failed / cancelled
  amount:      number
  balanceAmt:  number
  paidAt:      string
  payMethod:   string
  goodsName:   string
  card?:       { cardName: string; cardNum: string; cardQuota: number; cardType: string }
  vbank?: {
    vbankCode:    string
    vbankName:    string
    vbankNumber:  string
    vbankExpDate: string
    vbankHolder:  string
  }
}

export interface NicepayCancelResponse {
  resultCode:   string
  resultMsg:    string
  tid:          string
  cancelledTid: string
  orderId:      string
  status:       string
  amount:       number
  balanceAmt:   number
  cancelledAt:  string
}
