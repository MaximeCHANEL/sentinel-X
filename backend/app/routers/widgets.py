from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import DashboardWidget
from ..schemas import WidgetCreate, WidgetResponse, WidgetUpdate

router = APIRouter(prefix="/api/widgets", tags=["Widgets"])
CURRENT_USER_ID = 1

@router.get("", response_model=list[WidgetResponse])
def get_widgets(db: Session = Depends(get_db)):
    return (db.query(DashboardWidget)
            .filter(DashboardWidget.user_id == CURRENT_USER_ID, DashboardWidget.visible == True)
            .order_by(DashboardWidget.position_y, DashboardWidget.position_x).all())

@router.post("", response_model=WidgetResponse)
def create_widget(widget_data: WidgetCreate, db: Session = Depends(get_db)):
    existing = (db.query(DashboardWidget)
                .filter(DashboardWidget.user_id == CURRENT_USER_ID, DashboardWidget.widget == widget_data.widget).first())
    if existing:
        raise HTTPException(status_code=409, detail="Ce widget existe déjà.")
    widget = DashboardWidget(user_id=CURRENT_USER_ID, **widget_data.model_dump())
    db.add(widget)
    db.commit()
    db.refresh(widget)
    return widget

@router.put("/{widget_id}", response_model=WidgetResponse)
def update_widget(widget_id: int, widget_data: WidgetUpdate, db: Session = Depends(get_db)):
    widget = (db.query(DashboardWidget)
              .filter(DashboardWidget.id == widget_id, DashboardWidget.user_id == CURRENT_USER_ID).first())
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget introuvable.")
    for field, value in widget_data.model_dump(exclude_unset=True).items():
        setattr(widget, field, value)
    db.commit()
    db.refresh(widget)
    return widget

@router.delete("/{widget_id}")
def delete_widget(widget_id: int, db: Session = Depends(get_db)):
    widget = (db.query(DashboardWidget)
              .filter(DashboardWidget.id == widget_id, DashboardWidget.user_id == CURRENT_USER_ID).first())
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget introuvable.")
    db.delete(widget)
    db.commit()
    return {"message": "Widget supprimé."}
