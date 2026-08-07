<?php
/**
 * Default theme — archive/list template (roadmap 2.9).
 *
 * Used for the home page (latest posts, no pager) and for
 * /arsiv/{type} listings (with CI4 Pager links).
 *
 * @var list<array<string, mixed>> $posts  Published rows, newest first.
 * @var string $heading                    List heading.
 * @var \CodeIgniter\Pager\Pager|null $pager  Null on the home page.
 * @var array<string, mixed>|null $type    Content type row (archive only).
 * @var int|null $page @var int|null $perPage @var int|null $total
 */
$basePath = isset($type['slug']) && $type['slug'] === 'page' ? 'sayfa' : 'blog';
?>
<?= $this->extend('themes/default/layouts/main') ?>

<?= $this->section('content') ?>
<section class="container py-12">
  <h1 class="text-4xl font-bold tracking-tight mb-8"><?= esc($heading ?? 'Yazılar') ?></h1>

  <?php if (empty($posts)) : ?>
    <p class="text-muted">Henüz yayınlanmış içerik yok.</p>
  <?php else : ?>
    <ul class="post-list">
      <?php foreach ($posts as $item) : ?>
        <?php
          $itemData    = is_array($item['data'] ?? null) ? $item['data'] : [];
          $itemSummary = (string) ($itemData['summary'] ?? '');
          $itemDate    = (string) ($item['published_at'] ?? '');
          $itemUrl     = base_url($basePath . '/' . $item['slug']);
        ?>
        <li>
          <h2><a href="<?= esc($itemUrl) ?>"><?= esc($item['title']) ?></a></h2>
          <?php if ($itemDate !== '') : ?>
            <time class="text-muted" datetime="<?= esc($itemDate) ?>">
              <?= esc(date('d F Y', strtotime($itemDate))) ?>
            </time>
          <?php endif ?>
          <?php if ($itemSummary !== '') : ?>
            <p><?= esc($itemSummary) ?></p>
          <?php endif ?>
        </li>
      <?php endforeach ?>
    </ul>

    <?php if (isset($pager) && $pager !== null && isset($page, $perPage, $total)) : ?>
      <nav aria-label="Sayfalama">
        <?= $pager->makeLinks($page, $perPage, $total, 'default_full') ?>
      </nav>
    <?php endif ?>
  <?php endif ?>
</section>
<?= $this->endSection() ?>
