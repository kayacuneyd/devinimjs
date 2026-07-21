<?php
/**
 * DevinimJS example: <dv-counter> fed by PHP (the PROJECTIDEA deliverable).
 *
 * Run:  php -S localhost:8000 examples/counter.php
 * The component reads its initial state from the data-* attributes below — no JavaScript
 * build step, no API endpoint, no hydration payload. The HTML *is* the API.
 */

// In a real app these come from your database / session / request:
$start = 42;
$step  = 5;
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DevinimJS — PHP-fed counter</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kayacuneyd/ckcss@v0.1.0-beta.1/dist/ckcss.min.css">
  <style>
    body { max-width: 40rem; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    dv-counter { display: inline-flex; align-items: center; gap: .5rem; }
    dv-counter output { min-width: 3ch; text-align: center; font-size: 1.25rem; }
    code { background: #f4f4f4; padding: .1em .3em; }
  </style>
</head>
<body>
  <h1>PHP &rarr; &lt;dv-counter&gt;</h1>
  <p>This counter's initial state was printed by PHP:
     <code>data-start="<?= (int)$start ?>"</code>, <code>data-step="<?= (int)$step ?>"</code>.</p>

  <!-- The complete PHP integration contract: print the element with data-* attributes. -->
  <dv-counter data-start="<?= (int)$start ?>" data-step="<?= (int)$step ?>"></dv-counter>

  <!-- Adjust the path to wherever you uploaded DevinimJS on your shared host. -->
  <script type="module" src="../src/components/dv-counter.js"></script>

  <noscript>
    <p><em>This interactive widget needs JavaScript. The value above is
    <?= (int)$start ?> (see ADR-0001 for the deliberate no-JS scope decision).</em></p>
  </noscript>
</body>
</html>
