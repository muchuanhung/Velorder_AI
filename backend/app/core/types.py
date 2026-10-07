"""MySQL 專用欄位型別；在 SQLite（測試）退回通用型別。"""

from sqlalchemy import BigInteger, DateTime, Integer
from sqlalchemy.dialects import mysql
from sqlalchemy.types import UserDefinedType

# BIGINT UNSIGNED；SQLite 的自增主鍵必須是 INTEGER
UBigInt = (
    BigInteger()
    .with_variant(mysql.BIGINT(unsigned=True), "mysql")
    .with_variant(Integer(), "sqlite")
)
UInt = Integer().with_variant(mysql.INTEGER(unsigned=True), "mysql")
USmallInt = Integer().with_variant(mysql.SMALLINT(unsigned=True), "mysql")
DateTime3 = DateTime().with_variant(mysql.DATETIME(fsp=3), "mysql")


class Geometry(UserDefinedType):
    """MySQL 空間欄位（POLYGON / POINT），固定 SRID 4326。"""

    cache_ok = True

    def __init__(self, kind: str, srid: int = 4326) -> None:
        self.kind = kind
        self.srid = srid

    def get_col_spec(self, **kw) -> str:
        return f"{self.kind} SRID {self.srid}"
