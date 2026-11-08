# 3D aktiv reyestri

Bu fayla yalnız mənbəsi və lisenziyası yoxlanmış aktivlər əlavə edilir. “Namizəd” statusu aktivin oyuna idxal edildiyini və ya iPhone-da sınaqdan keçdiyini bildirmir.

## Əsas qala

| Aktiv | Mənbə | Lisenziya | Status | İstifadə / risk |
|---|---|---|---|---|
| Castle with Keep (GLB, 17.1 MB) | https://www.innerscene.com/tools/library/3d-parts/castle-with-keep-1a75a9e1 | CC0 | Əsas qala üçün birinci namizəd | 49.3 × 49.7 × 29.1 m; dörd dairəvi künc qülləsi, daxili keep, öz əkiz qülləli darvazası, divarlar və böyük zal. GLB materiallıdır. Poliqon sayı, tekstura ölçüləri və mobil FPS hələ yoxlanmayıb. Bu model artıq divar və darvaza ehtiva edir; eyni hissələr ayrıca model ilə təkrarlanmamalıdır. |
| Medieval Gatehouse (GLB, 11.6 MB) | https://www.innerscene.com/tools/library/3d-parts/medieval-gatehouse-8fd67334 | CC0 | Alternativ giriş modeli | 36.6 × 10.8 × 17.5 m; ayrıca iki qülləli giriş. Əsas qala modelinin darvazasını əvəz etmək üçün alternativdir, üstünə əlavə edilməməlidir. |

## Şəhər binaları və ətraf mühit

| Aktiv | Mənbə | Lisenziya | Status | İstifadə / risk |
|---|---|---|---|---|
| Medieval Village (26 GLB model, ZIP 1.4 MB) | https://shuriken.studio/kits/medieval-village | Free Model License, 2026-10-25 | Şəhər prop və bina namizədi | Meyxana, yel dəyirmanı, saman damlı ev, katapult, su mişarxanası, tövlə, dəmirçi, oxçuluq meydançası, fəvvarə, bazar köşkləri, modul divar, ibadətgah və dekorlar. Modellər təxminən 2.1k–8.7k tris aralığındadır. Üslub stilizə olunub; final realizm səviyyəsi kimi təsdiqlənməyib. |
| Medieval Castle Construction (149 GLB, 2.4 MB, 47,140 tris cəmi) | https://3dassets.dev/packs/medieval-castle-construction | CC0 1.0 | Modul istehkam prototipi | Divar, keçid, qala hissələri və həyət avadanlığı. Kiçik həndəsəli və AI ilə yaradılmışdır; final qala üçün deyil, modul ölçü/yerləşmə sınağı üçündür. |
| Kenney Castle Kit | https://kenney.nl/assets/castle-kit | CC0 | Stilizə edilmiş ehtiyat dəst | GLB/FBX/OBJ və teksturalar; stilizə olunmuş vizual dili səbəbilə final realizm üçün uyğunluğu təsdiqlənməyib. |

## Oyuna qoşulan xarici GLB mənbələri

Aşağıdakı modellər `src/city.js` daxilində GLTFLoader ilə uzaq URL-dən çağırılır. Bunlar repozitoriyaya hələ kopyalanmayıb; brauzerdə faktiki yüklənmə və vizual uyğunluq ayrıca yoxlanmalıdır.

