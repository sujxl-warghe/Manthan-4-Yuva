import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine, AsyncSessionLocal
from app.routers import (
    admin_public,
    analytics,
    auth,
    leaderboard,
    operations,
    reference,
    reports,
    trees,
    verifications,
    wards,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("vrukshasetu")

app = FastAPI(
    title=settings.APP_NAME,
    description="VrukshaSetu — Plant. Protect. Prove Survival. API for the Nagpur tree survival tracking platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code}")
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        body = detail
    else:
        body = {"success": False, "message": str(detail), "error_code": "ERROR"}
    return JSONResponse(status_code=exc.status_code, content=body)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error", "error_code": "INTERNAL_ERROR"},
    )


@app.on_event("startup")
async def on_startup():
    # Prototype convenience: auto-create tables if they don't exist yet.
    # (A real production deployment should use Alembic migrations instead.)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info(f"VrukshaSetu API started | environment={settings.ENVIRONMENT} | db={settings.DATABASE_URL.split('://')[0]}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "vrukshasetu-api"}


@app.get("/ready")
async def ready():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "not_ready", "database": "disconnected", "error": str(e)})


@app.get("/")
async def root():
    return {
        "service": "VrukshaSetu API",
        "tagline": "Plant. Protect. Prove Survival.",
        "docs": "/docs",
        "health": "/health",
    }


app.include_router(auth.router)
app.include_router(trees.router)
app.include_router(verifications.router)
app.include_router(reports.router)
app.include_router(operations.router)
app.include_router(wards.router)
app.include_router(analytics.router)
app.include_router(leaderboard.router)
app.include_router(admin_public.router)
app.include_router(reference.router)
