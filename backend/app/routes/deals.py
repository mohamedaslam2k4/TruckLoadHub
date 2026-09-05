from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/deals", tags=["Deals"])

# 1. GET DRIVER DEALS
@router.get("/driver/{driver_id}")
def get_driver_deals(driver_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT d.id AS dealId, 
               d.load_id AS loadId, 
               d.driver_id AS driverId, 
               d.deal_price AS dealPrice, 
               d.status AS status, 
               l.pickup, 
               l.destination, 
               l.load_type AS loadType, 
               l.weight, 
               l.truck_type AS truckType, 
               DATE_FORMAT(l.pickup_date, '%d/%m/%Y') AS pickupDate, 
               l.loader_id AS loaderId, 
               u_loader.name AS loaderName, 
               u_loader.phone AS loaderPhone, 
               u_loader.city AS loaderCity,
               lp.company_name AS companyName, 
               lp.business_type AS businessType,
               lp.gst_number AS gstNumber, 
               lp.operating_hours AS operatingHours,
               lp.address AS companyAddress
        FROM deals d 
        INNER JOIN loads l ON d.load_id = l.id 
        INNER JOIN loader_profiles lp ON l.loader_id = lp.id
        INNER JOIN users u_loader ON lp.user_id = u_loader.id 
        WHERE d.driver_id = :driver_id 
        ORDER BY d.id DESC
    """)
    deals = db.execute(query, {"driver_id": driver_id}).mappings().all()
    return [dict(deal) for deal in deals]



# 2. GET LOADER DEALS
@router.get("/loader/{loader_id}")
def get_loader_deals(loader_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT d.id AS dealId, 
               d.load_id AS loadId, 
               d.driver_id AS driverId, 
               d.deal_price AS dealPrice, 
               d.status AS status, 
               l.pickup, 
               l.destination, 
               l.load_type AS loadType, 
               l.weight, 
               l.truck_type AS truckType, 
               DATE_FORMAT(l.pickup_date, '%d/%m/%Y') AS pickupDate, 
               u_driver.name AS driverName, 
               u_driver.phone AS driverPhone, 
               u_driver.city AS driverCity, 
               dp.truck_type AS vehicleType, 
               dp.truck_number AS vehicleNumber, 
               dp.license_number AS licenseNumber, 
               dp.capacity, 
               dp.experience 
        FROM deals d 
        INNER JOIN loads l ON d.load_id = l.id 
        INNER JOIN driver_profiles dp ON d.driver_id = dp.id 
        INNER JOIN users u_driver ON dp.user_id = u_driver.id
        WHERE l.loader_id = :loader_id 
        ORDER BY d.id DESC
    """)
    deals = db.execute(query, {"loader_id": loader_id}).mappings().all()
    return [dict(deal) for deal in deals]



# 3. ACCEPT DEAL (PENDING -> ACCEPTED)
@router.put("/{deal_id}/accept")
def accept_deal(deal_id: int, db: Session = Depends(get_db)):
    deal_query = text("SELECT id, load_id, status FROM deals WHERE id = :deal_id")
    deal = db.execute(deal_query, {"deal_id": deal_id}).mappings().first()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["status"] != "PENDING":
        raise HTTPException(status_code=400, detail="Only pending deals can be accepted")
    
    # 1. Accept current deal
    db.execute(text("UPDATE deals SET status = 'ACCEPTED' WHERE id = :deal_id"), {"deal_id": deal_id})
    # 2. Update load status to BOOKED
    db.execute(text("UPDATE loads SET status = 'BOOKED' WHERE id = :load_id"), {"load_id": deal["load_id"]})
    # 3. Reject other pending deals on the same load
    db.execute(text("""
        UPDATE deals 
        SET status = 'REJECTED' 
        WHERE load_id = :load_id AND id != :deal_id AND status = 'PENDING'
    """), {"load_id": deal["load_id"], "deal_id": deal_id})
    
    db.commit()
    return {"message": "Deal accepted successfully", "dealId": deal_id, "status": "ACCEPTED"}



# 4. START TRIP (ACCEPTED -> IN TRANSIT)
@router.put("/{deal_id}/start")
def start_trip(deal_id: int, db: Session = Depends(get_db)):
    deal_query = text("SELECT id, load_id, status FROM deals WHERE id = :deal_id")
    deal = db.execute(deal_query, {"deal_id": deal_id}).mappings().first()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["status"] != "ACCEPTED":
        raise HTTPException(status_code=400, detail="Only accepted deals can be started")
    
    db.execute(text("UPDATE deals SET status = 'IN TRANSIT' WHERE id = :deal_id"), {"deal_id": deal_id})
    db.commit()
    return {"message": "Trip started successfully", "dealId": deal_id, "status": "IN TRANSIT"}



# 5. COMPLETE DEAL (IN TRANSIT -> COMPLETED)
@router.put("/{deal_id}/complete")
def complete_deal(deal_id: int, db: Session = Depends(get_db)):
    deal_query = text("SELECT id, load_id, driver_id, status FROM deals WHERE id = :deal_id")
    deal = db.execute(deal_query, {"deal_id": deal_id}).mappings().first()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["status"] != "IN TRANSIT":
        raise HTTPException(status_code=400, detail="Only in-transit trips can be completed")
    
    db.execute(text("UPDATE deals SET status = 'COMPLETED' WHERE id = :deal_id"), {"deal_id": deal_id})
    db.execute(text("UPDATE loads SET status = 'COMPLETED' WHERE id = :load_id"), {"load_id": deal["load_id"]})
    db.commit()
    return {"message": "Trip completed successfully", "dealId": deal_id, "status": "COMPLETED"}



# 6. REJECT DEAL (PENDING -> REJECTED)
@router.put("/{deal_id}/reject")
def reject_deal(deal_id: int, db: Session = Depends(get_db)):
    deal_query = text("SELECT id, load_id, status FROM deals WHERE id = :deal_id")
    deal = deal = db.execute(deal_query, {"deal_id": deal_id}).mappings().first()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal["status"] != "PENDING":
        raise HTTPException(status_code=400, detail="Only pending deals can be rejected")
    
    db.execute(text("UPDATE deals SET status = 'REJECTED' WHERE id = :deal_id"), {"deal_id": deal_id})
    db.commit()
    return {"message": "Deal rejected", "dealId": deal_id, "status": "REJECTED"}