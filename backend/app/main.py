from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import admin, auth, contact, loader, driver, deals

app = FastAPI(title="TL Hub Backend API", version="1.0.0")

# CORS middleware configuration for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://truckloadhub.onrender.com/",
        "https://truckloadhub.onrender.com",
     
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Application Router Module Mounting
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(contact.router)
app.include_router(deals.router)
app.include_router(driver.router)
app.include_router(loader.router)

@app.get("/")
def root():
    return {"message": "TL Hub API is running"}
