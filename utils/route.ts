// توجيه حقيقي على الطرق (OSRM) — بديل الخط المستقيم
export type LatLng = number[];
export type RouteResult = { ok: true; km: number; min: number; path: { latitude: number; longitude: number }[] } | { ok: false };
const cache: Record<string, RouteResult> = {};
// ملاحظة إنتاج: السيرفر العام للتجربة فقط — استبدل OSRM_URL بسيرفر OSRM خاص بكم
export const OSRM_URL = 'https://router.project-osrm.org';
export async function getRoute(points: LatLng[]): Promise<RouteResult> {
  const key = points.map(p => p[0].toFixed(5) + ',' + p[1].toFixed(5)).join(';');
  if (cache[key]) return cache[key];
  const coords = points.map(p => p[1] + ',' + p[0]).join(';');
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(`${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`, { signal: ctrl.signal });
    const j = await r.json();
    if (j.code !== 'Ok' || !j.routes?.length) throw new Error('no route');
    const rt = j.routes[0];
    const res: RouteResult = {
      ok: true, km: rt.distance / 1000, min: rt.duration / 60,
      path: rt.geometry.coordinates.map((c: number[]) => ({ latitude: c[1], longitude: c[0] })),
    };
    cache[key] = res;
    return res;
  } catch { return { ok: false }; } finally { clearTimeout(tm); }
}
export const fmtMin = (m: number) => { m = Math.round(m); return m < 60 ? `${m} د` : `${Math.floor(m / 60)} س ${m % 60} د`; };

// مسافات الطريق لطلب: من موقع السائق إلى أول نقطة + مسار الطلب كاملاً
// محاولة واحدة فقط لكل طلب (لا إعادة عند الفشل)
export type OrderDist = { toMe?: number; tripKm?: number; tripMin?: number; fail?: boolean };
export async function orderDistances(me: LatLng | null, pts: LatLng[]): Promise<OrderDist> {
  const clean = pts.filter(p => p && isFinite(p[0]) && isFinite(p[1]));
  if (!clean.length) return { fail: true };
  const [a, b] = await Promise.all([
    me ? getRoute([me, clean[0]]) : Promise.resolve({ ok: false } as RouteResult),
    clean.length > 1 ? getRoute(clean) : Promise.resolve({ ok: false } as RouteResult),
  ]);
  const out: OrderDist = {};
  if (a.ok) out.toMe = a.km;
  if (b.ok) { out.tripKm = b.km; out.tripMin = b.min; }
  if (!a.ok && !b.ok) out.fail = true;
  return out;
}
export const fmtKm = (km?: number) => (km == null ? '—' : km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`);

// مدة الوصول على الطريق (بالدقائق) من عدة سيارات إلى نقطة واحدة — طلب واحد فقط
export async function etaToPoint(from: LatLng[], to: LatLng): Promise<(number | null)[]> {
  if (!from.length) return [];
  const coords = [to, ...from].map(p => p[1] + ',' + p[0]).join(';');
  const src = from.map((_, i) => i + 1).join(';');
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(`${OSRM_URL}/table/v1/driving/${coords}?sources=${src}&destinations=0`, { signal: ctrl.signal });
    const j = await r.json();
    if (j.code !== 'Ok') throw new Error('no table');
    return j.durations.map((row: (number | null)[]) => (row[0] == null ? null : row[0] / 60));
  } catch { return from.map(() => null); } finally { clearTimeout(tm); }
}

// مسافة الطريق (كم) من نقطة واحدة إلى عدة نقاط — طلب واحد فقط
export async function roadKmFrom(origin: LatLng, to: LatLng[]): Promise<(number | null)[]> {
  if (!to.length) return [];
  const coords = [origin, ...to].map(p => p[1] + ',' + p[0]).join(';');
  const dst = to.map((_, i) => i + 1).join(';');
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(`${OSRM_URL}/table/v1/driving/${coords}?sources=0&destinations=${dst}&annotations=distance`, { signal: ctrl.signal });
    const j = await r.json();
    if (j.code !== 'Ok') throw new Error('no table');
    return j.distances[0].map((d: number | null) => (d == null ? null : d / 1000));
  } catch { return to.map(() => null); } finally { clearTimeout(tm); }
}
