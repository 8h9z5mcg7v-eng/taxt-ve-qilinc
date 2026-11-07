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


## Ölçülü yerləşdirmə planı — ilk oynanıla bilən şəhər

### Koordinat sistemi
- Səhnə mərkəzi: (0, 0); X şərq-qərb, Z şimal-cənub.
- Əsas qala namizədi təxminən 49.3 × 49.7 m olduğuna görə ilkin miqyas istinadı 1 model vahidi = 1 metrdir.
- Qala modelinin öz divarları və darvazası olduğundan ilk bloklamada ayrıca perimetr divarı əlavə edilmir.
- Həyət üçün ilkin sahə 150 × 150 m; bu, yekun ölçü deyil, kamera və yol sınağı üçün bloklama ölçüsüdür.

### Obyekt cədvəli
| Obyekt | Mərkəz (X,Z) | İlkin sahə | Qeyd |
|---|---:|---:|---|
| Əsas qala | (0, 0) | 49 × 50 m | Əsas vizual fokus; öz divarı/darvazası saxlanır |
| Kazarma | (-43, -25) | 18 × 14 m | Qalanın şimal-qərb həyəti |
| Tövlə | (42, -25) | 20 × 16 m | At meydançası ilə |
| Dəmirçi | (-43, 24) | 14 × 12 m | Tüstü bacası və açıq emalatxana |
| Oxçu meydançası | (42, 25) | 22 × 18 m | Hədəf dirəkləri qalanın siluetini kəsmir |
| Anbar | (-25, 53) | 16 × 12 m | Resurs binası |
| Bazar | (25, 53) | 20 × 12 m | 3–4 kiçik köşk |
| Quyu | (0, 48) | 5 × 5 m | Əsas yoldan kənarda |
| Cənub giriş yolu | (0, 58) | 8 m en | Darvazadan mərkəzə vizual ox |

### Kamera və idarəetmə
- Başlanğıc kamera: (115, 145, 115), hədəf (0, 0, 0); sonra cihaz ekranına görə tənzimlənir.
- Ortoqrafik kamera üçün ilkin görünüş eni 190 m; portret telefonda şaquli kadrda 160–190 m hədəflənir.
- İki barmaqla zoom, bir barmaqla orbit/pan; UI düymələri təhlükəsiz ekran kənarlarından aralı saxlanır.
- Kamera sərhədi həyətin kənarından 15 m artıq keçməməlidir.

### İnteqrasiya ardıcıllığı
1. Əsas qala GLB-ni ayrıca yoxlayıcıda aç; ölçü, tris, material, tekstura və animasiya göstəricilərini qeydə al.
2. Qalanın öz divar/darvaza hissələrini vizual təsdiqlə; ayrıca gatehouse-u yalnız müqayisə üçün yoxla.
3. Qalanın real ölçüsünə görə bütün əlavə binaları miqyasla; heç birini kor-koranə 1:1 qəbul etmə.
4. Hər bina üçün sadə collider/selection bounds ayrıca saxla.
5. Əvvəl 5 əsas obyektlə (qala, kazarma, tövlə, dəmirçi, oxçu meydançası) səhnə sınağı et.
6. Sonra anbar, bazar, quyu, yol və təbiət obyektlərini əlavə et.
7. Son mərhələdə mobil LOD, kölgə məsafəsi və instancing yoxlanılsın.

Bu koordinatlar real asset ölçüləri deyil; yalnız qala modelinin elan olunmuş ölçüsünə əsaslanan ilkin səhnə bloklama təklifidir. Hər binanın faktiki GLB ölçüsü import zamanı yenidən ölçülməlidir.
