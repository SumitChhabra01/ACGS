"""Base agent contract. Agents are stateless, event-triggered, and return a
structured result. They never run forever — they execute once and exit, which
is what keeps the platform cheap.
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from core.model_router import ModelRouter


@dataclass
class AgentResult:
    agent: str
    ok: bool
    output: dict[str, Any] = field(default_factory=dict)
    cost: float = 0.0
    duration_ms: int = 0
    error: str | None = None


class Agent(ABC):
    name: str = "base"

    def __init__(self, router: ModelRouter, brand_id: str = "default") -> None:
        self.router = router
        self.brand_id = brand_id

    @abstractmethod
    def run(self, **kwargs: Any) -> dict[str, Any]:
        """Execute the agent's deterministic pipeline and return its output."""

    def execute(self, **kwargs: Any) -> AgentResult:
        start = time.time()
        before = self.router.guard.daily_spend
        try:
            output = self.run(**kwargs)
            cost = self.router.guard.daily_spend - before
            return AgentResult(
                agent=self.name,
                ok=True,
                output=output,
                cost=round(cost, 5),
                duration_ms=int((time.time() - start) * 1000),
            )
        except Exception as exc:  # noqa: BLE001 - agents must fail soft for cron jobs
            return AgentResult(
                agent=self.name,
                ok=False,
                error=str(exc),
                duration_ms=int((time.time() - start) * 1000),
            )
