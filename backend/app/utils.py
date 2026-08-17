from datetime import datetime, timezone


def ok(data):
    return {"success": True, "data": data}


def paginated(items, total, page, page_size):
    return {
        "success": True,
        "data": items,
        "meta": {"total": total, "page": page, "page_size": page_size},
    }


def to_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.replace(tzinfo=dt.tzinfo or timezone.utc).isoformat()


def tree_to_dict(t) -> dict:
    return {
        "id": t.id,
        "tree_code": t.tree_code,
        "species_id": t.species_id,
        "species": t.species.name if t.species else None,
        "category_id": t.category_id,
        "category": t.category.name if t.category else None,
        "ward_id": t.ward_id,
        "ward": t.ward.name if t.ward else None,
        "institution_id": t.institution_id,
        "institution": t.institution.name if t.institution else None,
        "drive_id": t.drive_id,
        "guardian_id": t.guardian_id,
        "guardian_name": t.guardian.name if t.guardian else None,
        "latitude": t.latitude,
        "longitude": t.longitude,
        "address_hint": t.address_hint,
        "plantation_date": to_iso(t.plantation_date),
        "status": t.status.value if hasattr(t.status, "value") else t.status,
        "risk_level": t.risk_level.value if hasattr(t.risk_level, "value") else t.risk_level,
        "last_verified_at": to_iso(t.last_verified_at),
        "parent_tree_id": t.parent_tree_id,
        "replacement_generation": t.replacement_generation,
        "created_at": to_iso(t.created_at),
    }


def verification_to_dict(v) -> dict:
    return {
        "id": v.id,
        "tree_id": v.tree_id,
        "verified_by": v.verified_by,
        "photo_url": v.photo_url,
        "latitude": v.latitude,
        "longitude": v.longitude,
        "health_status": v.health_status,
        "watering_status": v.watering_status,
        "tree_guard_status": v.tree_guard_status,
        "notes": v.notes,
        "checkpoint": v.checkpoint,
        "status": v.status.value if hasattr(v.status, "value") else v.status,
        "ai_confidence": v.ai_confidence,
        "created_at": to_iso(v.created_at),
    }


def report_to_dict(r) -> dict:
    return {
        "id": r.id,
        "tree_id": r.tree_id,
        "reported_by": r.reported_by,
        "type": r.type.value if hasattr(r.type, "value") else r.type,
        "description": r.description,
        "photo_url": r.photo_url,
        "latitude": r.latitude,
        "longitude": r.longitude,
        "status": r.status.value if hasattr(r.status, "value") else r.status,
        "created_at": to_iso(r.created_at),
        "resolved_at": to_iso(r.resolved_at),
    }
