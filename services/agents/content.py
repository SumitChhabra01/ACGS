"""Content agent: the multi-step precision pipeline.

  outline (mid) -> generate (mid, escalate to premium on high opportunity)
  -> optimize (premium, gated) -> validate (deterministic)

Premium is used ONLY when opportunity_score is high enough to justify ROI.
Output is a draft destined for human approval — never auto-published.
"""
from __future__ import annotations

from typing import Any

from core.prompts import render
from core.rag import retrieve
from core.validation import validate

from .base import Agent

PREMIUM_OPPORTUNITY_THRESHOLD = 80


class ContentAgent(Agent):
    name = "content"

    def run(
        self,
        *,
        platform: str = "instagram",
        content_type: str = "instagram_caption",
        strategy: str = "",
        voice: str = "confident, punchy",
        opportunity_score: int = 60,
    ) -> dict[str, Any]:
        rag_ctx = retrieve(strategy or content_type, brand_id=self.brand_id)

        # Step 1: outline (cheap)
        outline = self.router.generate(
            task_type="ideation",
            prompt=render(
                "content_outline",
                platform=platform,
                content_type=content_type,
                strategy=strategy or "(none)",
                rag=rag_ctx.as_text(),
            ),
            brand_id=self.brand_id,
            agent=self.name,
        )

        # Step 2: generate (escalate task type when high opportunity)
        gen_task = (
            "final_content"
            if opportunity_score >= PREMIUM_OPPORTUNITY_THRESHOLD
            else "caption_cleanup"
        )
        draft = self.router.generate(
            task_type=gen_task,
            prompt=render(
                "content_generate",
                voice=voice,
                platform=platform,
                content_type=content_type,
                outline=outline.text,
                constraints="on-brand, platform limits, include a CTA",
            ),
            brand_id=self.brand_id,
            agent=self.name,
        )

        body = draft.text

        # Step 3: optimize (premium, only for high-opportunity content)
        optimized = False
        if opportunity_score >= PREMIUM_OPPORTUNITY_THRESHOLD:
            opt = self.router.generate(
                task_type="viral_optimization",
                prompt=render("content_optimize", platform=platform, content=body),
                brand_id=self.brand_id,
                agent=self.name,
            )
            if not opt.text.startswith("[PAUSED"):
                body = opt.text
                optimized = True

        # Step 4: validate (deterministic, free)
        result = validate(content_type, body)

        return {
            "platform": platform,
            "type": content_type,
            "body": body,
            "optimized": optimized,
            "tier_used": draft.tier.value,
            "quality_scores": result.scores,
            "validation_passed": result.passed,
            "issues": result.issues,
            "status": "pending_approval" if result.passed else "draft",
        }
