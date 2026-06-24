export interface BusinessVerificationRequest {
  businessNumber: string
}

export interface BusinessVerificationResponse {
  verified: boolean
  message: string
}
