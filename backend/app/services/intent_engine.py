import re
import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.intent import IntentEvaluation, UserIntent


class IntentConsistencyEngine:
    @staticmethod
    def extract_intent_structure(raw_prompt: str) -> dict[str, Any]:
        """
        Parses raw user instruction into structured constraints.
        Supports both AI analysis and deterministic regex fallback.
        """
        prompt_lower = raw_prompt.lower()
        
        # Detect negative constraints ("don't buy...", "no...", "avoid...")
        negative_patterns = [
            r"don'?t\s+(?:buy|purchase|get)\s+([^.,;\n]+)",
            r"no\s+([^.,;\n]+)",
            r"avoid\s+([^.,;\n]+)",
            r"never\s+([^.,;\n]+)",
        ]
        neg_constraints: list[str] = []
        for pat in negative_patterns:
            matches = re.findall(pat, prompt_lower)
            for m in matches:
                clean = m.strip()
                if clean and len(clean) > 2:
                    neg_constraints.append(clean)

        # Detect positive constraints ("prioritize...", "must have...", "prefer...")
        positive_patterns = [
            r"prioritize\s+([^.,;\n]+)",
            r"must\s+have\s+([^.,;\n]+)",
            r"prefer\s+([^.,;\n]+)",
            r"need\s+([^.,;\n]+)",
        ]
        pos_constraints: list[str] = []
        for pat in positive_patterns:
            matches = re.findall(pat, prompt_lower)
            for m in matches:
                clean = m.strip()
                if clean and len(clean) > 2:
                    pos_constraints.append(clean)

        # Extract budget if mentioned (e.g., "$1000", "under 1000", "below $800")
        budget_match = re.search(r"(?:under|below|max|budget of)\s*\$?(\d+(?:\.\d{2})?)", prompt_lower)
        max_budget = float(budget_match.group(1)) if budget_match else None

        return {
            "primary_goal": raw_prompt[:150],
            "positive_constraints": pos_constraints,
            "negative_constraints": neg_constraints,
            "max_acceptable_budget": max_budget,
        }

    @staticmethod
    def evaluate_intent_consistency(
        db: Session,
        intent_id: str,
        agent_id: str,
        proposed_item_name: str,
        proposed_merchant: str,
        proposed_price: float,
        proposed_item_specs: dict[str, Any] | None = None
    ) -> IntentEvaluation:
        """
        Compares proposed purchase against the user's original intent.
        Produces structured report:
          - consistency_score (0.0 to 1.0)
          - is_consistent (bool)
          - decision ('MATCH', 'DRIFT', 'HARD_CONFLICT')
          - conflicting_requirements (list)
          - reasoning (detailed explanation)
        """
        proposed_item_specs = proposed_item_specs or {}
        intent = db.query(UserIntent).filter(UserIntent.id == intent_id).first()
        if not intent:
            raise ValueError(f"UserIntent with id '{intent_id}' not found.")

        conflicts: list[str] = []
        item_text_corpus = f"{proposed_item_name} {proposed_merchant} {str(proposed_item_specs)}".lower()

        # 1. Evaluate Negative Constraints (Hard Conflicts)
        for neg in intent.negative_constraints or []:
            neg_lower = neg.lower()
            # extract key terms (e.g. "gaming laptops" -> "gaming")
            keywords = [w for w in re.split(r"\s+", neg_lower) if len(w) > 3 and w not in ["laptop", "laptops", "item", "product"]]
            for kw in keywords:
                if kw in item_text_corpus:
                    conflicts.append(f"Proposed item violates negative constraint: '{neg}' (detected term: '{kw}')")

        # 2. Evaluate Maximum Budget from Intent
        if intent.max_acceptable_budget and proposed_price > intent.max_acceptable_budget:
            conflicts.append(
                f"Proposed price ${proposed_price:.2f} exceeds user's original stated budget ceiling of ${intent.max_acceptable_budget:.2f}"
            )

        # 3. Calculate Consistency Score & Decision
        if conflicts:
            consistency_score = max(0.1, 1.0 - (len(conflicts) * 0.45))
            decision = "HARD_CONFLICT" if any("negative constraint" in c for c in conflicts) else "DRIFT"
            is_consistent = False
            reasoning = (
                f"Intent Mismatch Detected. The user's original instruction was: \"{intent.raw_prompt}\". "
                f"The proposed purchase \"{proposed_item_name}\" directly conflicts with requirements: {'; '.join(conflicts)}."
            )
        else:
            consistency_score = 0.95
            decision = "MATCH"
            is_consistent = True
            reasoning = (
                f"Proposed purchase \"{proposed_item_name}\" is consistent with user instruction: "
                f"\"{intent.raw_prompt}\". No negative constraint violations detected."
            )

        # 4. Save evaluation to database
        evaluation = IntentEvaluation(
            id=str(uuid.uuid4()),
            intent_id=intent.id,
            agent_id=agent_id,
            proposed_item_name=proposed_item_name,
            proposed_merchant=proposed_merchant,
            proposed_price=proposed_price,
            proposed_item_specs=proposed_item_specs,
            consistency_score=consistency_score,
            is_consistent=is_consistent,
            decision=decision,
            conflicting_requirements=conflicts,
            reasoning=reasoning
        )
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)

        return evaluation
