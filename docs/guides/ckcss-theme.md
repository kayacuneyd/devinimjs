# CKCSS component theme

DevinimJS components expose semantics and behavior. The optional CKCSS adapter supplies their
visual treatment without making CKCSS a runtime dependency.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kayacuneyd/ckcss@v0.1.0-beta.1/dist/ckcss.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kayacuneyd/devinimjs@v0.5.0/dist/devinim-ckcss.css">
```

Load CKCSS first, then the adapter. The adapter uses CKCSS public color and focus tokens only;
omit the second stylesheet to use your own design system. Components remain Light DOM, so an
application may override individual selectors such as `.dv-cart`, `.dv-field input` or
`.dv-toast-stack` in its own stylesheet.
