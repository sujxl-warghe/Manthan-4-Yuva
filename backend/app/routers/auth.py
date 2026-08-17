from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User, UserPoints
from app.schemas import LoginRequest, RegisterRequest
from app.security import create_access_token, get_current_user, hash_password, verify_password
from app.utils import ok

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register")
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "message": "Email already registered", "error_code": "EMAIL_EXISTS"},
        )
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role if payload.role in [r for r in ("CITIZEN", "INSTITUTION", "NGO", "CSR")] else "CITIZEN",
        phone=payload.phone,
    )
    db.add(user)
    await db.flush()
    db.add(UserPoints(user_id=user.id))
    await db.commit()
    token = create_access_token(user.id, user.role.value if hasattr(user.role, "value") else user.role)
    return ok({"token": token, "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}})


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid credentials", "error_code": "INVALID_CREDENTIALS"},
        )
    token = create_access_token(user.id, user.role.value if hasattr(user.role, "value") else user.role)
    return ok(
        {
            "token": token,
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
        }
    )


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return ok({"id": user.id, "name": user.name, "email": user.email, "role": user.role})
