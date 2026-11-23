const gameData = {
  branches: {
    A: {
      id: "A",
      title: "Časová linie",
      cardImage: "assets/images/ukol_za.png",
      correctAnswer: "od 79 až po 69",
      targetGps: { lat: 49.3032944, lng: 14.1002750, radius: 10 },
      reports: {
        round1: { nav: "assets/images/hlaseni_2a.png", done: "assets/images/hlaseni_3a.png" },
        round2: { nav: "assets/images/hlaseni_5a.png", done: "assets/images/hlaseni_6a.png" },
        round3: { nav: "assets/images/hlaseni_7a.png", done: "assets/images/hlaseni_8a.png" }
      },
      popups: [
        { lat: 49.3030619, lng: 14.1006561, radius: 5, image: "assets/indicie/indicie_za_1.png", repeatable: true },
        { lat: 49.3031658, lng: 14.1012633, radius: 5, image: "assets/indicie/indicie_za_2.png", repeatable: true },
        { lat: 49.3032400, lng: 14.1017792, radius: 5, image: "assets/indicie/indicie_za_3.png", repeatable: true },
        { lat: 49.3032794, lng: 14.1024544, radius: 5, image: "assets/indicie/indicie_za_4.png", repeatable: true },
        { lat: 49.3032300, lng: 14.1030158, radius: 5, image: "assets/indicie/indicie_za_5.png", repeatable: true },
        { lat: 49.3030964, lng: 14.1036153, radius: 5, image: "assets/indicie/indicie_za_6.png", repeatable: true },
        { lat: 49.3028739, lng: 14.1040856, radius: 5, image: "assets/indicie/indicie_za_7.png", repeatable: true },
        { lat: 49.3027353, lng: 14.1046700, radius: 5, image: "assets/indicie/indicie_za_8.png", repeatable: true },
        { lat: 49.3028194, lng: 14.1053906, radius: 5, image: "assets/indicie/indicie_za_9.png", repeatable: true },
        { lat: 49.3031211, lng: 14.1057700, radius: 5, image: "assets/indicie/indicie_za_10.png", repeatable: true },
        { lat: 49.3032603, lng: 14.1058478, radius: 15, image: "assets/indicie/indicie_za_konec.png", repeatable: true }
      ]
    },
    B: {
      id: "B",
      title: "Boží kámen",
      cardImage: "assets/images/ukol_zb.png",
      targetGps: { lat: 49.2304228, lng: 13.7837400, radius: 30 },
      reports: {
        round1: { nav: "assets/images/hlaseni_2b.png", done: "assets/images/hlaseni_3b.png" },
        round2: { nav: "assets/images/hlaseni_5b.png", done: "assets/images/hlaseni_6b.png" },
        round3: { nav: "assets/images/hlaseni_7b.png", done: "assets/images/hlaseni_8b.png" }
      },
      // 3 výběrové otázky se 3 možnostmi
      multipleChoice: [
        {
          id: "q1",
          label: "1. Rok objevu:",
          options: ["1902", "1904", "1906"],
          correct: "1902"
        },
        {
          id: "q2",
          label: "2. Místo nálezu:",
          options: ["západní okraj lesa", "úpatí lesa nad samotou", "Boží kámen"],
          correct: "úpatí lesa nad samotou"
        },
        {
          id: "q3",
          label: "3. Nalezený předmět:",
          options: ["velký vltavín", "truhla s groši", "keltská soška"],
          correct: "keltská soška"
        }
      ],
      popups: [
        { index: 1, lat: 49.2359439, lng: 13.7802592, radius: 5, image: "assets/indicie/indicie_zb_1.png", name: "Indicie 1" },
        { index: 2, lat: 49.2358075, lng: 13.7803531, radius: 5, image: "assets/indicie/indicie_zb_2.png", name: "Indicie 2" },
        { index: 3, lat: 49.2357864, lng: 13.7805569, radius: 5, image: "assets/indicie/indicie_zb_3.png", name: "Indicie 3" },
        { index: 4, lat: 49.2358986, lng: 13.7806694, radius: 5, image: "assets/indicie/indicie_zb_4.png", name: "Indicie 4" },
        { index: 5, lat: 49.2360244, lng: 13.7805836, radius: 5, image: "assets/indicie/indicie_zb_5.png", name: "Indicie 5" },
        { index: 6, lat: 49.2366872, lng: 13.7769981, radius: 30, image: "assets/indicie/indicie_zb_6.png", name: "Nápověda" }
      ]
    },
    C: {
      id: "C",
      title: "Skalka",
      cardImages: ["assets/images/ukol_zc_1.png", "assets/images/ukol_zc_2.png"],
      correctAnswers: ["1846", "2168"],
      targetGps: { lat: 49.1591211, lng: 13.8786736, radius: 30 },
      reports: {
        round1: { nav: "assets/images/hlaseni_2c.png", done: "assets/images/hlaseni_3c.png" },
        round2: { nav: "assets/images/hlaseni_5c.png", done: "assets/images/hlaseni_6c.png" },
        round3: { nav: "assets/images/hlaseni_7c.png", done: "assets/images/hlaseni_8c.png" }
      },
      popups: []
    }
  },

  steps: [
    {
      id: "start_sifra",
      title: "Startovní šifra",
      type: "map_pin",
      targetGps: { lat: 49.2633242, lng: 13.9099886, radius: 15 },
      reportImage: "assets/images/hlaseni_0.png"
    },
    {
      id: "start_video",
      title: "Start Hry",
      type: "video_pass",
      videoUrl: "https://www.youtube.com/embed/Mxil6ebh71o",
      targetGps: { lat: 49.2633242, lng: 13.9099886, radius: 30 },
      correctAnswer: "signál zachycen"
    },
    {
      id: "z1_pojistka",
      title: "Proč ten stroj nefunguje?",
      type: "gps_search",
      videoUrl: "https://www.youtube.com/embed/e4zEao5NV9Q",
      reportImage: "assets/images/hlaseni_1.png",
      correctAnswer: "pojistka",
      popups: [
        { lat: 49.2632608, lng: 13.9103744, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2634569, lng: 13.9103892, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2650111, lng: 13.9125725, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2640039, lng: 13.9101131, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2644642, lng: 13.9103089, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2645211, lng: 13.9109497, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2650461, lng: 13.9109511, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2652492, lng: 13.9115372, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2647031, lng: 13.9116686, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true },
        { lat: 49.2639819, lng: 13.9109847, radius: 5, image: "assets/indicie/indicie_z1b_otevri.png", repeatable: true }
      ]
    },
    {
      id: "z2a_valoun",
      title: "Zlatokopova chyba",
      type: "gps_and_pass",
      targetGps: { lat: 49.2597506, lng: 13.9491206, radius: 20 },
      cardImage: "assets/images/ukol_z2a.png",
      correctAnswer: "časíkovo",
      popups: [
        { lat: 49.2597319, lng: 13.9472803, radius: 20, image: "assets/indicie/indicie_z2a_1.png", repeatable: true },
        { lat: 49.2601714, lng: 13.9456683, radius: 20, image: "assets/indicie/indicie_z2a_1.png", repeatable: true },
        { lat: 49.2603447, lng: 13.9447322, radius: 20, image: "assets/indicie/indicie_z2a_1.png", repeatable: true }
      ]
    },
    {
      id: "z2b_zachrana",
      title: "Zlatokopova snaha o záchranu",
      type: "text_pass",
      cardImage: "assets/images/ukol_z2b.png",
      correctAnswer: "ten valoun se celkem blýská"
    },
    {
      id: "los_1",
      title: "První Losování",
      type: "branch_draw",
      roundNumber: 1
    },
    {
      id: "z4_labyrint",
      title: "Neviditelný labyrint",
      type: "labyrint",
      cardImage: "assets/images/ukol_z4.png",
      targetGps: { lat: 49.2686008, lng: 14.0003772, radius: 10 }, // Vstupní GPS
      endGps: { lat: 49.2735222, lng: 13.9953133, radius: 10 },    // Ukončovací GPS
      reportImage: "assets/images/hlaseni_4.png",
      intersections: [
        { id: 1, lat: 49.2741714, lng: 14.0003211, radius: 5, image: "assets/indicie/indicie_z4_1.png" },
        { id: 2, lat: 49.2750219, lng: 13.9937228, radius: 5, image: "assets/indicie/indicie_z4_2.png" },
        { id: 3, lat: 49.2709775, lng: 14.0004292, radius: 5, image: "assets/indicie/indicie_z4_3.png" },
        { id: 4, lat: 49.2746961, lng: 13.9938386, radius: 5, image: "assets/indicie/indicie_z4_4.png" },
        { id: 5, lat: 49.2758467, lng: 14.0021642, radius: 5, image: "assets/indicie/indicie_z4_5.png" },
        { id: 6, lat: 49.2720889, lng: 13.9969142, radius: 5, image: "assets/indicie/indicie_z4_6.png" },
        { id: 7, lat: 49.2695883, lng: 13.9974508, radius: 5, image: "assets/indicie/indicie_z4_7.png" },
        { id: 8, lat: 49.2718306, lng: 14.0005933, radius: 5, image: "assets/indicie/indicie_z4_8.png" },
        { id: 9, lat: 49.2692217, lng: 13.9973869, radius: 5, image: "assets/indicie/indicie_z4_9.png" },
        { id: 10, lat: 49.2691072, lng: 14.0004064, radius: 5, image: "assets/indicie/indicie_z4_10.png" },
        { id: 11, lat: 49.2721944, lng: 13.9947872, radius: 5, image: "assets/indicie/indicie_z4_11.png" },
        { id: 12, lat: 49.2700256, lng: 14.0004239, radius: 5, image: "assets/indicie/indicie_z4_12.png" },
        { id: 13, lat: 49.2732211, lng: 14.0001608, radius: 5, image: "assets/indicie/indicie_z4_13.png" },
        { id: 14, lat: 49.2705847, lng: 13.9952653, radius: 5, image: "assets/indicie/indicie_z4_14.png" },
        { id: 15, lat: 49.2757478, lng: 13.9996822, radius: 5, image: "assets/indicie/indicie_z4_15.png" },
        { id: 16, lat: 49.2692117, lng: 13.9984811, radius: 5, image: "assets/indicie/indicie_z4_16.png" },
        { id: 17, lat: 49.2736428, lng: 13.9942325, radius: 5, image: "assets/indicie/indicie_z4_17.png" },
        { id: 18, lat: 49.2710681, lng: 13.9951647, radius: 5, image: "assets/indicie/indicie_z4_18.png" }
      ],
      deadEnds: [
        { lat: 49.2707933, lng: 13.9944678, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2692725, lng: 13.9968350, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2700506, lng: 13.9993919, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2701922, lng: 13.9953353, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2720689, lng: 13.9939694, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2749003, lng: 13.9929028, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2754719, lng: 13.9935533, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2764150, lng: 13.9998506, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2758836, lng: 14.0028497, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2710422, lng: 14.0012164, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" },
        { lat: 49.2717617, lng: 14.0014153, radius: 5, image: "assets/indicie/indicie_z4_otoc.png" }
      ]
    },
    {
      id: "z5a_obed",
      title: "Co takhle si dát polévku?",
      type: "timer_30_min",
      cardImage: "assets/images/ukol_z5a.png",
      durationMinutes: 20
    },
    {
      id: "z5b_rezny",
      title: "Zpět za dobrodružstvím",
      type: "gps_check",
      cardImage: "assets/images/ukol_z5b.png",
      endGps: { lat: 49.2578400, lng: 13.9003739, radius: 15 } // Ukončovací GPS
    },
    {
      id: "los_2",
      title: "Druhý Losování",
      type: "branch_draw",
      roundNumber: 2
    },
    {
      id: "z7_strakonice",
      title: "Hrad Strakonice a jeho budoucnost",
      type: "form_questionnaire",
      cardImage: "assets/images/ukol_z7.png",
      targetGps: { lat: 49.2587294, lng: 13.9013292, radius: 15 },
      formUrl: "https://forms.gle/arUBXBcj8heYp6mx8", // Odkaz na Google Forms
      correctAnswer: "jelenka"
    },
    {
      id: "los_3",
      title: "Třetí Losování",
      type: "branch_draw",
      roundNumber: 3
    },
    {
      id: "z9_potvrzeni_cile",
      title: "Potvrzení místa cíle",
      type: "final_map_puzzle",
      cardImage: "assets/images/ukol_z9.png",
      correctAnswer: "rybník mešník"
    },
    {
      id: "cil_hry",
      title: "Cíl – Záchrana Časíka",
      type: "final_screen",
      targetGps: { lat: 49.2195747, lng: 14.0097797, radius: 30 },
      reportImage: "assets/images/hlaseni_9.png"
    }
  ]
};