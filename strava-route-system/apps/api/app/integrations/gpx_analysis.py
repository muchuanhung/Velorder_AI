"""GPX 解析與分段（目前為 stub）。

parse 只做安全的 XML 檢查與點數／起點統計；距離、爬升、分段之後再接真正的演算法
（與 web 端 0.5 km 取樣、行政區反查邏輯對齊）。回傳結構先固定，前端可以先接。
"""

from dataclasses import asdict, dataclass, field
from xml.etree.ElementTree import Element

from defusedxml import ElementTree as SafeET
from defusedxml.common import DefusedXmlException

PARSER_VERSION = "stub-0"


class GpxFormatError(Exception):
    """檔案不是合法的 GPX。"""


@dataclass
class ParsedGpx:
    track_name: str | None
    point_count: int
    start_lat: float | None
    start_lng: float | None
    # 尚未實作，固定為 None
    distance_m: float | None = None
    elevation_gain_m: float | None = None
    parser_version: str = PARSER_VERSION

    def to_analysis(self) -> dict:
        return {"parse": asdict(self), "segments": None}


@dataclass
class RouteSegment:
    index: int
    start_km: float | None
    end_km: float | None
    county: str | None = None
    town: str | None = None
    placeholder: bool = True


@dataclass
class SegmentResult:
    status: str
    segment_length_km: float
    segments: list[RouteSegment] = field(default_factory=list)
    note: str = "分段尚未實作，回傳 placeholder"


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _point_of(el: Element) -> tuple[float, float] | None:
    try:
        return float(el.attrib["lat"]), float(el.attrib["lon"])
    except (KeyError, ValueError):
        return None


def parse_gpx(data: bytes) -> ParsedGpx:
    try:
        root = SafeET.fromstring(data)
    except (SafeET.ParseError, DefusedXmlException) as exc:
        raise GpxFormatError(f"GPX XML 解析失敗：{exc}") from exc
    if _local(root.tag) != "gpx":
        raise GpxFormatError("根元素不是 <gpx>")

    track_name: str | None = None
    first: tuple[float, float] | None = None
    count = 0
    for el in root.iter():
        tag = _local(el.tag)
        if tag == "name" and track_name is None and el.text:
            track_name = el.text.strip() or None
        elif tag in ("trkpt", "rtept"):
            count += 1
            if first is None:
                first = _point_of(el)

    return ParsedGpx(
        track_name=track_name,
        point_count=count,
        start_lat=first[0] if first else None,
        start_lng=first[1] if first else None,
    )


def segment_route(parsed: ParsedGpx | None, segment_length_km: float = 0.5) -> SegmentResult:
    return SegmentResult(
        status="stub",
        segment_length_km=segment_length_km,
        segments=[RouteSegment(index=0, start_km=0.0, end_km=None)] if parsed else [],
    )
