from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ContactRequest

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_contact(request: ContactRequest, db: Session = Depends(get_db)):
    db.execute(
        text("""
            INSERT INTO contacts (name, email, phone, message, status) 
            VALUES (:name, :email, :phone, :message, 'PENDING')
        """),
        {
            "name": request.name.strip(),
            "email": request.email.strip().lower(),
            "phone": request.phone.strip() if request.phone else None,
            "message": request.message.strip(),
        },
    )
    db.commit()
    return {"message": "Contact request submitted successfully"}