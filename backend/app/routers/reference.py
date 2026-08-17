from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import CSROrganization, Institution, Species, TreeCategory
from app.utils import ok

router = APIRouter(prefix="/api/v1", tags=["reference"])


@router.get("/species")
async def list_species(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Species))).scalars().all()
    return ok([{"id": s.id, "name": s.name, "scientific_name": s.scientific_name, "category_id": s.category_id} for s in rows])


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(TreeCategory))).scalars().all()
    return ok([{"id": c.id, "name": c.name} for c in rows])


@router.get("/institutions")
async def list_institutions(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Institution))).scalars().all()
    return ok([{"id": i.id, "name": i.name, "type": i.type, "ward_id": i.ward_id} for i in rows])


@router.get("/csr")
async def list_csr(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(CSROrganization))).scalars().all()
    return ok(
        [
            {"id": c.id, "name": c.name, "trees_supported": c.trees_supported, "contact_email": c.contact_email}
            for c in rows
        ]
    )
