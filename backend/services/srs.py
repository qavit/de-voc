from dataclasses import dataclass


@dataclass
class SRSStateSnapshot:
    ease_factor: float
    interval_days: int
    repetitions: int


def apply_sm2_like_review(state: SRSStateSnapshot, grade: int) -> SRSStateSnapshot:
    ease = state.ease_factor
    interval = state.interval_days
    repetitions = state.repetitions

    if grade == 0:
        repetitions = 0
        interval = 1
        ease = max(1.3, ease - 0.2)
    elif grade == 1:
        interval = max(1, int(max(interval, 1) * 0.5))
        ease = max(1.3, ease - 0.15)
    elif grade == 2:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = max(1, round(max(interval, 1) * ease))
        repetitions += 1
    elif grade == 3:
        if repetitions == 0:
            interval = 4
        elif repetitions == 1:
            interval = 10
        else:
            interval = max(1, round(max(interval, 1) * ease * 1.3))
        repetitions += 1
        ease += 0.15
    else:
        raise ValueError(f"Unsupported grade: {grade}")

    return SRSStateSnapshot(ease_factor=ease, interval_days=interval, repetitions=repetitions)