| Model | Mənbə | Lisenziya / texniki məlumat | Hazırkı vəziyyət |
|---|---|---|---|
| Medieval Horse Stable | https://shuriken.studio/models/buildings/medieval-horse-stable | Free Model License; GLB, 0.4 MB, 7,748 tris | Tövlə maketi yüklənəndə gizlədilir; uzaqdan yükləmə kodu qoşulub |
| Blacksmith Workshop | https://shuriken.studio/models/buildings/blacksmith-workshop | Free Model License; GLB, 0.4 MB, 7,640 tris | Dəmirçi maketi yüklənəndə gizlədilir; uzaqdan yükləmə kodu qoşulub |
| Thatched Storybook Cottage | https://shuriken.studio/models/buildings/thatched-storybook-cottage | Free Model License; GLB, 0.5 MB, 5,610 tris | Kənd evi kimi əlavə edilir; uzaqdan yükləmə kodu qoşulub |
| Half-Timbered Tavern | https://shuriken.studio/models/buildings/half-timbered-tavern | Free Model License; GLB, 0.5 MB, 8,716 tris | Meyxana kimi əlavə edilir; uzaqdan yükləmə kodu qoşulub |
| Castle Gatehouse | https://shuriken.studio/models/buildings/castle-gatehouse | Free Model License; GLB, 0.4 MB, 6,190 tris | Darvaza maketi yüklənəndə gizlədilir; uzaqdan yükləmə kodu qoşulub |
| Archery Range Set | https://shuriken.studio/models/props/archery-range-set | Free Model License; GLB, 0.5 MB, 7,544 tris | Ox hədəfləri və maket meydança uğurlu yüklənmədə gizlədilir; uzaqdan yükləmə kodu qoşulub |
| Medieval Stone Windmill | https://shuriken.studio/models/buildings/medieval-stone-windmill | Free Model License; GLB, 0.3 MB, 4,638 tris | Əkin sahələrinin kənarında ayrıca istehsal binası kimi çağırılır |
| Knights Tent Camp | https://shuriken.studio/models/props/knights-tent-camp | Free Model License; GLB, 0.2 MB, 2,388 tris | Kazarma həyətində iki kiçik cəngavər düşərgəsi kimi çağırılır |
| Kingdom Military Camp | https://3dassets.dev/assets/medieval-rts-faction-buildings-kingdom-military-camp-f43ead3d | CC0 1.0; GLB 225.8 KB, 5,236 tris | Şəhər divarından kənarda ayrıca hərbi istehsal və təlim kompleksi kimi yüklənir; 54.9 × 9 × 56.365 m mənbə model, 49 m enə miqyaslanır; brauzerdə vizual uyğunluq yoxlanmayıb |
| Medieval Fair props | https://github.com/anishthite/cc0-models-Polygonal-Mind/tree/main/projects/medieval-fair | CC0; GLB | Bazar çadırı, araba, çəllək və fənər üçün uzaqdan yükləmə kodu qoşulub |

## İlkin kompozisiya qərarı
1. Castle with Keep əsas qala kimi sınaqdan keçiriləcək; onun daxili divarları və darvazası saxlanılacaq.
2. Ayrı Medieval Gatehouse yalnız alternativ qala girişi kimi qiymətləndiriləcək.
3. Şəhər həyətində kazarma, tövlə, dəmirçi, oxçuluq meydançası və bazar ayrıca yerləşdiriləcək.
4. Stilizə edilmiş paketlərdən yalnız dekor/boz qutu prototipi üçün istifadə oluna bilər; fotorealistik final səhnəyə qarışdırılmayacaq.
5. Final vizualı üçün PBR materialları, daş/taxta detalları, torpaq teksturası, fərqli dam örtükləri, LOD və işıqlandırma sınağı tələb olunur.

## Lisenziya qeydləri
- Innerscene Castle with Keep və Medieval Gatehouse səhifələri CC0/public domain göstərir: kommersiya istifadəsi, dəyişiklik və yenidən paylama mümkündür.
- Shuriken Studio Free Model License (versiya 2026-10-25) modelləri kommersiya oyunlarında istifadəyə və dəyişdirilməyə icazə verir; kredit tələb olunmur. Model fayllarını ayrıca və ya asset paketi kimi satmaq/paylamaq olmaz. Lisenziya: https://shuriken.studio/legal/models
- 3DAssets.dev paketi CC0 1.0 kimi göstərilir.
- Kenney Castle Kit CC0 kimi göstərilir; paketin özündəki lisenziya faylı layihə qeydlərində saxlanmalıdır.
- Lisenziya məlumatı modelin yükləndiyini, yaxud cihazda sınaqdan keçdiyini bildirmir.

## Qəbul yoxlaması
- [x] Mənbə linkləri qeydə alınıb
- [x] İlkin lisenziya qeydləri yoxlanıb
- [ ] Aktivlər repozitoriyaya lokal yüklənib (hazırda bir hissəsi uzaq URL-dən çağırılır)
- [ ] Castle with Keep GLB brauzerdə yüklənib və procedural fallback gizlədilməsi vizual təsdiqlənib
- [ ] Material və tekstura keyfiyyəti yoxlanıb
- [ ] Poliqon sayı və LOD yoxlanıb
- [ ] GLB iPhone Safari-də açılıb
- [ ] Mobil FPS və yaddaş ölçülüb
- [ ] Şəhər səhnəsində ölçü və üslub uyğunluğu yoxlanıb

## Qaydalar
- Ödənişli aktivlər istifadəçinin ayrıca razılığı olmadan alınmır.
- Lisenziya qeydi olmayan aktiv qəbul edilmir.
- Sadə low-poly/stilizə aktivlər final qrafika kimi təqdim edilmir.
- Model yüklənməyibsə və real cihazda sınaqdan keçməyibsə, “inteqrasiya edildi” deyilmir.

| Medieval Water Sawmill | https://shuriken.studio/models/buildings/medieval-water-sawmill | Free Model License; GLB, 0.4 MB, 7,588 tris, 16 parts | Resurs anbarının yerində taxta istehsalı binası; yüklənəndə prosedur anbar gizlədilir; model brauzerdə vizual yoxlanmayıb |
