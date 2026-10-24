// Data akurat mengacu NASA Planetary Fact Sheet (nilai dibulatkan untuk edukasi)
// Jarak & diameter asli disimpan (km/AU), render memakai skala playable.
export const SUN = { id:"matahari", hp:240, renderRadius:12, name:"Matahari", type:"Bintang G2V", diameterKm:1392700, suhu:"5.505°C", desc:"Bintang di pusat tata surya, 99,86% massa tata surya. Cahayanya butuh 8 mnt 20 dtk ke Bumi." };

export const PLANETS = [
 { id:"merkurius", hp:8, name:"Merkurius", type:"Planet Kebumian · Terkecil", diameterKm:4879, jarakAU:0.39, orbitRadius:30, renderRadius:1.0, periodeOrbitHari:88, rotasiJam:1407, suhu:"167°C", gravitasi:"3,7 m/s²", tilt:0.03, warnaBase:["#8a8378","#6b655c","#a09a8e"], gas:false,
   desc:"Planet terdekat Matahari, tanpa atmosfer, kawah seperti Bulan, selisih suhu siang-malam ekstrem.",
   facts:["Tahun hanya 88 hari, tapi 1 hari = 176 hari Bumi.","Kawah Caloris selebar 1.550 km.","Suhu siang 430°C, malam -180°C."] },
 { id:"venus", hp:14, name:"Venus", type:"Planet Kebumian · Terpanas", diameterKm:12104, jarakAU:0.72, orbitRadius:42, renderRadius:1.9, periodeOrbitHari:225, rotasiJam:-5832, suhu:"464°C", gravitasi:"8,9 m/s²", tilt:177.4, warnaBase:["#e8c47a","#d9a94f","#f5e0a8"], gas:false,
   desc:"Diselimuti CO₂ dan awan asam sulfat. Efek rumah kaca membuat Venus planet terpanas.",
   facts:["Berputar retrograde (matahari terbit dari barat).","Tekanan permukaan 92× Bumi.","Gunung Maxwell Montes setinggi 11 km."] },
 { id:"bumi", hp:18, name:"Bumi", type:"Planet Kebumian · Rumah Kita", diameterKm:12742, jarakAU:1.0, orbitRadius:55, renderRadius:2.0, periodeOrbitHari:365, rotasiJam:24, suhu:"15°C", gravitasi:"9,8 m/s²", tilt:23.4, warnaBase:["#1e6fd9","#2fae5f","#e8f4ff"], gas:false,
   desc:"Satu-satunya planet dengan air cair stabil dan kehidupan. 71% permukaan lautan, 1 bulan.",
   facts:["Jarak ke Matahari 149,6 juta km (1 AU).","Satelit: Bulan (3.474 km).","Kecepatan orbit 29,78 km/detik."] },
 { id:"mars", hp:10, name:"Mars", type:"Planet Kebumian · Planet Merah", diameterKm:6779, jarakAU:1.52, orbitRadius:68, renderRadius:1.4, periodeOrbitHari:687, rotasiJam:24.6, suhu:"-63°C", gravitasi:"3,7 m/s²", tilt:25.2, warnaBase:["#c1542b","#8f3a1e","#e08a52"], gas:false,
   desc:"Gurun besi beroksida. Olympus Mons (22 km) gunung tertinggi tata surya. Target misi manusia.",
   facts:["2 bulan: Phobos & Deimos.","Badai debu bisa menutupi seluruh planet.","Air es di kutub + bawah permukaan."] },
 { id:"jupiter", hp:40, name:"Jupiter", type:"Raksasa Gas · Terbesar", diameterKm:139820, jarakAU:5.2, orbitRadius:95, renderRadius:7.0, periodeOrbitHari:4333, rotasiJam:9.9, suhu:"-110°C", gravitasi:"24,8 m/s²", tilt:3.1, warnaBase:["#d8b48f","#b07a4a","#f2e2c4","#c97b4a"], gas:true,
   desc:"Raksasa gas 2,5× massa semua planet digabung. Bintik Merah badai 300+ tahun selebar Bumi.",
   facts:["79+ bulan, 4 besar Galileo: Io, Europa, Ganymede, Callisto.","Hari terpendek: 9,9 jam.","Magnetosfer terbesar tata surya."] },
 { id:"saturnus", hp:32, name:"Saturnus", type:"Raksasa Gas · Bercincin", diameterKm:116460, jarakAU:9.5, orbitRadius:125, renderRadius:6.0, periodeOrbitHari:10759, rotasiJam:10.7, suhu:"-140°C", gravitasi:"10,4 m/s²", tilt:26.7, warnaBase:["#e3cf9e","#c9a86a","#f5e8c8"], gas:true, ring:true,
   desc:"Cincin es/batu selebar 282.000 km tapi tebal cuma ~10 m. Titan punya danau metana cair.",
   facts:["Kepadatan < air (0,69 g/cm³).","82+ bulan, Titan lebih besar dari Merkurius.","Angin 1.800 km/jam."] },
 { id:"uranus", hp:22, name:"Uranus", type:"Raksasa Es · Miring", diameterKm:50724, jarakAU:19.2, orbitRadius:155, renderRadius:3.6, periodeOrbitHari:30687, rotasiJam:-17.2, suhu:"-195°C", gravitasi:"8,9 m/s²", tilt:97.8, warnaBase:["#9fe3e8","#5fb8c4","#d8f7f9"], gas:true,
   desc:"Berotasi miring 98° seperti menggelinding. Metana memberi warna cyan. Terdingin meski bukan terjauh.",
   facts:["Ditemukan 1781 oleh Herschel.","27 bulan, cincin vertikal redup.","Suhu terendah tercatat -224°C."] },
 { id:"neptunus", hp:24, name:"Neptunus", type:"Raksasa Es · Terjauh", diameterKm:49244, jarakAU:30.1, orbitRadius:185, renderRadius:3.5, periodeOrbitHari:60190, rotasiJam:16.1, suhu:"-200°C", gravitasi:"11,2 m/s²", tilt:28.3, warnaBase:["#2f5fe0","#1a2fa0","#7fa8ff"], gas:true,
   desc:"Ditemukan lewat matematika (1846). Angin supersonik 2.100 km/jam tercepat tata surya.",
   facts:["1 tahun = 165 tahun Bumi.","Bulan Triton mengorbit mundur.","Bintik Gelap seukuran Bumi."] },
];

