<?php
/**
 * Standalone admin login page (roadmap 2.2).
 *
 * Posts JSON to /auth/login via fetch — including the X-CSRF-TOKEN header
 * read from the meta tag below — and redirects to /admin on success.
 * Server-side validation errors land in the #login-error box.
 *
 * Styling: drop CKCSS into public/assets/ckcss/ and uncomment the link
 * for the full token-driven look; the small <style> block is a neutral
 * fallback so the page is usable on a bare install.
 *
 * @var string $csrfToken Session-bound CSRF token (csrf_hash()).
 */
?>
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="<?= esc($csrfToken) ?>">
  <title>Giriş — DevinimJS CMS</title>
  <!-- <link rel="stylesheet" href="/assets/ckcss/ckcss.css"> -->
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
    main { width: min(22rem, 92vw); background: #fff; border: 1px solid #e4e4e7; border-radius: .75rem; padding: 2rem; }
    h1 { margin: 0 0 1.5rem; font-size: 1.375rem; }
    label { display: block; font-size: .875rem; font-weight: 600; margin: 1rem 0 .25rem; }
    input { box-sizing: border-box; width: 100%; padding: .625rem .75rem; border: 1px solid #d4d4d8; border-radius: .5rem; font: inherit; }
    button { margin-top: 1.25rem; width: 100%; padding: .625rem; border: 0; border-radius: .5rem; background: #18181b; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: .6; cursor: progress; }
    #login-error { margin: 1rem 0 0; padding: .625rem .75rem; border-radius: .5rem; background: #fef2f2; color: #b91c1c; font-size: .875rem; }
    [hidden] { display: none; }
  </style>
</head>
<body>
  <main>
    <h1>Yönetim Girişi</h1>

    <form id="login-form" novalidate>
      <label for="email">E-posta</label>
      <input type="email" id="email" name="email" autocomplete="username" required autofocus>

      <label for="password">Parola</label>
      <input type="password" id="password" name="password" autocomplete="current-password" required>

      <button type="submit" id="login-button">Giriş Yap</button>
    </form>

    <p id="login-error" role="alert" hidden></p>
  </main>

  <script type="module">
    const form = document.getElementById('login-form');
    const button = document.getElementById('login-button');
    const errorBox = document.getElementById('login-error');
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    function showError(message) {
      errorBox.textContent = message;
      errorBox.hidden = false;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorBox.hidden = true;
      button.disabled = true;

      try {
        const response = await fetch('<?= base_url('auth/login') ?>', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
          },
          body: JSON.stringify({
            email: form.email.value.trim(),
            password: form.password.value,
          }),
        });

        const body = await response.json().catch(() => null);

        if (response.ok && body?.success) {
          window.location.href = '<?= base_url('admin') ?>';
          return;
        }

        // Tolerate CI4-version envelope differences:
        // { errors: {...} } / { messages: {...} } / { error: string } / { error: { message } }.
        const fieldMap = body?.errors ?? body?.messages;
        const firstFieldError = fieldMap && typeof fieldMap === 'object' ? Object.values(fieldMap)[0] : null;
        const flatError = typeof body?.error === 'string' ? body.error : body?.error?.message;
        showError(firstFieldError ?? body?.message ?? flatError ?? 'Giriş başarısız. Bilgileri kontrol edin.');
      } catch {
        showError('Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.');
      } finally {
        button.disabled = false;
      }
    });
  </script>
</body>
</html>
