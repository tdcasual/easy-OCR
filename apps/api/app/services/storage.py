from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4


@dataclass(frozen=True)
class StoredFile:
    relative_path: str
    absolute_path: Path


class LocalStorage:
    def __init__(self, root: str | Path):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def write_bytes(self, kind: str, filename: str, content: bytes) -> StoredFile:
        safe_name = self._safe_filename(filename)
        directory = (self.root / kind).resolve()
        if not str(directory).startswith(str(self.root)):
            raise ValueError("unsafe storage kind")
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / safe_name
        path.write_bytes(content)
        return StoredFile(relative_path=f"{kind}/{safe_name}", absolute_path=path)

    def unique_name(self, original_filename: str) -> str:
        safe_name = self._safe_filename(original_filename)
        suffix = Path(safe_name).suffix
        stem = Path(safe_name).stem or "file"
        return f"{stem}-{uuid4().hex}{suffix}"

    @staticmethod
    def _safe_filename(filename: str) -> str:
        name = Path(filename).name
        if name != filename or name in {"", ".", ".."}:
            raise ValueError("unsafe filename")
        return name
