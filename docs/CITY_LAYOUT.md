# İlk qala-şəhər səhnəsi — kompozisiya planı

## Məqsəd
Bir ekranda tam görünən, sıx, canlı və oxunaqlı orta əsr qala-şəhəri. Bu sənəd real model inteqrasiyası deyil; səhnə qurulması üçün yerləşdirmə və keyfiyyət spesifikasiyasıdır.

## Kamera və səhnə
- İzometrik/ortoqrafikə yaxın perspektiv kamera; şəhərin əsas hissəsi bir baxışda görünməlidir.
- Kamera şəhərin cənub-şərqindən baxır; əsas giriş ön tərəfdə və vizual olaraq seçilən yerdədir.
- Əsas qala səhnənin mərkəzində, divarlar və dörd müdafiə qülləsi ilə əhatələnir.
- Ərazi düzbucaqlı və ya yumşaq qeyri-müntəzəm qala həyəti kimi qurulur; binalar bir-birinin üzərinə düşməməlidir.
- Torpaq tək rəngli boş müstəvi deyil: torpaq teksturası, ot, daş döşəmə, palçıq yolları və kiçik bitki qrupları istifadə olunmalıdır.

## İlkin yerləşdirmə zonaları
1. **Mərkəz:** əsas qala/keep; ən hündür və əsas vizual fokus.
2. **Perimetr:** daş divarlar, künc qüllələri, ön darvaza və darvazaya gedən yol.
3. **Şimal-qərb həyəti:** kazarma və silah anbarı.
4. **Şimal-şərq həyəti:** tövlə və at meydançası.
5. **Cənub-qərb həyəti:** dəmirçi və emalatxana.
6. **Cənub-şərq həyəti:** oxçuluq meydançası və hədəf dirəkləri.
7. **Kənar zolaq:** bazar köşkləri, su quyusu/fəvvarə, odun və ərzaq anbarı.
8. **Divarlardan kənar:** meşə, daşlıq, əkin sahələri və uzaq təpələr; şəhər siluetini kəsməməlidir.

## Oyun oxunaqlılığı
- Əsas binaların üstündə oyun interfeysi üçün boş vizual sahə saxlanılsın.
- Binalar arasında ən azı bir bina eninin təxminən 0.35–0.5 misli qədər keçid saxlanılsın.
- Darvazadan əsas qalaya qədər yol aydın oxunsun.
- Bina növləri siluet və dam materialı ilə fərqlənsin.
- Təkrarlanan dekorlar instancing ilə çəkilsin; uzaq dekorlar LOD və ya sadələşdirilmiş mesh istifadə etsin.

## Vizual keyfiyyət tələbləri
- PBR daş, taxta, metal, dam örtüyü və torpaq materialları.
- Daşlarda ölçü variasiyası, kənar aşınması, rəng fərqləri və məntiqli tikişlər.
- Taxta konstruksiyalarda şüalar, dayaqlar, qapılar və dam detallarının görünməsi.
- Binalar eyni ölçü və üslubda olmasın; hər binanın öz silueti olsun.
- Yumşaq günəş işığı, məhdud real-time kölgələr və atmosfer dərinliyi.
- Aşağı poliqonlu stilizə edilmiş kənd dəsti yalnız bloklama/prototip üçündür; final görünüş kimi qəbul edilmir.

## Mobil performans qəbul meyarları
- İlk sınaqda model üzrə tris, mesh, material, tekstura ölçüləri ayrıca qeydə alınsın.
- Böyük teksturalar üçün mipmap və uyğun sıxılma; eyni materiallar paylaşılmalıdır.
- Kölgələr yalnız əsas qala və yaxın obyektlərdə aktiv saxlanılsın.
- İlk cihaz sınağında 30 FPS minimum hədəf, 60 FPS optimallaşdırma hədəfidir; nəticə real cihazda ölçülmədən iddia edilmir.
- Yaddaş, istilik və uzunmüddətli performans ayrıca yoxlanmalıdır.

## Hazırkı status
- Kompozisiya spesifikasiyası yazılıb.
- Heç bir 3D qala və ya şəhər modeli hələ repozitoriyaya idxal edilməyib.
- Heç bir FPS və yaddaş nəticəsi ölçülməyib.
