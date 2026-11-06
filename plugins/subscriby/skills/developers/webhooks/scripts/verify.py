"""Verifies a Subscriby webhook delivery's SB-Signature header.

HMAC-SHA256 over "<t>.<raw body>" with the endpoint's secret, compared in
constant time, with the timestamp within a tolerance (300 seconds by default).

Pass several secrets while you roll a rotation: Subscriby signs with one secret
only and switches the instant you rotate, so holding the current and the next
secret on your side is what keeps deliveries verifying through the deploy.
Compute over the raw body bytes, never over re-serialised JSON.

Self-test: python verify.py fixture.json   (make one with make-fixture.mjs)
"""

from __future__ import annotations

import hashlib
import hmac
import json
import re
import sys
import time
from collections.abc import Iterable

HEX64 = re.compile(r"^[0-9a-f]{64}$", re.IGNORECASE)


def verify_subscriby_signature(
    header: str,
    raw_body: bytes | str,
    secrets: str | Iterable[str],
    tolerance_seconds: int = 300,
    now: int | None = None,
) -> bool:
    if not isinstance(header, str) or not header:
        return False

    parts: dict[str, str] = {}
    for pair in header.split(","):
        key, separator, value = pair.partition("=")
        if separator:
            parts[key.strip()] = value.strip()

    timestamp_text = parts.get("t", "")
    if not timestamp_text.isdigit():
        return False
    timestamp = int(timestamp_text)
    if abs((now if now is not None else int(time.time())) - timestamp) > tolerance_seconds:
        return False

    body = raw_body if isinstance(raw_body, bytes) else str(raw_body).encode("utf-8")
    signed = f"{timestamp}.".encode("utf-8") + body
    candidates = [value for value in (parts.get("v1"), parts.get("v0")) if value and HEX64.match(value)]
    secret_list = [secrets] if isinstance(secrets, str) else [secret for secret in secrets if isinstance(secret, str) and secret]

    for secret in secret_list:
        expected = hmac.new(secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
        for candidate in candidates:
            if hmac.compare_digest(expected, candidate.lower()):
                return True

    return False


if __name__ == "__main__":
    with open(sys.argv[1] if len(sys.argv) > 1 else "fixture.json", encoding="utf-8") as handle:
        fixture = json.load(handle)

    failures = 0
    for delivery in fixture["deliveries"]:
        expectation = fixture["expectations"][delivery["name"]]
        header = delivery["headers"]["SB-Signature"]
        current_only = verify_subscriby_signature(header, delivery["body"], fixture["secret"], fixture["tolerance_seconds"], now=fixture["now"])
        both = verify_subscriby_signature(header, delivery["body"], [fixture["secret"], fixture["next_secret"]], fixture["tolerance_seconds"], now=fixture["now"])
        ok = current_only == expectation["current_only"] and both == expectation["both"]
        if not ok:
            failures += 1
        print(f"{'ok  ' if ok else 'FAIL'} {delivery['name']:<9} current-only={current_only} both={both}")

    sys.exit(1 if failures else 0)
