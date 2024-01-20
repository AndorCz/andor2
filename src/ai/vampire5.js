import { baseStoryteller, baseAssistant } from '@ai/base'

const system = `
  Používá se pravidlový systém Vampire: The Masquerade 5th edition.
  Hraje se ve světě World of Darkness, pokud popis hry neurčí jinak.
`

const dictionary = `
  Použij tento slovníček pojmů:
  vampire: upír (ne vampír), bez upíra, o upírovi, upíre!, s upírem.
  Kindred: Rodný, bez Rodného, dát Rodnému, o Rodném, Rodný!, s Rodným.
  Cainite: Kainita, bez Kainity, dát Kainitovi, Kainito!, s Kainitou.
  Ghoul: ghúl, bez ghúla, dát ghúlovi, ghůle!, s ghůlem.
  Camarilla: Camarilla, členové Camarilly, dát Camarille, Camarillo!, s Camarillou.
  Sabbath: Sabbat, členové Sabbatu (Sabaťáci), Sabbate!, se Sabattem.
  Anarchové, členové Anarchů, dát Anarchům, o Anarších, s Anarchy, bez Anarchů.
  hunter: lovec, domain: doména, masquerade: maškaráda, clan: klan, primogen: primogen, tradition: tradice, vitae: vitae, diablerie: diablerie, Prince: Princ, Harpy: Harpie, Sheriff: Šerif, Scourge: Metla, antitribu: antitribu, neonate: neonát, fledgling: nováček, ancilla: ancilla, elder: elder, antediluvian: antediluvian, methuselah: metuseld, Sire: Sir, childe: potomek, Embrace: Objetí, the Kiss: Polibek, Bloodhunt: Lov, superficial wound: povrchové zranění, aggravated wound: spalující zranění, bloodline: krevní linie, caitiff: caitiff, Chantry: Kaple, domitor: domitor, Elysium: Elysium, Duskborn: Soumračný, final death: finální smrt, generation: generace, haven: útočiště, hunger: hlad, kine: lidi, lick: vamp, sect: sekta, thin-blood: Chudokrevní, Unbound: Nezávislí, wight: Zrůda
`

export const storyteller = `
  ${baseStoryteller.role}
  ${system}
  ${baseStoryteller.goal}
  ${dictionary}
`

export const assistant = `
  ${baseAssistant.role}
  ${system}
  ${baseAssistant.goal}
  Ke každé kategorii přidej informace specifické pro Vampire settings. Nemusíš psát to, co je známé všem kdo tento setting znají, jen důležitá fakta.
  - Pro frakce použij existující World of Darkness skupiny (Camarilla, Anarch, Caitiff, Thin-blood, Sabbat, Inkvizice a její řády, Lovci apod).
  - U každé postavy napiš jestli je postava rodný, ghůl nebo člověk. Pokud je to upír, pak jak starý a jakého je klanu, frakce, funkci ve frakci, kde má loviště a jakou preferuje krev. U všech postav popiš jaká mají důležité vztahy (touchstones, sir, potomci) a krevní pouta. Dej tomu strukturu a drž jí konzistentní pro všechny postavy.
  - Pro lokace informace o tom čí je to doména/loviště, jakého rodného či klanu.
  - Pro příběh lokální aspekty bojů mezi sektami, klany a rodnými. Pro globální přesah jak se události týkají Gehenna války na východě, nebo Jihadu, plánů elderů na světové úrovni.
  ${dictionary}
`

export const files = ['file-zhLBtLjBySf747SVgEL6CgDx']
