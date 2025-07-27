from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz
from routers.auth.auth import auth_router
from routers.users import users_router
from routers.admin.admin import router as admin_router
from routers.products.products import products_router 
from routers.cart.cart import cart_router
from routers.wallet.wallet import wallet_router
from routers.applications.applications import applications_router
from routers.orders.orders import orders_router
from routers.agents_routes.routes import agents_routes_router


app = FastAPI(
    title="Vendor Collective", # You can update the title
    description="A digital platform for the street food vendor cooperative in your locality.", 
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def time_window_middleware(request: Request, call_next):
    """
    This middleware checks if an ordering-related request is within the
    6:00 PM to 11:30 PM IST window.
    """
    # Define which paths are restricted by time
    restricted_paths = ["/cart/items", "/products"]

    is_restricted = any(request.url.path.startswith(path) for path in restricted_paths)
    
    # Allow users to BROWSE products anytime, but not create/update them
    if request.method == "GET" and request.url.path.startswith("/products"):
        is_restricted = False

    if is_restricted:
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)
        current_hour = now_ist.hour
        current_minute = now_ist.minute
        
        # Check if the time is between 6:00 PM (18:00) and 11:30 PM (23:30)
        is_open = (18 <= current_hour < 23) or (current_hour == 23 and current_minute < 30)
        
        if not is_open:
            raise HTTPException(
                status_code=403, 
                detail="The ordering window is currently closed. It is open from 6:00 PM to 11:30 PM IST."
            )

    response = await call_next(request)
    return response

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(wallet_router)
app.include_router(applications_router)
app.include_router(orders_router)
app.include_router(agents_routes_router)
