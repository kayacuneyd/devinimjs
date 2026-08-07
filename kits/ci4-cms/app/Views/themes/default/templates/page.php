<?php
/**
 * Default theme — static page template (roadmap 2.9).
 *
 * Same trust model as post.php: body is raw admin-authored rich_text,
 * everything else is escaped.
 *
 * @var array<string, mixed> $post Content row (data already JSON-decoded).
 */
$data = is_array($post['data'] ?? null) ? $post['data'] : [];
$body = (string) ($data['body'] ?? '');
?>
<?= $this->extend('themes/default/layouts/main') ?>

<?= $this->section('content') ?>
<article class="container py-12" data-post-id="<?= esc((string) $post['id']) ?>">
  <header class="mb-8">
    <h1 class="text-4xl font-bold tracking-tight mb-4"><?= esc($post['title']) ?></h1>
  </header>

  <div class="content leading-relaxed">
    <?= $body /* rich_text: trusted admin HTML — see post.php docblock */ ?>
  </div>
</article>
<?= $this->endSection() ?>
