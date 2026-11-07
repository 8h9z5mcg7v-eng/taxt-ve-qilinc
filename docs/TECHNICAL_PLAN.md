# Texniki yol xəritəsi

## Məhsul hədəfi
iPhone və Android üçün orta əsr mobil strategiya oyunu. İlk mərhələdə brauzerdə işləyən yoxlanıla bilən 3D prototip; sonrakı mərhələdə native mobil paketləmə üçün uyğun arxitektura.

## Mərhələlər
1. **Repo və texniki baza** — bu repozitoriya, modul quruluş, vizual tələblər və aktiv reyestri.
2. **Render sınağı** — iPhone Safari-də GLB/PBR model yüklənməsi, kamera, işıq, toxunma idarəsi və performans testi.
3. **Qala-şəhər səhnəsi** — lisenziyası təsdiqlənmiş keyfiyyətli qala, divarlar və ayrı binalar; səhnə kompozisiyası və LOD.
4. **Oyun dövrəsi** — resurslar, tikinti, qoşun hazırlığı, kəşfiyyat və hücum.
5. **Döyüş prototipi** — piyada, oxçu, süvari; istiqamət/taktika seçimi və avtomatik döyüş seçimi.
6. **Mobil optimizasiya** — iOS/Android cihazlarında FPS, yaddaş, istilik və batareya sınaqları.
7. **Multiplayer** — server-authoritative döyüş, hesablar, klanlar/ittifaqlar və dünya xəritəsi.

## Texnologiya qərarı
Unity URP keyfiyyət hədəfi kimi saxlanılır, lakin Unity Editor iPhone-da işləmədiyinə görə hazırkı cihaz məhdudiyyəti nəzərə alınmalıdır. İlk işlək sınaq üçün brauzer əsaslı WebGL/WebGPU yolu ayrıca qiymətləndirilir. Mühərrik qərarı real iPhone sınağından sonra verilməlidir.

## İlk texniki qəbul meyarları
- iPhone Safari-də toxunma ilə kamera idarəsi.
- GLB model, PBR material və teksturaların düzgün yüklənməsi.
- Şəhər səhnəsində bütün binalar ayrı-ayrı görünür.
- Səhnə orta səviyyəli telefonda stabil işləyir; FPS və yaddaş ölçülür.
- Lisenziya qeydləri olmayan aktiv qəbul edilmir.

## Açıq risklər
- iPhone-only iş axınında 3D editor əməliyyatları çətin ola bilər.
- Native iOS build və imzalama üçün sonrakı mərhələdə macOS/Xcode tələb oluna bilər.
- Pulsuz aktivlərin bir hissəsi stilizə olunmuş və ya mobil üçün ağır ola bilər; hər model ayrıca sınaqdan keçirilməlidir.
