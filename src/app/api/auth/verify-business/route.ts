import { NextRequest, NextResponse } from 'next/server'
import type { BusinessVerificationResponse } from '@/lib/types/api'

const API_KEY = '0719f9dc21014f9aad2fe3053cbac4d3325bfef72eae1b9738643b0fe81b9cb4'
const NTS_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/status'

export async function POST(req: NextRequest) {
  try {
    const { businessNumber } = (await req.json()) as { businessNumber: string }
    const digits = (businessNumber ?? '').replace(/\D/g, '')

    if (digits.length !== 10) {
      return NextResponse.json<BusinessVerificationResponse>(
        { verified: false, message: '사업자등록번호는 10자리 숫자여야 합니다.' },
        { status: 400 },
      )
    }

    const res = await fetch(`${NTS_URL}?serviceKey=${API_KEY}&returnType=JSON`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b_no: [digits] }),
    })

    if (!res.ok) {
      return NextResponse.json<BusinessVerificationResponse>(
        { verified: false, message: '사업자 정보 조회 중 오류가 발생했습니다.' },
        { status: 500 },
      )
    }

    const json = await res.json()

    // 공공데이터포털 API 키 미등록 또는 서비스 오류
    if (json?.code === -4 || json?.code === -5) {
      return NextResponse.json<BusinessVerificationResponse>(
        { verified: false, message: '사업자 검증 서비스를 일시적으로 이용할 수 없습니다.' },
        { status: 503 },
      )
    }

    const record = json?.data?.[0]

    if (!record?.b_stt_cd) {
      return NextResponse.json<BusinessVerificationResponse>(
        { verified: false, message: '유효하지 않은 사업자등록번호입니다.' },
      )
    }

    if (record.b_stt_cd === '01') {
      return NextResponse.json<BusinessVerificationResponse>(
        { verified: true, message: '사업자 정보가 확인되었습니다.' },
      )
    }

    const statusLabel: Record<string, string> = {
      '02': '휴업 중인 사업자입니다.',
      '03': '폐업한 사업자입니다.',
    }

    return NextResponse.json<BusinessVerificationResponse>(
      { verified: false, message: statusLabel[record.b_stt_cd] ?? '유효하지 않은 사업자등록번호입니다.' },
    )
  } catch (err) {
    console.error('[verify-business]', err)
    return NextResponse.json<BusinessVerificationResponse>(
      { verified: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
