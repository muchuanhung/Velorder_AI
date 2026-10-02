from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

API_ROOT = Path(__file__).resolve().parents[1]


def _config(url: str) -> Config:
    cfg = Config(str(API_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(API_ROOT / "alembic"))
    cfg.cmd_opts = type("Opts", (), {"x": [f"url={url}"]})()
    return cfg


def test_upgrade_and_downgrade_on_sqlite(tmp_path):
    url = f"sqlite:///{tmp_path / 'm.db'}"
    cfg = _config(url)
    command.upgrade(cfg, "head")

    insp = inspect(create_engine(url))
    assert {"members", "routes", "alembic_version"} <= set(insp.get_table_names())
    cols = {c["name"] for c in insp.get_columns("routes")}
    assert {"member_id", "storage_key", "analysis_status", "start_lat", "analysis"} <= cols

    command.downgrade(cfg, "base")
    assert set(inspect(create_engine(url)).get_table_names()) == {"alembic_version"}


def test_mysql_offline_sql_has_spatial_column(capsys):
    command.upgrade(_config("mysql+pymysql://u:p@localhost/routecast"), "head", sql=True)
    sql = capsys.readouterr().out
    assert "CREATE TABLE members" in sql
    assert "CREATE TABLE routes" in sql
    assert "ST_SRID(POINT(start_lng, start_lat), 4326)" in sql
    assert "STORED SRID 4326" in sql
    assert "utf8mb4" in sql
