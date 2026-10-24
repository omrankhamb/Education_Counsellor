import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from pymongo import MongoClient
from config import MONGODB_URL, MONGODB_DB_NAME
from .models import LiveCollegeIntelligenceResponse, ChangeAuditRecord

logger = logging.getLogger("LiveDBSyncEngine")

class DatabaseSyncEngine:
    """
    Smart Database Sync & Diff Engine.
    Cross-checks live web data with MongoDB records.
    Only updates when changes are detected and logs the audit trail.
    """

    def __init__(self):
        try:
            self.client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
            self.db = self.client[MONGODB_DB_NAME]
            self.collection = self.db["college_live_intelligence"]
            self.connected = True
        except Exception as e:
            logger.warning(f"MongoDB connection skipped for live sync: {e}")
            self.connected = False

    def sync_college(self, live_data: LiveCollegeIntelligenceResponse) -> Tuple[str, List[ChangeAuditRecord]]:
        """
        Cross-checks live scraped data against DB record.
        Returns: (sync_status, list_of_changes)
        """
        if not self.connected:
            return "LIVE_ONLY_DB_OFFLINE", []

        try:
            existing = self.collection.find_one({"college_id": live_data.college_id})
            now_iso = datetime.utcnow().isoformat()
            changes: List[ChangeAuditRecord] = []

            # CASE 1: Brand new college
            if not existing:
                doc = live_data.dict()
                doc["created_at_iso"] = now_iso
                doc["last_verified_iso"] = now_iso
                self.collection.insert_one(doc)
                logger.info(f"Inserted new college record for {live_data.canonical_name}")
                return "INSERTED_NEW", []

            # CASE 2: College already exists - Run Field-by-Field Diff Check
            update_fields: Dict[str, Any] = {
                "last_verified_iso": now_iso,
                "latency_ms": live_data.latency_ms,
                "audit_passed": live_data.audit_passed
            }

            # Diff Placement Stats
            if live_data.placement_intelligence:
                old_p = existing.get("placement_intelligence") or {}
                new_p = live_data.placement_intelligence.dict()

                # Compare Placement Ratio
                if new_p.get("placement_ratio_pct") and new_p.get("placement_ratio_pct") != old_p.get("placement_ratio_pct"):
                    changes.append(ChangeAuditRecord(
                        field_name="placement_ratio_pct",
                        old_value=old_p.get("placement_ratio_pct"),
                        new_value=new_p.get("placement_ratio_pct"),
                        source_url=new_p.get("source_url", ""),
                        reason="Updated placement ratio published on official portal"
                    ))

                # Compare Highest CTC
                if new_p.get("highest_ctc_lpa") and new_p.get("highest_ctc_lpa") != old_p.get("highest_ctc_lpa"):
                    changes.append(ChangeAuditRecord(
                        field_name="highest_ctc_lpa",
                        old_value=old_p.get("highest_ctc_lpa"),
                        new_value=new_p.get("highest_ctc_lpa"),
                        source_url=new_p.get("source_url", ""),
                        reason="New highest package report published by TPO"
                    ))

                update_fields["placement_intelligence"] = new_p

            # Diff Fee Structure
            if live_data.fee_intelligence:
                old_f = existing.get("fee_intelligence") or {}
                new_f = live_data.fee_intelligence.dict()

                if new_f.get("total_annual_fee") and new_f.get("total_annual_fee") != old_f.get("total_annual_fee"):
                    changes.append(ChangeAuditRecord(
                        field_name="total_annual_fee",
                        old_value=old_f.get("total_annual_fee"),
                        new_value=new_f.get("total_annual_fee"),
                        source_url=new_f.get("source_url", ""),
                        reason="Annual tuition fee revised on official portal"
                    ))

                update_fields["fee_intelligence"] = new_f

            # Perform Smart Update
            if changes:
                # Append to change history in DB
                self.collection.update_one(
                    {"college_id": live_data.college_id},
                    {
                        "$set": update_fields,
                        "$push": {"change_history": {"$each": [c.dict() for c in changes]}}
                    }
                )
                logger.info(f"Updated {len(changes)} fields for {live_data.canonical_name}")
                return "UPDATED_WITH_DIFF", changes
            else:
                # No changes detected, just touch the timestamp
                self.collection.update_one(
                    {"college_id": live_data.college_id},
                    {"$set": {"last_verified_iso": now_iso}}
                )
                return "VERIFIED_UNCHANGED", []

        except Exception as e:
            logger.warning(f"Error in DatabaseSyncEngine: {e}")
            return "SYNC_ERROR", []