export const BONUS = [
 { id:"bulan", hp:4, name:"Bulan", type:"Satelit Bumi", diameterKm:3474, renderRadius:0.55, suhu:"-20°C", gravitasi:"1,6 m/s²", desc:"Satelit alami Bumi, penyebab pasang surut. Dikunjungi Apollo 1969.", facts:["Jarak 384.400 km.","1 hari = 27,3 hari Bumi.","Tidak punya atmosfer."] },
 { id:"pluto", hp:6, name:"Pluto", type:"Planet Katai", diameterKm:2377, jarakAU:39.5, orbitRadius:215, renderRadius:0.8, periodeOrbitHari:90560, suhu:"-229°C", gravitasi:"0,6 m/s²", tilt:122, warnaBase:["#c9b8a3","#8f7d68"], gas:false, desc:"Planet katai sabuk Kuiper, hati es nitrogen (Tombaugh Regio). Dikunjungi New Horizons 2015.", facts:["5 bulan, Charon setengah ukurannya.","1 tahun = 248 tahun Bumi.","Status direklasifikasi 2006."] },
];

export const ROCKETS = [
 { id:"nsx-vanguard", name:"NSX Vanguard", asal:"Armada Nusantara · Kelas Interseptor", tinggiM:"3.474 km · sebesar Bulan", stage:1, thrust:"Ion-X + Warp Ring", desc:"Interseptor sayap delta: badan lifting-body siluman, kanopi kaca kuantum, twin nacelle ion bercahaya.", warna:"#38e1ff" },
 { id:"nsx-odyssey", name:"NSX Odyssey", asal:"Armada Nusantara · Kelas Penjelajah", tinggiM:"3.800 km · sedikit lebih besar dari Bulan", stage:1, thrust:"Antimateri + Warp Ring Ganda", desc:"Penjelajah sayap lebar berbadan katamaran, dek observasi kaca, dan cincin warp ganda untuk lintas bintang.", warna:"#a78bfa" },
 { id:"nsx-aurora", name:"NSX Aurora", asal:"Armada Nusantara · Kelas Pengintai", tinggiM:"3.100 km · sedikit lebih kecil dari Bulan", stage:1, thrust:"Fusi He-3 + Layar Surya", desc:"Pengintai sayap maju dengan panel surya emas, sensor fotonik, dan manuver tinggi.", warna:"#f5c542" },
];

