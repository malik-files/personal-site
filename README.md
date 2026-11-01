# Personal site

Minimal three-page site: about, photographs, and projects.

## Run

```bash
python3 server.py
```

Then open http://127.0.0.1:8000

The local `server.py` is a stand-in backend. The pages only talk to `/api/*`.

## Edit copy

Replace placeholder text in:

- `content/site.json` — name, about copy, GitHub URL
- `content/projects.json` — project cards
- `content/photos.json` — photograph titles and captions (uploads also write here)

## Later: Django or Go

Keep the frontend. Point `js/config.js` `apiBase` at the new server (or reverse-proxy `/api` to it) and implement:

| Method | Path | Body / response |
| --- | --- | --- |
| GET | `/api/site` | site JSON |
| GET | `/api/projects` | `{ "projects": [...] }` |
| GET | `/api/photos` | `{ "photos": [...] }` |
| POST | `/api/photos` | multipart `file`, `title`, `caption` → `{ "photo": {...} }` |

Uploaded files currently land in `media/photos/`.
