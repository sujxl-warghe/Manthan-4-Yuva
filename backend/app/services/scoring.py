from datetime import datetime, timedelta


def compute_risk_level(tree, last_verification=None) -> str:
    """Derive a risk level from verification recency + health signals."""
    now = datetime.utcnow()
    if tree.status in ("DEAD", "MISSING"):
        return "CRITICAL"

    score = 0
    if tree.last_verified_at is None:
        score += 2
    else:
        days_since = (now - tree.last_verified_at).days
        if days_since > 180:
            score += 3
        elif days_since > 90:
            score += 2
        elif days_since > 45:
            score += 1

    if last_verification is not None:
        if last_verification.health_status not in ("HEALTHY",):
            score += 2
        if last_verification.watering_status != "OK":
            score += 1
        if last_verification.tree_guard_status != "OK":
            score += 1

    if score >= 5:
        return "CRITICAL"
    if score >= 3:
        return "HIGH"
    if score >= 1:
        return "MEDIUM"
    return "LOW"


def next_checkpoint(plantation_date: datetime, last_verified_at: datetime | None) -> dict:
    checkpoints = [
        ("1_MONTH", timedelta(days=30)),
        ("6_MONTHS", timedelta(days=182)),
        ("1_YEAR", timedelta(days=365)),
        ("3_YEARS", timedelta(days=365 * 3)),
    ]
    now = datetime.utcnow()
    timeline = []
    for label, delta in checkpoints:
        due_date = plantation_date + delta
        reached = now >= due_date
        verified = bool(last_verified_at and last_verified_at >= due_date)
        timeline.append(
            {
                "checkpoint": label,
                "due_date": due_date.isoformat(),
                "reached": reached,
                "verified": verified,
            }
        )
    upcoming = next((c for c in timeline if not c["verified"]), None)
    return {"timeline": timeline, "next_checkpoint": upcoming}


def compute_green_score(survival_rate: float, verification_rate: float,
                         maintenance_rate: float, participation_rate: float,
                         replacement_success_rate: float) -> float:
    score = (
        survival_rate * 0.35
        + verification_rate * 0.25
        + maintenance_rate * 0.15
        + participation_rate * 0.15
        + replacement_success_rate * 0.10
    )
    return round(min(100.0, max(0.0, score)), 1)
