/** 判讀載入中的骨架：版面與實際內容同高，避免串流完成時跳動 */
export function BriefingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="正在判讀路線">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="h-[26rem] animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
