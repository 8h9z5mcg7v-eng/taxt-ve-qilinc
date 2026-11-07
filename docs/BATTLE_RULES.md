# Döyüş mexanikası — ilk prototip

## Qoşun sinifləri
- Piyada: əsas ön xətt.
- Nizəçi: süvari hücumuna qarşı müdafiə.
- Oxçu: məsafəli zərbə, zəif müdafiə.
- Süvari: yüksək sürətli cinah hücumu.
- Cəngavər: bahalı və ağır zirehli hücum/müdafiə vahidi.

## Oyunçu qərarları
- Hücum istiqaməti: şimal, şərq, cənub, qərb.
- Döyüş taktikası: balanslı, paz (süvari), xətt (piyada/nizəçi), yaylım (oxçu).
- Nəticə: güc müqayisəsi, itkilər və qalan qoşun sayı.

## Hazırkı tətbiq
`src/troops.js` qoşun parametrlərini və ordu yaratma funksiyasını saxlayır.
`src/battle.js` deterministik prototip döyüş hesablayıcısıdır.

Bu mexanika ilk balans sınağı üçündür; multiplayer, server təsdiqi, animasiyalı döyüş və real vaxt taktiki hərəkət hələ yoxdur. Rəqəmlər ilkin oyun balansıdır, yekun deyil.
