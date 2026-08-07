<?php
/**
 * Default theme — main layout (roadmap 2.9).
 *
 * Every template extends this layout and fills the "content" section:
 *     <?= $this->extend('themes/default/layouts/main') ?>
 *
 * @var array{title: string, description: string} $meta Page meta tags.
 */
$meta = $meta ?? ['title' => '', 'description' => ''];
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= esc($meta['title']) ?> — DevinimJS CMS</title>
  <meta name="description" content="<?= esc($meta['description']) ?>">
  <!-- Optional: <link rel="stylesheet" href="/assets/ckcss/ckcss.css"> -->
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; color: #18181b; background: #fff; line-height: 1.6; }
    .container { max-width: 46rem; margin: 0 auto; padding: 0 1.25rem; }
    .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
    .mb-8 { margin-bottom: 2rem; }
    .site-header { border-bottom: 1px solid #e4e4e7; }
    .site-header .container { display: flex; align-items: center; gap: 1.25rem; padding-top: .9rem; padding-bottom: .9rem; }
    .site-header .brand { font-weight: 700; text-decoration: none; color: inherit; }
    .site-header nav a { color: #52525b; text-decoration: none; font-size: .95rem; margin-right: 1rem; }
    .site-header nav a:hover { color: #18181b; }
    .site-footer { border-top: 1px solid #e4e4e7; margin-top: 3rem; }
    .site-footer .container { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .text-muted { color: #71717a; font-size: .9rem; }
    .text-4xl { font-size: 2.25rem; line-height: 1.2; }
    .font-bold { font-weight: 700; }
    .tracking-tight { letter-spacing: -.02em; }
    .mb-4 { margin-bottom: 1rem; }
    .leading-relaxed { line-height: 1.75; }
    .cover { width: 100%; border-radius: .75rem; margin-bottom: 2rem; }
    .post-list { list-style: none; margin: 0; padding: 0; }
    .post-list li { padding: 1.25rem 0; border-bottom: 1px solid #e4e4e7; }
    .post-list h2 { margin: 0 0 .35rem; font-size: 1.35rem; }
    .post-list h2 a { color: inherit; text-decoration: none; }
    .post-list h2 a:hover { text-decoration: underline; }
    .pagination { display: flex; gap: .35rem; list-style: none; padding: 0; margin: 2rem 0 0; }
    .pagination a, .pagination li.active span { display: inline-block; padding: .3rem .7rem; border: 1px solid #d4d4d8; border-radius: .4rem; text-decoration: none; color: inherit; font-size: .9rem; }
    .pagination li.active span { background: #18181b; color: #fff; border-color: #18181b; }
    dv-like-button button { font: inherit; cursor: pointer; border: 1px solid #d4d4d8; background: #fff; border-radius: 999px; padding: .4rem 1rem; }
  </style>
</head>
<body>
  <?= $this->include('themes/default/partials/header') ?>

  <?= $this->renderSection('content') ?>

  <?= $this->include('themes/default/partials/footer') ?>
</body>
</html>
