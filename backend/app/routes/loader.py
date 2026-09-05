from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import LoadCreate

router = APIRouter(prefix="/loader", tags=["Loader & Loads"])

# Create a load using loader_profiles.id directly
@router.post("/loads/create", status_code=status.HTTP_201_CREATED)
def create_load(load: LoadCreate, db: Session = Depends(get_db)):
    if load.min_price is not None and load.max_price is not None:
        if load.min_price > load.max_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimum price cannot be greater than maximum price.",
            )

    loader_profile = db.execute(
        text("SELECT id FROM loader_profiles WHERE id = :profile_id"),
        {"profile_id": load.loader_id},
    ).first()

    if not loader_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided loader_id does not map to an active loader business profile.",
        )

    if load.pickup_date and load.pickup_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pickup date cannot be in the past.",
        )

    query = text("""
        INSERT INTO loads (
            pickup, destination, load_type, weight, truck_type, 
            pickup_date, min_price, max_price, description, loader_id, status
        ) 
        VALUES (
            :pickup, :destination, :load_type, :weight, :truck_type, 
            :pickup_date, :min_price, :max_price, :description, :loader_id, 'AVAILABLE'
        )
    """)

    payload = load.model_dump()
    payload["loader_id"] = loader_profile.id

    result = db.execute(query, payload)
    db.commit()
    return {"message": "Load created successfully", "loadId": result.lastrowid}


# Fetch loads directly using loader_profiles.id
@router.get("/loads/{loader_id}")
def get_loader_loads(loader_id: int, db: Session = Depends(get_db)):
    loader_profile = db.execute(
        text("SELECT id FROM loader_profiles WHERE id = :loader_id"),
        {"loader_id": loader_id},
    ).first()

    if not loader_profile:
        return []

    query = text("""
        SELECT id, pickup, destination, load_type, weight, 
               truck_type, DATE_FORMAT(pickup_date, '%d/%m/%Y') AS pickup_date, 
               min_price, max_price, description, 
               status, loader_id 
        FROM loads 
        WHERE loader_id = :loader_profile_id 
        ORDER BY created_at DESC
    """)
    loads = (
        db.execute(query, {"loader_profile_id": loader_profile.id})
        .mappings()
        .all()
    )
    return [dict(load) for load in loads]


@router.put("/loads/{load_id}/cancel")
def cancel_load(load_id: int, db: Session = Depends(get_db)):
    update_query = text(
        "UPDATE loads SET status = 'CANCELLED' WHERE id = :load_id"
    )
    result = db.execute(update_query, {"load_id": load_id})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Load not found"
        )
    return {"message": "Load cancelled successfully"}