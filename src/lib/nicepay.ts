import crypto from 'crypto'

const NICEPAY_API = 'https://api.nicepay.co.kr'

function basicAuth() {
  const id  = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID!
  const key = process.env.NICEPAY_SECRET_KEY!
  return Buffer.from(`${id}:${key}`).toString('base64')
}

// returnUrl 수신 후 위변조 검증
// 규칙: hex(sha256(authToken + clientId + amount + SecretKey))
export function verifyNicepaySignature(
  authToken: string,
  amount: number,
  receivedSig: string,
): boolean {
  const clientId  = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID!
  const secretKey = process.env.NICEPAY_SECRET_KEY!
  const expected  = crypto
    .createHash('sha256')
    .update(authToken + clientId + String(amount) + secretKey)
    .digest('hex')
  return expected === receivedSig
}

// NicePay 승인 API 호출
// 규칙: signData = hex(sha256(tid + amount + ediDate + SecretKey))
export async function approveNicepayPayment(tid: string, amount: number) {
  const ediDate   = new Date().toISOString()
  const secretKey = process.env.NICEPAY_SECRET_KEY!
  const signData  = crypto
    .createHash('sha256')
    .update(tid + String(amount) + ediDate + secretKey)
    .digest('hex')

  const res = await fetch(`${NICEPAY_API}/v1/payments/${tid}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${basicAuth()}`,
    },
    body: JSON.stringify({ amount, ediDate, signData }),
  })

  return res.json() as Promise<{
    resultCode: string
    resultMsg:  string
    tid:        string
    orderId:    string
    status:     string
    amount:     number
    paidAt:     string
  }>
}

export function generateOrderId() {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
