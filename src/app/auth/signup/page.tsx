'use client'

import { useState } from 'react'
import Image from 'next/image'
import SiteFooter from '@/components/SiteFooter'
import { createClient } from '@/lib/supabase/client'

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@gillmong.com`
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-[#555555]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT = 'w-full border border-gray-300 bg-white px-4 py-3 text-base text-[#333333] placeholder:text-gray-300 outline-none focus:border-[#01273A]'

type MemberType = 'general' | 'business'
type Step = 'select' | 'form'

function formatBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  return digits
}

export default function SignupPage() {
  const [step, setStep] = useState<Step>('select')
  const [memberType, setMemberType] = useState<MemberType>('general')

  const [username,         setUsername]         = useState('')
  const [password,         setPassword]         = useState('')
  const [passwordConfirm,  setPasswordConfirm]  = useState('')
  const [nickname,         setNickname]         = useState('')
  const [realName,     setRealName]     = useState('')
  const [phone,        setPhone]        = useState('')
  const [emailId,      setEmailId]      = useState('')
  const [emailDomain,  setEmailDomain]  = useState('naver.com')
  const [customDomain, setCustomDomain] = useState('')

  const [businessName,       setBusinessName]       = useState('')
  const [businessNumber,     setBusinessNumber]     = useState('')
  const [representativeName, setRepresentativeName] = useState('')

  const [error,   setError]   = useState('')
  const [done,    setDone]    = useState(false)
  const [loading, setLoading] = useState(false)

  const email = emailDomain === 'direct'
    ? (emailId && customDomain ? `${emailId}@${customDomain}` : '')
    : (emailId ? `${emailId}@${emailDomain}` : '')

  const [usernameError,    setUsernameError]    = useState('')
  const [usernameStatus,   setUsernameStatus]   = useState<'idle' | 'available' | 'taken'>('idle')
  const [checkingUsername, setCheckingUsername] = useState(false)

  const [agreeTerms,   setAgreeTerms]   = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeAge,     setAgreeAge]     = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)

  const allRequired = agreeTerms && agreePrivacy && agreeAge
  const allChecked  = allRequired && agreeMarketing

  function validateUsernameFormat(val: string) {
    if (!val) return ''
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) return '영문·숫자·밑줄(_) 3~20자로 입력해주세요.'
    return ''
  }

  function handleUsernameChange(val: string) {
    setUsername(val)
    setUsernameStatus('idle')
    setUsernameError(validateUsernameFormat(val))
  }

  async function checkUsername() {
    const formatErr = validateUsernameFormat(username)
    if (formatErr) { setUsernameError(formatErr); return }
    setCheckingUsername(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .maybeSingle()
    setCheckingUsername(false)
    setUsernameStatus(data ? 'taken' : 'available')
  }

  function handleAgreeAll() {
    const next = !allChecked
    setAgreeTerms(next)
    setAgreePrivacy(next)
    setAgreeAge(next)
    setAgreeMarketing(next)
  }

  function handleSelectType(type: MemberType) {
    setMemberType(type)
    setStep('form')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('아이디는 영문·숫자·밑줄(_) 3~20자로 입력해주세요.')
      return
    }
    if (usernameStatus !== 'available') {
      setError('아이디 중복 확인을 완료해주세요.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자리 이상 입력해주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.')
      return
    }
    if (!realName.trim()) {
      setError('이름(실명)을 입력해주세요.')
      return
    }
    if (!phone.trim()) {
      setError('전화번호를 입력해주세요.')
      return
    }
    if (!/^[0-9\-+\s]{7,15}$/.test(phone)) {
      setError('전화번호 형식이 올바르지 않습니다.')
      return
    }
    if (!emailId.trim()) {
      setError('이메일 아이디를 입력해주세요.')
      return
    }
    if (emailDomain === 'direct' && !customDomain.trim()) {
      setError('이메일 도메인을 입력해주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('이메일 형식이 올바르지 않습니다.')
      return
    }

    if (memberType === 'business') {
      if (!businessName.trim()) {
        setError('상호명을 입력해주세요.')
        return
      }
      const digits = businessNumber.replace(/\D/g, '')
      if (digits.length !== 9) {
        setError('사업자등록번호는 숫자 9자리로 입력해주세요.')
        return
      }
      if (!representativeName.trim()) {
        setError('대표자명을 입력해주세요.')
        return
      }
    }

    setLoading(true)

    const supabase = createClient()
    const authEmail = usernameToEmail(username)

    const metadata: Record<string, string> = {
      username:  username.trim().toLowerCase(),
      nickname:  nickname.trim(),
      real_name: realName.trim(),
      phone:     phone.trim(),
      email:     email.trim(),
      member_type: memberType,
    }

    if (memberType === 'business') {
      metadata.business_name       = businessName.trim()
      metadata.business_number     = businessNumber.replace(/\D/g, '')
      metadata.representative_name = representativeName.trim()
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: { data: metadata },
    })

    setLoading(false)

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
        setError('이미 사용 중인 아이디입니다.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
      return
    }

    if (data.session) {
      window.location.href = '/mypage'
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F5] px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center bg-[#01273A]">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="mb-3 text-2xl text-[#01273A]">가입 완료!</h2>
          {memberType === 'business' && (
            <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 border border-amber-200">
              사업자 정보는 관리자 검토 후 승인됩니다.
            </p>
          )}
          <p className="mb-8 text-sm text-[#777777]">바로 로그인하실 수 있습니다.</p>
          <a
            href="/auth/login"
            className="inline-block w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90"
          >
            로그인하러 가기
          </a>
        </div>
      </div>
    )
  }

  const Header = (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto max-w-6xl">
        <a href="/">
          <Image src="/logo_1.jpg" alt="길몽상점" height={50} width={160} className="h-[50px] w-auto object-contain" priority />
        </a>
      </div>
    </header>
  )

  /* ── Step 1: 회원 유형 선택 ── */
  if (step === 'select') {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
        {Header}
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <h1 className="mb-2 text-center text-2xl text-[#01273A]">회원가입</h1>
            <p className="mb-10 text-center text-sm text-[#777777]">가입 유형을 선택해주세요</p>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => handleSelectType('general')}
                className="flex flex-col items-start gap-2 border-2 border-gray-200 bg-white px-6 py-5 text-left transition-all hover:border-[#01273A] hover:shadow-sm"
              >
                <span className="text-base font-semibold text-[#01273A]">일반회원</span>
                <span className="text-sm text-[#777777]">개인 사용자로 가입합니다</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('business')}
                className="flex flex-col items-start gap-2 border-2 border-gray-200 bg-white px-6 py-5 text-left transition-all hover:border-[#01273A] hover:shadow-sm"
              >
                <span className="text-base font-semibold text-[#01273A]">사업자회원</span>
                <span className="text-sm text-[#777777]">사업자등록번호로 가입합니다 (관리자 승인 필요)</span>
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-[#777777]">
              이미 계정이 있으신가요?{' '}
              <a href="/auth/login" className="text-[#01273A] underline underline-offset-2 hover:brightness-75">
                로그인
              </a>
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  /* ── Step 2: 정보 입력 ── */
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      {Header}

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <button
            type="button"
            onClick={() => setStep('select')}
            className="mb-6 flex items-center gap-1 text-sm text-[#777777] hover:text-[#01273A]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {memberType === 'business' ? '사업자회원' : '일반회원'} 선택됨
          </button>

          <h1 className="mb-2 text-center text-2xl text-[#01273A]">회원가입</h1>
          <p className="mb-10 text-center text-sm text-[#777777]">길몽상점과 함께 꿈을 거래해보세요</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <Field label="아이디" required>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="영문·숫자·밑줄 3~20자"
                  required
                  className={INPUT}
                />
                <button
                  type="button"
                  onClick={checkUsername}
                  disabled={checkingUsername || !username}
                  className="shrink-0 whitespace-nowrap border border-[#01273A] px-4 py-3 text-sm font-semibold text-[#01273A] transition-all hover:bg-[#01273A] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {checkingUsername ? '확인 중...' : '중복 확인'}
                </button>
              </div>
              {usernameError && (
                <p className="mt-1 text-xs text-red-500">{usernameError}</p>
              )}
              {!usernameError && usernameStatus === 'available' && (
                <p className="mt-1 text-xs text-emerald-600">사용 가능한 아이디입니다.</p>
              )}
              {usernameStatus === 'taken' && (
                <p className="mt-1 text-xs text-red-500">이미 사용 중인 아이디입니다.</p>
              )}
              {!usernameError && usernameStatus === 'idle' && (
                <p className="mt-1 text-xs text-gray-400">로그인에 사용됩니다 (영문·숫자·밑줄만 허용)</p>
              )}
            </Field>

            <Field label="비밀번호" required>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자리 이상"
                required
                minLength={6}
                className={INPUT}
              />
            </Field>

            <Field label="비밀번호 확인" required>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력해주세요"
                required
                className={INPUT}
              />
              {passwordConfirm && password !== passwordConfirm && (
                <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
              {passwordConfirm && password === passwordConfirm && (
                <p className="mt-1 text-xs text-emerald-600">비밀번호가 일치합니다.</p>
              )}
            </Field>

            <Field label="닉네임" required>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="다른 사용자에게 표시될 이름"
                required
                className={INPUT}
              />
            </Field>

            <Field label="이름 (실명)" required>
              <input
                type="text"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="홍길동"
                required
                className={INPUT}
              />
            </Field>

            <Field label="전화번호" required>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                required
                className={INPUT}
              />
            </Field>

            <Field label="이메일 주소" required>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value.replace(/\s/g, ''))}
                  placeholder="이메일 아이디"
                  className={`${INPUT} min-w-0 flex-[7]`}
                />
                <span className="shrink-0 text-base font-medium text-gray-400">@</span>
                <select
                  value={emailDomain}
                  onChange={(e) => { setEmailDomain(e.target.value); setCustomDomain('') }}
                  className={`${INPUT} flex-[3] min-w-0 cursor-pointer`}
                >
                  <option value="direct">직접입력</option>
                  <option value="naver.com">naver.com</option>
                  <option value="daum.net">daum.net</option>
                  <option value="hanmail.net">hanmail.net</option>
                  <option value="nate.com">nate.com</option>
                  <option value="gmail.com">gmail.com</option>
                </select>
              </div>
              {emailDomain === 'direct' && (
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value.replace(/\s/g, ''))}
                  placeholder="도메인 입력 (예: yahoo.com)"
                  className={`${INPUT} mt-2`}
                />
              )}
              {email && (
                <p className="mt-1 text-xs text-gray-400">{email}</p>
              )}
            </Field>

            {/* 사업자회원 추가 정보 */}
            {memberType === 'business' && (
              <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold text-amber-700">사업자 정보 입력</p>

                <Field label="상호명" required>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="사업체 상호명"
                    className={INPUT}
                  />
                </Field>

                <Field label="사업자등록번호" required>
                  <input
                    type="text"
                    value={businessNumber}
                    onChange={(e) => setBusinessNumber(formatBusinessNumber(e.target.value))}
                    placeholder="숫자 9자리"
                    maxLength={9}
                    className={INPUT}
                  />
                  <p className="mt-1 text-xs text-gray-400">숫자만 입력 (9자리)</p>
                </Field>

                <Field label="대표자명" required>
                  <input
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    placeholder="대표자 성명"
                    className={INPUT}
                  />
                </Field>

                <p className="text-xs text-amber-600">※ 사업자 정보는 관리자 검토 후 승인됩니다.</p>
              </div>
            )}

            {/* 약관 동의 */}
            <div className="mt-2 flex flex-col gap-0 rounded-xl border border-gray-200 bg-white">
              <label className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleAgreeAll}
                  className="h-4 w-4 cursor-pointer accent-[#01273A]"
                />
                <span className="text-sm font-bold text-[#01273A]">전체 동의</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#01273A]"
                />
                <span className="flex-1 text-sm text-[#333333]">
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#01273A]" onClick={(e) => e.stopPropagation()}>
                    이용약관
                  </a>{' '}
                  동의 <span className="text-red-400">(필수)</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#01273A]"
                />
                <span className="flex-1 text-sm text-[#333333]">
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#01273A]" onClick={(e) => e.stopPropagation()}>
                    개인정보처리방침
                  </a>{' '}
                  동의 <span className="text-red-400">(필수)</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3">
                <input
                  type="checkbox"
                  checked={agreeAge}
                  onChange={(e) => setAgreeAge(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#01273A]"
                />
                <span className="text-sm text-[#333333]">
                  만 14세 이상입니다 <span className="text-red-400">(필수)</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#01273A]"
                />
                <span className="text-sm text-[#333333]">
                  마케팅 정보 수신 동의 <span className="text-gray-400">(선택)</span>
                </span>
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !allRequired}
              className="mt-2 w-full bg-[#01273A] py-3 text-base font-semibold text-white transition-all hover:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : '가입하기'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#777777]">
            이미 계정이 있으신가요?{' '}
            <a href="/auth/login" className="text-[#01273A] underline underline-offset-2 hover:brightness-75">
              로그인
            </a>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
