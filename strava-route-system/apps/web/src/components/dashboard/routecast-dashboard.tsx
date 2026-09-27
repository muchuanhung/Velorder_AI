"use client"

import { useState } from "react"
import { AlertTriangle, ArrowUpRight, Check, ChevronRight, CloudRain, Compass, Menu, Mountain, RefreshCw, Route, ShieldAlert, Wind } from "lucide-react"

const hazards = [
  { km: "02.8", title: "午後雷雨胞生成", detail: "午後 13:00 後降雨機率快速上升", level: "danger" },
  { km: "07.1", title: "側風暴露路段", detail: "稜線風速 32 km/h，體感不穩", level: "caution" },
  { km: "10.6", title: "路面濕滑", detail: "過去 3 小時累積雨量 8 mm", level: "caution" },
]

export function RoutecastDashboard() {
  const [activeVariant, setActiveVariant] = useState<"soft" | "field" | "hard">("field")
  const tone = activeVariant === "soft" ? "soft" : activeVariant === "hard" ? "hard" : "field"

  return (
    <main className={`routecast-shell routecast-${tone}`}>
      <header className="routecast-topbar">
        <div className="routecast-brand"><span className="brand-mark"><Mountain size={18} /></span><span>ROUTECAST</span></div>
        <nav className="routecast-nav" aria-label="主要導覽"><a className="active" href="#today">今日判讀</a><a href="#routes">我的路線</a><a href="#history">歷史紀錄</a></nav>
        <div className="routecast-user"><span className="sync-dot" /> STRAVA 已同步 <button className="icon-button" aria-label="開啟選單"><Menu size={19} /></button></div>
      </header>

      <div className="routecast-content" id="today">
        <div className="routecast-heading"><div><p className="eyebrow">台北・週三 09 月 27 日</p><h1>早安，明晨適合出發嗎？</h1></div><button className="refresh-button"><RefreshCw size={15} /> 更新預報 <span>09:42</span></button></div>

        <section className="verdict-board" aria-labelledby="verdict-title">
          <div className="verdict-copy"><div className="verdict-kicker"><ShieldAlert size={17} /> 今日判讀 <span className="mono">ROUTE / 01</span></div><h2 id="verdict-title">危險</h2><p>建議改期，或選擇較低風險的替代路線。</p><div className="verdict-reason"><span>主要原因</span><strong>起降雨 60%</strong><span className="divider" /><span>稜線陣風</span><strong>32 km/h</strong></div></div>
          <div className="verdict-weather"><CloudRain size={30} /><strong className="mono">24°</strong><span>午後雷雨</span></div>
        </section>

        <div className="routecast-grid">
          <section className="route-card route-primary"><div className="card-label"><Route size={15} /> 目前路線</div><div className="route-title-row"><div><h3>風櫃嘴</h3><p>陽明山・台北市士林區</p></div><ArrowUpRight size={19} /></div><div className="route-metrics"><div><span>距離</span><strong className="mono">12.4 <small>km</small></strong></div><div><span>爬升</span><strong className="mono">684 <small>m</small></strong></div><div><span>雨量峰值</span><strong className="mono danger-text">60<small>%</small></strong></div></div><div className="route-note"><AlertTriangle size={15} /> 11:00–14:00 降雨機率偏高</div></section>
          <section className="route-card alternative"><div className="card-label"><Check size={15} /> 建議替代</div><div className="route-title-row"><div><h3>河濱左岸</h3><p>社子島・基隆河沿岸</p></div><ChevronRight size={19} /></div><div className="route-metrics"><div><span>距離</span><strong className="mono">18.1 <small>km</small></strong></div><div><span>爬升</span><strong className="mono">92 <small>m</small></strong></div><div><span>雨量峰值</span><strong className="mono safe-text">18<small>%</small></strong></div></div><div className="route-note safe-note"><Check size={15} /> 今日較適合，午後維持安全</div></section>
        </div>

        <div className="lower-grid">
          <section className="panel hazard-panel"><div className="panel-heading"><div><p className="eyebrow">風櫃嘴 / 風險分段</p><h3>沿線注意事項</h3></div><span className="mono panel-meta">3 個警示</span></div>{hazards.map((hazard) => <div className="hazard-row" key={hazard.km}><span className={`hazard-icon ${hazard.level}`}>{hazard.level === "danger" ? <AlertTriangle size={14} /> : <Wind size={14} />}</span><span className="mono hazard-km">KM {hazard.km}</span><div><strong>{hazard.title}</strong><p>{hazard.detail}</p></div></div>)}</section>
          <section className="panel profile-panel"><div className="panel-heading"><div><p className="eyebrow">今日預報</p><h3>天氣剖面</h3></div><span className="mono panel-meta">06:00 — 18:00</span></div><div className="profile-chart" aria-label="降雨機率與爬升剖面圖"><div className="ridge ridge-one" /><div className="ridge ridge-two" /><div className="rain-band" /><span className="chart-label label-one">60%</span><span className="chart-label label-two">32km/h</span></div><div className="chart-axis mono"><span>06</span><span>09</span><span>12</span><span>15</span><span>18</span></div><div className="legend"><span><i className="legend-line rain" />降雨機率</span><span><i className="legend-line wind" />風速</span></div></section>
        </div>

        <footer className="routecast-footer"><span><Compass size={15} /> 資料來源：中央氣象署・路線資料 2026.09.27</span><div className="variant-switch" aria-label="視覺變體"><span>視覺方向</span>{(["soft", "field", "hard"] as const).map((variant) => <button key={variant} className={activeVariant === variant ? "selected" : ""} onClick={() => setActiveVariant(variant)}>{variant === "soft" ? "柔和" : variant === "field" ? "標準" : "硬朗"}</button>)}</div></footer>
      </div>
    </main>
  )
}

export default RoutecastDashboard
