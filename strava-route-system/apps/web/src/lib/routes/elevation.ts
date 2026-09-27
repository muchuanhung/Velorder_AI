/**
 * 修復階梯狀海拔：部分 GPX 只在海拔變化時才更新 <ele>，
 * 相鄰點大量相同後突然跳一格，直接算坡度會出現 30% 以上的假陡坡。
 * 做法：連續等值的一段取其中點當錨點，錨點之間線性內插。
 * 平滑資料的每個點都是自己的錨點，結果不變。
 */
export function repairSteppedElevation(profile: [number, number][]): [number, number][] {
  if (profile.length < 3) return profile;
  const anchors: [number, number][] = [];
  let i = 0;
  while (i < profile.length) {
    let j = i;
    while (j + 1 < profile.length && profile[j + 1]![1] === profile[i]![1]) j++;
    anchors.push([(profile[i]![0] + profile[j]![0]) / 2, profile[i]![1]]);
    i = j + 1;
  }
  if (anchors.length < 2) return profile; // 全程等高
  anchors[0]![0] = profile[0]![0];
  anchors[anchors.length - 1]![0] = profile[profile.length - 1]![0];
  let k = 1;
  return profile.map(([km]) => {
    while (k < anchors.length - 1 && anchors[k]![0] < km) k++;
    const a = anchors[k - 1]!;
    const b = anchors[k]!;
    const span = b[0] - a[0];
    const ele = span > 0 ? a[1] + ((b[1] - a[1]) * (km - a[0])) / span : a[1];
    return [km, Math.round(ele * 10) / 10];
  });
}
