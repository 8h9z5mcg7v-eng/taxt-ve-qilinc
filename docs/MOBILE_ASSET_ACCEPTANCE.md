# Mobil 3D aktiv qəbul meyarları

Bu yoxlama siyahısı iPhone Safari-də GLB modellərini ilkin süzgəcdən keçirmək üçündür. Rəqəmlər optimizasiya hədəfidir, universal mühərrik limiti deyil.

## İlkin xəbərdarlıq hədləri
- GLB faylı: 30 MB-dan yuxarı olduqda optimizasiya tələb olunur.
- Ümumi üçbucaqlar: 250,000-dən yuxarı olduqda LOD/mesh optimizasiyası yoxlanmalıdır.
- Mesh sayı: 150-dən çox olduqda birləşdirmə və instancing nəzərdən keçirilməlidir.
- Material sayı: 30-dan çox olduqda material paylaşımı və atlaslar yoxlanmalıdır.
- Tekstura kənarı: 4096 px-dən böyük olduqda mobil ölçüyə endirmə tələb oluna bilər.

## Yoxlama ardıcıllığı
1. GLB faylını 3D yoxlayıcıda aç.
2. Modelin ölçüsünü, siluetini, materiallarını və animasiyasını vizual yoxla.
3. Fayl ölçüsü, mesh, poliqon, material və tekstura sayına bax.
4. Alətin xəbərdarlıqlarını qeyd et; xəbərdarlıq olmaması performansın təsdiqi deyil.
5. Real iPhone-da ən azı 5 dəqiqəlik fırlatma/yaxınlaşdırma sınağı apar.
6. FPS, yaddaş, istilik və brauzer sabitliyini ayrıca ölç.
7. Yalnız bundan sonra modeli şəhər səhnəsinə daxil et.

## Qala-şəhər üçün əlavə qaydalar
- Əsas qala və divarlar bir-birini təkrarlamamalıdır; əsas qala namizədi artıq öz divar və darvazasını ehtiva edir.
- Yaxın, orta və uzaq məsafələr üçün LOD variantları hazırlanmalıdır.
- Eyni tip ağac, bayraq, daş və dekorlar instancing ilə yerləşdirilməlidir.
- Yalnız əsas obyektlər real-time kölgə alsın.
- PBR teksturalar mümkün qədər paylaşılmalı və sıxılmalıdır.

## Cari məhdudiyyət
GLB yoxlayıcısı ilkin texniki göstəriciləri oxuyur. O, GPU yaddaşını, faktiki tekstura sıxılmasını, istilik davranışını və sabit FPS-i tam ölçmür. Heç bir model bu testlər olmadan “mobil üçün hazır” sayılmır.
