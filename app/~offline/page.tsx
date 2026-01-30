export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-2xl border bg-white/60 backdrop-blur p-6 text-center">
        <h1 className="text-xl font-semibold">你现在离线啦</h1>
        <p className="mt-2 text-sm text-neutral-600">
          没关系，吃饭这件事不着急。网络恢复后再来记录也可以。
        </p>
      </div>
    </main>
  );
}
