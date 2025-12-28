#!/usr/bin/env python
"""Lightweight manage.py compatible with Django layout for scaffolding."""
import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:  # pragma: no cover - only hits when Django missing
        raise ImportError(
            "Django is required to run management commands. "
            "Install it in your environment to continue."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
