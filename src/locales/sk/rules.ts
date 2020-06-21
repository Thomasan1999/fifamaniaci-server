export default {
    'title': 'Pravidlá',
    'text': [
        '<b>Tento dokument určuje pravidlá správania sa používateľov webovej aplikácie (portálu, systému, webovej stránky) bežiacej na doméne ${href|external|https://fifamaniaci.app} (ďalej len aplikácia).</b>',
        [
            {
                'level': 1,
                'title': 'Aplikácia',
                'text': [
                    'aplikácia je rozdelená na <b>6 kategórií</b>',
                    [
                        '<b>PS4</b>',
                        '<b>PS4 FUT</b>',
                        '<b>Xbox One</b>',
                        '<b>Xbox One FUT</b>',
                        '<b>PC</b>',
                        '<b>PC FUT</b>'
                    ],
                    'pre každú kategóriu beží samostatne liga, rebríček hráčov a chat',
                    'hráč môže hrať vo viacerých kategóriách súčasne'
                ]
            }
        ],
        [
            {
                'level': 1,
                'title': 'Liga',
                'text': []
            },
            {
                'level': 2,
                'title': 'Registrácia',
                'text': [
                    'vstupné do ligy je <b>${currency|env.LEAGUE_REGISTRATION_MONEY}</b>'
                ]
            },
            {
                'level': 2,
                'title': 'Systém ligy',
                'text': [
                    'liga je rozdelená do divízií nasledujúcim spôsobom:',
                    [
                        'najvyššia divízia je jedna a má označenie Divízia 1',
                        'o úroveň nižšie sa nachádzajú 4 divízie s označením Divízia 2A, Divízia 2B, Divízia 2C a Divízia 2D',
                        'o úroveň nižšie sa nachádza 16 divízií s označením Divízia 3AA, Divízia 3AB až po Divíziu 3DD (prvé písmeno v názve určuje 2. divíziu, pod ktorú daná divízia spadá - napr. Divízia 3AC spadá pod Divíziu 2A)',
                        'pod každou divíziou môžu byť až 4 ďalšie divízie'
                    ],
                    '<b>každá divízia</b> pozostáva z <b>10 hráčov</b>'
                ]
            },
            {
                'level': 2,
                'title': 'Kvalifikácia do divízií',
                'text': [
                    '<b>pred prvou sezónou</b> sú hráči do divízií zaraďovaní <b>v prvom rade podľa ratingu</b> a v prípade, že ešte <b>neodohrali ani jeden zápas</b> a majú <b>nulový rating</b>, <b>podľa času registrácie</b>',
                    'hráči sú do divízií zaraďovaní nasledujúcim spôsobom: prvých 10 hráčov je zaradených do Divízie 1, ďalší hráči sú zaraďovaní do divízie 2A, kým ich počet neprekročí číslo 10; ak prekročí, rozdelia sa rovnomerne do divízií 2A a 2B, ak prekročí číslo 20, do divízií 2A, 2B a 2C, atď. (napr. ak sa prihlási 34 hráčov, prvých 10 bude podľa kvalifikačných kritérií zaradených do divízie 1 a zvyšných 24 sa rozdelí po 8 do divízií 2A, 2B a 2C)',
                    'pred ďalšími sezónami sú hráči do divízií zaraďovaní podľa predchádzajúcej sezóny podľa pravidiel popísaných v sekcii Play-off',
                    'v prípade, že sa niektorý z hráčov nezaregistruje do ďalšej sezóny, jeho miesto bude zaplnené hráčom z nižších divízií (ak takéto divízie existujú) alebo hráčom, ktorý žiadnu divíziu nehral, zaregistroval sa do ligy a má najvyšší rating spomedzi zaregistrovaných hráčov z nižších divízií - napr. hráč A bol v Divízií 1 a rozhodol sa, že nechce hrať ďalšiu sezónu; zoberú sa teda všetci zaregistrovaní hráči, ktorí nehrali Divíziu 1 alebo do nej nepostúpili v minulej sezóne a vyberie sa z nich ten, ktorý má aktuálne v rebríčku najvyšší rating',
                    'takýmto spôsobom sa postupne nahradia všetci hráči, ktorí sa nezaregistrovali do ďalšej sezóny',
                    'následne sa na ich miesto rovnakým postupom doplnia ďalší zaregistrovaní hráči (ak takí existujú) z ešte nižších divízií (ak takéto divízie existujú) alebo hráči, ktorí nehrali žiadnu divíziu'
                ]
            },
            {
                'level': 2,
                'title': 'Základná časť',
                'text': [
                    'v základnej časti <b>každý s každým</b> hráčom v divízií odohrá minimálne <b>2 zápasy</b> a to jeden doma a jeden vonku (v prípade, že v divízii bude menej ako 6 hráčov, počet zápasov jednotlivých súperov bude vyšší, aby sa mohlo odohrať čo najviac kôl, s tým, že maximálny počet zápasov pre jedného hráča je 18)',
                    'rozpis zápasov je vopred daný a určuje, v ktorom týždni sa má daný zápas odohrať',
                    '<b>v každom týždni</b> sú naplánované <b>maximálne 3 dvojzápasy</b> pre každého hráča'
                ]
            },
            {
                'level': 2,
                'title': 'Play-off',
                'text': [
                    'každé <b>kolo play-off</b> sa hrá na <b>2 víťazné zápasy</b>',
                    '<b>najlepší 4 hráči</b> z každej divízie <b>postupujú do play-off</b>, kde sa stretne 1. hráč so 4. a 2. s 3. v semifinále',
                    'víťazi semifinále sa stretnú vo finále, kde sa rozhodne o víťazovi ligy',
                    '<b>víťaz play-off Divízie 1</b> sa stane <b>absolútnym víťazom ligy</b> a <b>vyhrá najvyššiu možnú výhru</b>',
                    '<b>poslední 4 hráči zostupujú</b> priamo do nižších divízií (ak takéto divízie existujú)',
                    '<b>víťazi nižších divízií postupujú</b> priamo do vyššej divízie'
                ]
            },
            {
                'level': 2,
                'title': 'Dodržiavanie termínov',
                'text': [
                    'v prípade, že hráč <b>nemôže v danom týždni odohrať naplánované zápasy</b>, je povinný <b>oznámiť nám to</b> buď cez našu Facebookovú fanpage alebo na email ${href|email|env.EMAIL} <b>pred koncom daného týždňa</b>',
                    'ak tak neruobí, <b>za každý neodohraný zápas na konci týždňa</b> dostáva hráč <b>trestný bod</b> (v prípade, že to nebolo jeho vinou, trestný bod nedostáva)',
                    'ak hráč nazbiera <b>10 trestných bodov za sezónu</b>, bude <b>vylúčený zo súťaže bez nároku na vrátenie vstupného</b>'
                ]
            }

        ],
        [
            {
                'level': 1,
                'title': 'Rebríček hráčov',
                'text': [
                    'hráč je zaradený do rebríčka po vykonaní akcie v danej kategórií (odohranie zápasu alebo registrácia do ligy)',
                    'v prípade, že ešte neodohral ani jeden zápas, má 0 bodov',
                    '<b>po odohratí prvého zápasu</b> v kategórii získa hráč <b>${number|env.RANKING_BASIS} bodov plus body, ktoré získal</b> v prvom zápase',
                    'počet získaných bodov hráča A zo zápasu sa určuje nasledovným vzorcom, ktorý je modifikáciou základného vzorca metódy Elo:',
                    [
                        '<var>I<sub>Z</sub></var> <var>V<sub>Z</sub></var> <var>I<sub>G</sub></var> (<var>V</var> - <var>V<sub>o</sub></var>)',
                        '<var>I<sub>Z</sub></var> - index poradového čísla zápasu (1 + 3 (0,9<sup><var>Z</var> - 1</sup>))',
                        '<var>Z</var> - poradové číslo zápasu',
                        '<var>V<sub>Z</sub></var> - váha zápasu (10 - priateľský; 25 - kvalifikačný; 40 - ligový (základná časť), 60 - ligový (play-off))',
                        '<var>I<sub>G</sub></var> - index gólového rozdielu (2 - <math><mfrac><mi>1</mi><mi>2<sup>max(1, <var>G</var>) - 1</sup></mi></mfrac></math>)',
                        '<var>G</var> - gólový rozdiel',
                        '<var>V</var> - výsledok (0 - remíza; <math><mfrac><mi>1</mi><mi>3</mi></mfrac></math> - prehra po predĺžení; <math><mfrac><mi>1</mi><mi>2</mi></mfrac></math> - remíza; <math><mfrac><mi>2</mi><mi>3</mi></mfrac></math> - výhra po predĺžení; 1 - výhra)',
                        '<var>V<sub>o</sub></var> - očakávaný výsledok (<math><mfrac><mi>1</mi><mi>1 + 10<sup>(<var>B<sub>B</sub></var> - <var>B<sub>A</sub></var>) / 400</sup></mi></mfrac></math>)</sup>',
                        '<var>B<sub>B</sub></var> - počet bodov hráča <var>B</var>',
                        '<var>B<sub>A</sub></var> - počet bodov hráča <var>A</var>'
                    ]
                ]
            }
        ],
        [
            {
                'level': 1,
                'title': 'Zápas',
                'text': [
                    'hrá sa najnovšia verzia hry FIFA od EA SPORTS, ktorá je dostupná vo verzii Standard Edition',
                    {
                        'text': 'hráč si môže v každom zápase zvoliť <b>ľubovoľný ligový alebo národný tím</b> (nemusí opakovať voľbu z predchádzajúceho zápasu a to ani v prípade, že sa hrá odveta dvojzápasu alebo niekoľký zápas kola play-off)',
                        'categories': ['ps4', 'xboxOne', 'pc']
                    },
                    'v aplikácii existujú <b>3 typy zápasov</b> - <b>priateľský, kvalifikačný a ligový:</b>', [
                        '<b>priateľský zápas</b> - slúži hlavne na kamarátske zahranie si medzi dvoma hráčmi, ktorý sa chcú odreagovať, ale nechce sa im práve hrať žiadny súťažný zápas',
                        '<b>kvalifikačný zápas</b> - slúži primárne na kvalifikovanie sa do čo najvyššej divízie ligy',
                        '<b>ligový zápas</b>'
                    ]
                ]
            },
            {
                'level': 2,
                'title': 'Dohadovanie zápasu',
                'text': [
                    '<b>zápas dohodnutý cez aplikáciu</b> je automaticky považovaný za zápas <b>spadajúci do aplikácie</b>, to znamená, že má byť zapísaný do sekcie Zápasy',
                    '<b>zápas dohodnutý mimo aplikácie</b> je za zápas <b>spadajúci do aplikácie</b> považovaný <b>iba v prípade, že sa na tom hráči vyslovene dohodli</b>',
                    '<b>ak sa hráči nedohodli inak</b>, <b>typ zápasu</b> sa určí <b>podľa posledného zápasu, ktorý hráči medzi sebou odohrali</b> - to znamená, že ak napr. typ posledného zápasu, ktorý medzi sebou odohrali, je kvalifikačný, aj typ nového zápasu bude kvalifikačný',
                    '<b>ak sa hráči nedohodli inak</b> a je to ich <b>prvý zápas</b>, je považovaný za <b>priateľský zápas</b>'
                ]
            },
            {
                'level': 2,
                'title': 'Nastavenia zápasu',
                'text': [
                    'zápas sa hrá s nasledovnými <b>nastaveniami</b>', [
                        'dĺžka polčasu: <b>6 minút (6 Mins)</b>',
                        'ovládanie: <b>Ľubovoľné (Any)</b>',
                        'rýchlosť hry: <b>Normálna (Normal)</b>',
                        'typ mužstva: <b>Online (Online)</b>'
                    ],
                    '<b>nie je povolené dohodnúť sa na iných nastaveniach</b>',
                    'v prípade, že si <b>jeden z hráčov všimne</b>, že <b>nastavenia nezodpovedajú pravidlám, zápas je neplatný</b>'
                ],
                'categories': ['ps4', 'xboxOne', 'pc']
            },
            {
                'level': 2,
                'title': 'Vypnutie zápasu',
                'text': [
                    'v prípade vypnutia zápasu niektorým z hráčov (počíta sa aj spadnutie internetu) sa výsledok určuje nasledovným spôsobom',
                    [
                        'v prípade, že zápas <b>vypol vyhrávajúci hráč, zápas sa opakuje</b>',
                        'v prípade, že zápas <b>vypol prehrávajúci hráč</b>, alebo bol <b>zápas vypnutý počas remízy</b>, sa <b>hráčovi, ktorý zápas neukončil, pripočíta gól za každých zostávajúcich (aj necelých) 10 minút do konca riadneho hracieho času</b> - to znamená, že napr. ak hráč A vypne zápas v 67. minúte (na časomiere je napr. 66:43) za stavu 3:0 pre hráča B, znamená to, že sa hráčovi B pripočítajú 3 góly, pretože do konca riadneho hracieho času zostáva vyše 23 minút (presnejšie 23 minút a 17 sekúnd), čo môžeme rozdeliť na 3 10-minútovky -> 10 + 10 + 3:17 a konečný výsledok bude tým pádom určený na 6:0 pre hráča B)',
                        '<b>nadstavený čas</b> sa počíta ako <b>posledná minúta polčasu</b> - to znamená, že ak hráč vypne zápas napr. v nastavenom čase na konci zápasu, súperovi sa pripočíta 1 gól (do aplikácie treba napísať, že hráč vypol zápas v 90. minúte)',
                        '<b>tieto prepočty</b> však <b>hráči nemusia robiť</b>, stačí <b>do aplikácie napísať, v koľkej minúte ktorý hráč za akého stavu zápas vypol</b> a <b>aplikácia</b> ostatné <b>dopočíta</b> (treba si však dávať <b>pozor na to</b>, že <b>keď časomiera ukazuje</b> čas <b>66:43, je to 67.</b> a <b>nie 66. minúta</b>)',
                        'v prípade vypnutia zápasu odporúčame súperovi zápas okamžite zapísať do aplikácie, aby nestratil informáciu, v ktorej minúte bol zápas vypnutý, príp. si čas aj s výsledkom odfotiť, aby mal dôkaz v prípade sťažností',
                        'je možná výnimka tohto pravidla - ak sa hráči dohodnú na opakovaní zápasu, predchádzajúci zápas sa nepočíta a hráči odohrajú nový zápas'
                    ]
                ]
            },
            {
                'level': 2,
                'title': 'Zapísanie výsledku',
                'text': [
                    '<b>výsledok zapisuje víťaz zápasu hneď po jeho odohraní</b>',
                    'po odohratí zápasu sa hráči <b>dohodnú, kto zapíše výsledok</b> do aplikácie',
                    'urobiť tak môže v sekcii Zápasy',
                    'každý hráč má povinnosť sledovať si, či niekto nepridal nepravdivý výsledok s jeho nickom a v prípade, že taký zápas nájde, nahlásiť nám ho buď cez našu ${href|external|env.FB_PAGE|Facebookovú fanpage} alebo na email ${href|mail|env.EMAIL}'
                ]
            }
        ],
        [
            {
                'level': 1,
                'title': 'Ceny',
                'text': []
            },
            {
                'level': 2,
                'title': 'Liga',
                'text': [
                    'ceny v lige sú počítané na základe počtu zaplatených vstupov',
                ]
            }
        ],
        '<b>Vyhradzujeme si právo na zmenu a doplnenie pravidiel kedykoľvek počas behu aplikácie.</b>'
    ]
};
