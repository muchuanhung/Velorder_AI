export const CWB_COUNTY_DATASET: Record<string, string> = {
  臺北市: "063",
  新北市: "065",
  基隆市: "002",
  桃園市: "067",
  新竹市: "004",
  新竹縣: "011",
  苗栗縣: "013",
  臺中市: "066",
  彰化縣: "010",
  南投縣: "012",
  雲林縣: "015",
  嘉義市: "008",
  嘉義縣: "016",
  臺南市: "014",
  高雄市: "017",
  屏東縣: "035",
  宜蘭縣: "003",
  花蓮縣: "018",
  臺東縣: "019",
  澎湖縣: "020",
  金門縣: "021",
  連江縣: "091",
  台北市: "063",
  台中市: "066",
  台南市: "014",
};

export function getCWBdatasetId(county: string): string | null {
  const c = (county ?? "").replace(/\s/g, "");
  if (!c) return null;
  if (CWB_COUNTY_DATASET[c]) return CWB_COUNTY_DATASET[c];
  const alt = c.replace(/臺/g, "台").replace(/台/g, "臺");
  return CWB_COUNTY_DATASET[alt] ?? null;
}
