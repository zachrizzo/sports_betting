"""Kelly criterion utilities."""
from __future__ import annotations


def kelly_fraction(p_win: float, odds_decimal: float) -> float:
    """Return optimal fraction of bankroll according to Kelly.

    Args:
        p_win: Model probability of winning (0‑1).
        odds_decimal: Decimal odds (e.g., 2.5 for +150).
    """
    b = odds_decimal - 1.0
    edge = p_win * (b + 1) - 1
    if edge <= 0:
        return 0.0
    return edge / b
