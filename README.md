# PSO Serbest Vuruş Simülatörü

Pro Soccer Online (PSO) hissiyatından ilham alan, tarayıcı tabanlı 3D serbest vuruş antreman sahası. WASD ile topun etrafında konumlan, sol tıklayarak gücü doldur, fareyi sürükleyerek yüksekliği ve falsoyu ayarla. Ağır ve tok top fiziği, Magnus etkisi, hava sürtünmesi ve kaleci reaksiyonlarıyla zorlu bir frikik deneyimi sunar.

## 🎮 Özellikler

- Üçüncü şahıs kamera ve serbest dolaşım hareket sistemi (WASD + Shift sprint)
- 3 aşamalı hassas şut mekaniği:
  - Sol tuşla güç barını zorlayıcı hızda doldur
  - Aynı anda fareyi dikey hareket ettirerek yükseklik bandını belirle
  - Şut çıkarken kısa falso penceresinde sola/sağa flick ile spin ekle
- Magnus etkili top eğrisi, hava direnci, zıplama ve yer sürtünmesi
- Kaleci animasyonu + refleks kurtarışları, direk ve auta giden şut sonuçları
- Gerçekçi ölçülerde saha, kale ve atmosferik ışıklandırma
- Minimal ama yoğun HUD: güç/yükseklik/falso göstergeleri, skor tablosu, kontrol ipuçları

## 🚀 Kurulum

```bash
npm install
npm run dev
```

Tarayıcıdan `http://localhost:3000` adresine giderek oyunu oyna.

## 🧰 Teknolojiler

- Next.js 14 (App Router, SSR kapalı dinamik Canvas)
- React & TypeScript
- @react-three/fiber ve @react-three/drei ile WebGL sahne yönetimi
- Three.js fizik hesaplamaları ve özel integrasyon
- Zustand ile HUD durum yönetimi
- Tailwind CSS ile arayüz

## 📦 Komutlar

- `npm run dev` – Geliştirme sunucusu
- `npm run build` – Üretim derlemesi
- `npm start` – Üretim sunucusu
- `npm run lint` – ESLint doğrulaması

## 📐 Oynanış İpuçları

- Güç barı hızlı dolduğundan bırakma zamanlaması kritik.
- Yüksekliği belirlemek için fareyi dikey eksende agresifçe hareket ettir.
- Falso için topu vurduktan hemen sonra keskin yatay flick yap; pencere yalnızca ~180ms.
- Kaleci hamlesini okumak için gövde hareketine dikkat et; son anda yön değiştir.

Keyifli frikikler! 💥⚽
