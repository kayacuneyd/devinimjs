/**
 * DevinimJS ci4-cms — admin SPA (roadmap 2.8 / ADR-002).
 *
 * Mounted by app/Views/admin/shell.php into <div id="app"> via bootAdmin().
 * Everything runs against the module contract:
 *   - createApi          → /api client (X-CSRF-TOKEN + X-Requested-With on writes)
 *   - createHashRouter   → hash routes, params as data-param-* attributes
 *   - bindRouterLinks    → <a dv-link="/posts"> in the shell nav
 *   - component()/html   → authoring API pages below
 *   - <dv-media-upload>  → self-registering upload component (dv:uploaded / dv:error)
 *
 * The server is the real gate (AdminController session guard + apiAuth
 * filter); onUnauthorized below is the SPA-side courtesy redirect.
 */

import { component, html } from '/assets/devinim/core/authoring.js';
import { createStore } from '/assets/devinim/core/core.js';
import { createApi, createHashRouter, bindRouterLinks } from '/assets/devinim/core/app.js';
import '/assets/devinim/components/dv-media-upload.js'; // self-registers <dv-media-upload>

// Module singletons, created once by bootAdmin() and shared by the pages.
let api = null;
let router = null;
let sessionUser = null;

// Settings live in a persisted store — the settings page is deliberately
// localStorage-backed: an example of createStore().persist() without
// needing a settings API table.
const settings = createStore({ siteName: 'DevinimJS CMS', tagline: '' });

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

/**
 * Entry point called by the inline module in admin/shell.php.
 *
 * @param {{ csrfToken: string, user: string|null }} options
 */
