from sqlalchemy import Boolean, ForeignKey, Integer, String, BigInteger, DateTime, Float, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="user")
    widgets = relationship("DashboardWidget", back_populates="user", cascade="all, delete-orphan")

class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    widget: Mapped[str] = mapped_column(String(100), nullable=False)
    position_x: Mapped[int] = mapped_column(Integer, default=0)
    position_y: Mapped[int] = mapped_column(Integer, default=0)
    width: Mapped[int] = mapped_column(Integer, default=4)
    height: Mapped[int] = mapped_column(Integer, default=3)
    visible: Mapped[bool] = mapped_column(Boolean, default=True)
    user = relationship("User", back_populates="widgets")

class CapteurData(Base):
    __tablename__ = "capteur_data"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name_capteur: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    __table_args__ = (Index("idx_sensor_time", "name_capteur", "recorded_at"),)
