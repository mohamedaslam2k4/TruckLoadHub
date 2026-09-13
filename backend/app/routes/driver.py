from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import DealCreate

router = APIRouter(prefix="/driver", tags=["Driver"])

@router.get("/loads")
def get_available_loads(driver_id: int = None, db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            l.id, 
            l.pickup, 
            l.destination, 
            l.load_type AS load_type, 
            l.weight, 
            l.truck_type AS truck_type, 
            DATE_FORMAT(l.pickup_date, '%d/%m/%Y') AS pickup_date, 
            l.min_price AS min_price, 
            l.max_price AS max_price, 
            l.description, 
            l.status, 
            l.loader_id AS loader_id 
        FROM loads l
        WHERE l.status = 'AVAILABLE' 
          AND (:driver_id IS NULL OR l.id NOT IN (
              SELECT d.load_id 
              FROM deals d 
              WHERE d.driver_id = :driver_id 
                AND d.status IN ('PENDING', 'ACCEPTED')
          ))
        ORDER BY l.created_at DESC
    """)
    loads = db.execute(query, {"driver_id": driver_id}).mappings().all()
    return [dict(load) for load in loads]

@router.post("/deals/create", status_code=status.HTTP_201_CREATED)
def create_deal(data: DealCreate, db: Session = Depends(get_db)):
    # Extract IDs safely regardless of frontend key casing (snake_case vs camelCase)
    load_id = getattr(data, "load_id", None) or getattr(data, "loadId", None)
    driver_id = getattr(data, "driver_id", None) or getattr(data, "driverId", None)
    deal_price = getattr(data, "deal_price", None) or getattr(data, "dealPrice", None)

    if not load_id or not driver_id or deal_price is None:
        raise HTTPException(
            status_code=400,
            detail="load_id, driver_id, and deal_price are required parameters."
        )

    # 1. Fetch driver checking against both u.id and dp.id
    driver_query = text("""
        SELECT dp.id AS profile_id, u.id AS user_id, u.name, u.role, u.status 
        FROM users u
        LEFT JOIN driver_profiles dp ON dp.user_id = u.id
        WHERE (u.id = :driver_id OR dp.id = :driver_id) 
          AND u.role = 'DRIVER'
    """)
    driver = db.execute(driver_query, {"driver_id": driver_id}).mappings().first()

    if not driver:
        raise HTTPException(status_code=400, detail="Driver profile not found.")

    if driver["status"] != "VERIFIED":
        raise HTTPException(
            status_code=400, 
            detail="Your account is not verified. Please contact administrator."
        )

    # Use actual profile_id if present; fallback to user_id for DB foreign key
    actual_driver_id = driver["profile_id"] if driver["profile_id"] is not None else driver["user_id"]

    # 2. Fetch load details
    load_query = text("""
        SELECT id, pickup, destination, min_price, max_price, status, loader_id 
        FROM loads 
        WHERE id = :load_id
    """)
    load = db.execute(load_query, {"load_id": load_id}).mappings().first()

    if not load:
        raise HTTPException(status_code=404, detail="Load not found.")

    if load["status"] != "AVAILABLE":
        raise HTTPException(
            status_code=400, 
            detail="This load is no longer open for bidding."
        )

    # 3. Validate price constraints
    min_price = float(load["min_price"]) if load["min_price"] is not None else 0.0
    max_price = float(load["max_price"]) if load["max_price"] is not None else float("inf")

    if deal_price < min_price or deal_price > max_price:
        raise HTTPException(
            status_code=400, 
            detail=f"Deal price must be between ₹{min_price:,.0f} and ₹{max_price:,.0f}"
        )

    # 4. Check for existing active bid on this load
    deal_check_query = text("""
        SELECT id 
        FROM deals 
        WHERE load_id = :load_id 
          AND driver_id = :driver_id 
          AND status IN ('PENDING', 'ACCEPTED')
    """)
    existing_deal = db.execute(
        deal_check_query, 
        {"load_id": load_id, "driver_id": actual_driver_id}
    ).first()

    if existing_deal:
        raise HTTPException(
            status_code=400, 
            detail="You already have an active deal or offer submitted for this load."
        )

    # 5. Insert new deal offer
    insert_deal_query = text("""
        INSERT INTO deals (load_id, driver_id, deal_price, status) 
        VALUES (:load_id, :driver_id, :deal_price, 'PENDING')
    """)
    result = db.execute(
        insert_deal_query, 
        {"load_id": load_id, "driver_id": actual_driver_id, "deal_price": deal_price}
    )

    db.commit()

    return {
        "message": "Deal request sent successfully", 
        "dealId": result.lastrowid, 
        "loadId": load_id, 
        "driverId": actual_driver_id, 
        "driverName": driver["name"], 
        "dealPrice": deal_price, 
        "status": "PENDING"
    }
