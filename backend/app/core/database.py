"""Database configuration and connection management."""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from urllib.parse import urlparse, parse_qs, urlencode
import ssl
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import MetaData
from app.core.config import settings

# Normalize legacy postgres:// URIs to asyncpg driver if needed
raw_url = settings.DATABASE_URL
if raw_url.startswith("postgres://"):
    # Replace only the scheme prefix
    async_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    settings.DATABASE_URL = async_url  # type: ignore[attr-defined]
elif raw_url.startswith("postgresql://") and "+" not in raw_url.split("://", 1)[0]:
    # User provided postgresql:// without driver; upgrade to asyncpg
    settings.DATABASE_URL = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)  # type: ignore[attr-defined]

# Determine SSL requirements from query string
parsed = urlparse(settings.DATABASE_URL)
query_dict = parse_qs(parsed.query)
connect_args: dict = {}

sslmode_values = {"require", "verify-full", "verify-ca"}
sslmode = query_dict.pop("sslmode", [None])[0]
if sslmode in sslmode_values:
    ctx = ssl.create_default_context()
    connect_args["ssl"] = ctx

# Rebuild URL without sslmode so asyncpg doesn't receive unsupported kw
if query_dict:
    new_query = urlencode({k: v[0] for k, v in query_dict.items() if v}, doseq=False)
else:
    new_query = ""
sanitized_url = parsed._replace(query=new_query).geturl()

engine = create_async_engine(
    sanitized_url,
    echo=settings.DEBUG,
    future=True,
    connect_args=connect_args
)

# Create async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Create declarative base
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()


from typing import AsyncGenerator


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session.

    Yields an AsyncSession and ensures it is closed afterwards.
    """
    async with AsyncSessionLocal() as session:  # type: ignore
        yield session


async def init_db():
    """Initialize database - create all tables."""
    async with engine.begin() as conn:
        # Import models to register them
        from app.models import cryptocurrency, price_history
        await conn.run_sync(Base.metadata.create_all)