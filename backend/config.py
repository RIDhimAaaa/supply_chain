import os
from dotenv import load_dotenv
from supabase import create_client, Client
import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

load_dotenv()

# Create the base class for SQLAlchemy models
Base = declarative_base()

# Supabase client (for auth and realtime)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_KEY")  # Service role key
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")  # Default to HS256 if not set

# Regular client for normal operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Admin client for password resets (uses service role key)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Direct database connection
DATABASE_URL = os.getenv("DATABASE_URL")  # PostgreSQL connection string
if DATABASE_URL:
    # Sync engine for Alembic migrations
    sync_engine = create_engine(DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"))
    
    # Async engine for FastAPI app
    asyncpg_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    if "?" in asyncpg_url:
        base_url = asyncpg_url.split("?")[0]
    else:
        base_url = asyncpg_url
    
    asyncpg_url = f"{base_url}?prepared_statement_cache_size=0"
    
    async_engine = create_async_engine(
        asyncpg_url,
        echo=False,
        pool_pre_ping=True,  # Enable connection health checks
        pool_size=5,  # Reduced for Supabase connection limits
        max_overflow=10,  # Allow more overflow
        pool_timeout=30,  # Timeout for getting connection from pool
        pool_recycle=3600,  # Recycle connections every hour
        connect_args={
            "command_timeout": 60,  # Command timeout
            "server_settings": {
                "jit": "off",  # Disable JIT for better compatibility
            }
        }
    )

    AsyncSessionLocal = sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
else:
    sync_engine = None
    async_engine = None
    AsyncSessionLocal = None

async def get_db():
    if AsyncSessionLocal is None:
        raise Exception("Database not configured")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    if async_engine is None:
        raise Exception("Database not configured")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

def get_sync_engine():
    if sync_engine is None:
        raise Exception("Database not configured")
    return sync_engine
