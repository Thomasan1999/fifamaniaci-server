import sk    from 'vuejs-datepicker/dist/locale/translations/sk.js';
import rules from './rules';

export default {
    'alert': {
        'field': {
            'empty': 'vyplň prosím ${a.sg}',
            'invalid': '${n.sg} je v neplatnom tvare',
            'long': {
                '1': '${n.sg} môže obsahovať najviac ${max} znak',
                '2-4': '${n.sg} môže obsahovať najviac ${max} znaky',
                '5+': '${n.sg} môže obsahovať najviac ${max} znakov'
            },
            'notFound': {
                'default': '${n.sg} nebol nájdený v databáze',
                'password': 'heslo je nesprávne'
            },
            'short': {
                '1': '${n.sg} musí obsahovať aspoň ${min} znak',
                '2-4': '${n.sg} musí obsahovať aspoň ${min} znaky',
                '5+': '${n.sg} musí obsahovať aspoň ${min} znakov'
            },
            'taken': '${n.sg} už je obsadený'
        },
        'form': {
            'alreadyPlayed': 'So súperom si túto sezónu už odohral všetky zápasy',
            'divisionDifferent': 'Hráči nie sú zaregistrovaní v tej istej divízii',
            'emailVerificationFailed': 'Tvoju emailovú adresu sa nepodarilo potvrdiť pre neplatný verifikačný kód',
            'emailVerificationSuccessful': 'Tvoja emailová adresa bola úspešne potvrdená',
            'empty': 'Pre odoslanie ${g.sg} musíš vyplniť všetky povinné údaje',
            'foreignMatch': 'Môžeš pridávať iba zápasy, ktoré si odohral',
            'invalid': 'Údaje sú zadané v nesprávnom formáte',
            'leagueRegistrationCanceled': 'Registrácia bola úspešné zrušená',
            'leagueRegistrationCancelationFailed': 'Registráciu sa nepodarilo zrušiť, skús si prosím skontrolovať pripojenie k internetu alebo skús neskôr',
            'leagueRegistrationFailed': 'Registrácia do ligy nebola úspešná, skús si prosím skontrolovať pripojenie k internetu alebo skús neskôr',
            'matchesFormAddTooltipCanceledByWinner': 'Ak vyhrávajúci hráč vypol zápas, zápas sa opakuje',
            'notAdded': '${a.sg} nebolo možné pridať do databázy, skús si prosím skontrolovať pripojenie k internetu alebo skús neskôr',
            'notFound': '${n.sg} nebol nájdený v databáze',
            'notVerified': {
                'default': 'Pre pridanie ${g.sg} si musíš potvrdiť emailovú adresu',
                'leagueRegistration': 'Pre dokončenie registrácie prosím potvrď svoju emailovú adresu'
            },
            'opponentNotFound': 'Zápas nemôžeš odohrať sám proti sebe',
            'overtimeDrawIs': 'Ak bolo predĺženie, tak remíza nie je možná',
            'passwordIncorrect': '${n.sg} je nesprávne',
            'passwordResetTokenInvalid': 'Odkaz je neplatný, skopíruj ho z odoslaného mailu na zmenu hesla a skús ešte raz',
            'playOffDrawIs': 'V zápase play-off remíza nie je možná',
            'playerNotFound': 'Hráč alebo hráči, ktorých si zadal, neexistujú',
            'successful': {
                'LeagueRegistration': 'Tvoja registrácia do ligy bola úspešná. Na email sme ti poslali dodatočné info.',
                'LoginForm': 'Tvoje prihlásenie bolo úspešné',
                'LogoutForm': 'Tvoje odhlásenie bolo úspešné',
                'MatchesFormAdd': 'Zápas bol úspešne pridaný',
                'MessagesFormAdd': 'Tvoja správa bola odoslaná',
                'PasswordReset': 'Heslo bolo úspešné zmenené, môžeš ho použiť pre prihlásenie',
                'PasswordResetEmail': 'Žiadosť o zmenu hesla bola odoslaná',
                'Profile': 'Údaje boli úspešne zmenené',
                'Registration': 'Tvoja registrácia bola úspešná, pre pokračovanie prosím potvrď svoju emailovú adresu'
            },
            'transactionBankTransferNegative': 'Tvoj výber v hodnote ${currency|money} bol úspešný',
            'transactionBankTransferPositive': 'Tvoj vklad v hodnote ${currency|money} bol úspešný',
            'transactionLeagueRegistration': 'Tvoja platba za ligu v hodnote ${currency|money} prebehla úspešne',
            'transactionLeaguePrize': 'Na účet ti bolo pripísaných ${currency|money} za ${place}. miesto v ${categoryName} lige',
            'usersReversed': 'Dal si naopak domáceho a vonkajšieho hráča'
        }
    },
    'categories': {
        'pc': 'PC',
        'pcFut': 'PC FUT',
        'ps4': 'PS4',
        'ps4Fut': 'PS4 FUT',
        'xboxOne': 'Xbox One',
        'xboxOneFut': 'Xbox One FUT'
    },
    'categoriesSelect': {
        'title': 'Výber kategórie'
    },
    'connectivity': {
        'offline': 'offline',
        'online': 'online'
    },
    'copyright': '© 2018 - 2020 FIFA maniaci',
    'dictionary': {
        'division': 'divízia',
        'email': 'email',
        'fbLink': 'Facebook link',
        'match': {
            'n': {
                'sg': 'zápas'
            },
            'g': {
                'sg': 'zápasu'
            },
            'a': {
                'sg': 'zápas'
            }
        },
        'message': {
            'n': {
                'sg': 'správa'
            },
            'g': {
                'sg': 'správy'
            },
            'a': {
                'sg': 'správu'
            }
        },
        'password': 'heslo',
        'passwordCurrent': 'aktuálne heslo',
        'passwordNew': 'nové heslo',
        'player': {
            'g': {
                'pl': 'hráčov'
            },
            'a': {
                'sg': 'hráča',
                'pl': 'hráčov'
            }
        },
        'season': 'sezóna',
        'username': 'nick',
        'usernamesInGamePs': 'PSN Online ID',
        'usernamesInGameXbox': 'Xbox Gamertag',
        'usernamesInGamePc': 'Origin ID'
    },
    'form': {
        'login': {
            'submit': 'Prihlásiť sa'
        },
        'submit': 'Odoslať',
        'requiredFields': '* - povinné polia'
    },
    'grammar': {
        'cases': ['n', 'g', 'd', 'a', 'l', 'i'],
        'numbers': ['sg', 'pl']
    },
    'league': {
        'matches': {
            'placeholder': 'Tu bude rozpis zápasov.',
            'unseen': {
                'general': {
                    '1': '${count} nový zápas',
                    '2-4': '${count} nové zápasy',
                    '5+': '${count} nových zápasov'
                },
                'personal': {
                    '1': '${count} nový zápas proti tebe',
                    '2-4': '${count} nové zápasy proti tebe',
                    '5+': '${count} nových zápasov proti tebe'
                }
            }
        },
        'playOff': {
            'placeholder': 'Tu bude play-off.',
            'rounds': ['Finále', 'Semifinále', 'Štvrťfinále'],
            'table': {
                'placeholder': '',
                'unseen': {
                    '1': '${count} nový play-off zápas',
                    '2-4': '${count} nové play-off zápasy',
                    '5+': '${count} nových play-off zápasov'
                }
            }
        },
        'prizes': {
            'initial': 'Ceny sú vypočítané na základe počtu registrácií. Konečné ceny budú vypočítané podľa počtu zaplatených vstupov, to znamená, že sa môžu líšiť.',
            'placeholder': 'Tu budú ceny.',
            'playersRegistered': 'Počet zaplatených vstupov',
            'unseen': {
                '1': '${count} nová cena',
                '2-4': '${count} nové ceny',
                '5+': '${count} nových cien'
            }
        },
        'registration': {
            'button': 'Zaregistrovať sa do ${category} ligy',
            'cancel': 'Zrušiť registráciu',
            'completed': 'Ďakujeme, tvoja registrácia do ligy bola úspešná. Na email sme ti poslali dodatočné info.',
            'expired': 'Registrácia bola ukončená.',
            'main': {
                'moneyEnough': 'Na účte máš dosť peňazí na registráciu do ligy.',
                'moneyNotEnough': 'Pre registráciu do ligy nás prosím kontaktuj na email ${href|mail|env.EMAIL} alebo nám napíš cez ${href|internal||live chat}.'
            },
            'notVerified': 'Pre dokončenie registrácie prosím potvrď svoju emailovú adresu.',
            'placeholder': 'Tu bude zoznam zaregistrovaných hráčov.',
            'rules': {
                'text': [
                    {
                        'level': 1,
                        'title': 'Dôležité pravidlá',
                        'text': [
                            '<b>liga bude trvať</b> od <b>${date|d.m.|getters.leagueSeason.seasonStart}</b> do <b>${date|d.m.yyyy|getters.leagueSeason.seasonEnd}</b>',
                            '<b>vstupné</b> do ligy je <b>${currency|env.LEAGUE_REGISTRATION_MONEY}</b>',
                            'hráč je povinný mať ${currency|env.LEAGUE_REGISTRATION_MONEY} na hráčskom účte <b>${date|d.m.yyyy|getters.leagueSeason.paymentEnd}</b>, inak bude zo súťaže <b>diskvalifikovaný</b>',
                            'hráč je povinný <b>odohrať</b> svoje zápasy <b>v týždni, kedy sú naplánované</b>',
                            'v prípade, že tak nemôže urobiť, je povinný ohlásiť nám to <b>pred začiatkom daného týždňa</b>, uviesť dôvod a zápasy dohrať neskôr (pred koncom súťaže)',
                            'za každé neodôvodnené nedodržanie termínu bude hráčovi za každý zápas a každý týždeň, o ktorý sa omeškal, pripísaný trestný bod (ak sa snažil komunikovať a zápas bol neodohraný chybou jeho súpera, trestný bod mu pripísaný nebude)',
                            'ak hráč nazbiera <b>10 trestných bodov</b>, bude <b>diskvalifikovaný</b> bez nároku na vrátenie vstupného',
                            'ak hráč <b>nebude mať odohrané všetky zápasy na konci základnej časti ${date|d.m.yyyy|getters.leagueSeason.leagueEnd}</b>, bude <b>diskvalifikovaný</b> bez nároku na vrátenie vstupného (ak sa snažil komunikovať a zápasy boli neodohrané chybou jeho súpera, nebude diskvalifikovaný)',
                            'v prípade, že sa hráč prebojuje do <b>play-off</b>, je povinný <b>v termíne ${date|d.m.|getters.leagueSeason.playOffStart} - ${date|d.m.|getters.leagueSeason.semiFinalsEnd}</b> odohrať <b>semifinále</b> a v <b>termíne ${date|d.m.|getters.leagueSeason.finalStart} - ${date|d.m.|getters.leagueSeason.playOffEnd} finále</b>, inak bude diskvalifikovaný bez nároku na vrátenie vstupného (ak sa snažil komunikovať a zápasy boli neodohrané chybou jeho súpera, nebude diskvalifikovaný)',
                            'ak sa hráč v kvalifikácii <b>neprebojuje do divízie 1</b>, je <b>možné</b>, že <b>nebude hrať o finančné ceny</b> (ak by ceny vyšli pre ${getters.leagueSeason.divisionSize} hráčov a menej)',
                            'hráč si môže v každom zápase zvoliť <b>ľubovoľný ligový alebo národný tím</b>',
                            '<b>výsledok zapisuje víťaz zápasu hneď po jeho odohraní</b>'
                        ]
                    },
                    {
                        'level': 2,
                        'title': 'Nastavenia zápasu',
                        'text': [
                            'rýchlosť hry: <b>Normálna (Normal)</b>'
                        ],
                        'categories': ['ps4', 'xboxOne', 'pc']
                    },
                    '<b>Podrobné pravidlá nájdeš ${href|internal|rules|tu|_blank}. Registráciou do ligy potvrdzuješ, že súhlasíš s pravidlami.</b>'
                ]
            },
            'title': 'Registrácia do ligy'
        },
        'registrations': {
            'placeholder': 'Tu bude zoznam zaregistrovaných hráčov do ligy.',
            'unseen': {
                '1': '${count} nová registrácia do ligy',
                '2-4': '${count} nové registrácie do ligy',
                '5+': '${count} nových registrácií do ligy'
            }
        },
        'soon': 'čoskoro',
        'table': {
            'form': {
                'd': {
                    'long': 'Remíza',
                    'short': 'R'
                },
                'l': {
                    'long': 'Prehra',
                    'short': 'P'
                },
                'otl': {
                    'long': 'Prehra po predĺžení',
                    'short': 'PP'
                },
                'otw': {
                    'long': 'Výhra po predĺžení',
                    'short': 'VP'
                },
                'w': {
                    'long': 'Výhra',
                    'short': 'V'
                }
            },
            'placeholder': 'Tu bude ligová tabuľka.',
            'unseen': {
                '1': '${count} aktualizovaný hráč',
                '2-4': '${count} aktualizovaní hráči',
                '5+': '${count} aktualizovaných hráčov'
            }
        },
        'tabs': {
            'matches': 'Zápasy',
            'playOff': 'Play-off',
            'prizes': 'Ceny',
            'registration': 'Registrácia',
            'registrations': 'Kvalifikácia',
            'table': 'Tabuľka'
        },
        'title': 'Liga'
    },
    'matches': {
        'add': 'Pridať ${type} zápas',
        'awayId': 'Hostia',
        'awayGoals': '0',
        'canceled': 'Zápas bol vypnutý hráčom ${by} v ${at}. minúte za stavu ${homeGoals}:${awayGoals}',
        'colon': ':',
        'datepicker': sk,
        'homeId': 'Domáci',
        'homeGoals': '0',
        'overtime': {
            'localization': 'p',
            'title': 'po predĺžení'
        },
        'placeholder': 'Tu budú zápasy. Ukáž, že si aktívny, a vyzvi niekoho na prvý zápas prostredníctvom ${href|internal|messages|chatu}.',
        'types': {
            'localization': 'Typ zápasu:',
            'friendly': 'priateľský',
            'league': {
                'long': 'ligový (základná časť)',
                'short': 'základná časť'
            },
            'playOff': {
                'long': 'ligový (play-off)',
                'short': 'play-off'
            },
            'qualification': 'kvalifikačný'
        },
        'unseen': {
            'general': {
                '1': '${count} nový zápas',
                '2-4': '${count} nové zápasy',
                '5+': '${count} nových zápasov'
            },
            'personal': {
                '1': '${count} nový zápas proti tebe',
                '2-4': '${count} nové zápasy proti tebe',
                '5+': '${count} nových zápasov proti tebe'
            }
        },
        'title': 'Zápasy'
    },
    'messages': {
        'onlineCount': 'Počet ľudí online',
        'placeholder': {
            'general': 'Toto je spoločný chat. Slúži hlavne na dohadovanie zápasov, ale môžeš si tu aj voľne pokecať s ostatnými.',
            'personal': 'Toto je súkromný chat. Správy, ktoré pošleš, vidí iba ${addressee}.'
        },
        'title': 'Chat',
        'unseen': {
            '1': '${count} nová správa',
            '2-4': '${count} nové správy',
            '5+': '${count} nových správ'
        }
    },
    'passwordReset': {
        'submit': 'Odoslať heslo',
        'title': 'Zmena hesla'
    },
    'passwordResetEmail': {
        'instructions': 'Zadaj svoj email a my ti pošleme link na zmenu hesla.',
        'title': 'Zabudol som heslo'
    },
    'players': {
        'placeholder': 'Toto je rebríček hráčov. Body do rebríčka získavaš za odohrané ${href|internal|matches|zápasy}. Vyzvi niekoho na zápas prostredníctvom ${href|internal|messages|chatu} a možno budeš prvý práve ty!',
        'title': 'Rebríček',
        'unseen': {
            '1': '${count} aktualizovaný hráč',
            '2-4': '${count} aktualizovaní hráči',
            '5+': '${count} aktualizovaných hráčov'
        }
    },
    'profile': {
        'passwordConfirmation': 'Pre potvrdenie zmeny údajov prosím zadaj svoje aktuálne heslo',
        'submit': 'Uložiť',
        'title': 'Profil',
        'userNotFound': 'Ľutujeme, ale hráč s týmto nickom na našom portáli neexistuje'
    },
    'registration': {
        'submit': 'Zaregistrovať sa',
        'title': 'Registrácia'
    },
    rules,
    'seasons': ['zima', 'jar', 'leto', 'jeseň'],
    'soon': 'čoskoro',
    'table': {
        'completed': {
            'long': 'Čas registrácie',
            'short': 'Čas reg.'
        },
        'createdById': {
            'long': 'Hráč',
            'short': 'Hráč'
        },
        'divisionExpected': {
            'long': 'Divízia',
            'short': 'Div.'
        },
        'draws': {
            'long': 'Remízy',
            'short': 'R'
        },
        'goalDifference': {
            'long': 'Gólový rozdiel',
            'short': 'GR'
        },
        'form': {
            'long': 'Forma',
            'short': 'Forma'
        },
        'losses': {
            'long': 'Prehry',
            'short': 'P'
        },
        'matches': {
            'long': 'Zápasy',
            'short': 'Z'
        },
        'money': {
            'long': 'Cena',
            'short': 'Cena'
        },
        'overtimeLosses': {
            'long': 'Prehry po predĺžení',
            'short': 'PP'
        },
        'overtimeWins': {
            'long': 'Výhry po predĺžení',
            'short': 'VP'
        },
        'penaltyPoints': {
            'long': 'Trestné body',
            'short': 'TB'
        },
        'place': {
            'long': 'Miesto',
            'short': 'Miesto'
        },
        'points': {
            'long': 'Body',
            'short': 'B'
        },
        'rank': {
            'long': 'Poradie',
            'short': '#'
        },
        'rating': {
            'long': 'Rating',
            'short': 'Rating'
        },
        'score': {
            'long': 'Skóre',
            'short': 'Skóre'
        },
        'userId': {
            'long': 'Hráč',
            'short': 'Hráč'
        },
        'wins': {
            'long': 'Výhry',
            'short': 'V'
        }
    },
    'user': {
        'admin': 'admin',
        'dnf': {
            'short': 'DNF',
            'long': 'diskvalifikovaný'
        },
        'logout': 'Odhlásiť sa'
    }
};
