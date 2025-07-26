from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth.auth import auth_router
from routers.users import users_router
from routers.admin.admin import router as admin_router
from routers.products.products import products_router # 1. IMPORT YOUR NEW ROUTER

app = FastAPI(
    title="Vendor Collective", # You can update the title
    description="A digital platform for the street food vendor cooperative in Tarn Taran Sahib.", # You can update the description
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(products_router) # 2. INCLUDE THE ROUTER WITH THE APP