#!/usr/bin/env python3
"""Local development adapter for the static frontend.

The browser only talks to /api/*. Replace this file with Django or Go
by implementing the same JSON contract:

  GET  /api/site
  GET  /api/projects
  GET  /api/photos
  POST /api/photos   multipart: file, title, caption
"""

from __future__ import annotations

import json
import mimetypes
import posixpath
import re
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
PHOTOS_DIR = ROOT / "media" / "photos"
SITE_PATH = CONTENT / "site.json"
PROJECTS_PATH = CONTENT / "projects.json"
PHOTOS_PATH = CONTENT / "photos.json"

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
HOST = "127.0.0.1"
PORT = 8000


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def json_bytes(payload: dict, status: HTTPStatus = HTTPStatus.OK) -> tuple[HTTPStatus, bytes, str]:
    body = json.dumps(payload).encode("utf-8")
    return status, body, "application/json; charset=utf-8"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/api/site":
            self._send(*json_bytes(read_json(SITE_PATH)))
            return
        if self.path.split("?", 1)[0] == "/api/projects":
            self._send(*json_bytes(read_json(PROJECTS_PATH)))
            return
        if self.path.split("?", 1)[0] == "/api/photos":
            self._send(*json_bytes(read_json(PHOTOS_PATH)))
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path.split("?", 1)[0] != "/api/photos":
            self._send(*json_bytes({"error": "Not found"}, HTTPStatus.NOT_FOUND))
            return
        try:
            photo = self._handle_upload()
        except ValueError as exc:
            self._send(*json_bytes({"error": str(exc)}, HTTPStatus.BAD_REQUEST))
            return
        self._send(*json_bytes({"photo": photo}, HTTPStatus.CREATED))

    def _handle_upload(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_UPLOAD_BYTES:
            raise ValueError("Upload is missing or too large.")

        content_type = self.headers.get("Content-Type", "")
        match = re.search(r"boundary=(.+)", content_type, flags=re.I)
        if not match:
            raise ValueError("Expected multipart form data.")

        boundary = match.group(1).strip().strip('"').encode("ascii")
        body = self.rfile.read(length)
        fields, files = parse_multipart(body, boundary)

        file_field = files.get("file")
        if not file_field:
            raise ValueError("Choose an image to upload.")

        filename, data = file_field
        suffix = Path(filename).suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise ValueError("Use a jpg, png, gif, webp, or svg image.")
        if not data:
            raise ValueError("The image file was empty.")

        photo_id = uuid.uuid4().hex
        stored_name = f"{photo_id}{suffix}"
        PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
        (PHOTOS_DIR / stored_name).write_bytes(data)

        photo = {
            "id": photo_id,
            "filename": stored_name,
            "url": f"/media/photos/{stored_name}",
            "title": fields.get("title", "").strip() or "Untitled",
            "caption": fields.get("caption", "").strip(),
            "uploadedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        }

        catalog = read_json(PHOTOS_PATH)
        catalog.setdefault("photos", []).insert(0, photo)
        write_json(PHOTOS_PATH, catalog)
        return photo

    def _send(self, status: HTTPStatus, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), format % args))


def parse_multipart(body: bytes, boundary: bytes) -> tuple[dict[str, str], dict[str, tuple[str, bytes]]]:
    delimiter = b"--" + boundary
    fields: dict[str, str] = {}
    files: dict[str, tuple[str, bytes]] = {}

    for part in body.split(delimiter):
        part = part.strip(b"\r\n")
        if not part or part == b"--":
            continue
        if b"\r\n\r\n" not in part:
            continue
        raw_headers, content = part.split(b"\r\n\r\n", 1)
        if content.endswith(b"--"):
            content = content[:-2]
        content = content.removesuffix(b"\r\n")
        headers = raw_headers.decode("utf-8", errors="replace")
        disposition = next((line for line in headers.split("\r\n") if line.lower().startswith("content-disposition:")), "")
        name_match = re.search(r'name="([^"]+)"', disposition)
        if not name_match:
            continue
        name = name_match.group(1)
        filename_match = re.search(r'filename="([^"]*)"', disposition)
        if filename_match:
            filename = posixpath.basename(unquote(filename_match.group(1)))
            files[name] = (filename, content)
        else:
            fields[name] = content.decode("utf-8", errors="replace")

    return fields, files


def main() -> None:
    mimetypes.add_type("text/javascript", ".js")
    mimetypes.add_type("image/svg+xml", ".svg")
    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Serving http://{HOST}:{PORT}")
    print("Replace server.py with Django or Go; keep the /api contract.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
