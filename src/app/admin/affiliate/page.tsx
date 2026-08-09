import { redirect } from 'next/navigation'

// 제휴 상품 관리 화면은 /admin/shop-products로 통합되었다.
export default function AdminAffiliateRedirectPage() {
  redirect('/admin/shop-products')
}