/* Eksoplanet nyata (data NASA Exoplanet Archive) + Lubang Hitam.
   Catatan: periode orbit ASLI tetap disimpan (periodeOrbitHari) untuk panel info,
   tapi visual orbit diperlambat 15x (lambat:15) — kalau 1:1, Proxima mengorbit
   1 putaran tiap 4 detik sehingga mustahil dilihat/diikuti. */
export const EXOPLANETS = [
 { id:"proxima-b", hp:12, name:"Proxima Centauri b", type:"Eksoplanet Kebumian", diameterKm:14000, jarakLy:"4,24 tahun cahaya", orbitRadius:250, renderRadius:1.7, periodeOrbitHari:11.2, lambat:15, rotasiJam:264, suhu:"-39°C", gravitasi:"~11 m/s²", tilt:0, warnaBase:["#7a4a3a","#3a5f4a","#c9a06a"], gas:false,
   desc:"Planet tetangga terdekat di luar tata surya, mengorbit bintang katai merah Proxima Centauri di zona laik huni.",
   facts:["Ditemukan 2016 oleh ESO.","1 tahun hanya 11,2 hari.","Kemungkinan terkunci pasang (1 sisi selalu siang)."] },
 { id:"trappist-1e", hp:14, name:"TRAPPIST-1e", type:"Eksoplanet Kebumian", diameterKm:11700, jarakLy:"39 tahun cahaya", orbitRadius:300, renderRadius:1.8, periodeOrbitHari:6.1, lambat:15, rotasiJam:146, suhu:"-22°C", gravitasi:"~8 m/s²", tilt:0, warnaBase:["#2f6fd9","#3fae6f","#bfe3ff"], gas:false,
   desc:"Paling mirip Bumi di sistem 7 planet TRAPPIST-1. Kandidat kuat air cair di permukaan.",
   facts:["Ditemukan 2017 oleh teleskop TRAPPIST.","1 tahun hanya 6,1 hari.","Bintangnya seukuran Jupiter."] },
 { id:"kepler-186f", hp:16, name:"Kepler-186f", type:"Eksoplanet Super-Bumi", diameterKm:14100, jarakLy:"492 tahun cahaya", orbitRadius:350, renderRadius:2.1, periodeOrbitHari:130, lambat:15, rotasiJam:30, suhu:"-10°C", gravitasi:"~13 m/s²", tilt:0, warnaBase:["#4a8f5f","#2f5f8f","#d9e8c9"], gas:false,
   desc:"Eksoplanet seukuran Bumi pertama di zona laik huni, ditemukan misi Kepler 2014.",
   facts:["Ditemukan 2014 oleh Kepler.","Menerima 1/3 cahaya Matahari dibanding Bumi.","Bintang induk katai merah yang tenang."] },
];

