export interface DbDream {
  id: number
  user_id: string
  title: string
  content: string
  summary: string
  grade: string
  dream_type: string
  interpretation: string
  advice: string
  category: string
  price: number
  lucky_numbers: number[]
  is_sold: boolean
  created_at: string
}

export interface DbSavedDream {
  id: number
  user_id: string
  title: string
  content: string
  summary: string
  grade: string
  type: string
  interpretation: string
  advice: string
  lucky_numbers: number[]
  created_at: string
}

export interface DbProfile {
  id: string
  username: string
  nickname: string
  real_name: string
  phone: string
  email: string
  points: number
  member_type: 'general' | 'business'
  business_name: string | null
  business_number: string | null
  representative_name: string | null
  verified_at: string | null
  verification_status: 'pending' | 'approved' | 'rejected' | null
  created_at: string
}

export interface DbPurchase {
  id: number
  buyer_id: string
  dream_id: number
  price: number
  created_at: string
}

export const CATEGORY_PATH: Record<string, string> = {
  people:  '/category/people',
  animals: '/category/animals',
  nature:  '/category/nature',
  action:  '/category/action',
  etc:     '/category/etc',
}

export const CATEGORY_LABEL: Record<string, string> = {
  people:  '인물·신체',
  animals: '동물·식물',
  nature:  '자연·사물',
  action:  '행동·상황',
  etc:     '기타',
}

export const CATEGORY_DB: Record<string, string> = {
  '인물·신체': 'people',
  '동물·식물': 'animals',
  '자연·사물': 'nature',
  '행동·상황': 'action',
  '기타':      'etc',
}
