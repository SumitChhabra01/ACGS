"""Retrieval-before-generation. In production this queries pgvector for the
most similar successful posts / templates / brand knowledge and returns context
to inject. For dev it returns a small in-memory corpus so pipelines run offline.
"""
from __future__ import annotations

from dataclasses import dataclass

_DEV_CORPUS: list[str] = [
    "Hook formula that worked: '5 signs your X is about to be replaced by Y'.",
    "Top short structure: HOOK (0-2s) -> problem -> 3 quick beats -> CTA.",
    "Brand rule: lead with a concrete number; avoid hype adjectives.",
]


@dataclass
class RetrievedContext:
    snippets: list[str]

    def as_text(self, limit: int = 3) -> str:
        return "\n".join(f"- {s}" for s in self.snippets[:limit])


def retrieve(query: str, brand_id: str = "default", k: int = 3) -> RetrievedContext:
    # TODO(Phase 2): embed `query` (local model) and ANN-search pgvector.
    # Naive keyword overlap ranking for the dev corpus.
    scored = sorted(
        _DEV_CORPUS,
        key=lambda s: -len(set(s.lower().split()) & set(query.lower().split())),
    )
    return RetrievedContext(snippets=scored[:k])
