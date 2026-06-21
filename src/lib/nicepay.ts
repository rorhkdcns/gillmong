const NICEPAY_API = 'https://api.nicepay.co.kr'

function getBasicAuth() {
  const clientId  = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID
  const secretKey = process.env.NICEPAY_SECRET_KEY
  return Buffer.from(`${clientId}:${secretKey}`).toString('base64')
}

export async function approveNicepayPayment(tid: string, amount: number, orderId: string) {
  const res = await fetch(`${NICEPAY_API}/v1/payments/${tid}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Basic ${getBasicAuth()}`,
    },
    body: JSON.stringify({ amount, orderId }),
  })
  return res.json() as Promise<{ resultCode: string; resultMsg: string; tid: string; status: string }>
}

export function generateOrderId() {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