export function bootAdmin({ csrfToken, user } = {}) {
  sessionUser = user ?? null;
  settings.persist('dv-admin-settings');

  api = createApi({
    baseUrl: '/api',
    csrfToken,
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    onError: (error) => console.error('[ci4-cms] API error:', error.status ?? '', error.message),
    onUnauthorized: () => { window.location.href = '/login'; },
  });

  router = createHashRouter();

  // Order matters: '/posts/new' must precede '/posts/:id' so the literal
  // wins over the parameter. Server-side guards already ran; the
  // beforeEnter hooks show where client-side guards would live.
  const allow = () => true;
  router.add('/', 'dv-admin-dashboard', { beforeEnter: allow });
  router.add('/posts', 'dv-admin-posts', { beforeEnter: allow });
  router.add('/posts/new', 'dv-admin-post-editor', { beforeEnter: allow });
  router.add('/posts/:id', 'dv-admin-post-editor', { beforeEnter: allow });
  // Lazy variant for bigger apps:
  // router.add('/media', () => import('./pages/media.js').then(() => 'dv-admin-media'));
  router.add('/media', 'dv-admin-media', { beforeEnter: allow });
  router.add('/settings', 'dv-admin-settings', { beforeEnter: allow });
  router.add('/*', 'dv-admin-dashboard'); // catch-all → dashboard

  router.mount('#app');
  bindRouterLinks(router); // <a dv-link="..."> in the shell nav
  router.start();
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/** Human-readable message from an HttpError (CI4 fail* envelopes). */
function errText(error) {
  const errors = error?.body?.errors ?? error?.body?.messages;
  if (errors && typeof errors === 'object') return Object.values(errors)[0];
  const flat = typeof error?.body?.error === 'string' ? error.body.error : error?.body?.error?.message;
  return flat ?? error?.body?.message ?? error?.message ?? 'Bilinmeyen hata';
}

/** Tiny fixed-position toast — the SPA's only feedback widget. */
function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/** Status pill. */
function badge(status) {
  return html`<span class="badge badge-${status}">${status}</span>`;
}

/* ------------------------------------------------------------------ */
/* Dashboard — /                                                       */
/* ------------------------------------------------------------------ */

component('dv-admin-dashboard', {
  state() {
    return { loading: true, counts: { posts: 0, pages: 0, media: 0, users: 0 }, plugin: null };
  },

  async connected() {
    try {
      const [posts, pages, media, users] = await Promise.all([
        api.get('/posts', { limit: 1 }),
        api.get('/pages', { limit: 1 }),
        api.get('/media', { limit: 1 }),
        api.get('/users', { limit: 1 }),
      ]);
      this.state.counts = {
        posts: posts.meta?.total ?? 0,
        pages: pages.meta?.total ?? 0,
        media: media.meta?.total ?? 0,
        users: users.meta?.total ?? 0,
      };
    } catch (error) {
      toast(errText(error));
    }
    // Plugin route demo: /api/blog/stats ships with the Blog plugin.
    try {
      const stats = await api.get('/blog/stats');
      this.state.plugin = stats.data;
    } catch { /* plugin disabled — fine */ }
    this.state.loading = false;
  },

  view() {
    const c = this.state.counts;
    const card = (label, num, link) => html`
      <div class="card"><div class="num">${num}</div><div class="muted">${label}</div>
        <a dv-link="${link}">Aç →</a></div>`;
    return html`
      <h1>Gösterge Paneli</h1>
      <p class="muted">Hoş geldin${sessionUser ? `, ${sessionUser}` : ''}.</p>
      ${this.state.loading ? html`<p>Yükleniyor…</p>` : html`
        <div class="cards">
          ${card('Yazı', c.posts, '/posts')}
          ${card('Ortam dosyası', c.media, '/media')}
          ${card('Sayfa', c.pages, '/posts')}
          ${card('Kullanıcı', c.users, '/settings')}
        </div>
        ${this.state.plugin ? html`
          <h2>Blog eklentisi <span class="muted">(/api/blog/stats)</span></h2>
          <p class="muted">Yayında: ${this.state.plugin.published} · Taslak: ${this.state.plugin.drafts}</p>` : ''}
      `}
    `;
  },
});

/* ------------------------------------------------------------------ */
/* Post list — /posts                                                  */
/* (Hand-rolled table; <dv-data-table> from components/dv-data-table.js */
/*  is an alternative once row actions are not needed.)                */
/* ------------------------------------------------------------------ */

component('dv-admin-posts', {
  state() {
    return { items: [], page: 1, limit: 10, total: 0, q: '', status: '', loading: true, error: '' };
  },

  connected() {
    this.load();
  },

  actions: {
    async load() {
      this.state.loading = true;
      this.state.error = '';
      try {
        const res = await api.get('/posts', {
          page: this.state.page,
          limit: this.state.limit,
          q: this.state.q || undefined,
          status: this.state.status || undefined,
        });
        this.state.items = res.data ?? [];
        this.state.total = res.meta?.total ?? 0;
      } catch (error) {
        this.state.error = errText(error);
      } finally {
        this.state.loading = false;
      }
    },

    // Debounced live search.
    onSearch(event) {
      this.state.q = event.target.value;
      this.state.page = 1;
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.load(), 300);
    },

    onStatus(event) {
      this.state.status = event.target.value;
      this.state.page = 1;
      this.load();
    },

    turnPage(event) {
      const dir = Number(event.target.closest('button')?.dataset.dir ?? 0);
      const pages = Math.max(1, Math.ceil(this.state.total / this.state.limit));
      this.state.page = Math.min(pages, Math.max(1, this.state.page + dir));
      this.load();
    },

    goNew() { router.navigate('/posts/new'); },

    editRow(event) {
      const id = event.target.closest('[data-id]')?.dataset.id;
      if (id) router.navigate(`/posts/${id}`);
    },

    async publishRow(event) {
      const id = event.target.closest('[data-id]')?.dataset.id;
      if (!id) return;
      try {
        await api.post(`/posts/${id}/publish`);
        toast('Yayınlandı.');
        this.load();
      } catch (error) { toast(errText(error)); }
    },


    async duplicateRow(event) {
      const id = event.target.closest('[data-id]')?.dataset.id;
      if (!id) return;
      try {
        await api.post(`/posts/${id}/duplicate`);
        toast('Kopyalandı (taslak).');
        this.load();
      } catch (error) { toast(errText(error)); }
    },

    async deleteRow(event) {
      const id = event.target.closest('[data-id]')?.dataset.id;
      if (!id || !window.confirm('Bu yazı silinsin mi?')) return;
      try {
        await api.delete(`/posts/${id}`);
        toast('Silindi.');
        this.load();
      } catch (error) { toast(errText(error)); }
    },
  },

  view() {
    const s = this.state;
    const pages = Math.max(1, Math.ceil(s.total / s.limit));
    const rows = s.items.map((item) => html`
      <tr>
        <td><strong>${item.title}</strong><br><span class="muted">/${item.slug}</span></td>
        <td>${badge(item.status)}</td>
        <td class="muted">${item.published_at ?? '—'}</td>
        <td>
          <button class="btn btn-sm" data-on:click="editRow" data-id="${item.id}">Düzenle</button>
          ${item.status !== 'published'
            ? html`<button class="btn btn-sm" data-on:click="publishRow" data-id="${item.id}">Yayınla</button>`
            : ''}
          <button class="btn btn-sm" data-on:click="duplicateRow" data-id="${item.id}">Kopyala</button>
          <button class="btn btn-sm btn-danger" data-on:click="deleteRow" data-id="${item.id}">Sil</button>
        </td>
      </tr>`);

    return html`
      <h1>Yazılar</h1>
      <div class="toolbar">
        <input class="input" type="search" placeholder="Başlıkta ara…"
               value="${s.q}" data-on:input="onSearch" />
        <select class="select" data-on:change="onStatus">
          <option value="">Tüm durumlar</option>
          ${['draft', 'published', 'archived'].map((st) => html`
            <option value="${st}" ${s.status === st ? 'selected' : ''}>${st}</option>`)}
        </select>
        <button class="btn btn-primary" data-on:click="goNew">+ Yeni Yazı</button>
      </div>
      ${s.error ? html`<p class="muted">${s.error}</p>` : ''}
      ${s.loading ? html`<p>Yükleniyor…</p>` : html`
        <table class="admin-table">
          <thead><tr><th>Başlık</th><th>Durum</th><th>Yayın</th><th>İşlemler</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${s.items.length === 0 ? html`<p class="muted">Kayıt yok.</p>` : ''}
        <div class="pager">
          <button class="btn btn-sm" data-on:click="turnPage" data-dir="-1">← Önceki</button>
          <span class="muted">Sayfa ${s.page} / ${pages} · Toplam ${s.total}</span>
          <button class="btn btn-sm" data-on:click="turnPage" data-dir="1">Sonraki →</button>
        </div>
      `}
    `;
  },
});


