<?php
/**
 * Default theme — single blog post template (roadmap 2.9).
 *
 * The body is rich_text: trusted, admin-authored HTML printed RAW by
 * design (see RichTextField's trust model). Everything else — title,
 * dates, summary, cover path — is escaped with esc() (roadmap 2.10).
 *
 * The <dv-like-button> at the bottom is the interactive-island example:
 * a tiny self-contained DevinimJS component defined by the module script
 * below, persisting its count in localStorage (no backend table needed
 * for the demo — wire it to an API endpoint for a real counter).
 *
 * @var array<string, mixed> $post Content row (data already JSON-decoded).
 */
$data        = is_array($post['data'] ?? null) ? $post['data'] : [];
$summary     = (string) ($data['summary'] ?? '');
$body        = (string) ($data['body'] ?? '');
$coverImage  = (string) ($data['cover_image'] ?? '');
$publishedAt = (string) ($post['published_at'] ?? '');
?>
<?= $this->extend('themes/default/layouts/main') ?>

<?= $this->section('content') ?>
<article class="container py-12" data-post-id="<?= esc((string) $post['id']) ?>">
  <header class="mb-8">
    <h1 class="text-4xl font-bold tracking-tight mb-4"><?= esc($post['title']) ?></h1>
    <?php if ($publishedAt !== '') : ?>
      <time class="text-muted" datetime="<?= esc($publishedAt) ?>">
        <?= esc(date('d F Y', strtotime($publishedAt))) ?>
      </time>
    <?php endif ?>
    <?php if ($summary !== '') : ?>
      <p class="text-muted"><?= esc($summary) ?></p>
    <?php endif ?>
  </header>

  <?php if ($coverImage !== '') : ?>
    <img class="cover" src="<?= esc($coverImage) ?>" alt="<?= esc($post['title']) ?>">
  <?php endif ?>

  <div class="content leading-relaxed">
    <?= $body /* rich_text: trusted admin HTML — see docblock above */ ?>
  </div>

  <!-- Interactive island: mounted by the module script below -->
  <dv-like-button
    data-post-id="<?= esc((string) $post['id']) ?>"
    data-count="0">
  </dv-like-button>
</article>

<script type="module">
  // dv-like-button — example interactive island (roadmap 2.9). Kept
  // self-contained in the theme; move it into your own module under
  // public/assets/ when it grows. Replace the localStorage lines with an
  // api.post() call for a server-side counter.
  import { BaseComponent, html, define } from '/assets/devinim/core/core.js';

  class LikeButton extends BaseComponent {
    initialState() {
      const key = `dv-like:${this.str('postId', '0')}`;
      return { count: this.num('count', 0) + (Number(localStorage.getItem(key)) || 0) };
    }

    template() {
      return html`<button type="button" data-on:click="like">♥ ${this.state.count}</button>`;
    }

    like() {
      this.state.count += 1;
      localStorage.setItem(`dv-like:${this.str('postId', '0')}`, String(this.state.count - this.num('count', 0)));
    }
  }

  define('dv-like-button', LikeButton);
</script>
<?= $this->endSection() ?>
