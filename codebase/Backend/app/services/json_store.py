import json
from pathlib import Path
from typing import Any


class JsonStore:
    def __init__(self, file_path: Path, default_data: Any) -> None:
        self.file_path = file_path
        self.default_data = default_data

    def ensure_exists(self) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.write(self.default_data)

    def read(self) -> Any:
        self.ensure_exists()
        try:
            with self.file_path.open("r", encoding="utf-8") as file:
                return json.load(file)
        except json.JSONDecodeError as error:
            raise ValueError(f"Invalid JSON data in {self.file_path}") from error

    def write(self, data: Any) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        with self.file_path.open("w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