/* ------------------------------------------------------------------ */
/* Post editor — /posts/new and /posts/:id                             */
/*                                                                     */
/* Dynamic form: the field list is fetched from /api/content-types and */
/* each field_type renders its own control. Column fields (title, slug,*/
/* status) are fixed inputs; the rest go into the JSON `data` payload. */
/* Values are collected from the DOM at save time (inputs stay         */
/* uncontrolled between loads — morph render keeps them intact).       */
/* ------------------------------------------------------------------ */

/** Columns live on `contents`, everything else lands in `data`. */
const COLUMN_FIELDS = new Set(['title', 'slug', 'status']);

/** One control per field_type (mirrors app/Libraries/Fields/*). */
function fieldControl(field, value) {
  const name = field.name;
  const cfg = field.config ?? {};
  const label = html`<label class="label" for="f-${name}">${field.label ?? name}${cfg.required ? ' *' : ''}</label>`;
  switch (field.field_type) {
    case 'textarea':
      return html`${label}<textarea class="textarea" id="f-${name}" name="${name}" rows="4">${value ?? ''}</textarea>`;
    case 'rich_text':
      return html`${label}<textarea class="textarea" id="f-${name}" name="${name}" rows="12">${value ?? ''}</textarea>`;
    case 'number':
      return html`${label}<input class="input" type="number" id="f-${name}" name="${name}" value="${value ?? ''}" />`;
    case 'boolean':
      return html`${label}<input type="checkbox" id="f-${name}" name="${name}" value="1" ${value ? 'checked' : ''} />`;
    case 'date':
      return html`${label}<input class="input" type="date" id="f-${name}" name="${name}" value="${value ?? ''}" />`;
    case 'datetime':
      return html`${label}<input class="input" type="datetime-local" id="f-${name}" name="${name}" value="${value ?? ''}" />`;
    case 'select':
      return html`${label}<select class="select" id="f-${name}" name="${name}">
        ${(cfg.options ?? []).map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const text = typeof opt === 'object' ? opt.label ?? opt.value : opt;
          return html`<option value="${val}" ${String(value ?? cfg.default ?? '') === String(val) ? 'selected' : ''}>${text}</option>`;
        })}
      </select>`;
    case 'image':
      // Text input holds the URL; <dv-media-upload> next to it fills it
      // via the dv:uploaded event (see onUploaded below).
      return html`${label}
        <input class="input" type="text" id="f-${name}" name="${name}" value="${value ?? ''}" />
        ${value ? html`<img class="field-preview" src="${value}" alt="" />` : ''}
        <dv-media-upload data-endpoint="/api/media/upload" data-name="image"
                         data-accept="image/*" data-max-size="5242880"
                         data-on:dv:uploaded="onUploaded" data-on:dv:error="onUploadError">
        </dv-media-upload>`;
    default:
      // text, file, relation, multi_select…: example-grade fallback.
      return html`${label}<input class="input" type="text" id="f-${name}" name="${name}" value="${value ?? ''}" />
        <span class="muted">${field.field_type}</span>`;
  }
}


