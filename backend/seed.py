"""
Seed the VrukshaSetu database with realistic demo data.

Usage:
    python seed.py

This creates: wards, species, categories, institutions, drives, users
(including demo accounts), 300+ trees spread across Nagpur wards with
plantation dates over the last 3 years, verifications, reports, audits,
escalations, replacements, notifications, points and achievements —
so every dashboard number is computed from real rows, not hardcoded.
"""
import asyncio
import random
from datetime import datetime, timedelta

from sqlalchemy import select

from app.database import AsyncSessionLocal, Base, engine
from app.models.models import (
    Achievement,
    Audit,
    CSROrganization,
    Escalation,
    Institution,
    InstitutionTypeEnum,
    Notification,
    PlantationDrive,
    RiskLevelEnum,
    Species,
    Tree,
    TreeCategory,
    TreeMaintenance,
    TreeReplacement,
    TreeReport,
    TreeStatusEnum,
    TreeVerification,
    User,
    UserAchievement,
    UserPoints,
    Ward,
    VerificationStatusEnum,
    ReportStatusEnum,
    ReportTypeEnum,
)
from app.security import hash_password

random.seed(42)

# Real Nagpur ward-ish names/zones for a realistic demo (approximate, illustrative)
NAGPUR_CENTER = (21.1458, 79.0882)
WARDS = [
    ("Dharampeth", "W01", "Zone 1"),
    ("Sadar", "W02", "Zone 1"),
    ("Civil Lines", "W03", "Zone 1"),
    ("Sitabuldi", "W04", "Zone 2"),
    ("Mahal", "W05", "Zone 2"),
    ("Itwari", "W06", "Zone 2"),
    ("Gandhibagh", "W07", "Zone 3"),
    ("Nandanvan", "W08", "Zone 3"),
    ("Hanuman Nagar", "W09", "Zone 3"),
    ("Dhantoli", "W10", "Zone 4"),
    ("Laxmi Nagar", "W11", "Zone 4"),
    ("Ashi Nagar", "W12", "Zone 4"),
    ("Mangalwari", "W13", "Zone 5"),
    ("Satranjipura", "W14", "Zone 5"),
    ("Lakadganj", "W15", "Zone 5"),
]

CATEGORIES = ["Fruit", "Native", "Medicinal", "Flowering", "Shade", "Biodiversity", "Other"]

SPECIES_BY_CATEGORY = {
    "Fruit": ["Mango", "Jamun", "Guava", "Custard Apple", "Tamarind"],
    "Native": ["Neem", "Peepal", "Banyan", "Palash", "Mahua"],
    "Medicinal": ["Arjuna", "Bael", "Amla", "Ashoka"],
    "Flowering": ["Gulmohar", "Amaltas", "Kadamba", "Bougainvillea"],
    "Shade": ["Rain Tree", "Ficus", "Banyan Shade"],
    "Biodiversity": ["Bamboo", "Sheesham", "Karanj"],
    "Other": ["Coconut", "Ashoka Pillar"],
}

COLLEGES = [
    "VNIT Nagpur", "GH Raisoni College", "RCOEM", "Priyadarshini College of Engineering",
    "Institute of Science Nagpur", "Hislop College", "Kamla Nehru College",
]
NGOS = ["Green Vidarbha Foundation", "Nagpur Tree Trust", "EcoNagpur Collective"]
CSRS = ["Vidarbha Industries CSR", "Orange City Bank CSR", "GreenTech Nagpur CSR"]

FIRST_NAMES = ["Aarav", "Vivaan", "Isha", "Sneha", "Rohan", "Priya", "Aditya", "Neha", "Karan",
               "Ananya", "Rahul", "Pooja", "Siddharth", "Divya", "Arjun", "Kavya", "Nikhil",
               "Meera", "Yash", "Riya"]
LAST_NAMES = ["Sharma", "Patil", "Deshmukh", "Kulkarni", "Joshi", "Rao", "Gupta", "Verma",
              "Nair", "Iyer", "Bhosale", "Chavan"]


