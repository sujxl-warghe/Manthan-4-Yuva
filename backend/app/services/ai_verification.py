"""AI-assisted verification service.

DEMO MODE: no external AI provider is configured for this prototype, so this
service returns deterministic, clearly-labeled demo results derived from the
submitted data (not a real vision model). This keeps the backend fully
functional without any AI API key.
"""
import hashlib
import random


def run_ai_verification(tree_id: str, latitude: float | None, longitude: float | None,
                         tree_lat: float, tree_lng: float, photo_url: str | None) -> dict:
    seed = int(hashlib.sha256((tree_id + str(photo_url)).encode()).hexdigest(), 16) % (10 ** 8)
    rng = random.Random(seed)

    gps_match = True
    if latitude is not None and longitude is not None:
        distance = ((latitude - tree_lat) ** 2 + (longitude - tree_lng) ** 2) ** 0.5
        gps_match = distance < 0.01  # ~1km tolerance for demo

    tree_detected = rng.random() > 0.08
    duplicate_image = rng.random() < 0.05
    photo_similarity = round(rng.uniform(0.75, 0.98), 2)
    health_issue = rng.random() < 0.12

    confidence = round(
        (0.35 * tree_detected + 0.25 * gps_match + 0.25 * photo_similarity + 0.15 * (not duplicate_image))
        * 100,
        1,
    )

    if not tree_detected or duplicate_image:
        verdict = "MANUAL_REVIEW"
    elif not gps_match:
        verdict = "SUSPICIOUS"
    elif confidence >= 85:
        verdict = "VERIFIED"
    else:
        verdict = "MANUAL_REVIEW"

    return {
        "mode": "DEMO_MODE",
        "tree_detected": tree_detected,
        "photo_similarity": photo_similarity,
        "gps_match": gps_match,
        "duplicate_image": duplicate_image,
        "health_issue": health_issue,
        "confidence": confidence,
        "verdict": verdict,
        "label": "AI-ASSISTED VERIFICATION (DEMO MODE)",
    }
