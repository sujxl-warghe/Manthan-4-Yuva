from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Escalation, TreeReport, User
from app.schemas import ReportCreateRequest, ReportUpdateRequest
from app.security import get_current_user, require_roles
from app.utils import ok, paginated, report_to_dict

router = APIRouter(prefix="/api/v1", tags=["reports"])


@router.post("/reports", status_code=201)
async def create_report(
    payload: ReportCreateRequest, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
):
    report = TreeReport(
        tree_id=payload.tree_id,
        reported_by=user.id,
        type=payload.type,
        description=payload.description,
        photo_url=payload.photo_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(report)
    await db.commit()
    return ok(report_to_dict(report))


@router.get("/reports")
async def list_reports(
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    type_filter: str | None = Query(None, alias="type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = select(TreeReport)
    if status_filter:
        q = q.where(TreeReport.status == status_filter)
    if type_filter:
        q = q.where(TreeReport.type == type_filter)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(TreeReport.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    return paginated([report_to_dict(r) for r in rows], total, page, page_size)


@router.get("/reports/{report_id}")
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(TreeReport).where(TreeReport.id == report_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Report not found", "error_code": "REPORT_NOT_FOUND"},
        )
    return ok(report_to_dict(r))


@router.patch("/reports/{report_id}")
async def update_report(
    report_id: str,
    payload: ReportUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY", "INSTITUTION")),
):
    r = (await db.execute(select(TreeReport).where(TreeReport.id == report_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Report not found", "error_code": "REPORT_NOT_FOUND"},
        )
    r.status = payload.status
    if payload.status == "RESOLVED":
        r.resolved_at = datetime.utcnow()
    if payload.status == "ESCALATED":
        db.add(
            Escalation(
                tree_id=r.tree_id,
                report_id=r.id,
                level="SUPERVISOR",
                priority="HIGH",
                status="OPEN",
            )
        )
    await db.commit()
    return ok(report_to_dict(r))


@router.post("/escalations", status_code=201)
async def create_escalation(
    tree_id: str | None = None,
    report_id: str | None = None,
    priority: str = "MEDIUM",
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY", "INSTITUTION")),
):
    esc = Escalation(tree_id=tree_id, report_id=report_id, priority=priority, level="SUPERVISOR")
    db.add(esc)
    await db.commit()
    return ok(
        {
            "id": esc.id,
            "tree_id": esc.tree_id,
            "report_id": esc.report_id,
            "level": esc.level,
            "priority": esc.priority,
            "status": esc.status,
        }
    )


@router.get("/escalations")
async def list_escalations(
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = select(Escalation)
    if status_filter:
        q = q.where(Escalation.status == status_filter)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar() or 0
    q = q.order_by(Escalation.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(q)).scalars().all()
    data = [
        {
            "id": e.id,
            "tree_id": e.tree_id,
            "report_id": e.report_id,
            "level": e.level,
            "assigned_to": e.assigned_to,
            "priority": e.priority,
            "status": e.status,
            "deadline": e.deadline.isoformat() if e.deadline else None,
            "created_at": e.created_at.isoformat(),
            "resolved_at": e.resolved_at.isoformat() if e.resolved_at else None,
        }
        for e in rows
    ]
    return paginated(data, total, page, page_size)


@router.patch("/escalations/{escalation_id}")
async def update_escalation(
    escalation_id: str,
    status_value: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("ADMIN", "AUTHORITY")),
):
    e = (await db.execute(select(Escalation).where(Escalation.id == escalation_id))).scalar_one_or_none()
    if not e:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "message": "Escalation not found", "error_code": "ESCALATION_NOT_FOUND"},
        )
    if status_value:
        e.status = status_value
        if status_value == "RESOLVED":
            e.resolved_at = datetime.utcnow()
    await db.commit()
    return ok({"id": e.id, "status": e.status})
