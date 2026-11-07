# Taxt və Qılınc

Azərbaycan dilində hazırlanmış, mobil brauzer üçün orta əsr strategiya oyunu prototipi.

## Oyunu aç
- [Əsas menyu və oyun bölmələri](https://8h9z5mcg7v-eng.github.io/taxt-ve-qilinc/)
- [Qala-şəhər](https://8h9z5mcg7v-eng.github.io/taxt-ve-qilinc/city.html)
- [Dünya xəritəsi](https://8h9z5mcg7v-eng.github.io/taxt-ve-qilinc/world-map.html)
- [Taktiki döyüş](https://8h9z5mcg7v-eng.github.io/taxt-ve-qilinc/battle.html)
- [Sərhəd qalaları](https://8h9z5mcg7v-eng.github.io/taxt-ve-qilinc/frontier.html?kingdom=north)
- [3D model yoxlayıcısı](https://8h9z5mcg7v-eng.github.io/taxt-ve-qilinc/viewer.html)

## Hazırkı prototip sistemləri
- Three.js əsasında fırladıla və yaxınlaşdırıla bilən qala-şəhər və sərhəd qalası səhnələri.
- Bina və qala divarlarının səviyyə yüksəlişi, resurs xərcləri və şəhər yaddaşı.
- Piyada, nizəçi, oxçu, süvari və cəngavər qoşunları; hazırlıq və ordu idarəetməsi.
- İstiqamət, taktika, ərazi üstünlükləri, mühasirə qurğuları, divar zədəsi və döyüş itkiləri.
- Sərkərdələr, ixtisas bonusları və döyüşdən qazanılan təcrübə.
- Dünya xəritəsində yürüş, geri dönüş, sərhəd kampaniyaları, fəth edilmiş məntəqələr, qarnizon, karvan və bazar mexanikaları.
- Döyüş hesabatı və son döyüşlərin tarixçəsi.
- GLB aktivlərini texniki qiymətləndirmək üçün ayrıca model yoxlayıcısı.

## Məlumatların saxlanması və məhdudiyyətlər
Bu mərhələdə oyun məlumatlarının əksəriyyəti brauzerin `localStorage` yaddaşında saxlanılır. Buna görə irəliləyiş eyni brauzer və cihazda qalır; başqa cihazla sinxronizasiya, server hesabları, real multiplayer və server tərəfindən təsdiqlənən iqtisadiyyat hələ qurulmayıb. Brauzer məlumatlarını təmizləmək oyun irəliləyişini silə bilər.

3D şəhər və döyüş səhnələri hazırda prototip qrafikadır. Onlar yekun yüksək keyfiyyətli, ayrıca lisenziyası təsdiqlənmiş 3D aktivlər kimi təqdim edilmir. GLB yoxlayıcısında yoxlanmış model avtomatik olaraq oyuna daxil edilmir.

## Yoxlama
Hər GitHub Pages yayımlanmasından əvvəl:
- `npm test` — döyüş mexanikası üçün avtomatik testlər.
- `npm run check` — `src/*.js` fayllarının JavaScript sintaksis yoxlaması.

Əlavə texniki qeydlər:
- [Döyüş qaydaları](docs/BATTLE_RULES.md)
- [Şəhər yerləşim planı](docs/CITY_LAYOUT.md)
- [Mobil aktiv qəbul meyarları](docs/MOBILE_ASSET_ACCEPTANCE.md)
- [Vizual istiqamət](docs/ART_DIRECTION.md)

## İnkişaf prinsipləri
- Layihə Krallıqlar Dövrü və UstaTap-dan ayrıdır.
- Oyun mexanikaları orijinal qurulur; başqa oyunun kodu və aktivləri köçürülmür.
- Pulsuz aktivlərin lisenziyası yoxlanmadan kommersiya istifadəsi fərz edilmir.
- Mobil performans real cihazda yoxlanmadan model "mobilə hazır" sayılmır.
