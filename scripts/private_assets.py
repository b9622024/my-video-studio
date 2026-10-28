"""Offline private recovery verification and exclusive backup. No uploads."""
import argparse
import hashlib
import json
from pathlib import Path
import tarfile


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def verify(root):
    recovery = (root / "recovery").resolve()
    rows = json.loads((root / "manifest.json").read_text())
    if not rows:
        raise ValueError("Empty manifest")
    for row in rows:
        path = (recovery / row["path"]).resolve()
        if not path.is_relative_to(recovery):
            raise ValueError("Unsafe manifest path")
        if path.stat().st_size != row["bytes"] or digest(path) != row["sha256"]:
            raise ValueError("Recovery checksum mismatch")
    print(f"Verified {len(rows)} recovery files")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["verify", "backup"])
    parser.add_argument("root", type=Path)
    parser.add_argument("destination", type=Path, nargs="?")
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    verify(root)
    if args.action == "backup":
        if args.destination is None:
            parser.error("backup requires destination")
        destination = args.destination.resolve()
        repo = Path(__file__).resolve().parents[1]
        if destination.is_relative_to(root) or destination.is_relative_to(repo):
            parser.error("Backup must be outside source and repository")
        # Reject links to avoid including assets outside the declared private tree.
        if any(p.is_symlink() for p in root.rglob("*")):
            parser.error("Private tree must not contain symbolic links")
        with destination.open("xb") as output:
            destination.chmod(0o600)
            with tarfile.open(fileobj=output, mode="w:gz") as archive:
                archive.add(root, arcname="voice-private", recursive=True)
        print("Backup SHA-256:", digest(destination))
        print("Local archive created; persistence and encryption must be verified separately.")


if __name__ == "__main__":
    main()
