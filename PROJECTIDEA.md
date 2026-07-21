Sen uzman bir Yazılım Mimarı ve Frontend Geliştiricisisin.

Görevim: Herhangi bir derleme (build) sürecine (Node.js, Webpack, npm, Vite vb.) ihtiyaç duymayan, doğrudan tarayıcıda ES Modules olarak çalışabilen, ultra hafif ve performanslı bir Vanilla JS komponent kütüphanesi inşa etmek.

Bu kütüphane; CodeIgniter,, WordPress, Laravel, native PHP, SQLite gibi teknolojilerle geliştirilen ve paylaşımlı (shared) hosting ortamlarında barındırılan projelerde frontend performansını ve freelance geliştirme hızını maksimize etmek için kullanılacaktır.

Aşağıdaki mimari kısıtlamalara ve temel gereksinimlere harfiyen uymalısın her şeyden önce temel limitin bu repo https://github.com/kayacuneyd/kayaengineeringos sonra:

1. Sıfır Build Süreci: Kütüphane sadece `<script type="module">` etiketi ile HTML'e dahil edilip anında çalıştırılabilir olmalıdır.
2. Reaktivite (Svelte Yaklaşımı): JavaScript "Proxy" objesi ve "Custom Elements API" kullanılarak, state (durum) değiştiğinde DOM'un ilgili kısmını otomatik güncelleyen bir temel sınıf (BaseComponent) yazılmalıdır.
3. Light DOM Zorunluluğu: Projelerde kendi özel CSS framework'ümü kullanacağım. Bu nedenle Shadow DOM kesinlikle kullanılmayacaktır. Komponentler genel CSS dosyalarındaki stilleri doğrudan miras almalıdır.
4. PHP/Backend Uyumu: Komponentler, PHP tarafından HTML içine basılan `data-*` niteliklerini (attributes) okuyarak kendi başlangıç state'lerini (initial state) kolayca kurabilmelidir.
5. Yüksek Performans ve Minimalizm: Kütüphane gereksiz soyutlamalardan uzak, dosya boyutu çok küçük ve tarayıcıyı yormayacak şekilde tasarlanmalıdır.
6. Yapay Zeka (AI Agent) Uyumu: Otonom yapay zeka ajanlarıyla (multi-agent sistemler) geliştirme yaparken ajanların kodu kolayca okuyup yeni komponentler üretebilmesi için; kod mimarisi son derece öngörülebilir olmalı, standart isimlendirme kuralları (naming conventions) kullanılmalı ve kritik noktalara JSDoc açıklamaları eklenmelidir.

Çıktı Beklentisi:
Lütfen bana bu framework'ün çekirdek yapısını (core.js) ve bu yapıyı kullanan, PHP'den veri alabilen örnek bir interaktif web komponentinin kodlarını eksiksiz olarak yaz.