/* ===== BIMA SAKTI: objek langit dalam (posisi statis 3D, jarak visual dikompresi) ===== */
export const MILKYWAY = [
 { id:"sirius", hp:60, name:"Sirius A", emoji:"✨", type:"Bintang Deret Utama · Bima Sakti", jarakLy:"8,6 tahun cahaya", diameterKm:2400000, suhu:"9.940°C",
   info:[["⭐ Massa","2,06 × Matahari"],["🔭 Spektrum","A1V (putih-biru)"],["🌌 Rasi","Canis Major"]],
   pos:[560,120,-340], visual:"star", warna:"#bfe0ff", scale:28,
   renderRadius:2, nearRadius:70, hoverRadius:38, arriveRadius:46,
   desc:"Bintang paling terang di langit malam, hanya 8,6 tahun cahaya dari Bumi. Sirius sebenarnya sistem biner: Sirius A ditemani katai putih Sirius B.",
   facts:["Bintang terdekat ke-7 dari Matahari.","Sirius B adalah katai putih seukuran Bumi.","Kemunculannya dipakai bangsa Mesir kuno sebagai penanda banjir Nil."] },
 { id:"alpha-centauri", hp:90, name:"Alpha Centauri", emoji:"✨", type:"Sistem Bintang Tiga · Bima Sakti", jarakLy:"4,37 tahun cahaya", diameterKm:1700000, suhu:"5.790°C (A)",
   info:[["⭐ Massa","1,1 + 0,9 + 0,12 × Matahari"],["🪐 Planet","Proxima b"],["🌌 Rasi","Centaurus"]],
   pos:[-520,-80,420], visual:"star", warna:"#ffe6b0", scale:24,
   renderRadius:2, nearRadius:65, hoverRadius:36, arriveRadius:44,
   desc:"Sistem bintang terdekat dari Matahari: pasangan Alpha Centauri A & B plus Proxima Centauri, bintang katai merah yang menaungi Proxima b.",
   facts:["Bintang terdekat setelah Matahari (4,37 ly).","Proxima Centauri mengorbit pasangan A–B.","Kandidat pertama misi antarbintang manusia."] },
 { id:"betelgeuse", hp:120, name:"Betelgeuse", emoji:"✨", type:"Raksasa Merah · Bima Sakti", jarakLy:"±550 tahun cahaya", diameterKm:1400000000, suhu:"3.500°C",
   info:[["⭐ Massa","±16 × Matahari"],["📏 Radius","±700 × Matahari"],["🌌 Rasi","Orion"]],
   pos:[760,260,420], visual:"star", warna:"#ff8a5a", scale:46,
   renderRadius:3, nearRadius:90, hoverRadius:52, arriveRadius:60,
   desc:"Raksasa merah di pundak Orion. Jika diletakkan di pusat tata surya, permukaannya mencapai orbit Jupiter. Suatu hari akan meledak sebagai supernova.",
   facts:["Salah satu bintang paling besar yang terlihat mata telanjang.","Meredup dramatis pada 2019–2020 akibat debu.","Akan menjadi supernova dalam <100.000 tahun."] },
 { id:"pleiades", hp:160, name:"Gugus Pleiades (M45)", emoji:"🌫️", type:"Gugus Bintang Terbuka · Bima Sakti", jarakLy:"444 tahun cahaya", diameterLy:"±17 tahun cahaya",
   info:[["⭐ Bintang","1.000+ bintang"],["⏳ Umur","±100 juta tahun"],["🌌 Rasi","Taurus"]],
   pos:[-640,140,-520], visual:"cluster", warna:"#aad4ff", scale:66,
   renderRadius:3, nearRadius:100, hoverRadius:62, arriveRadius:78,
   desc:"Tujuh bintang terang yang dikenal sebagai Tujuh Saudari (Pleiades), dikelilingi nebula refleksi biru halus. Berjarak 444 tahun cahaya di rasi Taurus.",
   facts:["Dikenal sejak zaman prasejarah di banyak budaya.","Bintang-bintangnya lahir bersama ±100 juta tahun lalu.","Cahaya biru berasal dari debu yang memantulkan cahaya bintang."] },
 { id:"orion-nebula", hp:180, name:"Nebula Orion (M42)", emoji:"🌫️", type:"Nebula Emisi · Bima Sakti", jarakLy:"1.344 tahun cahaya", diameterLy:"24 tahun cahaya",
   info:[["⭐ Bintang muda","±2.000"],["🔥 Suhu gas","±10.000 K"],["🌌 Rasi","Orion"]],
   pos:[340,-220,-820], visual:"nebula", warna:"#ff9ecb", scale:110,
   renderRadius:4, nearRadius:120, hoverRadius:78, arriveRadius:96,
   desc:"Rumah pembibitan bintang terbesar dan terdekat dari Bumi. Bintang-bintang muda memancarkan ultraviolet yang membuat gas hidrogen bercahaya merah muda.",
   facts:["Terlihat mata telanjang sebagai 'bintang' di pedang Orion.","Berisi Trapesium, gugus bintang muda yang menyinari nebula.","Teleskop James Webb memotretnya dengan detail luar biasa."] },
 { id:"sagittarius-a", hp:500, name:"Sagittarius A*", emoji:"🕳️", type:"Lubang Hitam Supermasif · Inti Bima Sakti", jarakLy:"26.000 tahun cahaya", massa:"4,3 juta × Matahari", suhu:"Jutaan °C",
   info:[["⌀ Horizon","±25 juta km"],["💫 Orbit bintang","s/d 8.000 km/dtk"],["🏆 Bukti","Nobel Fisika 2020"]],
   pos:[-980,320,760], visual:"blackhole", warna:"#ffb066", scale:40,
   renderRadius:6, nearRadius:120, hoverRadius:62, arriveRadius:62,
   desc:"Jantung galaksi Bima Sakti. Lubang hitam supermasif yang massanya 4,3 juta Matahari, dikelilingi cakram gas panas dan bintang-bintang yang mengorbit sangat cepat.",
   facts:["Citra pertamanya dirilis Event Horizon Telescope (2022).","Bintang S2 mengorbit tiap 16 tahun dengan kecepatan ekstrem.","Reinhard Genzel & Andrea Ghez meraih Nobel 2020 untuk penemuannya."] },
];

