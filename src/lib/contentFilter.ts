const BLOCKED: RegExp[] = [
  // 욕설
  /씨발|시발|ㅅㅂ|개새끼|개새|ㄱㅅ|병신|ㅂㅅ|존나|ㅈㄴ|지랄|지랄|미친놈|미친년|꺼져|닥쳐|죽어|뒤져|새끼|쌍놈|쌍년|년아|놈아|창녀|보지|자지|좆|쥐좆|따먹|섹스|sex(?!y)|섹|야동|야설/i,
  // 외설
  /포르노|porn|nude|나체|음란|성기|강간|rape|윤간|원나잇|헌팅|조건만남|원조교제/i,
  // 비하
  /장애인새|정신병자|정신이상|머저리|바보새|멍청한 새|찐따|빡대가리|루저|패배자|열등|하등/i,
  // 정치 선동·혐오
  /빨갱이|토착왜구|친일파 새|일베|어준|찢|좌빨|우파새|보수새|진보새/i,
]

export function hasInappropriateContent(text: string): boolean {
  return BLOCKED.some((re) => re.test(text))
}
