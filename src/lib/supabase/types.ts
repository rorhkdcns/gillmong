export interface DbDream {
  id: number
  user_id: string
  title: string
  content: string
  summary: string
  grade: string
  category: string
  price: number
  lucky_numbers: number[]
  is_sold: boolean
  is_public: boolean
  created_at: string
}

export interface DbProfile {
  id: string
  username: string
  nickname: string
  points: number
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
