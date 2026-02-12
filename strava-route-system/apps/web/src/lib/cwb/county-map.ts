export const CWB_COUNTY_DATASET: Record<string, string> = {
  宜蘭縣: "003",
  桃園市: "007",
  新竹縣: "011",
  苗栗縣: "015",
  彰化縣: "019",
  南投縣: "023",
  雲林縣: "027",
  嘉義縣: "031",
  屏東縣: "035",
  臺東縣: "039",
  花蓮縣: "043",
  澎湖縣: "047",
  基隆市: "051",
  新竹市: "055",
  嘉義市: "059",
  臺北市: "063",
  高雄市: "067",
  新北市: "071",
  臺中市: "075",
  臺南市: "079",
  連江縣: "083",
  金門縣: "087",
};

/** 舊縣市名 → CWB 縣市名（2010 五都改制、2014 桃園升格等） */
const COUNTY_ALIASES: Record<string, string> = {
  台北縣: "新北市",
  臺北縣: "新北市",
  台中縣: "臺中市",
  臺中縣: "臺中市",
  台南縣: "臺南市",
  臺南縣: "臺南市",
  高雄縣: "高雄市",
  桃園縣: "桃園市",
};

/** 將縣市名轉為 CWB API 使用的名稱（含舊名對應） */
export function normalizeCountyForCWB(county: string): string {
  const c = (county ?? "").replace(/\s/g, "");
  const aliased = COUNTY_ALIASES[c] ?? c;
  return aliased.replace(/台/g, "臺");
}

export function normalizeLocationCounty(location: string): string {
  let s = location;
  for (const [oldName, newName] of Object.entries(COUNTY_ALIASES)) {
    s = s.replace(new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), newName);
  }
  return s.replace(/台/g, "臺");
}

export function getCWBdatasetId(county: string): string | null {
  const c = (county ?? "").replace(/\s/g, "");
  if (!c) return null;
  const normalized = COUNTY_ALIASES[c] ?? c;
  if (CWB_COUNTY_DATASET[normalized]) return CWB_COUNTY_DATASET[normalized];
  const alt = normalized.replace(/臺/g, "台").replace(/台/g, "臺");
  return CWB_COUNTY_DATASET[alt] ?? null;
}
