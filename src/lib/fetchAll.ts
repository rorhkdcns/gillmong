// Supabase(PostgREST)는 한 번에 최대 1000행까지만 돌려준다. 그 이상이 필요하면 1000개씩 끊어서 모두 읽어온다.
// 사용: await fetchAllRows((from, to) => admin.from('t').select('...').order('id').range(from, to))
// ★ 정렬 기준에 동률이 있으면 페이지 경계에서 행이 빠지거나 겹칠 수 있으니 마지막에 id 정렬을 꼭 붙일 것.
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<{ data: T[]; error?: string }> {
  const out: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1)
    if (error) return { data: out, error: error.message }
    out.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return { data: out }
}
