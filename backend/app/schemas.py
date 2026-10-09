from pydantic import BaseModel, Field
from datetime import datetime

class WidgetBase(BaseModel):
    widget: str
    position_x: int = Field(default=0, ge=0)
    position_y: int = Field(default=0, ge=0)
    width: int = Field(default=4, ge=1)
    height: int = Field(default=3, ge=1)
    visible: bool = True

class WidgetCreate(WidgetBase):
    pass

class WidgetUpdate(BaseModel):
    position_x: int | None = Field(default=None, ge=0)
    position_y: int | None = Field(default=None, ge=0)
    width: int | None = Field(default=None, ge=1)
    height: int | None = Field(default=None, ge=1)
    visible: bool | None = None

class WidgetResponse(WidgetBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class ReadingCreate(BaseModel):
    name_capteur: str = Field(min_length=1, max_length=50)
    value: float
    recorded_at: datetime | None = None

class ReadingResponse(BaseModel):
    id: int
    name_capteur: str
    value: float
    recorded_at: datetime
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=128)

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"