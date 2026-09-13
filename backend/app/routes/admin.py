from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])


# 1. GET ALL DRIVERS
@router.get("/drivers")
def get_all_drivers(db: Session = Depends(get_db)):
    drivers = db.execute(
        text("""
            SELECT
                u.id AS id,
                u.name AS name,
                u.email AS email,
                u.phone AS phone,
                u.city AS city,
                u.role AS role,
                u.status AS status,
                DATE_FORMAT(u.created_at, '%d/%m/%Y') AS createdAt,
                dp.id AS driverId,
                dp.experience AS experience,
                dp.truck_number AS truckNumber,
                dp.truck_type AS truckType,
                dp.capacity AS capacity,
                dp.license_number AS licenseNumber,
                (
                    SELECT COUNT(*) 
                    FROM deals d
                    WHERE d.driver_id = dp.id 
                      AND d.status = 'COMPLETED'
                ) AS totalLoads
            FROM users u
            LEFT JOIN driver_profiles dp
                ON u.id = dp.user_id
            WHERE u.role = 'DRIVER'
            ORDER BY u.id DESC
        """)
    ).mappings().all()
    
    return [dict(driver) for driver in drivers]


# 2. GET ALL LOADERS
@router.get("/loaders")
def get_loaders(db: Session = Depends(get_db)):
    loaders = db.execute(
        text("""
            SELECT
                u.id AS id,
                u.name AS name,
                u.email AS email,
                u.phone AS phone,
                u.city AS city,
                u.role AS role,
                u.status AS status,
                DATE_FORMAT(u.created_at, '%d/%m/%Y') AS createdAt,
                lp.id AS loaderId,
                lp.company_name AS companyName,
                lp.business_type AS businessType,
                lp.gst_number AS gstNumber,
                lp.operating_hours AS operatingHours,
                lp.address AS address,
                (
                    SELECT COUNT(*) 
                    FROM loads l 
                    WHERE l.loader_id = lp.id
                ) AS totalLoads
            FROM users u
            LEFT JOIN loader_profiles lp
                ON u.id = lp.user_id
            WHERE u.role = 'LOADER'
            ORDER BY u.created_at DESC
        """)
    ).mappings().all()
    
    return [dict(loader) for loader in loaders]


# 3. GET PENDING VERIFICATIONS
@router.get("/verification")
def get_pending_users(db: Session = Depends(get_db)):
    users = db.execute(
        text("""
            SELECT
                u.id AS id,
                u.name AS name,
                u.email AS email,
                u.phone AS phone,
                u.city AS city,
                u.role AS role,
                u.status AS status,
                DATE_FORMAT(u.created_at, '%d/%m/%Y') AS createdAt
            FROM users u
            WHERE u.status = 'PENDING'
            ORDER BY u.created_at DESC
        """)
    ).mappings().all()
    
    return [dict(user) for user in users]


# 4. APPROVE / REJECT USER VERIFICATION
@router.put("/verification/{user_id}/verify")
def update_verification(user_id: int, status: str, db: Session = Depends(get_db)):
    if status not in ["VERIFIED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid status"
        )

    user = db.execute(
        text("SELECT id FROM users WHERE id = :user_id"),
        {"user_id": user_id}
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )

    db.execute(
        text("UPDATE users SET status = :status WHERE id = :user_id"),
        {"status": status, "user_id": user_id}
    )
    db.commit()
    return {"message": "User status updated", "user_id": user_id, "status": status}


# 5. GET CONTACT SUPPORT QUERIES
@router.get("/contacts")
def get_contacts(
    status: Optional[str] = Query(None, description="Filter status: pending, resolved/closed, or all"),
    db: Session = Depends(get_db)
):
    query_str = """
        SELECT 
            id, 
            name, 
            email, 
            phone, 
            message, 
            status, 
            DATE_FORMAT(created_at, '%d/%m/%Y') AS createdAt 
        FROM contacts
    """

    if status:
        status_filter = status.lower()
        if status_filter == "pending":
            query_str += " WHERE LOWER(status) = 'pending'"
        elif status_filter in ["resolved", "closed"]:
            query_str += " WHERE LOWER(status) IN ('closed', 'resolved')"

    query_str += " ORDER BY created_at DESC"

    contacts = db.execute(text(query_str)).mappings().all()

    result = []
    for contact in contacts:
        contact_data = dict(contact)
        contact_data["subject"] = "Contact Request"
        result.append(contact_data)

    return result


# 6. CLOSE / RESOLVE CONTACT REQUEST
@router.put("/contacts/{contact_id}/resolve")
def resolve_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.execute(
        text("SELECT id, status FROM contacts WHERE id = :contact_id"),
        {"contact_id": contact_id}
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Contact request not found"
        )

    db.execute(
        text("UPDATE contacts SET status = 'CLOSED' WHERE id = :contact_id"),
        {"contact_id": contact_id}
    )
    db.commit()
    return {"message": "Contact request closed", "contact_id": contact_id, "status": "CLOSED"}
