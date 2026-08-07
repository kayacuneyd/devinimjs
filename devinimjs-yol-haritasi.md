# DevinimJS Geliştirme Yol Haritası

> Bu doküman, DevinimJS'in frontend runtime'ı, CI4 + SQLite backend entegrasyonu ve fullstack CMS mimarisi için eksiklerin, geliştirme önerilerinin ve öncelik sıralamasının kapsamlı bir özetidir.
> **Hedef:** Build-free, Proxy-reactive, Light DOM Vanilla JS component library + CodeIgniter 4 + SQLite tabanlı extensible CMS.

---

## Bölüm 1: Frontend Runtime (DevinimJS)

### 1.1 Event Binding — Tek Bir Convention

**Mevcut Durum:** `data-on:click` (class API) ve `on:click` (authoring API) iki farklı syntax var.

**Yapılacak:**
- Tek bir convention seçilmeli. Öneri: `data-on:click="increment"` (valid HTML, attribute namespace'li).
- Event modifier'lar desteklenmeli:
  - `data-on:click:passive="scrollHandler"`
  - `data-on:submit:prevent="handleSubmit"`
  - `data-on:keydown:stop="handleKey"`

**Kabul Kriteri:** Hem class API hem authoring API'de aynı event syntax'i çalışmalı.

---

### 1.2 Gerçek Morph Render (ADR-0001)

**Mevcut Durum:** `innerHTML` karşılaştırması ile full re-render. Bu, input focus kaybına, event listener tekrar attach'e ve performans sorunlarına yol açar.

**Yapılacak:**
1. **Text Node Diff:** Sadece değişen text node'ları güncelle.
2. **Attribute Diff:** Aynı tag ise sadece attribute'ları karşılaştır.
3. **Keyed Children:** Liste render ederken `key` attribute desteği. Virtual DOM benzeri reconcile mantığı.
4. **Focus Preservation:** Input/textarea focus'u morph sırasında korunmalı.
5. **Event Listener Reuse:** Aynı element üzerinde event listener'lar tekrar attach edilmemeli.

**Algoritma Taslağı:**
```
morph(oldNode, newHTML):
  1. newHTML → DocumentFragment parse et
  2. Eğer oldNode.tagName !== newNode.tagName → replaceNode
  3. Aynı tag ise:
     a. Attribute'ları diff et, sadece değişenleri güncelle
     b. Text node'ları karşılaştır, sadece değişeni güncelle
     c. Keyed children: key attribute'una göre eşleştir, move/insert/delete
     d. Keyless children: sırayla karşılaştır
```

**Kabul Kriteri:** 1000 satırlık liste render edildiğinde, tek bir item değiştiğinde sadece o item re-render olmalı. Input focus morph sırasında korunmalı.

---

### 1.3 Component Lifecycle & Cleanup

**Mevcut Durum:** `disconnectedCallback` yok. Interval, timeout, event listener, fetch abort controller hiçbiri temizlenmiyor → memory leak.

**Yapılacak:**
```js
class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this._cleanup = [];
  }

  connectedCallback() { /* ... */ }

  disconnectedCallback() {
    this._cleanup.forEach(fn => fn());
    this.onDisconnect?.(); // override edilebilir hook
  }

  // Helper method:
  autoCleanup(fn) { this._cleanup.push(fn); }
}
```

**Kullanım Örneği:**
```js
// Component içinde:
const interval = setInterval(() => this.tick(), 1000);
this.autoCleanup(() => clearInterval(interval));

const controller = new AbortController();
fetch('/api/data', { signal: controller.signal });
this.autoCleanup(() => controller.abort());
```

**Kabul Kriteri:** Component DOM'dan kaldırıldığında tüm interval'ler, listener'lar ve abort controller'lar temizlenmeli. Chrome DevTools Memory tab'ında leak görünmemeli.

---

### 1.4 Store & Shared State (Component'ler Arası İletişim)

**Mevcut Durum:** Component'ler arası state paylaşım mekanizması yok. Global fonksiyonlar (`window.showToast`) kullanılmak zorunda kalınıyor.

**Yapılacak:**
```js
// createStore API:
const store = createStore({
  count: 0,
  user: null,
  theme: 'light'
});

// Component içinde bağlantı:
this.connect(store, ['count', 'theme']); // sadece bu key'ler değişince re-render

// veya selector ile:
this.connect(store, state => ({
  displayCount: state.count > 99 ? '99+' : state.count
}));

// Store dışından güncelleme:
store.set('count', 5);
store.update(state => ({ count: state.count + 1 }));
```

**Özellikler:**
- Proxy-based reactive store (component state ile aynı mekanizma)
- Selector desteği (gereksiz re-render'ı önler)
- `store.subscribe(callback)` (component dışından dinleme)
- `store.persist(key)` → localStorage otomatik sync

**Kabul Kriteri:** İki farklı component aynı store'a bağlandığında, biri state'i değiştirdiğinde diğeri otomatik re-render olmalı.

---

### 1.5 Authoring API (`component()`) — Güvenilirlik

**Mevcut Durum:** README'de tanımlı ama `sync`, `actions`, `props` arasındaki etkileşim belirsiz.

**Yapılacak:**
```js
component('acme-counter', {
  props: {
    start: { type: Number, default: 0, required: true },
    step: { type: Number, default: 1 },
    label: { type: String, default: '' }
  },

  state() {
    return { count: this.props.start };
  },

  sync: {
    // attributeChangedCallback ile otomatik bağlı
    start(value) { this.state.count = value; }
  },

  actions: {
    increment() { this.state.count += this.props.step; },
    decrement() { this.state.count -= this.props.step; }
  },

  view() {
    return html`<button on:click="increment">${this.state.count}</button>`;
  }
});
```

**Kurallar:**
- `props` tanımları runtime'da validate edilmeli. Tip uyuşmazlığında `console.error` yerine anlamlı hata mesajı.
- `attributeChangedCallback` otomatik olarak `props` ve `sync`'i trigger etmeli.
- `actions` içindeki `this` → component instance'ını göstermeli (state ve props'a erişim).
- `view()` her state değişiminde çağrılmalı ama morph render ile optimize edilmeli.

**Kabul Kriteri:** Authoring API ile yazılmış component, class API ile yazılmış component ile aynı performans ve davranışı göstermeli.

---

### 1.6 Form Handling & Validation

**Mevcut Durum:** Form submit ve validation mekanizması yok.

**Yapılacak:**
```html
<form dv-form="subscribe">
  <input name="email" dv-validate="required|email" />
  <span dv-error="email"></span>

  <input name="age" dv-validate="required|number|min:18" />
  <span dv-error="age"></span>

  <button type="submit" dv-submit="subscribe">Gönder</button>
</form>
```

```js
// Component'te:
actions: {
  async subscribe(formData) {
    // formData zaten validate edilmiş ve sanitized
    const result = await api.post('/api/subscribe', formData);
    showToast('Başarıyla abone oldunuz!');
  }
}
```

**Validation Kuralları:** `required`, `email`, `url`, `number`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `match` (diğer field ile karşılaştırma).

**Kabul Kriteri:** Invalid form submit edilememeli. Hata mesajları anlık (on blur) veya submit sonrası görüntülenebilmeli.

---

### 1.7 Router (Hash-based)

**Mevcut Durum:** Sayfa içi smooth scroll var ama SPA hissi veren routing yok.

**Yapılacak:**
```js
const router = createRouter({
  '/': HomePage,
  '/about': AboutPage,
  '/post/:id': PostPage,
  '/admin/*': AdminLayout  // nested routes
});

// HTML'de declarative:
<a dv-link="/about">Hakkında</a>
<a dv-link="/post/123">Yazı</a>
```

**Özellikler:**
- Hash routing (`/#/path`) — shared hosting'de `.htaccess` sorunu yok
- Route params (`:id`) otomatik parse
- Nested routes
- Route guards (auth kontrolü)
- Lazy loading: `() => import('./pages/Admin.js')`
- `beforeEnter`, `afterLeave` hook'ları

**Kabul Kriteri:** `dv-link` tıklandığında sayfa yeniden yüklenmeden route değişmeli. Tarayıcı back/forward butonları çalışmalı.

---

### 1.8 Async Data / Fetch Pattern

**Mevcut Durum:** README'de "async data" bahsediyor ama standart bir fetch/API katmanı yok.

**Yapılacak:**
```js
// createApi:
const api = createApi({
  baseUrl: '/api/v1',
  csrfToken: document.querySelector('meta[name="csrf-token"]')?.content,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  },
  credentials: 'same-origin', // CI4 session cookie
  onError: (err) => showToast(err.message, 'error'),
  onUnauthorized: () => router.push('/login')
});

// Component içinde:
async load() {
  this.state.loading = true;
  try {
    this.state.posts = await api.get('/posts');
  } finally {
    this.state.loading = false;
  }
}

// veya declarative (auto fetch):
static data = {
  posts: '/api/posts',  // mount'ta auto fetch
  user: '/api/me'
};
```

**Kabul Kriteri:** Her API isteğinde CSRF token otomatik header'a eklenmeli. 401 response'unda login sayfasına yönlendirme otomatik olmalı.

---

### 1.9 File Upload Component'leri

**Mevcut Durum:** Drag-drop, progress bar, preview yok.

**Yapılacak:**
```html
<dv-media-upload
  data-endpoint="/api/media/upload"
  data-accept="image/*,video/*"
  data-max-size="5242880"
  data-multiple="true">
</dv-media-upload>
```

**Özellikler:**
- Drag & drop zone
- Dosya tipi ve boyut validation (client-side)
- Upload progress bar
- Thumbnail preview (FileReader API)
- Chunked upload (büyük dosyalar için)
- Abort upload

---

### 1.10 i18n (Çoklu Dil)

**Mevcut Durum:** Çoklu dil desteği yok.

**Yapılacak:**
```js
const i18n = createI18n({
  locale: document.documentElement.lang || 'tr',
  fallbackLocale: 'en',
  messages: {
    tr: { save: 'Kaydet', delete: 'Sil', posts: 'Yazılar' },
    en: { save: 'Save', delete: 'Delete', posts: 'Posts' }
  }
});

// Component'te:
html`<button>${i18n.t('save')}</button>`

// Interpolation:
i18n.t('hello', { name: 'Ahmet' }) // "Merhaba Ahmet"

// Pluralization:
i18n.t('post_count', { count: 5 }) // "5 yazı"
```

**Kabul Kriteri:** Dil değiştiğinde tüm component'ler otomatik re-render olmalı.

---

### 1.11 CSS Integration — CKCSS ile Sıkı Bağ

**Mevcut Durum:** Component'ler kendi stillerini nasıl tanımlayacağını bilmiyor.

**Yapılacak:**
```js
// Optional: Component-level suggested styles
static styles = `
  .dv-counter { display: inline-flex; gap: 0.5rem; }
`;
// Bu CSS, component mount edildiğinde <style> olarak head'e eklenir.
// Light DOM'da çalıştığı için global ama component kaldırılınca CSS de kaldırılabilir.

// veya JS helper:
this.class('btn', 'btn-primary', 'shadow-md'); // CKCSS class helper
```

---

### 1.12 Developer Experience (DX)

**Yapılacak:**
- **Anlamlı hata mesajları:** Prop type hatası, undefined action, missing template gibi durumlarda `console.error` yerine stack trace'li hata.
- **DevTools integration:** Chrome DevTools'da `window.__DEVINIM_DEBUG__` ile component tree, store state, active subscriptions görünümü.
- **Hot reload (dev mode):** `DEV=true` iken component dosyası değişince auto remount.

---

## Bölüm 2: Backend API & Entegrasyon (CI4 + SQLite)

### 2.1 API Layer — Standart Fetch Wrapper

**Yapılacak:**
```js
// DevinimJS içinde createApi:
const api = createApi({
  baseUrl: '/api/v1',
  csrfToken: document.querySelector('meta[name="csrf-token"]')?.content,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  credentials: 'same-origin',
  onError: (err) => showToast(err.message, 'error'),
  onUnauthorized: () => window.location.href = '/login'
});
```

**CI4 Karşılığı:**
```php
// app/Controllers/Api/BaseApiController.php
namespace App\Controllers\Api;
use CodeIgniter\RESTful\ResourceController;

class BaseApiController extends ResourceController {
  protected $format = 'json';

  public function initController(\CodeIgniter\HTTP\RequestInterface $request, 
                                \CodeIgniter\HTTP\ResponseInterface $response, 
                                \Psr\Log\LoggerInterface $logger) {
    parent::initController($request, $response, $logger);

    // CSRF kontrolü (AJAX istekler için)
    if (!$this->request->isAJAX()) {
      return $this->failUnauthorized('AJAX only');
    }

    // Auth kontrolü
    if (!session()->get('user_id')) {
      return $this->failUnauthorized('Login required');
    }
  }
}
```

---

### 2.2 Auth & Session

**Karar:** Shield yerine basit session auth (shared hosting uyumluluğu için).

**CI4 Implementasyonu:**
```php
// app/Controllers/AuthController.php
public function login() {
  $rules = [
    'email' => 'required|valid_email',
    'password' => 'required|min_length[6]'
  ];

  if (!$this->validate($rules)) {
    return $this->failValidationErrors($this->validator->getErrors());
  }

  $user = $this->userModel->where('email', $this->request->getPost('email'))->first();

  if (!$user || !password_verify($this->request->getPost('password'), $user['password'])) {
    return $this->failUnauthorized('Invalid credentials');
  }

  session()->set(['user_id' => $user['id'], 'user_email' => $user['email']]);
  return $this->respond(['success' => true, 'user' => ['email' => $user['email']]]);
}

public function logout() {
  session()->destroy();
  return $this->respond(['success' => true]);
}
```

**DevinimJS tarafında:**
```js
// Login component:
actions: {
  async login(formData) {
    const result = await api.post('/auth/login', formData);
    store.set('user', result.user);
    router.push('/admin');
  }
}
```

---

### 2.3 Content Schema & Field Types (DB Modeli)

**SQLite Şeması:**
```sql
-- content_types: Blog Post, Sayfa, Ürün, vb.
CREATE TABLE content_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- fields: Her content type'ın dinamik alanları
CREATE TABLE fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  label TEXT,
  field_type TEXT NOT NULL CHECK(field_type IN ('text','textarea','rich_text','number','boolean','date','datetime','image','file','select','multi_select','relation')),
  config TEXT, -- JSON: {options: [...], required: true, default: ...}
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (type_id) REFERENCES content_types(id) ON DELETE CASCADE
);

-- contents: Asıl içerik kayıtları
CREATE TABLE contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  author_id INTEGER,
  data TEXT NOT NULL, -- JSON: {"summary": "...", "body": "...", "cover_image": "..."}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME,
  FOREIGN KEY (type_id) REFERENCES content_types(id) ON DELETE CASCADE
);

-- content_data: EAV modeli (opsiyonel, karmaşık sorgular için)
-- veya JSON1 extension ile contents.data üzerinden sorgula:
-- SELECT * FROM contents WHERE json_extract(data, '$.status') = 'published'
```

**CI4 Model:**
```php
// app/Models/ContentModel.php
class ContentModel extends Model {
  protected $table = 'contents';
  protected $primaryKey = 'id';
  protected $allowedFields = ['type_id', 'title', 'slug', 'status', 'author_id', 'data', 'published_at'];
  protected $returnType = 'array';

  // JSON decode/encode otomatik
  protected $casts = ['data' => 'json'];

  public function getBySlug($slug) {
    return $this->where('slug', $slug)->where('status', 'published')->first();
  }

  public function getByType($typeSlug, $limit = 10, $offset = 0) {
    return $this->select('contents.*')
                ->join('content_types', 'content_types.id = contents.type_id')
                ->where('content_types.slug', $typeSlug)
                ->where('contents.status', 'published')
                ->orderBy('contents.published_at', 'DESC')
                ->limit($limit, $offset)
                ->findAll();
  }
}
```

**Field Type Render'ları:**
```php
// app/Libraries/Fields/TextField.php
namespace App\Libraries\Fields;

class TextField extends BaseField {
  public function render($value, $config = []) {
    $required = ($config['required'] ?? false) ? 'required' : '';
    return '<input type="text" name="' . $this->name . '" value="' . esc($value) . '" ' . $required . ' class="input" />';
  }

  public function validate($value, $config = []) {
    $rules = [];
    if ($config['required'] ?? false) $rules[] = 'required';
    if ($config['minLength'] ?? false) $rules[] = 'min_length[' . $config['minLength'] . ']';
    if ($config['maxLength'] ?? false) $rules[] = 'max_length[' . $config['maxLength'] . ']';
    return $rules;
  }
}
```

---

### 2.4 Admin CRUD API'leri

**CI4 Routes:**
```php
// app/Config/Routes.php
$routes->group('api', ['namespace' => 'App\Controllers\Api', 'filter' => 'apiAuth'], function($routes) {
  $routes->resource('posts');
  $routes->resource('pages');
  $routes->resource('media');
  $routes->resource('users');
  $routes->resource('content-types');

  $routes->post('posts/(:num)/publish', 'PostController::publish/$1');
  $routes->post('posts/(:num)/duplicate', 'PostController::duplicate/$1');
  $routes->get('posts/search', 'PostController::search');
});
```

**DevinimJS Admin Component'leri:**
```html
<!-- Admin Post List -->
<dv-data-table
  data-endpoint="/api/posts"
  data-columns='[
    {"key": "title", "label": "Başlık", "sortable": true},
    {"key": "status", "label": "Durum", "badge": {"published": "success", "draft": "warning"}},
    {"key": "created_at", "label": "Tarih", "format": "date"}
  ]'
  data-sortable="true"
  data-searchable="true"
  data-page-size="20">
</dv-data-table>

<!-- Admin Post Editor -->
<dv-post-editor
  data-post-id="123"
  data-save-endpoint="/api/posts/123"
  data-content-type="post">
</dv-post-editor>
```

---

### 2.5 Plugin Mimarisi

**Dizin Yapısı:**
```
app/
  Plugins/
    Blog/
      Config/
        Routes.php
      Controllers/
        BlogController.php
      Models/
        PostModel.php
      Views/
        post.php
      plugin.json
    SEO/
      Config/
        Hooks.php
      Libraries/
        SeoLibrary.php
      plugin.json
writable/
  plugins/  -- upload edilen plugin'ler
```

**Plugin Loader:**
```php
// app/Libraries/PluginLoader.php
class PluginLoader {
  public static function boot() {
    $pluginDirs = glob(APPPATH . 'Plugins/*', GLOB_ONLYDIR);

    foreach ($pluginDirs as $dir) {
      $manifest = json_decode(file_get_contents($dir . '/plugin.json'), true);
      if (!($manifest['active'] ?? false)) continue;

      // Routes'u yükle
      $routesFile = $dir . '/Config/Routes.php';
      if (file_exists($routesFile)) require $routesFile;

      // Hooks'u register et
      $hooksFile = $dir . '/Config/Hooks.php';
      if (file_exists($hooksFile)) require $hooksFile;

      // Event listener'ları bağla
      if (!empty($manifest['events'])) {
        foreach ($manifest['events'] as $event => $handler) {
          Hook::on($event, $handler);
        }
      }
    }
  }
}
```

**Hook Sistemi:**
```php
// app/Libraries/Hook.php
class Hook {
  private static $hooks = [];

  public static function on($event, callable $callback) {
    self::$hooks[$event][] = $callback;
  }

  public static function trigger($event, $data = null) {
    if (!isset(self::$hooks[$event])) return $data;
    foreach (self::$hooks[$event] as $callback) {
      $data = $callback($data);
    }
    return $data;
  }
}

// Kullanım:
Hook::on('content.before_save', function($content) {
  $content['slug'] = url_title($content['title'], '-', true);
  return $content;
});
```

**Sandbox:**
- Plugin'ler kendi namespace'inde çalışır (`Plugin\Blog\...`)
- `eval()` yasak
- File system access'i kendi dizini ile sınırlı
- Database access'i sadece kendi migration'ları ile

---

### 2.6 Media Upload & Asset Pipeline

**CI4 Controller:**
```php
// app/Controllers/Api/MediaController.php
class MediaController extends BaseApiController {
  public function upload() {
    $file = $this->request->getFile('image');

    if (!$file->isValid()) {
      return $this->failValidationErrors(['image' => 'Geçersiz dosya']);
    }

    $rules = [
      'image' => 'uploaded[image]|max_size[image,5120]|ext_in[image,png,jpg,jpeg,gif,webp]'
    ];

    if (!$this->validate($rules)) {
      return $this->failValidationErrors($this->validator->getErrors());
    }

    $newName = $file->getRandomName();
    $file->move(WRITEPATH . 'uploads', $newName);

    // Thumbnail (GD)
    $image = \Config\Services::image();
    $image->withFile(WRITEPATH . 'uploads/' . $newName)
          ->fit(300, 300, 'center')
          ->save(WRITEPATH . 'uploads/thumbs/' . $newName);

    // DB'ye kaydet
    $mediaId = $this->mediaModel->insert([
      'filename' => $newName,
      'original_name' => $file->getClientName(),
      'mime' => $file->getMimeType(),
      'size' => $file->getSize(),
      'path' => '/uploads/' . $newName,
      'thumb_path' => '/uploads/thumbs/' . $newName
    ]);

    return $this->respond([
      'id' => $mediaId,
      'url' => base_url('/uploads/' . $newName),
      'thumb_url' => base_url('/uploads/thumbs/' . $newName)
    ]);
  }
}
```

**DevinimJS Component:**
```html
<dv-media-upload
  data-endpoint="/api/media/upload"
  data-accept="image/*"
  data-max-size="5242880"
  data-multiple="true">
</dv-media-upload>
```

---

### 2.7 SQLite Production Considerations

**Config:**
```php
// app/Config/Database.php
public array $default = [
    'DSN'      => '',
    'hostname' => '',
    'username' => '',
    'password' => '',
    'database' => WRITEPATH . 'database.sqlite',
    'DBDriver' => 'SQLite3',
    'DBPrefix' => '',
    'DBDebug'  => true,
    'charset'  => 'utf8',
    'DBCollat' => 'utf8_general_ci',
    'swapPre'  => '',
    'encrypt'  => false,
    'compress' => false,
    'strictOn' => false,
    'failover' => [],
];
```

**WAL Mode (Performans):**
```php
// app/Config/Boot/production.php veya bir migration'da:
$db = \Config\Database::connect();
$db->query('PRAGMA journal_mode = WAL;');
$db->query('PRAGMA synchronous = NORMAL;');
```

**Backup Command:**
```php
// app/Commands/DbBackup.php
namespace App\Commands;
use CodeIgniter\CLI\BaseCommand;

class DbBackup extends BaseCommand {
  protected $group = 'Database';
  protected $name = 'db:backup';
  protected $description = 'SQLite database backup';

  public function run(array $params) {
    $source = WRITEPATH . 'database.sqlite';
    $dest = WRITEPATH . 'backups/database_' . date('Y-m-d_H-i-s') . '.sqlite';

    if (!is_dir(WRITEPATH . 'backups')) mkdir(WRITEPATH . 'backups', 0755, true);

    copy($source, $dest);
    $this->cli->write("Backup created: $dest", 'green');
  }
}
```

**Dosya İzinleri (Shared Hosting):**
```bash
chmod 775 writable/
chmod 664 writable/database.sqlite
chmod 775 writable/uploads/
chmod 775 writable/backups/
```

---

### 2.8 Routing — CI4 + DevinimJS Birlikte

**Karar:**
- **Public site:** CI4 routing (SEO). `example.com/blog/hello-world`
- **Admin panel:** DevinimJS hash router. `example.com/admin/#/posts`

**CI4 Admin Controller:**
```php
// app/Controllers/AdminController.php
class AdminController extends BaseController {
  public function index() {
    // Auth kontrolü
    if (!session()->get('user_id')) {
      return redirect()->to('/login');
    }

    // Sadece shell döndür, gerisi DevinimJS'te
    return view('admin/shell', [
      'csrf_token' => csrf_hash(),
      'user' => session()->get('user_email')
    ]);
  }
}
```

**Admin Shell View (`app/Views/admin/shell.php`):**
```php
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="csrf-token" content="<?= $csrf_token ?>">
  <title>Admin Panel</title>
  <link rel="stylesheet" href="/assets/ckcss/ckcss.css">
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { router } from '/assets/devinim/router.js';
    import { createApi } from '/assets/devinim/api.js';

    const api = createApi({
      baseUrl: '/api',
      csrfToken: document.querySelector('meta[name="csrf-token"]').content,
      credentials: 'same-origin'
    });

    router.mount('#app', {
      '/': DashboardPage,
      '/posts': PostListPage,
      '/posts/new': PostEditorPage,
      '/posts/:id': PostEditorPage,
      '/media': MediaLibraryPage,
      '/settings': SettingsPage
    });
  </script>
</body>
</html>
```

---

### 2.9 Tema / View Engine Entegrasyonu

**Dizin Yapısı:**
```
app/Views/
  themes/
    default/
      layouts/
        main.php          ← <html>, <head>, CI4 view cell'leri
      partials/
        header.php
        footer.php
        sidebar.php
      templates/
        post.php          ← <article> + dv-* component mount point'leri
        page.php
        archive.php
      assets/
        css/
        js/
```

**CI4 Controller:**
```php
public function show($slug) {
  $post = $this->contentModel->getBySlug($slug);
  if (!$post) throw new \CodeIgniter\Exceptions\PageNotFoundException();

  return view('themes/default/templates/post', [
    'post' => $post,
    'theme' => 'default',
    'meta' => [
      'title' => $post['title'],
      'description' => json_decode($post['data'], true)['summary'] ?? ''
    ]
  ]);
}
```

**Post Template (`post.php`):**
```php
<?= $this->extend('themes/default/layouts/main') ?>

<?= $this->section('content') ?>
<article class="container py-12" data-post-id="<?= $post['id'] ?>">
  <header class="mb-8">
    <h1 class="text-4xl font-bold tracking-tight mb-4"><?= esc($post['title']) ?></h1>
    <time class="text-muted"><?= date('d F Y', strtotime($post['published_at'])) ?></time>
  </header>

  <div class="content leading-relaxed">
    <?= json_decode($post['data'], true)['body'] ?? '' ?>
  </div>

  <!-- Interaktif alanlar DevinimJS ile -->
  <dv-like-button 
    data-post-id="<?= $post['id'] ?>" 
    data-count="<?= $post['likes'] ?? 0 ?>">
  </dv-like-button>
</article>

<script type="module">
  import { define } from '/assets/devinim/core.js';
  import { LikeButton } from '/assets/devinim/components/like-button.js';
  define('dv-like-button', LikeButton);
</script>
<?= $this->endSection() ?>
```

---

### 2.10 Security — XSS, CSRF, SQL Injection

| Tehdit | CI4 Çözümü | DevinimJS Çözümü |
|---|---|---|
| **SQL Injection** | Query Builder / Model kullan. Raw query yazma. | — |
| **XSS (output)** | `esc()` helper ile escape. | `html` template tag'inde auto-escape. `{{raw}}` syntax ile explicit raw. |
| **CSRF** | CI4 Security class, form hidden field + meta tag. | `createApi` otomatik header'a ekler. |
| **File Upload** | MIME type + extension validation. | Client-side preview, server-side validation. |
| **Auth Bypass** | Session middleware + filter. | Route guard (`beforeEnter` hook). |
| **Rate Limiting** | CI4 Throttler (opsiyonel). | — |

**CI4 API Auth Filter:**
```php
// app/Filters/ApiAuthFilter.php
class ApiAuthFilter implements FilterInterface {
  public function before(RequestInterface $request, $arguments = null) {
    if (!session()->get('user_id')) {
      return Services::response()
        ->setStatusCode(401)
        ->setJSON(['error' => 'Unauthorized', 'login_url' => '/login']);
    }
  }

  public function after(RequestInterface $request, ResponseInterface $response, $arguments = null) {
    return $response;
  }
}
```

---

## Bölüm 3: Öncelik Sıralaması (Roadmap)

### Faz 1: Temel Altyapı (P0) — CMS'siz çalışamaz

| # | Özellik | Açıklama | Tahmini Süre |
|---|---|---|---|
| 1.1 | **Gerçek Morph Render** | Text/attribute diff, keyed children, focus preservation | 2-3 hafta |
| 1.2 | **Lifecycle Cleanup** | `disconnectedCallback`, `autoCleanup`, abort controller | 3-5 gün |
| 1.3 | **Store + Selectors** | Proxy-based shared state, `connect()`, `persist()` | 1 hafta |
| 1.4 | **API Layer (`createApi`)** | CSRF, credentials, error handling, base URL | 3-5 gün |
| 2.1 | **CI4 Base API Controller** | Auth, CSRF, AJAX kontrolü, JSON response | 3-5 gün |
| 2.2 | **CI4 Session Auth** | Login/logout, middleware, session management | 1 hafta |
| 2.3 | **SQLite Schema + Content Model** | content_types, fields, contents tabloları | 1 hafta |

### Faz 2: Admin Panel (P1) — CMS olmazsa olmaz

| # | Özellik | Açıklama | Tahmini Süre |
|---|---|---|---|
| 1.5 | **Authoring API Güvenilirliği** | Props validation, sync, actions, `this` binding | 1 hafta |
| 1.6 | **Form Validation** | `dv-validate`, `dv-error`, client + server sync | 1 hafta |
| 1.7 | **Data Table Component** | Sort, search, paginate, CRUD actions | 1-2 hafta |
| 1.8 | **Post Editor Component** | Dynamic fields, rich text, media embed | 2-3 hafta |
| 2.4 | **Admin CRUD API'leri** | Resource controller'lar, search, pagination | 1-2 hafta |
| 2.5 | **Field Type Library** | Text, textarea, image, select, relation render'ları | 1-2 hafta |
| 2.6 | **Media Upload API** | CI4 file upload, thumbnail, DB kayıt | 3-5 gün |
| 1.9 | **Media Upload Component** | Drag-drop, progress, preview, chunked | 1 hafta |

### Faz 3: Genişletilebilirlik (P2) — CMS olgunlaşması

| # | Özellik | Açıklama | Tahmini Süre |
|---|---|---|---|
| 2.7 | **Plugin Mimarisi** | Namespace isolation, Hook, manifest, loader | 2-3 hafta |
| 1.10 | **Router** | Hash routing, params, guards, lazy loading | 1 hafta |
| 2.8 | **Tema Sistemi** | CI4 View engine, theme config, asset pipeline | 1-2 hafta |
| 1.11 | **i18n** | `createI18n`, interpolation, pluralization | 3-5 gün |
| 2.9 | **SQLite WAL + Backup** | Production config, CLI backup command | 2-3 gün |
| 1.12 | **CSS Integration** | Component-level styles, CKCSS helper | 3-5 gün |

### Faz 4: DX & Polish (P3) — Geliştirici deneyimi

| # | Özellik | Açıklama | Tahmini Süre |
|---|---|---|---|
| 1.13 | **Error Messages** | Anlamlı stack trace'li hatalar | 3-5 gün |
| 1.14 | **DevTools Integration** | `window.__DEVINIM_DEBUG__`, component tree | 1 hafta |
| 1.15 | **Hot Reload** | Dev mode auto remount | 3-5 gün |
| 2.10 | **Rate Limiting** | CI4 Throttler entegrasyonu | 2-3 gün |
| 2.11 | **Cache Layer** | CI4 Cache, query cache, view cache | 1 hafta |

---

## Bölüm 4: Mimari Kararlar (ADR'lar)

### ADR-001: Light DOM vs. Shadow DOM
**Karar:** Light DOM. Sebep: CKCSS global utility class'ları doğrudan uygulanabilir. Shadow DOM CSS isolation getirir ama zero-build felsefesiyle çatışır.

### ADR-002: Hash Router vs. History API
**Karar:** Admin panelde hash router (`/#/path`). Sebep: Shared hosting'de `.htaccess` rewrite kuralları ile uğraşmamak. Public site CI4 routing ile server-side.

### ADR-003: SQLite vs. MySQL
**Karar:** SQLite default, MySQL opsiyonel. Sebep: Shared hosting'de tek dosya, zero-config. MySQL desteği sonradan eklenebilir.

### ADR-004: Shield vs. Custom Auth
**Karar:** Custom session auth. Sebep: Shield shared hosting'de ağır gelebilir. Basit session yeterli.

### ADR-005: JSON Field vs. EAV
**Karar:** JSON field (contents.data) + fields metadata. Sebep: SQLite JSON1 extension yeterli. EAV karmaşık sorgulara yol açar.

### ADR-006: Plugin Sandbox
**Karar:** Namespace isolation + Hook sistemi. Gerçek process isolation (WordPress'in sorunu) shared hosting'de mümkün değil. "Yeterince güvenli" yaklaşımı.

---

## Bölüm 5: Teknoloji Stack Özeti

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND                                                   │
│  ─────────────────────────────────────────────────────────  │
│  DevinimJS (zero-build ES modules)                        │
│  ├── Proxy-based reactive state                             │
│  ├── Morph render (ADR-0001)                                │
│  ├── Custom Elements v1 (Light DOM)                         │
│  ├── html tagged template literals                          │
│  ├── Store + Router + i18n                                  │
│  └── Form validation + File upload                          │
│                                                             │
│  CKCSS (zero-build utility-first CSS)                       │
│  ├── CSS custom properties (design tokens)                  │
│  ├── Semantic utility classes                             │
│  └── No build step, no preprocessor                       │
│                                                             │
│  BACKEND                                                    │
│  ─────────────────────────────────────────────────────────  │
│  CodeIgniter 4 (PHP 8.2+)                                   │
│  ├── RESTful Resource Controllers                           │
│  ├── Session-based Auth                                   │
│  ├── Query Builder (SQL injection safe)                   │
│  ├── Migration system                                       │
│  └── CLI Commands (backup, seed, etc.)                    │
│                                                             │
│  SQLite 3 (JSON1 extension)                                 │
│  ├── WAL mode (concurrency)                                 │
│  ├── Single file (zero config)                            │
│  └── JSON field support                                   │
│                                                             │
│  DEPLOYMENT                                                 │
│  ─────────────────────────────────────────────────────────  │
│  Shared Hosting (cPanel, FTP, rsync)                        │
│  ├── No Node.js required                                  │
│  ├── No build pipeline                                    │
│  └── Single command: `rsync -avz ./ user@host:public_html/`│
└─────────────────────────────────────────────────────────────┘
```

---

## Bölüm 6: Başlangıç Checklist'i

### CI4 Kurulumu
- [ ] `composer create-project codeigniter4/appstarter cms`
- [ ] `php spark db:create` → SQLite config
- [ ] `php spark migrate` → content_types, fields, contents
- [ ] `php spark db:seed ContentTypeSeeder`
- [ ] Session config (`app/Config/Session.php`)
- [ ] CSRF config (`app/Config/Security.php`)
- [ ] Routes config (`app/Config/Routes.php`)

### DevinimJS Kurulumu
- [ ] `assets/devinim/` dizini oluştur
- [ ] `core.js` (BaseComponent, html, define)
- [ ] `store.js` (createStore)
- [ ] `api.js` (createApi)
- [ ] `router.js` (createRouter)
- [ ] `i18n.js` (createI18n)
- [ ] `components/` (counter, accordion, tabs, modal, toast, form, table, upload)

### Admin Panel Shell
- [ ] `AdminController::index()`
- [ ] `app/Views/admin/shell.php`
- [ ] Hash router mount
- [ ] Auth guard

### İlk Content Type
- [ ] "Blog Post" content type oluştur
- [ ] Fields: title, slug, summary, body, cover_image, status
- [ ] Admin CRUD: list, create, edit, delete
- [ ] Public template: post.php

---

> **Son Not:** Bu yol haritası, DevinimJS'in "build-free" felsefesini koruyarak, CI4 + SQLite ile production-ready bir CMS inşa etmek için gereken tüm eksikleri ve geliştirme adımlarını kapsar. Öncelik sıralaması, teknik borçları önce çözme (morph render, cleanup, API layer) ve sonra özellik eklemeye (admin panel, plugin sistemi) odaklanma prensibine göre düzenlenmiştir.