component('dv-admin-post-editor', {
  state() {
    return { id: null, loading: true, saving: false, error: '', fields: [], data: {}, title: '', slug: '', status: 'draft', cover: '' };
  },

  async connected() {
    const paramId = this.str('paramId', '');
    this.state.id = /^\d+$/.test(paramId) ? Number(paramId) : null;
    try {
      // 1) Field schema of the 'post' content type.
      const types = await api.get('/content-types');
      const postType = (types.data ?? []).find((t) => t.slug === 'post');
      if (postType) {
        const detail = await api.get(`/content-types/${postType.id}`);
        this.state.fields = (detail.data?.fields ?? []).filter((f) => !COLUMN_FIELDS.has(f.name));
      }
      // 2) Existing record when editing.
      if (this.state.id) {
        const res = await api.get(`/posts/${this.state.id}`);
        const post = res.data;
        this.state.title = post.title ?? '';
        this.state.slug = post.slug ?? '';
        this.state.status = post.status ?? 'draft';
        this.state.data = post.data ?? {};
        this.state.cover = post.data?.cover_image ?? '';
      }
    } catch (error) {
      this.state.error = errText(error);
    } finally {
      this.state.loading = false;
    }
  },

  actions: {
    // <dv-media-upload> fired: store the URL, re-render the preview.
    onUploaded(event) {
      const url = event.detail?.response?.url;
      if (!url) return;
      this.state.cover = url;
      const input = this.querySelector('[name="cover_image"]');
      if (input) input.value = url;
      toast('Görsel yüklendi.');
    },

    onUploadError(event) {
      // dv:error detail: { name, reason }
      toast(event.detail?.reason ?? event.detail?.error?.message ?? 'Yükleme başarısız.');
    },

    async save() {
      if (this.state.saving) return;
      this.state.saving = true;
      this.state.error = '';

      // Collect the form from the DOM: column inputs + dynamic fields.
      const val = (name) => this.querySelector(`[name="${name}"]`)?.value?.trim() ?? '';
      const data = {};
      for (const field of this.state.fields) {
        const el = this.querySelector(`[name="${field.name}"]`);
        if (!el) continue;
        data[field.name] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value;
      }
      const payload = {
        title: val('title'),
        slug: val('slug'),
        status: val('status') || 'draft',
        data,
      };

      try {
        const saved = this.state.id
          ? await api.put(`/posts/${this.state.id}`, payload)
          : await api.post('/posts', payload);
        toast('Kaydedildi.');
        router.navigate(`/posts/${saved.data.id}`);
      } catch (error) {
        this.state.error = errText(error); // CI4 400 → error.body.errors
      } finally {
        this.state.saving = false;
      }
    },

    back() { router.navigate('/posts'); },
  },

  view() {
    const s = this.state;
    if (s.loading) return html`<p>Yükleniyor…</p>`;
    return html`
      <h1>${s.id ? `Yazıyı Düzenle #${s.id}` : 'Yeni Yazı'}</h1>
      ${s.error ? html`<p class="muted">${s.error}</p>` : ''}

      <label class="label" for="f-title">Başlık *</label>
      <input class="input" type="text" id="f-title" name="title" value="${s.title}" />

      <label class="label" for="f-slug">Slug <span class="muted">(boş bırakılırsa başlıktan üretilir)</span></label>
      <input class="input" type="text" id="f-slug" name="slug" value="${s.slug}" />

      <label class="label" for="f-status">Durum</label>
      <select class="select" id="f-status" name="status">
        ${['draft', 'published', 'archived'].map((st) => html`
          <option value="${st}" ${s.status === st ? 'selected' : ''}>${st}</option>`)}
      </select>

      ${s.fields.map((field) => fieldControl(
        field,
        field.name === 'cover_image' ? s.cover : s.data?.[field.name],
      ))}

      <div class="toolbar" style="margin-top:1.25rem">
        <button class="btn btn-primary" data-on:click="save" ${s.saving ? 'disabled' : ''}>
          ${s.saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button class="btn" data-on:click="back">← Listeye dön</button>
      </div>
    `;
  },
});


/* ------------------------------------------------------------------ */
/* Media library — /media                                              */
/* ------------------------------------------------------------------ */

component('dv-admin-media', {
  state() {
    return { items: [], page: 1, limit: 24, total: 0, loading: true, error: '' };
  },

  connected() {
    this.load();
  },

  actions: {
    async load() {
      this.state.loading = true;
      try {
        const res = await api.get('/media', { page: this.state.page, limit: this.state.limit });
        this.state.items = res.data ?? [];
        this.state.total = res.meta?.total ?? 0;
      } catch (error) {
        this.state.error = errText(error);
      } finally {
        this.state.loading = false;
      }
    },

    onUploaded() {
      toast('Yüklendi.');
      this.state.page = 1;
      this.load();
    },

    onUploadError(event) {
      // dv:error detail: { name, reason }
      toast(event.detail?.reason ?? event.detail?.error?.message ?? 'Yükleme başarısız.');
    },

    async deleteRow(event) {
      const id = event.target.closest('[data-id]')?.dataset.id;
      if (!id || !window.confirm('Dosya silinsin mi?')) return;
      try {
        await api.delete(`/media/${id}`);
        toast('Silindi.');
        this.load();
      } catch (error) { toast(errText(error)); }
    },

    turnPage(event) {
      const dir = Number(event.target.closest('button')?.dataset.dir ?? 0);
      const pages = Math.max(1, Math.ceil(this.state.total / this.state.limit));
      this.state.page = Math.min(pages, Math.max(1, this.state.page + dir));
      this.load();
    },
  },

  view() {
    const s = this.state;
    const pages = Math.max(1, Math.ceil(s.total / s.limit));
    return html`
      <h1>Ortam Kütüphanesi</h1>
      <dv-media-upload data-endpoint="/api/media/upload" data-name="image"
                       data-accept="image/*" data-max-size="5242880" data-multiple="true"
                       data-on:dv:uploaded="onUploaded" data-on:dv:error="onUploadError">
      </dv-media-upload>
      ${s.error ? html`<p class="muted">${s.error}</p>` : ''}
      ${s.loading ? html`<p>Yükleniyor…</p>` : html`
        <div class="media-grid">
          ${s.items.map((item) => html`
            <figure>
              <img src="${item.thumb_path ?? item.path}" alt="${item.original_name}" loading="lazy" />
              <figcaption class="muted">${item.original_name}</figcaption>
              <button class="btn btn-sm btn-danger" data-on:click="deleteRow" data-id="${item.id}">Sil</button>
            </figure>`)}
        </div>
        ${s.items.length === 0 ? html`<p class="muted">Henüz dosya yok.</p>` : ''}
        <div class="pager">
          <button class="btn btn-sm" data-on:click="turnPage" data-dir="-1">← Önceki</button>
          <span class="muted">Sayfa ${s.page} / ${pages} · Toplam ${s.total}</span>
          <button class="btn btn-sm" data-on:click="turnPage" data-dir="1">Sonraki →</button>
        </div>
      `}
    `;
  },
});

/* ------------------------------------------------------------------ */
/* Settings — /settings (createStore().persist() example)              */
/* ------------------------------------------------------------------ */

component('dv-admin-settings', {
  state() {
    return { saved: false };
  },

  connected() {
    // Auto re-render whenever the persisted store changes.
    this.useStore(settings);
  },

  actions: {
    onInput(event) {
      settings.set(event.target.name, event.target.value);
      this.state.saved = false;
    },

    save() {
      // Persisted already via store.persist(); this is where an
      // api.put('/settings', ...) call would go in a real app.
      this.state.saved = true;
      toast('Ayarlar kaydedildi (localStorage).');
    },
  },

  view() {
    return html`
      <h1>Ayarlar</h1>
      <p class="muted">
        Örnek sayfa: değerler createStore().persist() ile tarayıcıda saklanır.
        Kalıcı sunucu ayarları için bir /api/settings kaynağı ekleyin.
      </p>
      <label class="label" for="site-name">Site adı</label>
      <input class="input" type="text" id="site-name" name="siteName"
             value="${settings.state.siteName}" data-on:input="onInput" />
      <label class="label" for="tagline">Slogan</label>
      <input class="input" type="text" id="tagline" name="tagline"
             value="${settings.state.tagline}" data-on:input="onInput" />
      <div class="toolbar" style="margin-top:1.25rem">
        <button class="btn btn-primary" data-on:click="save">Kaydet</button>
        ${this.state.saved ? html`<span class="muted">Kaydedildi ✓</span>` : ''}
      </div>
    `;
  },
});