/* ===== GALAKSI LAIN (posisi statis jauh di luar tata surya) ===== */
export const GALAXIES = [
 { id:"lmc", hp:200, name:"Awan Magellan Besar", emoji:"🌌", type:"Galaksi Satelit · Ireguler", jarakLy:"163.000 tahun cahaya", diameterLy:"14.000 tahun cahaya",
   info:[["⭐ Bintang","±30 miliar"],["🔭 Tipe","Ireguler berpalang"],["🌌 Rasi","Dorado / Mensa"]],
   pos:[980,-200,360], visual:"irregular", palette:["#cfe6ff","#5f8fe0","#ffe9b0"], scale:[110,72],
   renderRadius:8, nearRadius:110, hoverRadius:82, arriveRadius:96,
   desc:"Galaksi satelit terbesar Bima Sakti, terlihat dari belahan Bumi selatan. Rumah Nebula Tarantula, salah satu wilayah pembentuk bintang paling aktif di grup galaksi lokal.",
   facts:["Berjarak 163.000 tahun cahaya.","Mengandung Nebula Tarantula (30 Doradus).","Akan bergabung dengan Bima Sakti dalam miliaran tahun."] },
 { id:"andromeda", hp:300, name:"Galaksi Andromeda (M31)", emoji:"🌌", type:"Galaksi Spiral Berpalang", jarakLy:"2,54 juta tahun cahaya", diameterLy:"220.000 tahun cahaya",
   info:[["⭐ Bintang","±1 triliun"],["🔭 Tipe","Spiral berpalang (SA(s)b)"],["🌌 Rasi","Andromeda"]],
   pos:[-1200,340,-560], visual:"spiral", palette:["#dfe9ff","#7fa6ff","#ffd9a8"], scale:[300,120],
   renderRadius:20, nearRadius:250, hoverRadius:200, arriveRadius:216,
   desc:"Galaksi spiral terbesar di Grup Lokal dan tetangga galaksi terdekat. Bergerak mendekati Bima Sakti dan akan bertabrakan dalam ±4,5 miliar tahun.",
   facts:["Terjauh yang bisa dilihat mata telanjang (2,54 juta ly).","Diameter ±220.000 tahun cahaya — 2× Bima Sakti.","Memiliki ±1 triliun bintang dan lubang hitam supermasif."] },
 { id:"triangulum", hp:260, name:"Galaksi Triangulum (M33)", emoji:"🌌", type:"Galaksi Spiral", jarakLy:"2,73 juta tahun cahaya", diameterLy:"60.000 tahun cahaya",
   info:[["⭐ Bintang","±40 miliar"],["🔭 Tipe","Spiral berstruktur longgar"],["🌌 Rasi","Triangulum"]],
   pos:[-1320,380,-680], visual:"spiral", palette:["#e8f2ff","#86b8ff","#ffe0b0"], scale:[150,150],
   renderRadius:12, nearRadius:150, hoverRadius:116, arriveRadius:132,
   desc:"Galaksi spiral ketiga terbesar di Grup Lokal, diduga terikat gravitasi dengan Andromeda. Tampak sebagai kabut samar di langit gelap.",
   facts:["Berjarak 2,73 juta tahun cahaya.","Berisi ±40 miliar bintang.","Nebula NGC 604 di dalamnya 40× lebih besar dari Nebula Orion."] },
 { id:"whirlpool", hp:280, name:"Galaksi Whirlpool (M51)", emoji:"🌌", type:"Galaksi Spiral Berinteraksi", jarakLy:"23 juta tahun cahaya", diameterLy:"76.000 tahun cahaya",
   info:[["⭐ Bintang","±100 miliar"],["🔭 Tipe","Spiral (SA(s)bc)"],["🌌 Rasi","Canes Venatici"]],
   pos:[1220,-340,980], visual:"spiral", palette:["#e6f0ff","#6fa8ff","#ffcf9a"], scale:[170,170],
   renderRadius:14, nearRadius:160, hoverRadius:122, arriveRadius:140,
   desc:"Galaksi spiral klasik yang sedang berinteraksi dengan galaksi pendamping NGC 5195. Lengannya terlukis jelas — favorit para astrofotografer.",
   facts:["Ditemukan Pierre Méchain tahun 1773.","Interaksi gravitasi memicu gelombang pembentukan bintang.","Jaraknya 23 juta tahun cahaya."] },
 { id:"sombrero", hp:270, name:"Galaksi Sombrero (M104)", emoji:"🌌", type:"Galaksi Lentikular", jarakLy:"31 juta tahun cahaya", diameterLy:"50.000 tahun cahaya",
   info:[["⭐ Bintang","±100 miliar"],["⌀ Lubang hitam","±1 miliar × Matahari"],["🌌 Rasi","Virgo"]],
   pos:[-1080,-460,1120], visual:"elliptical", palette:["#fff3d8","#d9b98a","#8a6a4a"], scale:[160,115],
   renderRadius:13, nearRadius:150, hoverRadius:116, arriveRadius:132,
   desc:"Dijuluki Sombrero karena tonjolan terang dan jalur debu gelapnya menyerupai topi Meksiko. Galaksi lentikular dengan inti yang sangat terang.",
   facts:["Berjarak 31 juta tahun cahaya.","Memiliki lubang hitam ±1 miliar massa Matahari.","Berisi ±2.000 gugus bola (10× Bima Sakti)."] },
];

export const BLACKHOLE = { id:"cygnus-x1", hp:400, name:"Cygnus X-1", type:"Lubang Hitam Bermassa Bintang", massa:"21× massa Matahari", jarakLy:"~6.000 tahun cahaya", orbitRadius:430, renderRadius:6, periodeOrbitHari:90000, rotasiJam:10, suhuDisk:">10 juta °C", gravitasi:"Tak terhingga di singularitas", tilt:20, gas:false,
 desc:"Lubang hitam nyata pertama yang dikonfirmasi (1971). Cakram akresi superpanas memancarkan sinar-X. AWAS: gravitasinya menarik pesawatmu!",
 facts:["Dikonfirmasi 1971, pemenang taruhan Hawking–Thorne.","Cakram akresi bersuhu jutaan derajat.","Bahkan cahaya tak bisa lolos dari horizon peristiwa."] };

export function kmhari(hari){ return hari; }
