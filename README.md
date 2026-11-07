# Taxt və Qılınc

Mobil strategiya oyunu üçün ayrıca layihə.

## Məqsəd
- iPhone və Android üçün uyğun oyun təməli
- Orijinal orta əsr strategiya dünyası
- İzometrik kamera və yüksək keyfiyyətli 3D səhnə
- Qala quruculuğu, qoşun hazırlığı və taktiki döyüş

## Cari mərhələ
Hazırda 3D aktiv yoxlayıcısı hazırlanıb. Bu, oyunun özü deyil; GLB modellərini mobil cihazda texniki və vizual qiymətləndirmək üçündür. Repozitoriyada hələ tam oyun, real qala modeli və ya yayımlanmış oyun build-i yoxdur.

## 3D model yoxlayıcısı
1. `index.html` səhifəsini GitHub Pages vasitəsilə aç.
2. **GLB seç** düyməsinə toxun.
3. Cihazından tək fayllı `.glb` modeli seç.
4. Modeli barmaqla fırlat və yaxınlaşdır.
5. Aşağı paneldə fayl həcmi, ölçülər, mesh, poliqon, material, tekstura və animasiya göstəricilərinə bax.
6. İki dəfə toxunaraq ilkin kamera bucağına qayıt.

Qeyd: `.gltf` formatı xarici tekstura və buffer fayllarından asılı ola bilər. Bu yoxlayıcı üçün özündə resursları saxlayan tək fayllı GLB daha uyğundur. Böyük modellərin yüklənməsi iPhone yaddaşı və brauzer imkanları ilə məhdudlaşa bilər.

## Aktiv inkişaf prinsipləri
- Köhnə Krallıqlar Dövrü və UstaTap repozitoriyalarından ayrı saxlanılır.
- Yalnız lisenziyası yoxlanmış pulsuz kommersiya istifadəli aktivlər seçilir.
- Aşağı poliqonlu placeholder-lar final qrafika kimi təqdim edilmir.
- Modelin oyuna daxil edilməsindən əvvəl mobil performans və vizual keyfiyyət sınağı aparılır.
