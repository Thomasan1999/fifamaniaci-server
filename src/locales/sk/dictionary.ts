type GrammaticalCase = 'n' | 'g' | 'd' | 'a' | 'l' | 'i';
type GrammaticalNumber = 'sg' | 'pl';
type GrammaticalGender = 'mA' | 'mI' | 'f' | 'n';

type Word = string | {
    adjective?: {
        [key in GrammaticalCase]?: {
            [key in GrammaticalNumber]?: {
                [key in GrammaticalGender]?: string
            }
        }
    },
    noun?: {
        [key in GrammaticalCase]?: {
            [key in GrammaticalNumber]?: string
        }
    },
    [s: string]: Word | Word[]
};

const dictionary: Word = {
    'email': 'email',
    'leagueSeasons': {
        'months': [
            {
                'noun': {
                    'n': {
                        'sg': 'január'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'januárová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'januárovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'február'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'februárová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'februárovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'marec'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'marcová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'marcovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'apríl'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'aprílová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'aprílovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'máj'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'májová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'májovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'jún'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'júnová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'júnovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'júl'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'júlová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'júlovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'august'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'augustová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'augustovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'september'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'septembrová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'septembrovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'október'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'októbrová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'októbrovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'november'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'novembrová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'novembrovej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'december'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'decembrová'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'decembrovej'
                        }
                    }
                }
            }
        ],
        'quarters': [
            {
                'noun': {
                    'n': {
                        'sg': 'zima'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'zimná'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'zimnej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'jar'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'jarná'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'jarnej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'leto'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'letná'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'letnej'
                        }
                    }
                }
            },
            {
                'noun': {
                    'n': {
                        'sg': 'jeseň'
                    }
                },
                'adjective': {
                    'n': {
                        'sg': {
                            'f': 'jesenná'
                        }
                    },
                    'l': {
                        'sg': {
                            'f': 'jesennej'
                        }
                    }
                }
            }
        ]
    },
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
    'username': 'nick'
};

export default dictionary;
