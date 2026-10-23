export function Skeleton({ w = '100%', h = 14, r, className = '', style }) {
  return <span className={`skeleton ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 6, height = 48 }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="list-row" style={{ height }}>
          <Skeleton w={24} h={24} r={12} />
          <Skeleton w={`${40 + ((i * 17) % 35)}%`} h={12} />
          <Skeleton w={36} h={12} style={{ marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 180 }) {
  return (
    <div className="card" style={{ padding: 20 }} aria-busy="true">
      <Skeleton w="40%" h={14} />
      <Skeleton w="100%" h={height - 70} style={{ marginTop: 16 }} r={10} />
    </div>
  );
}
