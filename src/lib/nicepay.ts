export async function callNicepayAPI(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  authRequired: boolean = true
) {
  const clientId = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID
  const secretKey = process.env.NICEPAY_SECRET_KEY

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authRequired) {
    const auth = Buffer.from(`${clientId}:${secretKey}`).toString('base64')
    headers['Authorization'] = `Basic ${auth}`
  }

  const response = await fetch(`https://api.nicepay.co.kr${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('NicePay API Error:', data)
    throw new Error(data.message || 'NicePay API 오류')
  }

  return data
}

export function generateOrderId() {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
