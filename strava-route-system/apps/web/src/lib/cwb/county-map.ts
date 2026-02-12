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

export function getCWBdatasetId(county: string): string | null {
  const c = (county ?? "").replace(/\s/g, "");
  if (!c) return null;
  if (CWB_COUNTY_DATASET[c]) return CWB_COUNTY_DATASET[c];
  const alt = c.replace(/臺/g, "台").replace(/台/g, "臺");
  return CWB_COUNTY_DATASET[alt] ?? null;
}
