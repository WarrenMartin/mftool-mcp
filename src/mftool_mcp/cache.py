"""
Simple in-memory TTL cache to reduce redundant network calls to AMFI.
"""

import time
from threading import Lock


class TTLCache:
    def __init__(self):
        self._store: dict = {}
        self._lock = Lock()

    def get(self, key: str):
        with self._lock:
            entry = self._store.get(key)
            if entry:
                value, expiry = entry
                if time.time() < expiry:
                    return value
                del self._store[key]
        return None

    def set(self, key: str, value, ttl: int = 3600):
        with self._lock:
            self._store[key] = (value, time.time() + ttl)

    def cached(self, key: str, fetch_fn, ttl: int = 3600):
        result = self.get(key)
        if result is None:
            result = fetch_fn()
            if result:
                self.set(key, result, ttl)
        return result


_cache = TTLCache()
