<?php
/**
 * Admin SPA shell (roadmap 2.8 / ADR-002).
 *
 * CI4 renders exactly this once; everything below /admin/#/... belongs to
 * the DevinimJS hash router. The inline module hands the session-bound
 * CSRF token and the current user to public/assets/admin/app.js, which
 * creates the createApi() client and mounts the router into #app.
 *
 * The top nav uses plain <a dv-link="..."> anchors — bindRouterLinks()
 * turns them into hash-router navigations without page reloads.
 *
 * Styling: uncomment the CKCSS link once public/assets/ckcss/ exists; the
 * fallback <style> keeps the shell usable on a bare install.
 *
 * @var string $csrf_token Session-bound CSRF token (csrf_hash()).
 * @var string|null $user  E-mail of the logged-in admin.
 */
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="<?= esc($csrf_token) ?>">
  <title>Yönetim Paneli — DevinimJS CMS</title>
  <!-- <link rel="stylesheet" href="/assets/ckcss/ckcss.css"> -->
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #fafafa; color: #18181b; }
    .admin-nav { display: flex; align-items: center; gap: 1rem; padding: .75rem 1.25rem; background: #18181b; color: #fafafa; }
    .admin-nav .brand { font-weight: 700; margin-right: .5rem; }
    .admin-nav a { color: #d4d4d8; text-decoration: none; font-size: .925rem; }
    .admin-nav a:hover { color: #fff; }
    .admin-nav .spacer { flex: 1; }
    .admin-nav .user { font-size: .85rem; color: #a1a1aa; }
    main { padding: 1.5rem 1.25rem; max-width: 72rem; margin: 0 auto; }
    table.admin-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e4e4e7; }
    .admin-table th, .admin-table td { text-align: left; padding: .55rem .75rem; border-bottom: 1px solid #e4e4e7; font-size: .925rem; }
    .input, .textarea, .select { box-sizing: border-box; width: 100%; padding: .5rem .75rem; border: 1px solid #d4d4d8; border-radius: .5rem; font: inherit; background: #fff; }
    .label { display: block; font-size: .875rem; font-weight: 600; margin: .9rem 0 .3rem; }
    .btn { display: inline-block; padding: .45rem .9rem; border: 1px solid #d4d4d8; border-radius: .5rem; background: #fff; color: #18181b; font: inherit; font-size: .875rem; cursor: pointer; text-decoration: none; }
    .btn:hover { background: #f4f4f5; }
    .btn-primary { background: #18181b; border-color: #18181b; color: #fff; }
    .btn-danger { color: #b91c1c; border-color: #fecaca; }
    .btn-sm { padding: .25rem .55rem; font-size: .8rem; }
    .badge { display: inline-block; padding: .1rem .5rem; border-radius: 999px; font-size: .75rem; background: #e4e4e7; }
    .badge-published { background: #dcfce7; color: #15803d; }
    .badge-draft { background: #fef9c3; color: #a16207; }
    .badge-archived { background: #e4e4e7; color: #52525b; }
    .toolbar { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; margin: 0 0 1rem; }
    .toolbar .input, .toolbar .select { width: auto; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 1rem; }
    .card { background: #fff; border: 1px solid #e4e4e7; border-radius: .75rem; padding: 1rem 1.25rem; }
    .card .num { font-size: 1.75rem; font-weight: 700; }
    .muted { color: #71717a; font-size: .85rem; }
    .toast { position: fixed; bottom: 1rem; right: 1rem; padding: .7rem 1rem; border-radius: .5rem; background: #18181b; color: #fff; font-size: .875rem; }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr)); gap: 1rem; }
    .media-grid figure { margin: 0; background: #fff; border: 1px solid #e4e4e7; border-radius: .5rem; padding: .5rem; }
    .media-grid img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: .35rem; display: block; }
    .field-preview { max-width: 8rem; display: block; margin-top: .4rem; border-radius: .35rem; }
    .pager { display: flex; gap: .5rem; align-items: center; margin-top: 1rem; }
  </style>
</head>
<body>
  <nav class="admin-nav">
    <span class="brand">DevinimJS CMS</span>
    <a dv-link="/">Gösterge</a>
    <a dv-link="/posts">Yazılar</a>
    <a dv-link="/media">Ortam</a>
    <a dv-link="/settings">Ayarlar</a>
    <span class="spacer"></span>
    <span class="user"><?= esc((string) $user) ?></span>
    <a href="<?= base_url('logout') ?>">Çıkış</a>
  </nav>

  <main>
    <!-- DevinimJS hash router mount point -->
    <div id="app"></div>
  </main>

  <script type="module">
    import { bootAdmin } from '/assets/admin/app.js';

    bootAdmin({
      csrfToken: document.querySelector('meta[name="csrf-token"]').content,
      user: <?= json_encode($user ?? null, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?>,
    });
  </script>
</body>
</html>
