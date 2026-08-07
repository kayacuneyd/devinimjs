# writable/ — permissions & safety notes (roadmap 2.7)

This kit ships an empty `writable/` marker so the expected directory layout is
visible in the repo. On a real install, **use the appstarter's own `writable/`**
(it also contains `cache/`, `logs/`, `session/`, …) — just make sure the web
server can write to it, and that these kit-specific paths exist:

```
writable/
  database.sqlite        # created by `php spark migrate --all`
  uploads/               # created on first upload (or: mkdir -p writable/uploads/thumbs)
    thumbs/              # 300×300 GD thumbnails
  backups/               # created by `php spark db:backup`
```

## Permissions (shared hosting)

```bash
chmod 775 writable/
chmod 664 writable/database.sqlite
chmod 775 writable/uploads/
chmod 775 writable/uploads/thumbs/
chmod 775 writable/backups/
```

If PHP runs as a different user (no group write), use `755`/`644` with correct
ownership, or ask your host — never `777` on production.

## Apache: keep `writable/` out of reach

`writable/` must NOT be web-accessible. With the standard appstarter layout the
docroot is `public/`, so `writable/` is already outside the docroot. If your
host forces the whole project into the docroot, drop an `.htaccess` into
`writable/`:

```apache
# writable/.htaccess — belt & braces when writable/ sits inside the docroot
Require all denied
Deny from all
```

## Serving uploaded files

Uploads live in `writable/uploads/` (outside the docroot) but are linked as
`/uploads/...`. Pick one:

```bash
# Preferred: symlink into the docroot
ln -s ../writable/uploads public/uploads

# Alternative (hosts without symlink support): change the upload target in
# app/Controllers/Api/MediaController.php from WRITEPATH . 'uploads'
# to FCPATH . 'uploads'.
```
