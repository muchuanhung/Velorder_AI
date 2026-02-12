"use client";

import { Thermometer, Droplets, Wind, Sun, Gauge } from "lucide-react";
import { WeatherMetric } from "./weather-metric";

export interface CompactMetricsData {
  temperature: number;
  humidity: number;
  windSpeedKmh: number;
  uvIndex: number;
  rainPop: number;
}

interface CompactMetricsGridProps {
  data: CompactMetricsData;
}

/** 2 欄 compact 氣象指標，用於地圖 control panel 等窄版面 */
export function CompactMetricsGrid({ data }: CompactMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <WeatherMetric
        icon={Thermometer}
        label="溫度"
        value={`${data.temperature}°C`}
        color="text-strava"
      />
      <WeatherMetric
        icon={Droplets}
        label="濕度"
        value={`${data.humidity}%`}
        color="text-[#60a5fa]"
      />
      <WeatherMetric
        icon={Wind}
        label="風速"
        value={`${data.windSpeedKmh} km/h`}
        color="text-[#a78bfa]"
      />
      <WeatherMetric
        icon={Sun}
        label="紫外線"
        value={String(data.uvIndex)}
        color="text-warning"
      />
      <WeatherMetric
        icon={Gauge}
        label="降雨機率"
        value={`${data.rainPop}%`}
        color="text-[#4169E1]"
      />
    </div>
  );
}