def rand_point_near(lat, lng, radius=0.08):
    return (
        round(lat + random.uniform(-radius, radius), 6),
        round(lng + random.uniform(-radius, radius), 6),
    )


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("Seeding wards...")
        wards = []
        for name, code, zone in WARDS:
            lat, lng = rand_point_near(*NAGPUR_CENTER, radius=0.05)
            w = Ward(name=name, code=code, zone=zone, centroid_lat=lat, centroid_lng=lng)
            db.add(w)
            wards.append(w)
        await db.flush()

        print("Seeding categories & species...")
        categories = {}
        for cname in CATEGORIES:
            c = TreeCategory(name=cname)
            db.add(c)
            categories[cname] = c
        await db.flush()

        species_list = []
        for cname, names in SPECIES_BY_CATEGORY.items():
            for sname in names:
                sp = Species(name=sname, scientific_name=f"{sname} sp.", category_id=categories[cname].id)
                db.add(sp)
                species_list.append((sp, cname))
        await db.flush()

        print("Seeding institutions...")
        institutions = []
        for name in COLLEGES:
            inst = Institution(name=name, type=InstitutionTypeEnum.COLLEGE, ward_id=random.choice(wards).id)
            db.add(inst)
            institutions.append(inst)
        for name in NGOS:
            inst = Institution(name=name, type=InstitutionTypeEnum.NGO, ward_id=random.choice(wards).id)
            db.add(inst)
            institutions.append(inst)
        for name in CSRS:
            inst = Institution(name=name, type=InstitutionTypeEnum.CSR, ward_id=random.choice(wards).id)
            db.add(inst)
            institutions.append(inst)
        await db.flush()

        print("Seeding CSR organizations...")
        for name in CSRS:
            db.add(CSROrganization(name=name, trees_supported=random.randint(50, 400),
                                    contact_email=f"impact@{name.lower().replace(' ', '')}.org"))

        print("Seeding drives...")
        drives = []
        for i in range(8):
            start = datetime.utcnow() - timedelta(days=random.randint(30, 900))
            drive = PlantationDrive(
                name=f"Green Nagpur Drive {2023 + i % 3} - Phase {i+1}",
                description="Community plantation drive under the Nagpur Green Mission.",
                start_date=start,
                end_date=start + timedelta(days=30),
                target=random.randint(50, 300),
                ward_id=random.choice(wards).id,
                institution_id=random.choice(institutions).id,
                status=random.choice(["ACTIVE", "COMPLETED", "COMPLETED"]),
            )
            db.add(drive)
            drives.append(drive)
        await db.flush()

        print("Seeding users...")
        users = []
        admin = User(name="Admin User", email="admin@vrukshasetu.demo",
                     password_hash=hash_password("Admin@123"), role="ADMIN")
        citizen_demo = User(name="Demo Citizen", email="citizen@vrukshasetu.demo",
                             password_hash=hash_password("Demo@123"), role="CITIZEN")
        db.add(admin)
        db.add(citizen_demo)
        users.extend([admin, citizen_demo])

        for i in range(60):
            fname = random.choice(FIRST_NAMES)
            lname = random.choice(LAST_NAMES)
            u = User(
                name=f"{fname} {lname}",
                email=f"{fname.lower()}.{lname.lower()}{i}@example.com",
                password_hash=hash_password("Citizen@123"),
                role="CITIZEN",
                ward_id=random.choice(wards).id,
            )
            db.add(u)
            users.append(u)

        authority = User(name="Nagpur Forest Authority", email="authority@vrukshasetu.demo",
                          password_hash=hash_password("Authority@123"), role="AUTHORITY")
        db.add(authority)
        users.append(authority)
        await db.flush()

        for u in users:
            db.add(UserPoints(user_id=u.id, total_points=0, trees_planted=0, trees_verified=0, trees_surviving=0))
        await db.flush()

        print("Seeding achievements...")
        achievement_defs = [
            ("FIRST_TREE", "First Tree", "Planted your first tree"),
            ("TREE_GUARDIAN", "Tree Guardian", "Actively guarding a tree"),
            ("GREEN_CHAMPION", "Green Champion", "10+ trees planted"),
            ("TEN_TREES", "10 Trees", "Planted 10 trees"),
            ("ONE_YEAR_SURVIVOR", "1-Year Survivor", "A tree survived 1 year"),
            ("THREE_YEAR_GUARDIAN", "3-Year Guardian", "A tree survived 3 years"),
            ("COMMUNITY_PROTECTOR", "Community Protector", "Filed 5+ community reports"),
        ]
        achievements = {}
        for code, name, desc in achievement_defs:
            a = Achievement(code=code, name=name, description=desc)
            db.add(a)
            achievements[code] = a
        await db.flush()

        citizen_users = [u for u in users if u.role == "CITIZEN"]

        print("Seeding 320 trees with verifications, reports, audits...")
        now = datetime.utcnow()
        POINTS = {"plant": 50, "verify": 20, "one_year": 100, "three_year": 500, "report": 15}

        trees_created = []
        for i in range(320):
            ward = random.choice(wards)
            sp, cat_name = random.choice(species_list)
            days_ago = random.randint(5, 1100)
            plantation_date = now - timedelta(days=days_ago)
            guardian = random.choice(citizen_users)
            drive = random.choice(drives) if random.random() < 0.7 else None
            institution = random.choice(institutions) if random.random() < 0.5 else None

            lat, lng = rand_point_near(ward.centroid_lat, ward.centroid_lng, radius=0.015)

            # Determine survival outcome based on age (older trees more likely resolved one way or another)
            roll = random.random()
            if days_ago > 900:
                status = TreeStatusEnum.HEALTHY if roll > 0.18 else TreeStatusEnum.DEAD
            elif days_ago > 365:
                status = TreeStatusEnum.HEALTHY if roll > 0.15 else (TreeStatusEnum.AT_RISK if roll > 0.06 else TreeStatusEnum.DEAD)
            else:
                if roll > 0.75:
                    status = TreeStatusEnum.HEALTHY
                elif roll > 0.55:
                    status = TreeStatusEnum.AT_RISK
                elif roll > 0.45:
                    status = TreeStatusEnum.VERIFICATION_DUE
                elif roll > 0.40:
                    status = TreeStatusEnum.DEAD
                else:
                    status = TreeStatusEnum.HEALTHY

            year = plantation_date.year
            code = f"NGP-{year}-{i+1:06d}"

            last_verified = None
            if status not in (TreeStatusEnum.DEAD, TreeStatusEnum.MISSING) and random.random() < 0.8:
                last_verified = now - timedelta(days=random.randint(1, min(days_ago, 200)))

            risk = RiskLevelEnum.LOW
            if status == TreeStatusEnum.AT_RISK:
                risk = random.choice([RiskLevelEnum.MEDIUM, RiskLevelEnum.HIGH])
            elif status == TreeStatusEnum.VERIFICATION_DUE:
                risk = RiskLevelEnum.MEDIUM
            elif status in (TreeStatusEnum.DEAD, TreeStatusEnum.MISSING):
                risk = RiskLevelEnum.CRITICAL

            tree = Tree(
                tree_code=code,
                species_id=sp.id,
                category_id=categories[cat_name].id,
                ward_id=ward.id,
                institution_id=institution.id if institution else None,
                drive_id=drive.id if drive else None,
                guardian_id=guardian.id,
                latitude=lat,
                longitude=lng,
                address_hint=f"Near {ward.name} main road",
                plantation_date=plantation_date,
                status=status,
                risk_level=risk,
                last_verified_at=last_verified,
                created_at=plantation_date,
            )
            db.add(tree)
            trees_created.append((tree, guardian, days_ago, status))

        await db.flush()

        print("Seeding verifications for planted trees...")
        for tree, guardian, days_ago, status in trees_created:
            n_verifications = random.randint(0, 4) if status != TreeStatusEnum.DEAD else random.randint(0, 2)
            v_date = tree.plantation_date
            for _ in range(n_verifications):
                v_date = v_date + timedelta(days=random.randint(30, 120))
                if v_date > now:
                    break
                health = "HEALTHY" if status in (TreeStatusEnum.HEALTHY,) else random.choice(["HEALTHY", "STRESSED", "DAMAGED"])
                v_status = VerificationStatusEnum.VERIFIED if random.random() > 0.1 else VerificationStatusEnum.MANUAL_REVIEW
                verification = TreeVerification(
                    tree_id=tree.id,
                    verified_by=guardian.id,
                    health_status=health,
                    watering_status=random.choice(["OK", "OK", "LOW"]),
                    tree_guard_status=random.choice(["OK", "OK", "DAMAGED"]),
                    checkpoint=random.choice(["1_MONTH", "6_MONTHS", "1_YEAR", "ROUTINE"]),
                    status=v_status,
                    ai_confidence=round(random.uniform(72, 98), 1),
                    created_at=v_date,
                )
                db.add(verification)

        print("Seeding community reports...")
        report_types = list(ReportTypeEnum)
        for _ in range(90):
            tree, guardian, days_ago, status = random.choice(trees_created)
            r_status = random.choice(list(ReportStatusEnum))
            report = TreeReport(
                tree_id=tree.id,
                reported_by=random.choice(citizen_users).id,
                type=random.choice(report_types),
                description="Reported via VrukshaSetu community reporting.",
                status=r_status,
                created_at=now - timedelta(days=random.randint(1, 300)),
                resolved_at=now - timedelta(days=random.randint(0, 30)) if r_status == ReportStatusEnum.RESOLVED else None,
            )
            db.add(report)
        await db.flush()

        print("Seeding escalations...")
        for _ in range(20):
            tree, guardian, days_ago, status = random.choice(trees_created)
            db.add(Escalation(
                tree_id=tree.id,
                level=random.choice(["GUARDIAN", "SUPERVISOR", "INSTITUTION", "AUTHORITY"]),
                priority=random.choice(["LOW", "MEDIUM", "HIGH"]),
                status=random.choice(["OPEN", "RESOLVED", "OPEN"]),
                deadline=now + timedelta(days=random.randint(1, 14)),
            ))

        print("Seeding audits...")
        for _ in range(40):
            tree, guardian, days_ago, status = random.choice(trees_created)
            expected = status.value
            actual = expected if random.random() > 0.2 else random.choice(["HEALTHY", "AT_RISK", "DEAD"])
            db.add(Audit(
                tree_id=tree.id,
                auditor_id=authority.id,
                expected_status=expected,
                actual_status=actual,
                result="MATCH" if expected == actual else "MISMATCH",
                created_at=now - timedelta(days=random.randint(1, 200)),
            ))

        print("Seeding replacements for dead trees...")
        dead_trees = [t for t, g, d, s in trees_created if s == TreeStatusEnum.DEAD]
        for tree in dead_trees[: max(1, len(dead_trees) // 2)]:
            replacement_tree = Tree(
                tree_code=f"{tree.tree_code}-R1",
                species_id=tree.species_id,
                category_id=tree.category_id,
                ward_id=tree.ward_id,
                institution_id=tree.institution_id,
                drive_id=tree.drive_id,
                guardian_id=tree.guardian_id,
                latitude=tree.latitude,
                longitude=tree.longitude,
                plantation_date=now - timedelta(days=random.randint(1, 60)),
                status=TreeStatusEnum.HEALTHY,
                risk_level=RiskLevelEnum.LOW,
                parent_tree_id=tree.id,
                replacement_generation=1,
            )
            db.add(replacement_tree)
            await db.flush()
            db.add(TreeReplacement(
                original_tree_id=tree.id,
                replacement_tree_id=replacement_tree.id,
                reason="Original tree did not survive; replaced under accountability workflow.",
                status="COMPLETED",
            ))

        print("Seeding maintenance logs...")
        for _ in range(60):
            tree, guardian, days_ago, status = random.choice(trees_created)
            db.add(TreeMaintenance(
                tree_id=tree.id,
                performed_by=guardian.id,
                activity=random.choice(["Watering", "Pruning", "Guard Repair", "Mulching"]),
                created_at=now - timedelta(days=random.randint(1, 200)),
            ))

        print("Computing leaderboard points...")
        for tree, guardian, days_ago, status in trees_created:
            pts_result = await db.execute(select(UserPoints).where(UserPoints.user_id == guardian.id))
            up = pts_result.scalar_one_or_none()
            if not up:
                continue
            up.trees_planted += 1
            up.total_points += POINTS["plant"]
            if status != TreeStatusEnum.DEAD:
                up.trees_surviving += 1
            if days_ago > 365:
                up.total_points += POINTS["one_year"]
            if days_ago > 1095:
                up.total_points += POINTS["three_year"]

        print("Seeding notifications...")
        for u in random.sample(citizen_users, min(20, len(citizen_users))):
            db.add(Notification(
                user_id=u.id,
                type="VERIFICATION_DUE",
                title="Verification Due",
                message="One of your trees is due for verification. Please submit evidence soon.",
            ))
            db.add(Notification(
                user_id=u.id,
                type="BADGE_UNLOCKED",
                title="Badge Unlocked: Tree Guardian",
                message="You've unlocked the Tree Guardian badge for your consistent care.",
            ))

        await db.commit()
        print(f"Seed complete: {len(trees_created)} original trees + replacements.")


if __name__ == "__main__":
    asyncio.run(seed())
