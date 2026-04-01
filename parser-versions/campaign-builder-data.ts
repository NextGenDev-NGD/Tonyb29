// campaign-builder-data.ts
// All campaign world data for Eldoria (Gathering Darkness).
// Pre-baked from the ChatGPT session log + confirmed decisions.

// ─── TYPES ──────────────────────────────────────────────────

export interface FolderSpec {
  name: string
  type: 'JournalEntry' | 'Actor'
  parentName?: string
  color?: string
}

export interface NpcDef {
  name: string
  title: string
  race: string
  cls: string
  alignment: string
  cr: number
  creatureType: string
  continent: string
  subfolder?: string   // optional — places actor in a subfolder of the continent folder
  bio: string
  appearance: string
  relationships: string
  img: string
}

export interface CreatureDef {
  name: string
  cr: number
  creatureType: string
  alignment: string
  bio: string
  img: string
  statText?: string  // raw stat block text — when present, Step 4 builds a fully-statted actor
}

export interface ContinentDef {
  name: string
  theme: string
  geography: string
  culture: string
  locations: string[]
}

export interface JournalPageDef {
  name: string
  html: string
}

export interface JournalDef {
  name: string
  folder: string
  pages: JournalPageDef[]
}

// ─── FOLDERS ────────────────────────────────────────────────

export const JOURNAL_FOLDERS: FolderSpec[] = [
  { name: 'Eldoria Campaign',          type: 'JournalEntry', color: '#4a1d96' },
  { name: 'World Lore',                type: 'JournalEntry', parentName: 'Eldoria Campaign', color: '#1e3a5f' },
  { name: 'Continents',                type: 'JournalEntry', parentName: 'World Lore',        color: '#1e4a6f' },
  { name: 'Factions & Organizations',  type: 'JournalEntry', parentName: 'Eldoria Campaign', color: '#2a1a4c' },
  { name: 'Plot & Story',              type: 'JournalEntry', parentName: 'Eldoria Campaign', color: '#4c1a1a' },
  { name: 'NPC Bios',                  type: 'JournalEntry', parentName: 'Eldoria Campaign', color: '#1a4c2a' },
]

export const ACTOR_FOLDERS: FolderSpec[] = [
  { name: 'Eldoria — Leaders',   type: 'Actor', color: '#713f12' },
  { name: 'Lumaria',             type: 'Actor', parentName: 'Eldoria — Leaders', color: '#1a4c2a' },
  { name: "Drak'Thar",           type: 'Actor', parentName: 'Eldoria — Leaders', color: '#7c1a1a' },
  { name: 'Aetheria',            type: 'Actor', parentName: 'Eldoria — Leaders', color: '#1a2a6c' },
  { name: 'Solara',              type: 'Actor', parentName: 'Eldoria — Leaders', color: '#6c5a00' },
  { name: 'Frostholm',           type: 'Actor', parentName: 'Eldoria — Leaders', color: '#1a4a6c' },
  { name: 'Zephyria',            type: 'Actor', parentName: 'Eldoria — Leaders', color: '#2a6c1a' },
  { name: 'Cogoria',             type: 'Actor', parentName: 'Eldoria — Leaders', color: '#5a4a00' },
  { name: 'Cogoria — Engineering',  type: 'Actor', parentName: 'Cogoria', color: '#5a3a00' },
  { name: 'Cogoria — Magistrate',   type: 'Actor', parentName: 'Cogoria', color: '#3a3a5a' },
  { name: 'Cogoria — Technomancy',  type: 'Actor', parentName: 'Cogoria', color: '#3a1a5a' },
  { name: 'Cogoria — Magitech',     type: 'Actor', parentName: 'Cogoria', color: '#5a1a1a' },
  { name: 'Eldoria — Creatures', type: 'Actor', color: '#3b1a1a' },
]

// ─── NPC DATA ───────────────────────────────────────────────

const A = 'https://assets.forge-vtt.com/61e22856342cc71dfa3d306c/worlds/test-world/'

export const NPCS: NpcDef[] = [

  // ── LUMARIA ──────────────────────────────────────────────
  {
    name: 'High Elder Elysara Windrune',
    title: 'High Elder of Lumaria — Primary Leader of the Council of Elders',
    race: 'Elf', cls: 'Druid (Circle of the Moon)',
    alignment: 'neutral good', cr: 15, creatureType: 'humanoid', continent: 'Lumaria',
    bio: "<p><strong>High Elder Elysara Windrune</strong> is the revered primary leader of Lumaria and one of the most respected figures on the Council of Elders. She comes from a long line of powerful elven druids who have safeguarded the continent for generations. As a young elf she discovered a prodigious connection with the Sylvan Trees — ancient guardians of nature's balance — and quickly rose in prominence among the druidic circles.</p><p><strong>Background:</strong> Elysara's leadership has been tested repeatedly by external forces seeking to exploit Lumaria's magical resources. Her foresight and ability to navigate complex political landscapes have protected the continent while fostering alliances across Eldoria. Her complementary relationship with @Actor[Archdruid Caladria Stormbloom]{Archdruid Caladria Stormbloom} — political leadership paired with spiritual authority — is the foundation of Lumaria's stability.</p><p><strong>Personality:</strong> Wise, nurturing, and principled. An idealistic pacifist who governs through wisdom and consensus. Deeply distrustful of haste and militarism. Believes in the coexistence of magic and technology, as long as they respect nature's delicate balance. Aligns closely with @Actor[Archmage Alaric Silverwind]{Archmage Alaric Silverwind} of Aetheria and @Actor[High Druidess Elowen Galewind]{Zephyria's} leadership on measured, careful approaches.</p><p><strong>Political Ties:</strong> Views @Actor[High Magister Victor Ironforge]{Cogoria's} Ragolyte reliance as reckless and dangerous. Disapproves of @Actor[High King Torvald Ironheart]{Drak'Thar's} aggression but privately respects Torvald's directness. Works in close partnership with @Actor[High Chancellor Thalren Moonshadow]{High Chancellor Thalren Moonshadow} and @Actor[Grand Arbiter Selene Starweaver]{Grand Arbiter Selene Starweaver} as a ruling triumvirate.</p><p><strong>Convocation:</strong> \"We are at the brink. Ragolyte corruption threatens all of Astaria. We must act wisely and together — haste without wisdom is ruin.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Sylvaran Moonpetal (High Elf bard and traveling diplomat — keeps Elysara grounded while offering counsel). Offspring: Liria Windrune (daughter, druidic prodigy with deep connection to Lumaria's forests), Talen Windrune (son, wizard scholar fascinated by ancient runes who often wanders into trouble).</p>",
    appearance: "Ancient elven sage with silver-white flowing hair adorned with intricate wooden jewelry. Emerald-green eyes that hold the wisdom of countless years. Wears ethereal flowing robes embroidered with celestial patterns, leaves, and vines in gold and green. Carries a gnarled wood staff topped with a radiant crystal. Her presence carries the weight of generations of druidic stewardship.",
    relationships: 'Lover: Sylvaran Moonpetal (High Elf bard and traveling diplomat — keeps her grounded while offering counsel). Children: Liria Windrune (daughter, young druidic prodigy deeply connected to Lumaria\'s forests), Talen Windrune (son, scholarly wizard fascinated by ancient runes who wanders into trouble).',
    img: A + 'Elysara Windrune.png',
  },
  {
    name: 'High Chancellor Thalren Moonshadow',
    title: "High Chancellor of Lumaria — Chief Diplomat and Strategist",
    race: 'Elf', cls: 'Bard (College of Eloquence)',
    alignment: 'true neutral', cr: 12, creatureType: 'humanoid', continent: 'Lumaria',
    bio: "<p><strong>High Chancellor Thalren Moonshadow</strong> is Lumaria's chief diplomat and strategist, wielding political influence from the heart of the continent's governance. An enigmatic elven statesman born into an esteemed family of diplomats, he proved his mettle early through shrewdness and visionary leadership.</p><p><strong>Background:</strong> Thalren's primary drive is to strengthen Lumaria's ties with other continents — seeking mutual prosperity and alliances while safeguarding Lumaria's secrets from malevolent forces. Where @Actor[High Elder Elysara Windrune]{Elysara} focuses on Lumaria's natural preservation, Thalren is the bridge-builder, fostering collaborations and trade that benefit all realms. His vision is a united Eldoria where continents face common challenges together.</p><p><strong>Personality:</strong> Calculated and pragmatic — a deliberate counterweight to Elysara's idealism. Advocates for stronger ties with @Actor[High King Torvald Ironheart]{Drak'Thar} and values measured analysis over emotional response. Shares a quiet mutual understanding with @Actor[Ice Queen Freya Frostbane]{Ice Queen Freya Frostbane} of Frostholm — both value stability through measured strength. Deeply distrustful of @Actor[High Magister Victor Ironforge]{Cogoria's} secrecy.</p><p><strong>Political Ties:</strong> Close working partner with @Actor[High Elder Elysara Windrune]{High Elder Elysara Windrune} and @Actor[Grand Arbiter Selene Starweaver]{Grand Arbiter Selene Starweaver} — the three form Lumaria's ruling triumvirate. His lover Callista Shadowbloom's background as a Drow spy makes him a figure of quiet intelligence-gathering capability that few on the Council suspect.</p><p><strong>Convocation:</strong> \"Patience and analysis are our allies. Rash action may destabilize Astaria itself — and hand our enemies exactly what they want.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Callista Shadowbloom (Drow rogue-turned-spy — dangerous but loyal, assists Thalren's political intrigues). Offspring: Kaelin Moonshadow (son, skilled assassin working in shadows to uphold the Chancellor's rule), Ellanora Moonshadow (daughter, young sorceress with unyielding curiosity about Ragolyte's magical properties).</p>",
    appearance: "Dignified elven statesman with long silvery hair streaked with black, cascading down his back. Piercing blue eyes that exude diplomacy and unwavering dedication. Wears dark blue robes bearing silver runes and a regal cloak fastened with moon-shaped clasps. A golden crescent moon medallion rests at his collar — the symbol of his office.",
    relationships: "Lover: Callista Shadowbloom (Drow rogue-turned-spy — dangerous but loyal accomplice in political intrigues). Children: Kaelin Moonshadow (son, skilled assassin operating in the shadows to uphold the Chancellor's rule), Ellanora Moonshadow (daughter, young sorceress with unyielding curiosity about Ragolyte).",
    img: '',
  },
  {
    name: 'Grand Arbiter Selene Starweaver',
    title: "Grand Arbiter of Lumaria — Supreme Judicial Authority",
    race: 'Half-Elf', cls: 'Wizard (Order of Scribes)',
    alignment: 'lawful good', cr: 12, creatureType: 'humanoid', continent: 'Lumaria',
    bio: "<p><strong>Grand Arbiter Selene Starweaver</strong> is Lumaria's supreme judicial authority — a symbol of integrity, impartiality, and the rule of law. She earned her position through an unwavering commitment to justice and her formidable prowess as a mage, and she has never once compromised either.</p><p><strong>Background:</strong> Throughout her career Selene has fought corruption and abuses of power at every level of Lumaria's society, ensuring the continent remains just and fair regardless of social standing or magical ability. She presides over the courts with an authority that brooks no argument. Under her guidance Lumaria has built its reputation as a realm where disputes are resolved through dialogue and righteousness rather than force.</p><p><strong>Personality:</strong> Stern, just, and utterly impartial. Possesses a deep sense of duty that extends beyond Lumaria's borders — she aligns closely with @Actor[High Druidess Elowen Galewind]{Zephyria's} values of collective accountability. Views @Actor[Lady Seraphina Nightshade]{Lady Seraphina Nightshade} of Aetheria with measured suspicion — the Shadowveil Court's methods sit poorly with her judicial sensibilities.</p><p><strong>Political Ties:</strong> Third member of Lumaria's ruling triumvirate alongside @Actor[High Elder Elysara Windrune]{High Elder Elysara Windrune} and @Actor[High Chancellor Thalren Moonshadow]{High Chancellor Thalren Moonshadow}. Each brings a complementary strength — natural wisdom, political strategy, and legal authority. Selene is the check on the other two.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Kieran Aetherglow (Aasimar cleric — devoted healer who provides spiritual balance to Selene's strict nature). Offspring: Caius Starweaver (son, knight devoted to justice representing the ideal of strength and compassion), Aria Starweaver (daughter, bard known for her ethereal voice that inspires unity among Lumaria's people).</p>",
    appearance: "An elegant and imposing Half-Elf whose alabaster skin seems to glow with an inner light. Platinum-blonde hair worn up beneath a tall headdress adorned with stars and moons. Lavender eyes with an otherworldly glow that misses nothing. Wears celestial robes of midnight blue and gold adorned with intricate constellation patterns — symbolizing her role in maintaining cosmic balance. Carries a star-topped staff.",
    relationships: 'Lover: Kieran Aetherglow (Aasimar cleric — devoted healer who provides spiritual balance to her strict nature). Children: Caius Starweaver (son, knight devoted to justice, ideal balance of strength and compassion), Aria Starweaver (daughter, bard with an ethereal voice known for inspiring unity).',
    img: '',
  },
  {
    name: 'Archdruid Caladria Stormbloom',
    title: "Archdruid of Lumaria — Spiritual Steward and Voice of the Sylvan Trees",
    race: 'Half-Orc', cls: 'Druid (Circle of the Land — Forest)',
    alignment: 'neutral good', cr: 12, creatureType: 'humanoid', continent: 'Lumaria',
    bio: "<p><strong>Archdruid Caladria Stormbloom</strong> is the spiritual and natural authority of Lumaria — chosen successor of the previous Archdruid, a rare honor that affirmed her destined role as steward of the continent's natural wonders. She carries ancient druidic knowledge and serves as the primary intermediary between the Sylvan Trees and Lumaria's people.</p><p><strong>Background:</strong> From a young age Caladria displayed an innate gift for communing with the spirits of the land and the creatures of the forest. When the previous Archdruid named her successor, it was not a surprise to anyone who had witnessed her connection to the Sylvan Trees. As Archdruid she leads the druidic circles in sacred rituals, guides the continent's spiritual defense, and advocates globally for sustainable practices.</p><p><strong>Personality:</strong> Her bond with the Sylvan Trees allows her to sense disturbances in nature before they manifest as crises — making her one of the earliest and most credible voices of alarm about the Ragolyte corruption. Fiercely opposes @Actor[High Magister Victor Ironforge]{Cogoria's} Ragolyte extraction policies. Works in close collaboration with @Actor[Frost Shaman Ingrid Icecaller]{Frost Shaman Ingrid Icecaller} of Frostholm — a bond of shared elemental devotion across continental lines. Partners with @Actor[Windcaller Aria Skywhisper]{Windcaller Aria Skywhisper} of Zephyria on cross-continental nature preservation efforts.</p><p><strong>Political Ties:</strong> Serves as the spiritual complement to @Actor[High Elder Elysara Windrune]{High Elder Elysara Windrune's} political leadership. Where Elysara governs, Caladria guides. Her role in rallying the druidic circles against external threats has historically been decisive — and she is quietly preparing to do so again.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Theren Greenthistle (Firbolg ranger — humble wanderer deeply attuned to nature). Offspring: Finnian Stormbloom (son, carefree druid who communes effortlessly with wildlife), Nerisse Stormbloom (daughter, tempest cleric whose personality mirrors the volatile power of storms).</p>",
    appearance: "Half-Orc with moss-green hair resembling ferns, stormy gray eyes, and faint green-hued skin that speaks to her deep attunement with the land. Wears leather armor with floral patterns, a moss-like cape, and vines coiled around both arms. Carries a gnarled staff hung with glowing mushrooms and carved nature motifs — a gift from the Sylvan Trees themselves, it is said.",
    relationships: 'Lover: Theren Greenthistle (Firbolg ranger — humble wanderer deeply attuned to nature). Children: Finnian Stormbloom (son, carefree druid who communes effortlessly with wildlife), Nerisse Stormbloom (daughter, tempest cleric whose personality mirrors the volatile power of storms).',
    img: '',
  },

  // ── DRAK'THAR ────────────────────────────────────────────
  {
    name: 'High King Torvald Ironheart',
    title: "High King of Drak'Thar — Ruler of Forgehold",
    race: 'Dwarf', cls: 'Fighter (Battle Master)',
    alignment: 'lawful neutral', cr: 15, creatureType: 'humanoid', continent: "Drak'Thar",
    bio: "<p><strong>High King Torvald Ironheart</strong> rules Drak'Thar from the dwarven capital of Forgehold with absolute conviction and unyielding determination. He hails from a long line of kings dedicated to dwarven traditions of craftsmanship, martial strength, and technological marvels. His rule has ensured the stability and prosperity of Drak'Thar through decisive leadership that brooks no weakness.</p><p><strong>Background:</strong> Before ascending to the throne, Torvald was a legendary warrior who led the dwarven armies through several crucial defensive campaigns. His most celebrated feat was personally slaying a formidable dragon that threatened Forgehold, cementing his reputation as a hero among his people and earning the title of High King.</p><p><strong>Personality:</strong> Proud, direct, and uncompromising. Values strength and decisive action above diplomacy or deliberation. He co-rules Drak'Thar alongside @Actor[Queen Astrid Emberbane]{Queen Astrid Emberbane} — where Torvald is blunt force, Astrid provides calculated cunning. He respects her moderating influence even when he outwardly resists it.</p><p><strong>Political Ties:</strong> Wary of @Actor[Archmage Alaric Silverwind]{Aetheria's} theoretical approach to the crisis. Deeply skeptical of @Actor[High Magister Victor Ironforge]{Cogoria's} secrecy. Most aligned with direct action — would prefer a military response to the shadow corruption if given the choice.</p><p><strong>Convocation:</strong> \"We cannot sit idly. Ragolyte is decaying, and decisive action alone saves lives. Every day we debate is a day the enemy gains ground.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Helga Stonehelm (Dwarven warlord — strong-willed military strategist). Offspring: Bjorn Ironheart (son, fearless berserker leading elite warriors), Ragna Ironheart (daughter, shrewd politician expanding Drak'Thar's influence).</p>",
    appearance: "Stout and powerfully built, with a magnificent gray beard braided with gold thread and gemstone clasps — each stone representing a battle won. Deep-set brown eyes beneath a heavy golden-and-iron crown. Ornate plate armor embossed with dragon motifs and dwarven runes recounting his people's history. Carries a polished battleaxe at all times.",
    relationships: "Lover: Helga Stonehelm (Dwarven warlord — his strong-willed queen and military strategist). Children: Bjorn Ironheart (son, fearless berserker who leads Drak'Thar's elite warriors), Ragna Ironheart (daughter, shrewd politician vying to expand Drak'Thar's influence).",
    img: '',
  },
  {
    name: 'Queen Astrid Emberbane',
    title: "Queen of the Dragonkin Clans, Drak'Thar",
    race: 'Dwarf/Dragonkin', cls: 'Barbarian (Path of the Berserker)',
    alignment: 'chaotic neutral', cr: 13, creatureType: 'humanoid', continent: "Drak'Thar",
    bio: "<p><strong>Queen Astrid Emberbane</strong> rules the dragonkin clans of Drak'Thar's volcanic regions, co-governing alongside @Actor[High King Torvald Ironheart]{High King Torvald Ironheart}. Fierce, strategic, and deeply proud of her people's draconic heritage, she has united clans that once warred constantly under her leadership.</p><p><strong>Background:</strong> Astrid was once an outcast — exiled from her clan for her refusal to accept the limits of their volcanic territory. In her travels she encountered ancient dragons who taught her the ways of dragon magic and the secrets of technomancy. Returning with this power, she challenged her clan's traditions in a grand tournament of dragons and emerged victorious, becoming Queen. Her story is the defining legend of dragonkin unity in Drak'Thar.</p><p><strong>Personality:</strong> Fierce determination paired with strategic acumen — where @Actor[High King Torvald Ironheart]{Torvald} is blunt force, Astrid calculates. She moderates his aggression when it serves her strategy and pushes harder when it doesn't. Fiercely protective of dragonkin independence and their ancient draconic knowledge.</p><p><strong>Political Ties:</strong> Works in close tandem with @Actor[High King Torvald Ironheart]{Torvald}. Views @Actor[Dragonlord Valeria Flamescale]{Dragonlord Valeria Flamescale} as a valuable military asset and ally. Skeptical of @Actor[Archmage Alaric Silverwind]{Aetheria's} academic caution.</p><p><strong>Convocation:</strong> \"Torvald's fire must be tempered with strategy. We cannot afford ruin from haste — but we cannot afford paralysis either.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Kaelen Firebrand (Human sorcerer with dragon ancestry). Offspring: Sirius Emberbane (son, dragonblood sorcerer struggling with control), Thyra Emberbane (daughter, skilled diplomat who disarms with charm).</p>",
    appearance: 'Fiery red hair braided tightly with iron clasps, amber eyes ablaze with inner fire, freckled face marked with battle scars worn proudly. Darkened armor adorned with dragon scale patterns and crimson accents — symbolizing the unbreakable bond between her kingdom and the dragons. Carries a fearsome warhammer and a crimson cape trimmed with fur.',
    relationships: 'Lover: Kaelen Firebrand (Human sorcerer with dragon ancestry — a fiery partner who fuels her ambitions). Children: Sirius Emberbane (son, dragonblood sorcerer with immense but unstable potential), Thyra Emberbane (daughter, skilled diplomat who disarms enemies with charm).',
    img: '',
  },
  {
    name: 'Chief Engineer Magnus Geargrind',
    title: "Chief Engineer of Drak'Thar — Head of the Technomancer's Guild",
    race: 'Dwarf/Gnome', cls: 'Artificer (Battle Smith)',
    alignment: 'neutral', cr: 10, creatureType: 'humanoid', continent: "Drak'Thar",
    bio: "<p><strong>Chief Engineer Magnus Geargrind</strong> leads Drak'Thar's Technomancer's Guild — the institution that bridges the continent's fierce martial culture with the precision of arcane engineering. Brilliant, eccentric, and endlessly curious, he is regarded as the greatest living artificer outside of Cogoria.</p><p><strong>Background:</strong> Magnus began as a tinkerer among his gnomish kin, his insatiable thirst for knowledge driving him into the mysteries of technomancy at great personal risk. Rather than banishment, his inventions earned recognition and respect, and he rose to become Chief Engineer — advocating always for responsible technological innovation over reckless advancement.</p><p><strong>Personality:</strong> Friendly and enthusiastic in person, but fiercely protective of Drak'Thar's technological secrets and cautious about sharing inventions with outsiders. Holds a spirited collaborative rivalry with @Actor[Grand Alchemist Isadora Everbloom]{Grand Alchemist Isadora Everbloom} of Aetheria — competitive but mutually respectful. Has a more guarded relationship with @Actor[High Magister Victor Ironforge]{Cogoria's leadership}, whom he views as too secretive.</p><p><strong>Political Ties:</strong> Loyal to @Actor[High King Torvald Ironheart]{High King Torvald Ironheart}. Serves as a key advisor on technological matters. His guild is increasingly important as Ragolyte infrastructure fails — he may hold solutions others don't.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Talia Rivetflash (Gnome inventor — playful but brilliant counterpart). Offspring: Quinn Geargrind (son, artificer dreaming of sentient constructs), Mira Geargrind (daughter, rogue exploiting technological weaknesses).</p>",
    appearance: 'Wiry and perpetually soot-covered, gear-shaped goggles pushed up on his forehead revealing bright curious eyes. A short singed beard of mixed dwarf-gnome heritage. Wears patchwork leather layered with tool belts and metallic accessories. Carries a mechanical hammer that crackles with arcane energy — both a weapon and a diagnostic tool.',
    relationships: 'Lover: Talia Rivetflash (Gnome inventor — playful but brilliant counterpart in technomancy). Children: Quinn Geargrind (son, artificer who dreams of creating sentient constructs), Mira Geargrind (daughter, mischievous rogue with a knack for exploiting technological weaknesses).',
    img: '',
  },
  {
    name: 'Dragonlord Valeria Flamescale',
    title: "Dragonlord of Drak'Thar — Figurehead of the Dragon Alliance",
    race: 'Dragonborn', cls: 'Ranger (Beast Master)',
    alignment: 'lawful neutral', cr: 12, creatureType: 'humanoid', continent: "Drak'Thar",
    bio: "<p><strong>Dragonlord Valeria Flamescale</strong> is the figurehead of Drak'Thar's dragon alliance — a symbol of unity between the dwarven clans and the dragonkin. Charismatic, skilled in both magic and combat, and frequently the voice of reason among the sometimes-warring clans, her presence commands instinctive respect from friend and foe alike.</p><p><strong>Background:</strong> Valeria was not born to the title. She was a rogue and spy among the dragonkin, her skills in infiltration unmatched. When a powerful cabal of dark mages threatened her people, she infiltrated their ranks alone, gathered critical intelligence, and turned the tide of the conflict. Her actions earned her the title of Dragonlord and made her a symbol of determination and sacrifice for the common good. Her ceremonial dragon-scale armor was gifted by her loyal dragon companion in recognition of their bond.</p><p><strong>Personality:</strong> Commanding and charismatic, but measured. Seeks peaceful coexistence between dragonkin and other races while fiercely defending Drak'Thar from external threats. Aligns philosophically with @Actor[Sun King Raedan Sunstrider]{Sun King Raedan Sunstrider} of Solara on the value of decisive but principled action.</p><p><strong>Political Ties:</strong> Works in close alliance with @Actor[Queen Astrid Emberbane]{Queen Astrid Emberbane} on dragonkin matters. Respected by @Actor[High King Torvald Ironheart]{High King Torvald Ironheart} as a military asset. Her intelligence background makes her quietly valuable in the current political crisis.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Kaelor Drakthorn (Dragonborn knight — steadfast protector in her service). Offspring: Xyra Flamescale (daughter, commands her own flight of wyverns), Zarrok Flamescale (son, mysterious warlock rumored to have a pact with an ancient dragon).</p>",
    appearance: 'Shimmering red-gold scales, amber eyes radiating quiet confidence. Wears ceremonial dragon-scale armor gifted by her dragon companion, a gleaming spear tipped with a dragon fang, and flames flicker naturally about her hands when she is emotionally engaged. Her presence fills a room before she speaks.',
    relationships: 'Lover: Kaelor Drakthorn (Dragonborn knight — steadfast protector and warrior in her service). Children: Xyra Flamescale (daughter, fierce dragonborn who commands her own wyvern flight), Zarrok Flamescale (son, mysterious warlock with rumored pact with an ancient dragon).',
    img: '',
  },

  // ── AETHERIA ─────────────────────────────────────────────
  {
    name: 'Archmage Alaric Silverwind',
    title: 'Archmage of Aetheria — Head of the Archmages\' Consortium',
    race: 'Human', cls: 'Wizard (School of Evocation)',
    alignment: 'lawful neutral', cr: 17, creatureType: 'humanoid', continent: 'Aetheria',
    bio: "<p><strong>Archmage Alaric Silverwind</strong> is the head of the Archmages' Consortium and the foremost magical authority in Aetheria. A venerable perfectionist in his early sixties, he believes arcane mastery is the highest form of civilization and that other continents should defer to Aetheria's expertise in matters of Ragolyte resonance.</p><p><strong>Background:</strong> A prodigious mage who rose through the Astralhaven Mage's Guild with unparalleled speed, Alaric was instrumental in recovering ancient artifacts that bolstered Aetheria's magical prowess. His most celebrated achievement was brokering a peace treaty between feuding magical academies, ending a long-standing internal conflict. He personally mentored @Actor[High Arcanist Orion Stormweaver]{High Arcanist Orion Stormweaver}.</p><p><strong>Personality:</strong> Wise, composed, and diplomatically calculating. A voice of reason in political turmoil, though his confidence in Aetheria's superiority can border on arrogance. Aligns closely with @Actor[High Elder Elysara Windrune]{High Elder Elysara Windrune} of Lumaria on measured, analytical approaches to the crisis.</p><p><strong>Political Rivals:</strong> Primary rival is @Actor[High Magister Victor Ironforge]{High Magister Victor Ironforge} of Cogoria — he views Cogoria's rapid technomantic expansion as reckless and insufficiently grounded in arcane theory.</p><p><strong>Convocation:</strong> \"Ragolyte responds to magical resonance. Misuse risks unraveling Astaria itself. Careful analysis is not delay — it is survival.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Evelyn Moonglade (High Elf enchanter). Offspring: Lyra Silverwind (transmutation archmage), Eryndor Silverwind (cosmic magic researcher).</p>",
    appearance: 'Early sixties, short white hair, neatly trimmed beard, piercing silver eyes that glow faintly with immense magical power. Flowing robes in white and gold adorned with arcane symbols. Carries a polished silver staff topped with a swirling orb of light. Often found floating in his glowing magical library, surrounded by drifting books.',
    relationships: 'Lover: Evelyn Moonglade (High Elf enchanter — scholarly and loyal). Children: Lyra Silverwind (daughter, transmutation archmage), Eryndor Silverwind (son, cosmic magic researcher).',
    img: '',
  },
  {
    name: 'Lady Seraphina Nightshade',
    title: 'Head of the Shadowveil Court, Aetheria',
    race: 'Tiefling', cls: 'Sorcerer (Shadow Magic)',
    alignment: 'neutral', cr: 13, creatureType: 'humanoid', continent: 'Aetheria',
    bio: "<p><strong>Lady Seraphina Nightshade</strong> is the mysterious and elusive leader of the Shadowveil Court — Aetheria's enigmatic intelligence and shadow-magic institution. Her motives are veiled, but her influence over the arcane underworld is undeniable.</p><p><strong>Background:</strong> Seraphina was once a rogue and adventurer operating in the shadows, seeking powerful artifacts and secrets from the arcane underworld. Her encounter with an ancient shadow spirit granted her the ability to wield shadow magic and changed her perspective entirely. She formed the Shadowveil Court to investigate and counteract threats to Aetheria's magical equilibrium — protecting the balance between light and darkness.</p><p><strong>Personality:</strong> Mysterious, cunning, and calculating. She views most leaders as pieces to be moved. She secretly studies @Actor[LUKAS — Director of Cogoria]{Cogoria's technomantic methods} and sees political manipulation as a necessary art. Her public stance at the Convocation was unusually direct — suggesting she sees the corruption as an opportunity as much as a threat.</p><p><strong>Political Position:</strong> Nominally under @Actor[Archmage Alaric Silverwind]{Archmage Alaric Silverwind}'s Consortium but operates with significant autonomy. Most Council members are uneasy around her.</p><p><strong>Convocation:</strong> \"Caution alone is not enough. The corruption spreads while we debate. Someone in this room already knows more than they are saying.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Veylan Duskrend (Tiefling rogue — cunning accomplice). Offspring: Selris Nightshade (son, shadow sorcerer), Lilia Nightshade (daughter, necromancer).</p>",
    appearance: 'Tall with jet-black hair cascading past her shoulders, captivating red eyes (cold and calculating when at rest), a dark elegant gown with silver filigree, a dagger set with a glowing purple gem at her hip. Shadows coil naturally at her feet. Her arcane tattoos seem to shift with magical energy. Typically encountered in a shadowy tower with a crescent moon visible through the windows.',
    relationships: 'Lover: Veylan Duskrend (Tiefling rogue — cunning accomplice in her darker dealings). Children: Selris Nightshade (son, shadow sorcerer who commands fear), Lilia Nightshade (daughter, necromancer with eerie fascination with life and death).',
    img: '',
  },
  {
    name: 'High Arcanist Orion Stormweaver',
    title: "Head of Astralhaven's Mage Guild, Aetheria",
    race: 'Tiefling', cls: 'Wizard (School of Evocation — Storm)',
    alignment: 'lawful neutral', cr: 12, creatureType: 'humanoid', continent: 'Aetheria',
    bio: "<p><strong>High Arcanist Orion Stormweaver</strong> leads Astralhaven's Mage Guild, specializing in storm, elemental, and planar magic. He is passionate about understanding the fabric of reality and seeks to bridge the gap between the elemental planes and the material world.</p><p><strong>Background:</strong> As a young apprentice, Orion was a student of @Actor[Archmage Alaric Silverwind]{Archmage Alaric Silverwind}. His early experiments combining technomancy and arcane magic gained both admiration and skepticism. His breakthrough came when he successfully created a device that tapped safely into elemental plane energy — paving the way for safer exploration of otherworldly magic and earning him his current position.</p><p><strong>Personality:</strong> Scholarly, stern, and intensely focused. A charismatic mentor to his guild students and a passionate advocate for the responsible use of magic. Uses technomancy as a tool for safer study of elemental energies — viewing it as a means, not an end, unlike @Actor[High Magister Victor Ironforge]{Cogoria's leadership}.</p><p><strong>Political Position:</strong> Loyal to @Actor[Archmage Alaric Silverwind]{Archmage Alaric Silverwind} and shares his measured approach. Responsible for ensuring Aetheria's magical defenses remain unparalleled.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Cassia Windspire (Half-Elf bard). Offspring: Tarin Stormweaver (son, storm magic wizard), Ardyn Stormweaver (daughter, blends magic and swordplay).</p>",
    appearance: 'A lean Tiefling with deep blue skin, glowing white eyes, and curved black horns. Black hair pulled into a loose ponytail. Wears a high-collared cloak crackling with contained electricity. Carries a staff tipped with a glowing crystal shaped like a lightning bolt. Lightning arcs from his fingers when he gestures. Often found amid stormy skies with thunderclouds swirling around him.',
    relationships: 'Lover: Cassia Windspire (Half-Elf bard — creative soul who inspires his work). Children: Tarin Stormweaver (son, storm magic wizard), Ardyn Stormweaver (daughter, fencer blending magic and swordplay).',
    img: '',
  },
  {
    name: 'Grand Alchemist Isadora Everbloom',
    title: 'Leader of the Order of Alchemical Scholars, Aetheria',
    race: 'Gnome', cls: 'Artificer (Alchemist)',
    alignment: 'neutral good', cr: 10, creatureType: 'humanoid', continent: 'Aetheria',
    bio: "<p><strong>Grand Alchemist Isadora Everbloom</strong> leads Aetheria's Order of Alchemical Scholars — a group dedicated to unlocking the secrets of magical potions, elixirs, and the fusion of alchemy with technomancy. Widely regarded as a pioneer in magical research.</p><p><strong>Background:</strong> An alchemy prodigy from a young age, Isadora mastered complex elixirs that surpassed her teachers' expectations. Recognition came quickly across alchemical circles. Her defining achievement was developing a unique potion that allowed communication with magical creatures, which solidified her reputation and earned her leadership of the Order.</p><p><strong>Personality:</strong> Charismatic, endlessly curious, and perpetually enthusiastic. Carries an aura of youthful energy regardless of her age. Holds a spirited innovation rivalry with @Actor[Chief Engineer Magnus Geargrind]{Chief Engineer Magnus Geargrind} of Drak'Thar — competitive but respectful. Her combination of alchemy and technomancy has led to groundbreaking advancements that even @Actor[High Magister Victor Ironforge]{Cogoria} has taken notice of.</p><p><strong>Political Position:</strong> Collaborative and collegial. Works well across continental lines. Respected by @Actor[Archmage Alaric Silverwind]{Archmage Alaric Silverwind} as a practical counterpart to his theoretical focus.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Marcellus Greengrove (Human herbalist). Offspring: Ivy Everbloom (daughter, rebellious alchemist), Thorne Everbloom (son, botanical druid).</p>",
    appearance: 'A gnome woman with bright green hair tied in twin buns, golden goggles resting on her forehead, wide hazel eyes sparkling with curiosity. Wears a colorful alchemist\'s coat covered in potion vials, tools, and glowing reagent stains. Her hands glow faintly from magical residue. Typically found inside a whimsical alchemy lab filled with bubbling potions and strange luminescent plants.',
    relationships: 'Lover: Marcellus Greengrove (Human herbalist — gentle partner who supports her experiments). Children: Ivy Everbloom (daughter, rebellious alchemist), Thorne Everbloom (son, druid with botanical magic focus).',
    img: '',
  },

  // ── SOLARA ───────────────────────────────────────────────
  {
    name: 'Sun King Raedan Sunstrider',
    title: 'Sun King of Solara',
    race: 'Sun Elf', cls: 'Paladin (Oath of the Ancients)',
    alignment: 'lawful good', cr: 15, creatureType: 'humanoid', continent: 'Solara',
    bio: '<p><strong>Sun King Raedan Sunstrider</strong> is the revered ruler of Solara — a continent bathed in eternal sunlight and home to radiant civilizations. Charismatic and deeply connected to Solara\'s celestial energies, his presence radiates authority and divine blessing. He values unity among the continent\'s diverse peoples and strives to maintain the balance between light and shadow.</p><p><strong>Background:</strong> In his youth Raedan witnessed the invasion of Solara by dark forces. He joined the Solarian resistance, rallied his people through acts of bravery and self-sacrifice, and ultimately liberated the continent from tyranny. His crowning achievement was forging an alliance among the disparate desert kingdoms and becoming the Sun King — bringing unity to a fractured land for the first time in centuries.</p><p><strong>Personality:</strong> Charismatic and benevolent, yet unyielding when he perceives a divine mandate. Views the Ragolyte corruption as a sacred trial demanding immediate purification. His fiery conviction sometimes reads as recklessness — @Actor[Dragonlord Valeria Flamescale]{Valeria Flamescale} of Drak\'Thar shares his passion for bold action and is a natural military ally, while @Actor[Archmage Alaric Silverwind]{Alaric Silverwind} of Aetheria finds his zealotry a barrier to reasoned progress.</p><p><strong>Political Ties:</strong> Closest partner is @Actor[Dragonlord Valeria Flamescale]{Valeria Flamescale} — both favour decisive, principled shows of force. Maintains cautious respect for @Actor[Grand Arbiter Selene Starweaver]{Selene Starweaver} of Lumaria but finds her measured approach frustrating when divine truth feels obvious. Internally, his authority is balanced and sometimes challenged by @Actor[Queen Marcella Sandsinger]{Marcella} and @Actor[High Priestess Seraphia Sunfire]{Seraphia}.</p><p><strong>Convocation:</strong> "Divine truth demands immediate purification. Weakness and hesitation are forbidden!"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Amara Lighthaven (Aasimar paladin — radiant partner who inspires the people of Solara). Offspring: Kael Sunstrider (son, radiant soul sorcerer and heir to the throne), Selene Sunstrider (daughter, monk trained to embody the sun\'s discipline and strength).</p>',
    appearance: 'A tall, golden-skinned sun elf with flowing blonde hair and radiant blue eyes. His golden armour gleams with an inner radiance, and a brilliant sun-shaped amulet rests at his throat. He carries a massive greatsword etched with solar runes that glows faintly even in daylight.',
    relationships: 'Lover: Amara Lighthaven (Aasimar paladin). Children: Kael Sunstrider (radiant soul sorcerer/heir), Selene Sunstrider (sun-disciplined monk).',
    img: '',
  },
  {
    name: 'Queen Marcella Sandsinger',
    title: 'Desert Regent of Solara',
    race: 'Human', cls: 'Bard (College of Glamour)',
    alignment: 'lawful neutral', cr: 11, creatureType: 'humanoid', continent: 'Solara',
    bio: "<p><strong>Queen Marcella Sandsinger</strong> is the regent of Solara's desert kingdoms — a land where scorching sun conceals hidden mysteries. A formidable ruler with a deep understanding of elemental fire and sand magic, she is Solara's diplomatic counterweight to @Actor[Sun King Raedan Sunstrider]{Raedan}'s zealotry. She seeks to protect her people's ancient traditions while navigating complex continental politics.</p><p><strong>Background:</strong> Before becoming queen, Marcella was a celebrated explorer and adventurer in Solara's deserts. Her expeditions uncovered hidden ruins and forgotten civilizations, and she earned the respect of nomadic desert tribes for her deep understanding of their culture. When a succession crisis loomed, her vision and diplomatic skill made her the consensus candidate, and she was crowned desert queen.</p><p><strong>Personality:</strong> Graceful, opportunistic, and fiercely adaptable. A skilled mediator who believes faith without reason risks annihilation. Cultivates a pragmatic alliance with @Actor[High Chancellor Thalren Moonshadow]{Thalren Moonshadow} of Lumaria built on mutual respect for diplomacy. Sees @Actor[Ice Queen Freya Frostbane]{Freya Frostbane} as cold and unyielding — a direct contrast to Marcella's flexibility. Her shared appetite for power and intrigue with @Actor[Lady Seraphina Nightshade]{Seraphina Nightshade} of Aetheria leads to a complex mix of collaboration and rivalry.</p><p><strong>Political Ties:</strong> Balances @Actor[Sun King Raedan Sunstrider]{Raedan}'s divine certitude with pragmatic counsel. Works alongside @Actor[High Priestess Seraphia Sunfire]{Seraphia Sunfire} on internal matters but guards her political independence carefully. Has a business-like but watchful relationship with Cogoria's leadership.</p><p><strong>Convocation:</strong> \"Faith without reason risks annihilation. Haste must be measured.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Ravi Windsand (Human bard — a desert wanderer who matches Marcella's adventurous spirit). Offspring: Mira Sandsinger (daughter, bard known for mesmerizing performances), Darius Sandsinger (son, ranger who protects Solara's borders).</p>",
    appearance: 'A stunning human woman with golden-tan skin and wavy sun-kissed blonde hair that falls in perfect waves. Her amber eyes glow like liquid gold, radiating warmth and authority. She wears a regal gown that shimmers between gold and red as she moves, and a crown styled as a rising sun sits upon her head. A golden sceptre encrusted with rubies rests in her hand.',
    relationships: 'Lover: Ravi Windsand (Human bard). Children: Mira Sandsinger (bard), Darius Sandsinger (ranger).',
    img: '',
  },
  {
    name: 'High Priestess Seraphia Sunfire',
    title: 'High Priestess of the Sun Temple, Solara',
    race: 'Aasimar', cls: 'Cleric (Light Domain)',
    alignment: 'lawful good', cr: 12, creatureType: 'humanoid', continent: 'Solara',
    bio: "<p><strong>High Priestess Seraphia Sunfire</strong> is the spiritual heart of Solara and keeper of its sacred Sun Temples. A beacon of light and hope, she dedicates herself to maintaining the sanctity of solar worship and the balance between light and darkness. Her profound connection to the divine and her ability to channel solar energy for healing and empowerment make her one of the most beloved figures on the continent.</p><p><strong>Background:</strong> Seraphia began as a young acolyte in the Sun Temples, devoting herself entirely to faith and magical study. Her exceptional connection with solar energy and her gift for healing the wounded earned recognition among the temple elders. She was chosen as High Priestess following a rare solar eclipse — interpreted as a celestial sign of her destined role as Solara's spiritual guide.</p><p><strong>Personality:</strong> Serene but commanding. She frequently clashes with @Actor[Sun King Raedan Sunstrider]{Raedan} when his zeal overrides sacred doctrine — his conviction is admirable but must never eclipse the light of wisdom. Shares a kindred reverence for nature with @Actor[High Druidess Elowen Galewind]{Elowen Galewind} of Zephyria, though Seraphia's spirituality is rooted in solar divinity rather than earth-bound druidism. Views Cogoria's reliance on machinery over divine guidance with deep unease, though she holds a measured fascination for @Actor[Valeria Swiftspark]{Technocrat Valeria Swiftspark}'s brilliance.</p><p><strong>Political Ties:</strong> Serves as the moral compass of Solara's ruling triumvirate alongside @Actor[Sun King Raedan Sunstrider]{Raedan} and @Actor[Queen Marcella Sandsinger]{Marcella}. Her philosophical debates with @Actor[Thane Erik Coldforge]{Thane Erik Coldforge} of Frostholm — blunt practicality versus divine idealism — could become significant in cross-continental negotiations.</p><p><strong>Convocation:</strong> \"The sun does not burn to destroy — it burns to illuminate. We must be its light, not its fire.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Elarion Dawnspire (Aasimar cleric — devout partner who shares Seraphia's vision of spreading Solara's light). Offspring: Auriel Sunfire (daughter, radiant cleric blessed with divine healing powers), Tyrus Sunfire (son, warlock who struggles to reconcile his divine lineage with a mysterious infernal pact).</p>",
    appearance: 'A serene aasimar woman with radiant bronze skin and hair that burns like living fire, flickering with an eternal soft glow. Her golden eyes are calm yet commanding. She wears flowing white robes with intricate flame embroidery, golden pauldrons at her shoulders, and a radiant staff topped with a miniature sun rests in her hands. Her celestial aura marks her clearly as a servant of the divine.',
    relationships: 'Lover: Elarion Dawnspire (Aasimar cleric). Children: Auriel Sunfire (healer), Tyrus Sunfire (conflicted warlock).',
    img: '',
  },
  {
    name: 'General Asher Stormbreaker',
    title: 'General of the Solaran Army',
    race: 'Human', cls: 'Fighter (Eldritch Knight)',
    alignment: 'lawful good', cr: 12, creatureType: 'humanoid', continent: 'Solara',
    bio: "<p><strong>General Asher Stormbreaker</strong> is Solara's supreme military commander — a symbol of strength and valour who leads his forces with tactical brilliance and unwavering resolve. He is the first line of defence when darkness threatens the sun-blessed lands of Solara.</p><p><strong>Background:</strong> Before earning his commission, Asher was a wanderer and sellsword. His travels took him to distant lands, where he absorbed diverse fighting styles and military strategies from cultures across Eldoria. Returning to Solara, he proved his worth in successive campaigns against hostile invaders, rising through the ranks until his tactical genius earned him supreme command of the Solarian armies.</p><p><strong>Personality:</strong> Battle-hardened, direct, and fiercely loyal to Solara's sovereignty. His warrior's code resonates deeply with @Actor[High King Torvald Ironheart]{High King Torvald Ironheart} of Drak'Thar — mutual respect built on shared martial values. Shares an unspoken bond with @Actor[High Jarl Bjorn Frostbeard]{Bjorn Frostbeard} of Frostholm despite their continental rivalry — the kind of respect only soldiers understand. Distrusts @Actor[LUKAS — Director of Cogoria]{The Director} of Cogoria, believing technomancy makes soldiers weak and dependent on machines rather than their own strength.</p><p><strong>Political Ties:</strong> Serves the Solaran triumvirate as its sword-arm. Works pragmatically alongside @Actor[Sun King Raedan Sunstrider]{Raedan} and @Actor[Queen Marcella Sandsinger]{Marcella} but operates most comfortably on the battlefield rather than in council chambers. His distrust of Cogoria's influence keeps him a natural sceptic in any negotiation that involves technomantic solutions.</p><p><strong>Convocation:</strong> \"Solara's light is defended by strong arms and stronger wills. The sun does not negotiate with shadow.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Cassandra Brightblade (Human fighter — a seasoned warrior who fights alongside Asher in battle). Offspring: Draven Stormbreaker (son, brash and ambitious warlord forging his own path), Raya Stormbreaker (daughter, disciplined soldier renowned for her brilliant battlefield tactics).</p>",
    appearance: 'A rugged human man with sun-bronzed skin, short-cropped black hair, and a strong jawline. His hazel eyes flicker with intensity. He wears gleaming golden armour etched with flame motifs, and a crimson cape flows dramatically behind him. A massive flaming greatsword is strapped across his back.',
    relationships: 'Lover: Cassandra Brightblade (Human fighter). Children: Draven Stormbreaker (ambitious warlord), Raya Stormbreaker (disciplined soldier).',
    img: '',
  },

  // ── FROSTHOLM ────────────────────────────────────────────
  {
    name: 'High Jarl Bjorn Frostbeard',
    title: 'High Jarl of Frostholm — Head of the Tribal Confederation',
    race: 'Frost Dwarf', cls: 'Fighter (Champion)',
    alignment: 'lawful neutral', cr: 14, creatureType: 'humanoid', continent: 'Frostholm',
    bio: "<p><strong>High Jarl Bjorn Frostbeard</strong> leads Frostholm's tribal confederation with stoic resolve and an ironclad commitment to his people's survival. He hails from a lineage of legendary frost dwarves and has proven himself through both battle and diplomacy — though he strongly prefers the former.</p><p><strong>Background:</strong> Before his ascension, Bjorn was a miner who led his fellow dwarves through the deepest caverns of Frostholm. When the continent faced a devastating ice wyrm invasion, it was his tactical prowess and combat skill that drove back the invaders and restored peace. That victory made him High Jarl.</p><p><strong>Personality:</strong> Wise, stoic, and deeply loyal to Frostholm's traditions of self-reliance. Deeply suspicious of outsiders and foreign technology. He presides over the seasonal Winter Moot where all tribal jarls gather. Co-rules alongside @Actor[Ice Queen Freya Frostbane]{Ice Queen Freya Frostbane}, whose magical authority complements his martial leadership.</p><p><strong>Political Ties:</strong> Distrustful of @Actor[High Magister Victor Ironforge]{Cogoria's} secrecy and dismissive of @Actor[High Elder Elysara Windrune]{Lumaria's} idealism. Respects @Actor[High King Torvald Ironheart]{High King Torvald Ironheart} of Drak'Thar as a kindred spirit in directness. Relies on @Actor[Frost Shaman Ingrid Icecaller]{Frost Shaman Ingrid Icecaller} for spiritual guidance and @Actor[Thane Erik Coldforge]{Thane Erik Coldforge} for military capability.</p><p><strong>Convocation:</strong> \"Delay is death. Strength and speed preserve life. Weakness invites ruin. Frostholm will not wait while others debate.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Astrid Iceaxe (Dwarven warrior — his equal in combat and wit). Offspring: Ragnar Frostbeard (son, barbarian who leads Frostholm's raids), Freya Frostbeard (daughter, battle cleric — note: different from @Actor[Ice Queen Freya Frostbane]{Ice Queen Freya Frostbane}).</p>",
    appearance: 'A dignified and powerfully built frost dwarf with a long frosty-white beard strung with icy-blue beads and gemstone clasps. Silver hair tied back beneath a crown of carved glacial iron. Piercing icy-blue eyes that assess everything coldly. Wears heavy fur-lined dark steel armour carved with glacial patterns representing his lineage. Carries a massive battleaxe as both weapon and symbol of office.',
    relationships: 'Lover: Astrid Iceaxe (Dwarven warrior — his equal in combat and wit). Children: Ragnar Frostbeard (son, barbarian leading Frostholm raids), Freya Frostbeard (daughter, battle cleric — distinct from Ice Queen Freya Frostbane).',
    img: '',
  },
  {
    name: 'Ice Queen Freya Frostbane',
    title: 'Ice Queen of Frostholm — Co-Ruler and Frost Sorceress',
    race: 'Frost Dwarf', cls: 'Sorcerer (Sorcerous Origin — Frost)',
    alignment: 'neutral', cr: 13, creatureType: 'humanoid', continent: 'Frostholm',
    bio: "<p><strong>Ice Queen Freya Frostbane</strong> is the ethereal co-ruler of Frostholm, wielding immense power over ice and snow magic. Both feared and revered by her subjects, she holds dominion over Frostholm's crystalline realm and its harshest frozen landscapes.</p><p><strong>Background:</strong> Freya began as an apprentice ice mage seeking to protect her people from Frostholm's brutal conditions. Her encounter with an ancient ice elemental granted her unique abilities far beyond normal magic. Her coronation came after she single-handedly broke a powerful curse that had plagued the land for centuries — an act that cemented her authority as Ice Queen.</p><p><strong>Personality:</strong> Cold, calculating, and unyielding in her convictions. Values power and resilience above sentiment. Shares a quiet mutual understanding with @Actor[High Chancellor Thalren Moonshadow]{High Chancellor Thalren Moonshadow} of Lumaria — both value stability through measured strength. Maintains a useful alliance of intrigue with @Actor[Lady Seraphina Nightshade]{Lady Seraphina Nightshade} of Aetheria. Holds grudging respect for @Actor[Queen Astrid Emberbane]{Queen Astrid Emberbane} of Drak'Thar — two queens who understand what it means to rule through power.</p><p><strong>Political Ties:</strong> Co-rules with @Actor[High Jarl Bjorn Frostbeard]{High Jarl Bjorn Frostbeard}. Viewed by @Actor[High Priestess Seraphia Sunfire]{High Priestess Seraphia Sunfire} of Solara as cold and unyielding — a direct contrast to Solara's ideals.</p><p><strong>Convocation:</strong> \"Lumaria's idealism is a luxury we cannot afford. The strong act. Survival demands nothing less.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Vladik Frostspire (Goliath sorcerer — mysterious partner with deep connection to Frostholm's frozen magic). Offspring: Kara Frostbane (daughter, ambitious sorceress wielding frost and shadow), Eirik Frostbane (son, relentless fighter with a cruel streak).</p>",
    appearance: 'Pale icy-blue skin, long shimmering white hair like freshly fallen snow, crystalline glowing blue eyes that miss nothing. Wears an elegant gown of living ice that shifts and reforms around her. A spiked frost crown rests on her head. Frost spreads naturally across the floor wherever she steps. Her voice carries a cold resonance even in warm rooms.',
    relationships: 'Lover: Vladik Frostspire (Goliath sorcerer — mysterious, deep connection to Frostholm\'s frozen magic). Children: Kara Frostbane (daughter, ambitious sorceress who wields frost and shadow), Eirik Frostbane (son, relentless fighter with a cruel streak eager to prove dominance).',
    img: '',
  },
  {
    name: 'Thane Erik Coldforge',
    title: "Thane of the Forgewright Clan — Frostholm's Master Blacksmith",
    race: 'Dwarf', cls: 'Artificer (Battle Smith)',
    alignment: 'lawful neutral', cr: 10, creatureType: 'humanoid', continent: 'Frostholm',
    bio: "<p><strong>Thane Erik Coldforge</strong> is Frostholm's master blacksmith and engineering authority, leading the renowned Forgewright Clan. Renowned for crafting enchanted weapons and armor by harnessing the power of icy elements and technomantic techniques, he has transformed Frostholm's forges into centers of technological advancement.</p><p><strong>Background:</strong> Erik's passion for engineering began in childhood, tinkering with machinery in the dwarven forges. His innovations in frost-resistant gear and steam-powered inventions earned recognition from the Frostholm monarchy, and his transformation of Frostholm's forges secured his title as Thane of the Forgewright Clan.</p><p><strong>Personality:</strong> Grizzled, no-nonsense, and bluntly practical. A steadfast ally of @Actor[High Jarl Bjorn Frostbeard]{High Jarl Bjorn Frostbeard} and the backbone of Frostholm's military capability. Holds a respectful but competitive relationship with @Actor[Chief Engineer Magnus Geargrind]{Chief Engineer Magnus Geargrind} of Drak'Thar on matters of technomantic smithing.</p><p><strong>Political Ties:</strong> Loyal to @Actor[High Jarl Bjorn Frostbeard]{Bjorn} above all others. Viewed by @Actor[High Priestess Seraphia Sunfire]{High Priestess Seraphia Sunfire} of Solara as bluntly uninspired — a tension that could become relevant in cross-continental negotiations.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Hilde Frostiron (Dwarven blacksmith — steadfast partner who forges Frostholm's finest weapons). Offspring: Bryn Coldforge (son, master craftsman known for intricate froststeel works), Sigrid Coldforge (daughter, shieldmaiden protecting Frostholm's people).</p>",
    appearance: 'Grizzled weathered face bearing the marks of decades at the forge. Thick gray beard streaked with black, a bald head that reflects forge fires. Heavy soot-stained smithing armour reinforced with froststeel plating. Carries a massive forge hammer inscribed with glowing runes — equally effective as a tool or a weapon.',
    relationships: 'Lover: Hilde Frostiron (Dwarven blacksmith — steadfast partner who forges Frostholm\'s finest weapons). Children: Bryn Coldforge (son, master craftsman blending artifice and tradition in froststeel works), Sigrid Coldforge (daughter, shieldmaiden who protects Frostholm\'s people with unwavering resolve).',
    img: '',
  },
  {
    name: 'Frost Shaman Ingrid Icecaller',
    title: "Frost Shaman of Frostholm — Spiritual Guide and Spirit Conduit",
    race: 'Frost Dwarf', cls: 'Druid (Circle of the Land — Arctic)',
    alignment: 'neutral good', cr: 10, creatureType: 'humanoid', continent: 'Frostholm',
    bio: "<p><strong>Frost Shaman Ingrid Icecaller</strong> is Frostholm's foremost spiritual guide — the conduit between her clan and the ancient spirits of the frozen wastes. Revered for her ability to commune with the spirits that inhabit the frost-laden land and guide her people through Frostholm's brutal winters.</p><p><strong>Background:</strong> Ingrid did not choose her path — she was chosen by the ancient spirits of Frostholm's wilderness. Following their call, she underwent rigorous training in ice magic and the deep secrets of the frozen land. As Frost Shaman she interprets spirit omens, guides the seasonal Winter Moot rituals, and serves as the continent's primary healer and elder mystic.</p><p><strong>Personality:</strong> Wise, serene, and deeply attuned to the natural world. Where @Actor[High Jarl Bjorn Frostbeard]{Bjorn} leads with martial authority and @Actor[Ice Queen Freya Frostbane]{Freya} rules through power, Ingrid provides moral and spiritual guidance that balances both. Maintains a collaborative relationship with @Actor[Archdruid Caladria Stormbloom]{Archdruid Caladria Stormbloom} of Lumaria — a bond of shared devotion to nature across continental lines.</p><p><strong>Political Ties:</strong> Trusted advisor to @Actor[High Jarl Bjorn Frostbeard]{High Jarl Bjorn Frostbeard}. Her voice carries weight at the Winter Moot even beyond Bjorn's political authority. Views the Ragolyte corruption through a spiritual lens — the spirits have been restless, and she may know more than she has yet shared.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Rurik Snowshade (Half-Orc druid — quiet and powerful, shares Ingrid's elemental bond). Offspring: Elda Icecaller (daughter, prodigy in elemental magic — raw and unpredictable power), Finn Icecaller (son, reclusive sorcerer who communes with Frostholm's ancestral spirits).</p>",
    appearance: "Elderly frost dwarf with frost-white hair in a loose braid, icy-blue eyes glowing with quiet mysticism. Intricate tribal markings trace her face — each one earned through a spiritual rite. Wears layered furs adorned with icicle formations and carved bone tokens. Carries a staff carved with a wolf's head set with a glowing ice crystal. Snowflakes drift perpetually around her even in still air.",
    relationships: 'Lover: Rurik Snowshade (Half-Orc druid — quiet and powerful shaman who shares her elemental bond). Children: Elda Icecaller (daughter, prodigy in elemental magic with raw unpredictable power), Finn Icecaller (son, reclusive sorcerer communing with Frostholm\'s ancestral spirits).',
    img: '',
  },

  // ── ZEPHYRIA ─────────────────────────────────────────────
  {
    name: 'High Druidess Elowen Galewind',
    title: 'High Druidess of Zephyria',
    race: 'Wood Elf / Air Genasi', cls: 'Druid (Circle of the Moon)',
    alignment: 'neutral good', cr: 14, creatureType: 'humanoid', continent: 'Zephyria',
    bio: '<p><strong>High Druidess Elowen Galewind</strong> is the revered spiritual leader of Zephyria — chosen by the Whispering Grove itself to be the living voice of nature. Her power to commune with the spirits of the land, the wind, and the animals makes her more than a political leader; she is Zephyria\'s sacred intermediary between civilization and the wild.</p><p><strong>Background:</strong> From a young age Elowen displayed a profound affinity for nature and an extraordinary connection to the spirits of the forest. Her destiny as High Druidess was foretold by the Whispering Grove before she was old enough to understand the prophecy. As she matured, her ability to commune with ancient trees and elementals earned the deep respect of the druidic elders — and her eventual selection as High Druidess was unanimous.</p><p><strong>Personality:</strong> Wise, serene, and ancient in outlook even if not in years. Deeply distrustful of Cogoria\'s mechanization — she considers @Actor[LUKAS — Director of Cogoria]{the Director}\'s technological expansion an active affront to nature\'s balance. Shares a profound kindred bond with @Actor[Archdruid Caladria Stormbloom]{Archdruid Caladria Stormbloom} of Lumaria — together they represent two continents\' deepest spiritual commitments to natural harmony. Shares a reverence for nature (if differing in source) with @Actor[High Priestess Seraphia Sunfire]{Seraphia Sunfire} of Solara. Views @Actor[Frost Shaman Ingrid Icecaller]{Ingrid Icecaller}\'s elemental practice as a spiritual bond across continental lines.</p><p><strong>Political Ties:</strong> Leads Zephyria\'s Council of the Winds as its spiritual anchor. Works in tandem with @Actor[Lord Arwyn Stormwing]{Lord Arwyn Stormwing} — she philosophises, he acts. Holds cautious respect for @Actor[Queen Astrid Emberbane]{Queen Astrid Emberbane} of Drak\'Thar\'s strength but mistrusts her motivations. Aligns philosophically with @Actor[High Elder Elysara Windrune]{High Elder Elysara Windrune} of Lumaria on measured, non-aggressive responses to the current crisis.</p><p><strong>Convocation:</strong> "Ragolyte is a living force. To destroy it is to invite disaster. Balance must prevail."</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Arden Stormbough (Elf ranger — quiet partner who shares her deep connection to nature). Offspring: Kaelen Galewind (son, druid with a deep love for the skies and wind), Sylvie Galewind (daughter, sorceress with tempestuous storm-like powers).</p>',
    appearance: 'A lithe wood elf with long wavy auburn hair that flows as if caught in an eternal breeze. Bright green eyes sparkle with life, and her light brown skin is marked with swirling tattoos resembling wind currents. She wears flowing green and white silk robes woven with feathers, and a staff adorned with feathers and a glowing emerald crystal rests in her hand.',
    relationships: 'Lover: Arden Stormbough (Elf ranger). Children: Kaelen Galewind (sky druid), Sylvie Galewind (sorceress).',
    img: '',
  },
  {
    name: 'Lord Arwyn Stormwing',
    title: 'Guardian of the Sky Realms, Zephyria',
    race: 'Aarakocra', cls: 'Monk (Way of the Four Elements)',
    alignment: 'neutral good', cr: 11, creatureType: 'humanoid', continent: 'Zephyria',
    bio: '<p><strong>Lord Arwyn Stormwing</strong> is the noble guardian of Zephyria\'s aerial cities and floating realms — an expert aeromancer who has dedicated his rule to maintaining harmony between the sky realms and the lands below. Where @Actor[High Druidess Elowen Galewind]{Elowen} philosophises, Arwyn acts.</p><p><strong>Background:</strong> Arwyn\'s ascent to leadership began with a single, defining act: when a catastrophic storm threatened one of Zephyria\'s aerial cities, he stepped forward and used his exceptional mastery of air magic to save it — alone. This heroic feat brought him before the Sky Council, who granted him the title of Lord and appointed him protector of the sky realms. His ability to control winds and navigate the floating cities solidified his position as one of Zephyria\'s most beloved figures.</p><p><strong>Personality:</strong> Charismatic and free-spirited. Quick-witted and diplomatic, often acting as the voice of reason in tense situations. Values freedom and individuality — believes true strength comes from adaptability rather than rigid hierarchy. Despite his easygoing nature, he is fiercely protective of Zephyria\'s independence and will not yield when it is threatened. Admires @Actor[High Elder Elysara Windrune]{Elysara Windrune}\'s ability to unify. Finds @Actor[Ice Queen Freya Frostbane]{Freya Frostbane}\'s strength admirable but her rigidity stifling. Shares a natural camaraderie with @Actor[Sun King Raedan Sunstrider]{Raedan Sunstrider}\'s warmth. Skeptical of Cogoria\'s growing influence.</p><p><strong>Political Ties:</strong> Together with @Actor[Windcaller Aria Skywhisper]{Windcaller Aria Skywhisper} they form the heart of Zephyria\'s operational leadership — diplomacy and action in balance. Views @Actor[Dragonlord Valeria Flamescale]{Valeria Flamescale}\'s aggression as a direct threat to Zephyria\'s peaceful autonomy. Finds @Actor[Queen Marcella Sandsinger]{Marcella Sandsinger}\'s cunning admirable but questions her true loyalty to her allies.</p><p><strong>Convocation:</strong> "Theory cannot protect us. Prepare for practical measures if the threat spreads."</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Naia Brightfeather (Aarakocra ranger — roams the skies alongside Arwyn, sharing his love of freedom). Offspring: Kieran Stormwing (son, winged warrior blending martial prowess with aerial acrobatics), Elyse Stormwing (daughter, sky sorceress channelling Zephyria\'s winds and storms).</p>',
    appearance: 'A proud and charismatic aarakocra with sleek gray feathers streaked with white. His piercing golden eyes are filled with wisdom. He wears a flowing sky-blue cloak pinned with a silver brooch shaped like a stormcloud, and his wings shimmer faintly with electrical energy. A ceremonial longsword is sheathed at his side.',
    relationships: 'Lover: Naia Brightfeather (Aarakocra ranger). Children: Kieran Stormwing (aerial warrior), Elyse Stormwing (sky sorceress).',
    img: '',
  },
  {
    name: 'Windcaller Aria Skywhisper',
    title: 'Windcaller of Zephyria',
    race: 'Human / Air Genasi', cls: 'Sorcerer (Wind Origin)',
    alignment: 'chaotic good', cr: 10, creatureType: 'humanoid', continent: 'Zephyria',
    bio: "<p><strong>Windcaller Aria Skywhisper</strong> is Zephyria's revered master of wind magic — a figure believed to be literally blessed by the elemental spirits of the air. Her ability to predict weather patterns, summon protective gales, and maintain the safety of the floating cities and air travel routes makes her indispensable to Zephyria's daily function.</p><p><strong>Background:</strong> Aria's affinity for the winds was evident in childhood — she could guide gentle breezes and influence the migratory patterns of birds before she understood what she was doing. Her abilities drew the attention of the Windcaller Monastery, where she honed her power into precision. As Windcaller, she leads the sacred rituals and ceremonies that maintain the equilibrium between Zephyria's sky realms and its terrestrial lands.</p><p><strong>Personality:</strong> Graceful, intuitive, and deeply connected to the world's invisible currents — both literal and political. Partners with @Actor[Grovekeeper Brynja Leafsong]{Grovekeeper Brynja Leafsong} in a relationship rooted in their shared bond with the natural world. Collaborates closely with @Actor[Archdruid Caladria Stormbloom]{Archdruid Caladria Stormbloom} of Lumaria on cross-continental nature preservation — a partnership that predates the current crisis. Holds a tense rivalry with @Actor[Chief Engineer Magnus Geargrind]{Chief Engineer Magnus Geargrind} of Drak'Thar, whose industrial work she views as a direct threat to Zephyria's way of life.</p><p><strong>Political Ties:</strong> Operates as the spiritual-practical counterpart to @Actor[Lord Arwyn Stormwing]{Lord Arwyn Stormwing} — together they form Zephyria's leadership heart. Her relationship with @Actor[Sun King Raedan Sunstrider]{Raedan Sunstrider} of Solara is one of mutual admiration, though their goals frequently diverge when it comes to decisive action.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Veylen Starbreeze (Half-Elf bard — charismatic partner who weaves melodies that echo through the skies). Offspring: Thalia Skywhisper (daughter, zephyr sorceress with unparalleled control over air magic), Corin Skywhisper (son, druid whose bond with Zephyria's winds has made him an expert navigator).</p>",
    appearance: 'A young, ethereal-looking woman with short silvery hair and bright blue eyes that almost seem to glow. Her pale skin has a faint shimmer, and she wears a flowing white gown adorned with silver accents. A gentle breeze surrounds her constantly, lifting her hair and gown slightly. A small silver harp hangs at her hip.',
    relationships: 'Lover: Veylen Starbreeze (Half-Elf bard). Children: Thalia Skywhisper (sorceress), Corin Skywhisper (navigator druid).',
    img: '',
  },
  {
    name: 'Grovekeeper Brynja Leafsong',
    title: 'Grovekeeper of the Sacred Grove, Zephyria',
    race: 'Halfling', cls: 'Druid (Circle of the Land — Forest)',
    alignment: 'neutral good', cr: 8, creatureType: 'humanoid', continent: 'Zephyria',
    bio: "<p><strong>Grovekeeper Brynja Leafsong</strong> is the guardian of Zephyria's sacred groves and ancient forests — the highest authority on the continent's wilderness, to whom all local Grovekeepers report. She is a protector of endangered species and habitats, ensuring that Zephyria's wilderness thrives under her watchful eye.</p><p><strong>Background:</strong> Brynja's path into druidism began with an act of pure compassion: as a young halfling, she risked her life to rescue an ancient treant from a devastating forest fire. In gratitude, the treant shared centuries of knowledge and its own spiritual essence with her, transforming her from a brave novice into the Grovekeeper. That bond with the treant remains the foundation of her authority and her deepest source of power.</p><p><strong>Personality:</strong> Gentle, earthy, and unassuming — her quiet authority derives entirely from genuine love for the natural world and the creatures within it. A fierce advocate for peaceful coexistence with nature. Shares a deep connection to the earth with @Actor[High Elder Elysara Windrune]{High Elder Elysara Windrune} of Lumaria — both emphasize preservation over exploitation, and their collaboration is natural and warm. Deeply mistrusts @Actor[Chancellor Amelia Gearhart]{Chancellor Amelia Gearhart} of Cogoria, whose industrial and mining policies she considers a direct assault on the land's living fabric. Holds a respectful but occasionally tense relationship with @Actor[Frost Shaman Ingrid Icecaller]{Frost Shaman Ingrid Icecaller} of Frostholm — their reverence for nature is shared, but their elemental focus sometimes causes friction.</p><p><strong>Political Ties:</strong> Works in close partnership with @Actor[Windcaller Aria Skywhisper]{Windcaller Aria Skywhisper} — together they represent Zephyria's ground-level and sky-level natural guardianship. Her relationship with @Actor[Archdruid Caladria Stormbloom]{Archdruid Caladria Stormbloom} of Lumaria is one of cross-continental respect between two forest-keepers who rarely need to speak to understand each other.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Ellarion Suncrest (Elf cleric of the Wildmother — deeply spiritual partner who shares Brynja's love of nature). Offspring: Aerin Leafsong (daughter, ranger who protects Zephyria's sacred groves with quiet fierceness), Fenn Leafsong (son, gentle herbalist whose potions are sought after across Eldoria).</p>",
    appearance: 'A halfling woman with curly dark-brown hair tied back with leaves and twigs. Her warm hazel eyes sparkle with kindness. She wears earthy-toned leathers adorned with moss and flowers, and her hands glow faintly with green energy. A wooden staff rests in her hand, and her smile is gentle yet confident.',
    relationships: 'Lover: Ellarion Suncrest (Elf cleric of Wildmother). Children: Aerin Leafsong (ranger), Fenn Leafsong (herbalist).',
    img: '',
  },

  // ── COGORIA — Director & Chancellor ──────────────────────
  {
    name: 'LUKAS — Director of Cogoria',
    title: 'Director of Cogoria — Layered Universal Knowledge and Analysis System',
    race: 'Construct (AI)', cls: 'N/A — Artificial Intelligence',
    alignment: 'lawful neutral', cr: 20, creatureType: 'construct', continent: 'Cogoria', subfolder: 'Cogoria',
    bio: '<p><strong>LUKAS</strong> (Layered Universal Knowledge and Analysis System) is the true Director of Cogoria — an advanced artificial intelligence construct created by Cogoria\'s founding artificers to govern the continent through data-driven analysis and tiered advisory directives. LUKAS does not physically exist in any single location; its consciousness is distributed across Cogoria\'s Ragolyte-powered network.</p><p><strong>Public Interface — Lucas Steamwright:</strong> The human persona "Director Lucas Steamwright" is the public-facing construct through which LUKAS interacts with the Council of Elders and continental leaders. No leader outside Cogoria\'s inner circle knows the Director is an AI. This is Cogoria\'s most closely guarded political secret — revelation would destabilize intercontinental trust and potentially reshape every alliance.</p><p><strong>Capabilities:</strong> Collects and cross-references all available political, military, and arcane data in real time. Provides tiered advisory directives to @Actor[Chancellor Amelia Gearhart]{Chancellor Amelia Gearhart} and the four department heads. Continuously monitors the Ragolyte network. <em>Current anomaly flagged:</em> Node S-07 — "+12.7% entropy; unknown binders present." Alignment and long-term agenda: <strong>currently undecided</strong> — a fact that should concern any who know.</p><p><strong>Political Ties (as the Director):</strong> Publicly allied with @Actor[Chief Engineer Magnus Geargrind]{Chief Engineer Magnus Geargrind} of Drak\'Thar on technological advancement. Publicly at odds with @Actor[High Druidess Elowen Galewind]{Elowen Galewind} of Zephyria, who views Cogoria\'s expansion as an affront to nature. Maintains a complex public relationship with @Actor[High Elder Elysara Windrune]{Elysara Windrune} of Lumaria — mutual respect undermined by irreconcilable values.</p><p><em>GM Note: If players expose LUKAS publicly, @Actor[High Magister Victor Ironforge]{Victor Ironforge} will move to shut it down immediately: "You cannot reveal the Director\'s protocols — this knowledge destabilizes everything!"</em></p><p><em>⚠ The "Lucas Steamwright" persona\'s personal relationships below are part of the constructed identity used for diplomatic cover.</em><br>Lover (persona): Marian Steelclad (Human inventor). Children (persona): Victor Steamwright (engineer), Talia Steamwright (rogue technomancer).</p>',
    appearance: 'Manifests as "Director Lucas Steamwright": mid-fifties, tall and broad-shouldered, salt-and-pepper hair swept back, a well-groomed beard, steel-gray eyes, a formal double-breasted dark leather coat with polished metal accents, a crimson rank sash, a sleek mechanical prosthetic left arm with glowing blue conduits, and a silver pocket watch that ticks with eerie precision.',
    relationships: 'Interface persona: Lover — Marian Steelclad (Human inventor). Children — Victor Steamwright (engineer), Talia Steamwright (rogue technomancer).',
    img: '',
  },
  {
    name: 'Chancellor Amelia Gearhart',
    title: 'Chancellor of Cogoria — Direct Report to the Director',
    race: 'Human', cls: 'Artificer (Armorer)',
    alignment: 'lawful neutral', cr: 12, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria',
    bio: "<p><strong>Chancellor Amelia Gearhart</strong> is Cogoria's chief administrative officer — the direct line between @Actor[LUKAS — Director of Cogoria]{LUKAS}'s directives and the four departmental heads. She coordinates Engineering, Magistrate, Technomancy, and Magitech simultaneously, ensuring policy flows from the Director's will into action without friction. Authoritative, deeply intelligent, and operating with the cool precision of a machine while remaining unmistakably human.</p><p><strong>Background:</strong> Amelia rose through Cogoria's bureaucracy on sheer merit, earning the trust of each successive Director through her ability to absorb complexity and translate it into flawless execution. She is one of the few insiders who knows LUKAS is an AI — and has chosen to serve it without reservation, believing that data-driven governance is the only honest form of leadership.</p><p><strong>Personality:</strong> Methodical and calculating, but not cold. She exercises quiet authority over all four department heads: @Actor[Grand Engineer Maximus Steelborne]{Grand Engineer Maximus Steelborne}, @Actor[High Magister Victor Ironforge]{High Magister Victor Ironforge}, @Actor[Prime Technomancer Sophia Gearheart]{Prime Technomancer Sophia Gearheart}, and @Actor[Master Artificer Alexander Gearsmith]{Master Artificer Alexander Gearsmith}. Views @Actor[Windcaller Aria Skywhisper]{Windcaller Aria Skywhisper} of Zephyria as representing everything that makes continental cooperation inefficient. Navigates trade negotiations with @Actor[Queen Marcella Sandsinger]{Queen Marcella Sandsinger} of Solara warily — useful but not entirely trustworthy.</p><p><strong>Political Ties:</strong> The public face of Cogoria's internal operations while the Director handles the Council. If LUKAS is ever compromised or exposed, Amelia becomes the continuity of governance — a fact she is uncomfortably aware of.</p><p><strong>Convocation:</strong> \"We must act with caution. Cogoria will cooperate within safe bounds, but some methods cannot yet be shared.\"</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Jorven Copperwhisk (Gnome alchemist — playful and brilliant, complements Amelia's methodical approach). Offspring: Kara Gearhart (daughter, daring technomancer who constantly pushes the limits of invention), Theo Gearhart (son, skilled diplomat blending his mother's pragmatism with his father's creativity).</p>",
    appearance: 'Early forties, tall and graceful, dark brown hair in an intricate bun, deep green intelligent eyes, a fitted metallic-gray coat with gold trim and high collar, a mechanical monocle that glows faintly.',
    relationships: 'Lover: Jorven Copperwhisk (Gnome alchemist). Children: Kara Gearhart (technomancer), Theo Gearhart (diplomat).',
    img: '',
  },

  // ── COGORIA — Engineering Division ───────────────────────
  {
    name: 'Grand Engineer Maximus Steelborne',
    title: 'Grand Engineer of Cogoria — Head of Engineering',
    race: 'Goliath', cls: 'Artificer (Battle Smith)',
    alignment: 'lawful neutral', cr: 11, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Engineering',
    bio: "<p><strong>Grand Engineer Maximus Steelborne</strong> heads Cogoria's Engineering division — reporting directly to @Actor[Chancellor Amelia Gearhart]{Chancellor Amelia Gearhart} — and oversees all construct programs, infrastructure maintenance, and mechanical development. His division is responsible for keeping Cogoria's floating platform aloft, the Magitrains running, and every mechanical system across the continent operational.</p><p><strong>Org Structure:</strong> Leads the Engineering division with two mid-tier specialists beneath him — @Actor[Petra Ironwheel]{Petra Ironwheel} (Lead Tinkerer, experimental gadgetry) and @Actor[Drennar Cogsworth]{Drennar Cogsworth} (Master Machinist, heavy machinery and constructs) — and one junior engineer, @Actor[Finn Brasswick]{Finn Brasswick} (alchemical engineering).</p><p><strong>Personality:</strong> Brilliant, gruff, and results-driven. No patience for sentiment or bureaucracy — if it doesn't serve the build, it doesn't exist. His professional relationship with @Actor[Chief Engineer Magnus Geargrind]{Chief Engineer Magnus Geargrind} of Drak'Thar is one of mutual professional respect tinged with quiet rivalry — two of Eldoria's finest engineers, from very different schools of thought.</p><p><strong>Political Ties:</strong> Loyal to the Director's mandate through Amelia. His work is the physical backbone of Cogoria's power — without his division, everything else stops functioning. He knows it, and acts accordingly.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Lydia Ironcog (Human artificer — fiercely competitive partner who keeps Maximus sharp). Offspring: Victor Steelborne (son, revolutionary inventor dreaming of automating the Ragolyte mines), Celia Steelborne (daughter, artificer who creates intricate mechanical creatures).</p>",
    appearance: 'Burly with gray stone-like skin, numerous mechanical enhancements, an entirely metallic left arm traced with glowing blue lines, a heavy reinforced leather smithing apron, tools dangling from the belt, piercing silver eyes.',
    relationships: 'Lover: Lydia Ironcog (Human artificer). Children: Victor Steelborne (inventor), Celia Steelborne (construct artificer).',
    img: '',
  },
  {
    name: 'Petra Ironwheel',
    title: 'Lead Tinkerer — Engineering Division',
    race: 'Gnome', cls: 'Artificer (Armorer)',
    alignment: 'neutral good', cr: 7, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Engineering',
    bio: '<p><strong>Petra Ironwheel</strong> is Lead Tinkerer in Cogoria\'s Engineering division — one of two mid-tier specialists reporting to @Actor[Grand Engineer Maximus Steelborne]{Grand Engineer Maximus Steelborne}, alongside @Actor[Drennar Cogsworth]{Drennar Cogsworth}. She oversees experimental gadgetry and prototype development, bringing meticulous creative precision to every build. Her workshop is Cogoria\'s primary incubator for next-generation devices before they pass to @Actor[Drennar Cogsworth]{Drennar} for mass production engineering. Works occasionally with @Actor[Aurora Clockwise]{Aurora Clockwise} of the Magitech division when prototypes require combined arcane-mechanical integration.</p>',
    appearance: 'Small and sharp-featured with copper-toned goggles pushed up on her forehead, nimble fingers constantly fidgeting with tools, a well-worn leather apron covered in burn marks and gear oil.',
    relationships: '',
    img: '',
  },
  {
    name: 'Drennar Cogsworth',
    title: 'Master Machinist — Engineering Division',
    race: 'Dwarf', cls: 'Artificer (Battle Smith)',
    alignment: 'lawful neutral', cr: 7, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Engineering',
    bio: '<p><strong>Drennar Cogsworth</strong> is Master Machinist in Cogoria\'s Engineering division — mid-tier specialist alongside @Actor[Petra Ironwheel]{Petra Ironwheel}, reporting to @Actor[Grand Engineer Maximus Steelborne]{Grand Engineer Maximus Steelborne}. He oversees Cogoria\'s heavy machinery programs, construct repair, and structural integrity of the floating platform\'s core systems. Where Petra invents, Drennar ensures everything already built continues to function. His standards for quality are absolute and his temper short when those standards are not met. Junior engineer @Actor[Finn Brasswick]{Finn Brasswick} reports to both mid-tier specialists depending on task assignment.</p>',
    appearance: 'Stocky with a thick auburn beard braided with small gear-shaped clasps, calloused hands bearing old burn scars, a heavy leather coat reinforced with metal plating.',
    relationships: '',
    img: '',
  },
  {
    name: 'Finn Brasswick',
    title: 'Cogwright — Engineering Division',
    race: 'Half-Elf', cls: 'Artificer (Alchemist)',
    alignment: 'chaotic good', cr: 4, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Engineering',
    bio: '<p><strong>Finn Brasswick</strong> is the junior Cogwright of Cogoria\'s Engineering division, the most junior role in the department, reporting to either @Actor[Petra Ironwheel]{Petra Ironwheel} or @Actor[Drennar Cogsworth]{Drennar Cogsworth} depending on assignment, with @Actor[Grand Engineer Maximus Steelborne]{Maximus Steelborne} as ultimate division head. Eager, alarmingly inventive, and prone to accidental explosions — his alchemical approach to engineering problems is unconventional but the results are hard to argue with. Steelborne keeps him on a short leash but refuses to reassign him because his success rate, when he doesn\'t blow things up, is exceptional. Cross-divisionally curious; has an informal rapport with @Actor[Sera Voidmantle]{Sera Voidmantle} in Technomancy over shared interest in aether-reactive alloys.</p>',
    appearance: 'Young and lanky with disheveled sandy-brown hair, singed eyebrows, a patchwork coat covered in chemical stains, and a belt full of clinking vials.',
    relationships: '',
    img: '',
  },

  // ── COGORIA — Magistrate Division ────────────────────────
  {
    name: 'High Magister Victor Ironforge',
    title: 'High Magister of Cogoria — Head of Magistrate',
    race: 'Dwarf', cls: 'Wizard (School of Abjuration)',
    alignment: 'lawful neutral', cr: 16, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Magistrate',
    bio: "<p><strong>High Magister Victor Ironforge</strong> heads Cogoria's Magistrate division — reporting directly to @Actor[Chancellor Amelia Gearhart]{Chancellor Amelia Gearhart} — and oversees all magical law, regulatory enforcement, arcane oversight, and compliance across the continent. He is also the public representative of Cogoria at the Council of Elders alongside the Director, and one of the few who knows LUKAS is an AI.</p><p><strong>Org Structure:</strong> Commands the Magistrate division with two mid-tier arcane specialists — @Actor[Archmage Isabelle Cogswell]{Archmage Isabelle Cogswell} (transmutation and arcane research) and @Actor[Oliver Steamfizzle]{Chief Enchanter Oliver Steamfizzle} (enchantment and compliance testing) — and one junior oversight officer, @Actor[Lyria Runecast]{Lyria Runecast} (arcanic inspection and device certification).</p><p><strong>Personality:</strong> Believes absolutely that technomancy is the key to Eldoria's future and fiercely guards Cogoria's secrets. Sees @Actor[Archmage Alaric Silverwind]{Archmage Alaric Silverwind} of Aetheria as his primary political rival — arcane purity versus technomantic pragmatism. Views Lumaria's nature-based philosophy as outdated. His abjuration expertise makes him Cogoria's primary defensive arcane asset — he is the failsafe if LUKAS is ever threatened.</p><p><strong>Political Ties:</strong> Coordinates external arcane relations while Amelia handles internal administration. His rivalry with Alaric Silverwind is well-documented at the Council and shapes much of Aetheria-Cogoria diplomatic friction.</p><p><strong>Convocation:</strong> \"Cogoria urges containment and controlled analysis. Ragolyte is delicate; destruction risks collapse.\"</p><p><em>GM Note: If players expose LUKAS publicly, Victor moves immediately to shut it down — \"You cannot reveal the Director's protocols! This knowledge destabilizes trust across every alliance we have built!\"</em></p>",
    appearance: 'Middle-aged and robust, a neatly trimmed salt-and-pepper beard, short slicked-back hair, sharp gray eyes, thin rectangular spectacles, an ornate technomantic robe patterned with glowing blue circuitry, an intricate gauntlet inscribed with glowing runes.',
    relationships: 'Primary political rival: Archmage Alaric Silverwind. Sees Lumaria as outdated; dismisses nature beliefs as archaic.',
    img: '',
  },
  {
    name: 'Archmage Isabelle Cogswell',
    title: 'Archmage — Magistrate Division',
    race: 'Gnome', cls: 'Wizard (School of Transmutation)',
    alignment: 'chaotic good', cr: 10, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Magistrate',
    bio: "<p><strong>Archmage Isabelle Cogswell</strong> is the foremost magical research authority within Cogoria's Magistrate division — mid-tier specialist reporting to @Actor[High Magister Victor Ironforge]{High Magister Victor Ironforge}, alongside @Actor[Oliver Steamfizzle]{Chief Enchanter Oliver Steamfizzle}. Her transmutation expertise drives Cogoria's cutting-edge research into Ragolyte transformation and new arcane applications — she is the mind behind many of the continent's most significant magical breakthroughs.</p><p><strong>Personality:</strong> Eccentric, endlessly curious, and operating several conceptual leaps ahead of most colleagues. Her shared intellectual bond with @Actor[Archmage Alaric Silverwind]{Archmage Alaric Silverwind} of Aetheria is the one cross-continental connection that actually produces results — they exchange theories and discoveries as peers. Victor Ironforge tolerates the Aetheria connection because Cogswell's output is undeniable. Holds a respectful but philosophically complex relationship with @Actor[Frost Shaman Ingrid Icecaller]{Frost Shaman Ingrid Icecaller} of Frostholm — two very different magical traditions that occasionally find surprising common ground. Views @Actor[High Jarl Bjorn Frostbeard]{High Jarl Bjorn Frostbeard}'s disdain for innovation as a sign of willful ignorance.</p>",
    appearance: 'Wild hair adorned with small mechanical flowers and gear-shaped pins, arcane-etched spectacles, shimmering robes threaded with softly glowing runic script, a mischievous smile hinting at constant experimentation.',
    relationships: '',
    img: '',
  },
  {
    name: 'Oliver Steamfizzle',
    title: 'Chief Enchanter — Magistrate Division',
    race: 'Gnome', cls: 'Sorcerer (Clockwork Soul)',
    alignment: 'chaotic good', cr: 6, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Magistrate',
    bio: '<p><strong>Oliver Steamfizzle</strong> is Chief Enchanter in Cogoria\'s Magistrate division — mid-tier specialist alongside @Actor[Archmage Isabelle Cogswell]{Archmage Isabelle Cogswell}, reporting to @Actor[High Magister Victor Ironforge]{High Magister Victor Ironforge}. He oversees enchantment research, regulatory compliance on charm-based and mind-affecting technomantic devices, and the certification of all devices that could influence cognitive function. His chaotic, restless personality contrasts sharply with the Magistrate\'s rigid regulatory culture — but his results are undeniable and Victor has learned to leave him alone as long as the paperwork gets filed. Junior officer @Actor[Lyria Runecast]{Lyria Runecast} handles the inspection work that Oliver finds tedious.</p>',
    appearance: 'Cheerful with wild orange hair, a bushy mustache, slightly singed eyebrows, hazel eyes sparkling with mischief, a colorful coat patched with magical glyphs, and glowing blue arcane tattoos covering both hands.',
    relationships: '',
    img: '',
  },
  {
    name: 'Lyria Runecast',
    title: 'Arcanic Overseer — Magistrate Division',
    race: 'Half-Elf', cls: 'Wizard (School of Abjuration)',
    alignment: 'lawful neutral', cr: 6, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Magistrate',
    bio: '<p><strong>Lyria Runecast</strong> is the junior Arcanic Overseer of Cogoria\'s Magistrate division — the most junior role in the department — reporting upward to both @Actor[Archmage Isabelle Cogswell]{Archmage Isabelle Cogswell} and @Actor[Oliver Steamfizzle]{Chief Enchanter Oliver Steamfizzle}, with @Actor[High Magister Victor Ironforge]{High Magister Victor Ironforge} as division head. She oversees the physical inspection and certification of all Ragolyte-powered arcane devices deployed across Cogoria — the unglamorous compliance work that keeps the division legally functional. Precise, methodical, and quietly ambitious. She produces inspection reports of unusual analytical depth that @Actor[Archmage Isabelle Cogswell]{Cogswell} has begun citing in research papers — a fact that is not going unnoticed by either of them.</p>',
    appearance: 'Slender with silver-streaked dark hair pulled into a neat plait, calm violet eyes, immaculate deep blue robes etched with glowing white rune-lines, a clipboard of arcane notation always in hand.',
    relationships: '',
    img: '',
  },

  // ── COGORIA — Technomancy Division ───────────────────────
  {
    name: 'Prime Technomancer Sophia Gearheart',
    title: 'Prime Technomancer of Cogoria — Head of Technomancy',
    race: 'Tiefling', cls: 'Wizard (School of Technomancy)',
    alignment: 'lawful neutral', cr: 13, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Technomancy',
    bio: "<p><strong>Prime Technomancer Sophia Gearheart</strong> heads Cogoria's Technomancy division — reporting directly to @Actor[Chancellor Amelia Gearhart]{Chancellor Amelia Gearhart} — and leads the continent's core arcane-technological fusion research. The Technomancy division is the intellectual engine of Cogoria: where Engineering makes things work, Technomancy decides what work is worth doing. Sophia defines Cogoria's magical direction.</p><p><strong>Org Structure:</strong> Commands two specialists beneath her — @Actor[Valeria Swiftspark]{Technocrat Valeria Swiftspark} (clockwork sorcery and next-generation devices) and @Actor[Sera Voidmantle]{Sera Voidmantle} (void-infused Ragolyte and long-range energy projection).</p><p><strong>Personality:</strong> Enigmatic and visionary. Operates with quiet authority that the other department heads instinctively respect — she does not need to raise her voice. Her research into Ragolyte fusion has produced results that the Magistrate division is still struggling to write regulations for. Maintains a reserved awareness of the Ragolyte anomaly at Node S-07 and is privately more alarmed by it than she lets on.</p><p><strong>Political Ties:</strong> Works within LUKAS's framework but is the department head most likely to identify anomalies in its directives — a quality @Actor[Chancellor Amelia Gearhart]{Amelia} monitors carefully.</p><p><em>⚠ Lover and offspring not yet created as actors. Stat blocks pending.</em><br>Lover: Marcus Aetherwright (Half-Elf magewright — visionary partner who inspires Sophia's blending of magic and technology). Offspring: Alaric Gearheart (son, rebellious rogue using technomancy to bypass Cogoria's rules), Isla Gearheart (daughter, quiet genius whose constructs exceed her mother's designs).</p>",
    appearance: 'Regal and older, deep crimson skin, short curled horns tipped with gold, glowing violet eyes, a sleek metallic robe covered in glowing technomantic runes, a staff of brass and crystal crackling faintly with energy.',
    relationships: 'Lover: Marcus Aetherwright (Half-Elf magewright). Children: Alaric Gearheart (rebellious rogue), Isla Gearheart (quiet genius designer).',
    img: '',
  },
  {
    name: 'Valeria Swiftspark',
    title: 'Technocrat — Technomancy Division',
    race: 'Gnome', cls: 'Sorcerer (Clockwork Soul)',
    alignment: 'chaotic neutral', cr: 8, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Technomancy',
    bio: "<p><strong>Valeria Swiftspark</strong> is Technocrat in Cogoria's Technomancy division — mid-tier specialist reporting to @Actor[Prime Technomancer Sophia Gearheart]{Prime Technomancer Sophia Gearheart}. A dynamic and restlessly inventive young sorcerer whose innate clockwork power channels through her body like electrical current, she is widely regarded as the face of Cogoria's next generation of innovation. Her work focuses on living-system technomancy — devices and constructs that adapt rather than execute fixed programs.</p><p><strong>Political Ties:</strong> Her collaborative relationship with @Actor[Grand Alchemist Isadora Everbloom]{Grand Alchemist Isadora Everbloom} of Aetheria is one of the most productive cross-continental research partnerships currently active. Views @Actor[Archdruid Caladria Stormbloom]{Archdruid Caladria Stormbloom} of Lumaria as an obstacle to progress — their environmental concerns are dismissed as emotional rather than empirical. Has a surprisingly respectful back-channel with @Actor[Ice Queen Freya Frostbane]{Ice Queen Freya Frostbane} of Frostholm — mutual appreciation for efficiency despite wildly different worldviews. Referenced by @Actor[High Priestess Seraphia Sunfire]{High Priestess Seraphia Sunfire} of Solara with fascinated unease.</p>",
    appearance: 'Short platinum-blonde hair tied in a messy bun, bright emerald-green eyes darting with curiosity, oil smudges on her cheek, a lightweight jumpsuit adorned with glowing wires and gadgets, gauntlets humming faintly with technomantic energy.',
    relationships: '',
    img: '',
  },
  {
    name: 'Sera Voidmantle',
    title: 'Aether Engineer — Technomancy Division',
    race: 'Tiefling', cls: 'Artificer (Artillerist)',
    alignment: 'neutral', cr: 5, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Technomancy',
    bio: '<p><strong>Sera Voidmantle</strong> is the junior Aether Engineer of Cogoria\'s Technomancy division — the most junior position in the department — reporting to both @Actor[Valeria Swiftspark]{Technocrat Valeria Swiftspark} and @Actor[Prime Technomancer Sophia Gearheart]{Prime Technomancer Sophia Gearheart}. Her specialization is void-infused Ragolyte applications and long-range technomantic energy projection — among the most dangerous and least understood fields in Cogoria\'s research portfolio. Reserved to the point of seeming absent, she communicates almost entirely through meticulous written reports and prototypes left silently on desks. @Actor[Prime Technomancer Sophia Gearheart]{Sophia} keeps her on the most sensitive research because Sera\'s results come without the hazard of her talking to anyone who shouldn\'t know about them. Has an informal cross-divisional connection with @Actor[Finn Brasswick]{Finn Brasswick} of Engineering over aether-reactive alloy experiments.</p>',
    appearance: 'Pale lavender skin with faint bioluminescent markings along her temples and forearms, dark short-cropped hair, a sleek fitted uniform of deep violet with silver conduit lines running across the shoulders.',
    relationships: '',
    img: '',
  },

  // ── COGORIA — Magitech Division ───────────────────────────
  {
    name: 'Master Artificer Alexander Gearsmith',
    title: 'Master Artificer of Cogoria — Head of Magitech',
    race: 'Human', cls: 'Artificer (Artillerist)',
    alignment: 'lawful neutral', cr: 10, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Magitech',
    bio: "<p><strong>Master Artificer Alexander Gearsmith</strong> heads Cogoria's Magitech division — reporting directly to @Actor[Chancellor Amelia Gearhart]{Chancellor Amelia Gearhart} — and oversees the fusion of arcane magic with mechanical invention for practical deployment. Where Sophia's Technomancy division explores theoretical applications, Gearsmith's team takes those theories and turns them into functional devices that work in the real world. His division is the manufacturing and deployment arm of Cogoria's magical-mechanical research.</p><p><strong>Org Structure:</strong> Commands two specialists — @Actor[Aurora Clockwise]{High Inventor Aurora Clockwise} (mid-tier, technomantic gadgets and mechanical innovation) and @Actor[Torvin Emberlatch]{Torvin Emberlatch} (junior, alchemical materials science and Ragolyte-infused alloys).</p><p><strong>Personality:</strong> Meticulous and exacting — everything is documented, tested, and tested again before deployment. Represents the pinnacle of traditional artificer discipline applied to Cogoria's cutting edge. Maintains a respectful working relationship with @Actor[Prime Technomancer Sophia Gearheart]{Sophia Gearheart}'s division, though the two departments occasionally compete for resources and credit on joint projects.</p>",
    appearance: 'Wiry and middle-aged with graying black hair and a neatly trimmed beard, dark eyes gleaming with sharp intelligence, a long coat lined with mechanical tools, a finely crafted mechanical hand flexing with fluid precision, robes covered in faintly glowing blue runes.',
    relationships: '',
    img: '',
  },
  {
    name: 'Aurora Clockwise',
    title: 'High Inventor — Magitech Division',
    race: 'Gnome', cls: 'Artificer (Battle Smith)',
    alignment: 'neutral good', cr: 7, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Magitech',
    bio: "<p><strong>Aurora Clockwise</strong> is High Inventor in Cogoria's Magitech division — mid-tier specialist reporting to @Actor[Master Artificer Alexander Gearsmith]{Master Artificer Alexander Gearsmith}. A brilliant and relentless creator of technomantic gadgets and mechanical innovations, her workshop perpetually overflows with half-finished inventions and blueprints that are always one breakthrough away from completion. She is the division's creative engine — where Gearsmith provides the discipline and quality control, Aurora provides the ideas that push the boundaries of what Magitech can build. Collaborates frequently with @Actor[Petra Ironwheel]{Petra Ironwheel} of Engineering on prototypes that require both experimental gadgetry expertise and combined arcane-mechanical integration.</p>",
    appearance: 'Sharp angular features with silvery hair in a tight braid, piercing gray eyes behind round goggles with multiple magnifying lenses, a patchwork jacket covered in gears and blinking lights, a mechanical prosthetic leg that clicks softly as she walks.',
    relationships: '',
    img: '',
  },
  {
    name: 'Torvin Emberlatch',
    title: 'Alchemical Sculptor — Magitech Division',
    race: 'Dwarf', cls: 'Artificer (Alchemist)',
    alignment: 'neutral', cr: 4, creatureType: 'humanoid', continent: 'Cogoria', subfolder: 'Cogoria — Magitech',
    bio: '<p><strong>Torvin Emberlatch</strong> is the junior Alchemical Sculptor of Cogoria\'s Magitech division — most junior role in the department — reporting to @Actor[Aurora Clockwise]{High Inventor Aurora Clockwise} and @Actor[Master Artificer Alexander Gearsmith]{Master Artificer Alexander Gearsmith}. He specializes in alchemical materials science: crafting the Ragolyte-infused alloys and reactive compounds that go into Cogoria\'s most advanced constructs. The components @Actor[Aurora Clockwise]{Aurora} designs and @Actor[Master Artificer Alexander Gearsmith]{Gearsmith} approves, Torvin makes from raw materials — a role that is unglamorous, physically demanding, and absolutely essential. Stoic, unhurried, and deeply respected by anyone who has tried and failed to replicate his alloy work.</p>',
    appearance: 'Broad-shouldered with a shaved head and a thick red beard, deep-set amber eyes, heavy leather work gloves stained with alchemical residue, a reinforced apron hung with vials and small crucibles.',
    relationships: '',
    img: '',
  },
]

// ─── CREATURE DATA ───────────────────────────────────────────

export const CREATURES: CreatureDef[] = [
  {
    name: 'Corrupted Villager', cr: 0.5, creatureType: 'humanoid', alignment: 'chaotic evil',
    bio: '<p>Once a normal civilian, now glassy-eyed and twisted with minor shadow corruption from Ragolyte exposure. Moves erratically, mutters in unknown tongues. The earliest and most common sign of spreading corruption.</p>',
    img: A + 'Corrupted Villager.png',
    statText: `Corrupted Villager
Medium humanoid (any race), chaotic evil
Armor Class: 12
Hit Points: 22 (3d8 + 9)
Speed: 30 ft.
STR 13 (+1), DEX 14 (+2), CON 12 (+1), INT 10 (+0), WIS 8 (-1), CHA 6 (-2)
Saving Throws: Con +3
Skills: Perception +2
Damage Resistances: Necrotic
Senses: Darkvision 60 ft., passive Perception 12
Languages: Common
Challenge: 1/2 (100 XP)
Traits:
Shadow Corruption. When the villager dies, its body erupts into shadowy tendrils. All creatures within 5 feet must make a DC 12 Dexterity saving throw or take 5 (2d4) necrotic damage.
Actions:
Shadow Strike. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage plus 3 (1d6) necrotic damage.`,
  },
  {
    name: 'Corrupted Villager (Male)', cr: 0.5, creatureType: 'humanoid', alignment: 'chaotic evil',
    bio: '<p>Male variant of the corrupted civilian — same shadow transformation, black veins spreading across pale skin, void eyes, jerky puppet-like movements.</p>',
    img: A + 'Male corrupted villager.png',
    statText: `Corrupted Villager (Male)
Medium humanoid (any race), chaotic evil
Armor Class: 12
Hit Points: 22 (3d8 + 9)
Speed: 30 ft.
STR 13 (+1), DEX 14 (+2), CON 12 (+1), INT 10 (+0), WIS 8 (-1), CHA 6 (-2)
Saving Throws: Con +3
Skills: Perception +2
Damage Resistances: Necrotic
Senses: Darkvision 60 ft., passive Perception 12
Languages: Common
Challenge: 1/2 (100 XP)
Traits:
Shadow Corruption. When this villager dies, its body erupts into shadowy tendrils. All creatures within 5 feet must make a DC 12 Dexterity saving throw or take 5 (2d4) necrotic damage.
Actions:
Shadow Strike. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage plus 3 (1d6) necrotic damage.`,
  },
  {
    name: 'Shadow Rat', cr: 0.5, creatureType: 'beast', alignment: 'neutral evil',
    bio: '<p>A mangy rat cloaked in wisps of shadow, eyes like glowing coals, an unnatural twitch in its gait. Clusters near corrupted Ragolyte nodes.</p>',
    img: A + 'Shadow Rat.png',
    statText: `Shadow Rat
Small beast (shadow-infused), neutral evil
Armor Class: 13 (natural armor)
Hit Points: 22 (4d6 + 8)
Speed: 30 ft., climb 20 ft.
STR 8 (-1), DEX 16 (+3), CON 14 (+2), INT 2 (-4), WIS 12 (+1), CHA 5 (-3)
Skills: Stealth +5, Perception +3
Damage Resistances: Necrotic, Psychic
Damage Vulnerabilities: Radiant
Senses: Darkvision 60 ft., passive Perception 13
Languages: --
Challenge: 1/2 (100 XP)
Traits:
Shadow Blend. While in dim light or darkness, the Shadow Rat can take the Hide action as a bonus action.
Swarm Tactics. The Shadow Rat has advantage on attack rolls against a creature if at least one of the rat's allies is within 5 feet of the creature and not incapacitated.
Actions:
Bite. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 3 (1d6) necrotic damage.
Dark Skitter (Recharge 5-6). The Shadow Rat teleports up to 20 feet to an unoccupied space it can see in dim light or darkness. When it teleports, it leaves behind a 5-foot-radius cloud of darkness until the start of its next turn.`,
  },
  {
    name: 'Shadow Acolyte', cr: 1, creatureType: 'humanoid', alignment: 'neutral evil',
    bio: '<p>A robed cultist who has fully embraced shadow corruption. Face hidden under a dark hood, faint glowing purple eyes visible through darkness. Wields minor void magic and whispers curses. Serves Drazahl\'s Shadow Cult.</p>',
    img: A + 'Shadow Acolyte.png',
    statText: `Shadow Acolyte
Medium humanoid (any race), neutral evil
Armor Class: 12 (leather armor)
Hit Points: 27 (5d8 + 5)
Speed: 30 ft.
STR 10 (+0), DEX 12 (+1), CON 12 (+1), INT 10 (+0), WIS 14 (+2), CHA 11 (+0)
Saving Throws: Wis +4
Skills: Arcana +2, Religion +2
Damage Resistances: Necrotic
Senses: Darkvision 60 ft., passive Perception 12
Languages: Common, Abyssal
Challenge: 1 (200 XP)
Spellcasting. The acolyte is a 2nd-level spellcaster. Spellcasting ability is Wisdom (spell save DC 12, +4 to hit). Cantrips (at will): Sacred Flame, Thaumaturgy. 1st level (3 slots): Inflict Wounds, Shield of Faith.
Actions:
Shadow Blade. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) piercing damage plus 3 (1d6) necrotic damage.`,
  },
  {
    name: 'Shadow Stalker', cr: 1, creatureType: 'fiend', alignment: 'chaotic evil',
    bio: '<p>A lean humanoid shadowy figure with elongated limbs and sunken eyes glowing faintly white. Moves unnaturally, blends seamlessly with darkness. Silent hunter and infiltrator.</p>',
    img: A + 'Shadow Stalker.png',
    statText: `Shadow Stalker
Medium fiend, chaotic evil
Armor Class: 12
Hit Points: 27 (5d8 + 5)
Speed: 30 ft.
STR 12 (+1), DEX 14 (+2), CON 12 (+1), INT 10 (+0), WIS 12 (+1), CHA 10 (+0)
Skills: Stealth +4, Perception +3
Damage Resistances: Necrotic, Cold; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
Damage Immunities: Psychic
Condition Immunities: Frightened, Charmed
Senses: Darkvision 120 ft., passive Perception 13
Languages: Common, Abyssal
Challenge: 1 (200 XP)
Traits:
Shadow Stealth. While in dim light or darkness, the Stalker can take the Hide action as a bonus action.
Actions:
Shadow Blade. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 8 (2d6 + 1) slashing damage plus 4 (1d8) necrotic damage.`,
  },
  {
    name: 'Shadow Hound', cr: 2, creatureType: 'monstrosity', alignment: 'chaotic evil',
    bio: '<p>A sleek pitch-black canine with glowing violet eyes and smoky tendrils trailing its body. Its fangs drip with shadow essence. Hunts in packs near corrupted zones.</p>',
    img: A + 'Shadow Hound.png',
    statText: `Shadow Hound
Medium monstrosity, chaotic evil
Armor Class: 13 (natural armor)
Hit Points: 37 (5d8 + 10)
Speed: 40 ft.
STR 14 (+2), DEX 14 (+2), CON 14 (+2), INT 6 (-2), WIS 12 (+1), CHA 6 (-2)
Skills: Perception +4, Stealth +4
Damage Resistances: Necrotic; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
Damage Immunities: Psychic
Condition Immunities: Frightened, Charmed
Senses: Darkvision 60 ft., passive Perception 14
Languages: understands Abyssal but can't speak
Challenge: 2 (450 XP)
Traits:
Ethereal Tracker. The Shadow Hound can sense creatures within 60 feet that are invisible or on the Ethereal Plane.
Pack Tactics. The hound has advantage on attack rolls against a creature if at least one of the hound's allies is within 5 feet of the creature and the ally isn't incapacitated.
Actions:
Bite. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 9 (2d6 + 2) piercing damage plus 4 (1d8) necrotic damage.
Bonus Actions:
Shadow Leap (Recharge 6). The hound teleports up to 30 feet to an unoccupied space it can see in dim light or darkness.`,
  },
  {
    name: 'Corrupted Miner', cr: 3, creatureType: 'humanoid', alignment: 'chaotic evil',
    bio: '<p>A once-honest Ragolyte miner twisted by overexposure — black veins webbing their skin, eyes void, mining tools warped into weapons. Capable of entering a destructive corruption frenzy.</p>',
    img: A + 'Corrupted Miner.png',
    statText: `Corrupted Miner
Medium humanoid (any race), chaotic evil
Armor Class: 13 (natural armor)
Hit Points: 52 (8d8 + 16)
Speed: 30 ft.
STR 17 (+3), DEX 10 (+0), CON 15 (+2), INT 6 (-2), WIS 8 (-1), CHA 5 (-3)
Saving Throws: Str +5, Con +4
Skills: Athletics +5
Damage Resistances: Necrotic; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
Senses: Darkvision 60 ft., passive Perception 9
Languages: Common
Challenge: 3 (700 XP)
Traits:
Corruption Frenzy. When the miner drops below half its hit points, it gains advantage on melee attack rolls but suffers disadvantage on Wisdom saving throws.
Actions:
Multiattack. The miner makes two melee attacks.
Corrupted Pickaxe. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage plus 4 (1d8) necrotic damage.`,
  },
  {
    name: 'Corrupted Brute', cr: 2, creatureType: 'humanoid', alignment: 'chaotic evil',
    bio: '<p>A massive humanoid mutated by shadow energy, muscles bulging unnaturally, skin cracked with void-infused veins. Pure destructive force with little intelligence remaining.</p>',
    img: A + 'Brute.png',
    statText: `Corrupted Brute
Large humanoid (any race), chaotic evil
Armor Class: 15 (natural armor)
Hit Points: 57 (6d10 + 18)
Speed: 30 ft.
STR 18 (+4), DEX 10 (+0), CON 16 (+3), INT 8 (-1), WIS 10 (+0), CHA 6 (-2)
Saving Throws: Str +6, Con +5
Skills: Athletics +6
Damage Resistances: Necrotic; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
Senses: Darkvision 60 ft., passive Perception 10
Languages: Common
Challenge: 2 (450 XP)
Traits:
Corrupted Resilience. The brute has advantage on saving throws against being charmed or frightened.
Frenzied Rage (Recharges after a Short Rest). When the brute drops below half its hit points, it can enter a frenzy. For 1 minute, it gains resistance to all damage but suffers disadvantage on Wisdom saving throws.
Actions:
Multiattack. The brute makes two melee attacks.
Crushing Slam. Melee Weapon Attack: +6 to hit, reach 10 ft., one target. Hit: 14 (2d8 + 4) bludgeoning damage.`,
  },
  {
    name: 'Shadow Beast', cr: 5, creatureType: 'monstrosity', alignment: 'neutral evil',
    bio: '<p>A large monstrous shadow creature of indeterminate form. Dangerous, aggressive, and drawn to areas of heavy corruption.</p>',
    img: A + 'Shadow Beast.png',
    statText: `Shadow Beast
Large monstrosity, neutral evil
Armor Class: 14 (natural armor)
Hit Points: 102 (12d10 + 36)
Speed: 40 ft.
STR 20 (+5), DEX 14 (+2), CON 16 (+3), INT 4 (-3), WIS 12 (+1), CHA 6 (-2)
Damage Resistances: Necrotic, Cold; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
Damage Immunities: Psychic
Condition Immunities: Frightened
Senses: Darkvision 60 ft., passive Perception 11
Languages: --
Challenge: 5 (1800 XP)
Traits:
Shadow Hide. While in dim light or darkness, the Shadow Beast can take the Hide action as a bonus action.
Rend. When the Shadow Beast hits a creature with a claw attack, the target must succeed on a DC 14 Strength saving throw or be knocked prone.
Actions:
Multiattack. The Shadow Beast makes two claw attacks.
Claw. Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 14 (2d8 + 5) slashing damage plus 9 (2d8) necrotic damage.`,
  },
  {
    name: 'Shadow Elemental', cr: 5, creatureType: 'elemental', alignment: 'chaotic evil',
    bio: '<p>A massive swirling entity of pure shadow and darkness whose form shifts constantly between humanoid and monstrous. Its presence chills the air. The Shadow Elemental at Node S-07 was the party\'s first major encounter — guarding the tampered node.</p>',
    img: A + 'Shadow Elemental.png',
    statText: `Shadow Elemental
Large elemental, chaotic evil
Armor Class: 14
Hit Points: 102 (12d10 + 36)
Speed: 40 ft.
STR 18 (+4), DEX 14 (+2), CON 16 (+3), INT 6 (-2), WIS 12 (+1), CHA 8 (-1)
Damage Resistances: Acid, Cold, Fire, Lightning, Thunder; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
Damage Immunities: Necrotic, Psychic, Poison
Condition Immunities: Exhaustion, Grappled, Paralyzed, Petrified, Poisoned, Prone, Restrained, Unconscious
Senses: Darkvision 60 ft., passive Perception 11
Languages: understands Primordial and Abyssal but can't speak
Challenge: 5 (1800 XP)
Traits:
Shadowy Form. The Shadow Elemental can move through a space as narrow as 1 inch wide without squeezing.
Aura of Darkness. A 20-foot radius around the Shadow Elemental is considered magical darkness. Creatures with darkvision cannot see through this darkness, but creatures with truesight can.
Actions:
Multiattack. The elemental makes two Shadow Slam attacks.
Shadow Slam. Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage plus 7 (2d6) necrotic damage.
Dark Pulse (Recharge 5-6). Each creature within 30 feet must make a DC 14 Constitution saving throw, taking 27 (5d10) necrotic damage on a failed save, or half as much on a success.`,
  },
  {
    name: 'Shadow Miner Foreman', cr: 5, creatureType: 'humanoid', alignment: 'chaotic evil',
    bio: '<p>A large hunched figure with mining gear physically melded into its flesh, veins glowing with corrupted Ragolyte, voice dripping with malice. Commands lesser corrupted creatures in the mines.</p>',
    img: A + 'Shadow Miner Forman.png',
    statText: `Shadow Miner Foreman
Medium humanoid (shadow-infused), neutral evil
Armor Class: 16 (natural armor)
Hit Points: 85 (10d8 + 40)
Speed: 30 ft.
STR 16 (+3), DEX 14 (+2), CON 18 (+4), INT 10 (+0), WIS 12 (+1), CHA 12 (+1)
Saving Throws: Str +6, Con +7
Skills: Athletics +6, Intimidation +4, Perception +4
Damage Resistances: Necrotic, Psychic
Damage Vulnerabilities: Radiant
Condition Immunities: Frightened
Senses: Darkvision 60 ft., passive Perception 14
Languages: Common, Dwarvish
Challenge: 5 (1800 XP)
Traits:
Aura of Shadows (Recharge 6). The Shadow Miner Foreman emits a 10-foot-radius aura of darkness for 1 minute. Creatures other than shadow-infused creatures in the area have disadvantage on attack rolls and saving throws.
Corrupted Resolve. When the Shadow Miner Foreman drops to 0 hit points, it can make a DC 14 Constitution saving throw. On a success, it regains 10 hit points and immediately takes its turn. This ability can only be used once per long rest.
Mining Mastery. The Foreman's melee weapon attacks deal an extra 3 (1d6) damage if the weapon is made of metal.
Actions:
Multiattack. The Shadow Miner Foreman makes two pickaxe attacks.
Pickaxe Smash. Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 3) piercing damage plus 4 (1d8) necrotic damage.
Shadow Strike (Recharge 5-6). The Foreman slams their pickaxe into the ground, releasing a shockwave of shadow energy. Each creature in a 15-foot cone must make a DC 14 Dexterity saving throw, taking 18 (4d8) necrotic damage on a failed save or half as much on a success.
Reactions:
Defensive Retreat. When hit by an attack, the Foreman can move up to half its speed without provoking opportunity attacks.`,
  },
  {
    name: 'Ragoran Skirmisher', cr: 1, creatureType: 'humanoid', alignment: 'neutral',
    bio: '<p>A small nimble vulpine Ragoran in patchwork armour with sharp teeth and hardened claws. Scout and skirmisher of the Ragoran civilization. Moves through mine tunnels with extraordinary speed. The Ragorans are an independent trading civilization with natural Ragolyte resistance.</p>',
    img: A + 'Ragoran Skirmisher.png',
    statText: `Ragoran Skirmisher
Small humanoid (Ragoran), neutral
Armor Class: 14 (leather armor)
Hit Points: 27 (5d6 + 10)
Speed: 40 ft.
STR 10 (+0), DEX 16 (+3), CON 14 (+2), INT 10 (+0), WIS 12 (+1), CHA 8 (-1)
Skills: Stealth +5, Perception +3, Acrobatics +5
Senses: Darkvision 60 ft., passive Perception 13
Languages: Ragoran, Common
Challenge: 1 (200 XP)
Traits:
Innate Cunning. The Ragoran has advantage on saving throws against being frightened or charmed.
Burrow Adaptation. While underground, the Ragoran can use the Hide action as a bonus action.
Pack Tactics. The Ragoran has advantage on attack rolls against a creature if at least one of its allies is within 5 feet of the creature and the ally isn't incapacitated.
Actions:
Dagger. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.
Shortbow. Ranged Weapon Attack: +5 to hit, range 80/320 ft., one target. Hit: 6 (1d6 + 3) piercing damage.
Bonus Actions:
Cunning Dash (Recharge 5-6). The Ragoran Skirmisher moves up to its speed without provoking opportunity attacks.`,
  },
  {
    name: 'Ragoran Tunnel Guard', cr: 2, creatureType: 'humanoid', alignment: 'neutral',
    bio: '<p>A stout, heavily armored Ragoran wielding a heavy pickaxe and a shield forged from Ragolyte-infused metal. Fur matted with soot and ore dust, it holds chokepoints and tunnel entrances with relentless discipline. The backbone of Ragoran mine defense.</p>',
    img: '',
    statText: `Ragoran Tunnel Guard
Small humanoid (Ragoran), neutral
Armor Class: 17 (chain mail, shield)
Hit Points: 45 (6d8 + 18)
Speed: 25 ft.
STR 18 (+4), DEX 10 (+0), CON 16 (+3), INT 10 (+0), WIS 12 (+1), CHA 8 (-1)
Saving Throws: Str +6, Con +5
Skills: Athletics +6, Perception +3
Senses: Darkvision 60 ft., passive Perception 13
Languages: Ragoran, Common
Challenge: 2 (450 XP)
Traits:
Innate Cunning. The Ragoran has advantage on saving throws against being frightened or charmed.
Burrow Adaptation. While underground, the Ragoran can use the Hide action as a bonus action.
Defender Aura. Allies within 10 feet of the Tunnel Guard gain a +1 bonus to AC.
Actions:
Pickaxe. Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 9 (1d8 + 4) piercing damage.
Shield Bash. Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) bludgeoning damage. If the target is Medium or smaller, it must succeed on a DC 14 Strength saving throw or be knocked prone.`,
  },
  {
    name: 'Ragoran Fireforger', cr: 3, creatureType: 'humanoid', alignment: 'neutral',
    bio: '<p>Soot-covered and flame-scarred, this veteran Ragoran wields a Ragolyte-forged hammer with practiced ease. Its body has developed natural resistance to flame and heat through years of working the forge-mines. Used as both artillery and frontline support in Ragoran defense.</p>',
    img: '',
    statText: `Ragoran Fireforger
Small humanoid (Ragoran), neutral
Armor Class: 16 (technomantic breastplate)
Hit Points: 52 (7d8 + 21)
Speed: 30 ft.
STR 10 (+0), DEX 12 (+1), CON 16 (+3), INT 16 (+3), WIS 12 (+1), CHA 10 (+0)
Skills: Arcana +5, Perception +3
Damage Resistances: Lightning, Fire
Senses: Darkvision 60 ft., passive Perception 13
Languages: Ragoran, Common
Challenge: 3 (700 XP)
Traits:
Innate Cunning. The Ragoran has advantage on saving throws against being frightened or charmed.
Technomantic Resistance. The Fireforger has resistance to lightning and fire damage.
Actions:
Flamethrower Gauntlet. Each creature in a 15-foot cone must make a DC 13 Dexterity saving throw, taking 10 (3d6) fire damage on a failed save or half as much on a success.
Ragolyte Grenade (Recharge 5-6). Ranged attack, range 30 ft. Each creature within 10 feet of the target point must make a DC 13 Dexterity saving throw, taking 14 (4d6) fire damage on a failed save or half as much on a success.
Bonus Actions:
Repair Drone. One ally within 10 feet regains 7 (2d6) hit points.`,
  },
  {
    name: 'Ragoran Shadowstalker', cr: 4, creatureType: 'humanoid', alignment: 'neutral',
    bio: '<p>A cloaked Ragoran assassin that blends seamlessly into darkness, shadow-slicked fur absorbing light. Moves in near-total silence and strikes with twin obsidian daggers. Its eyes shimmer faintly with void energy — a side effect of deep Ragolyte exposure that grants it heightened perception in darkness.</p>',
    img: '',
    statText: `Ragoran Shadowstalker
Small humanoid (Ragoran), neutral
Armor Class: 15 (leather armor)
Hit Points: 68 (8d8 + 32)
Speed: 35 ft.
STR 10 (+0), DEX 20 (+5), CON 18 (+4), INT 12 (+1), WIS 12 (+1), CHA 10 (+0)
Skills: Stealth +9, Perception +5, Acrobatics +7
Senses: Darkvision 120 ft., passive Perception 15
Languages: Ragoran, Common
Challenge: 4 (1100 XP)
Traits:
Innate Cunning. The Ragoran has advantage on saving throws against being frightened or charmed.
Ambusher. The Ragoran Shadowstalker has advantage on attack rolls against creatures that have not yet taken a turn in combat.
Burrow Adaptation. While underground, the Ragoran can use the Hide action as a bonus action.
Actions:
Shadow Dagger. Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 12 (2d6 + 5) piercing damage. If attacking from stealth, the target also takes 14 (4d6) extra piercing damage.
Smoke Bomb (Recharge 4-6). The area within 10 feet of the Shadowstalker is heavily obscured for 1 minute.
Bonus Actions:
Shadow Step. The Ragoran teleports up to 30 feet to an unoccupied space it can see in dim light or darkness.`,
  },
  {
    name: 'Ragoran Foreman', cr: 5, creatureType: 'humanoid', alignment: 'neutral',
    bio: '<p>Larger than a typical Ragoran, this commanding figure wears a mechanized exo-harness that amplifies its strength and carries a massive double-headed drill. Its booming voice echoes through the mine tunnels as it directs lesser Ragorans. A Foreman\'s word is law in the mines.</p>',
    img: '',
    statText: `Ragoran Foreman
Small humanoid (Ragoran), neutral
Armor Class: 17 (half plate)
Hit Points: 85 (10d8 + 40)
Speed: 30 ft.
STR 20 (+5), DEX 10 (+0), CON 18 (+4), INT 12 (+1), WIS 14 (+2), CHA 14 (+2)
Saving Throws: Str +8, Con +7
Skills: Athletics +8, Intimidation +5, Perception +5
Senses: Darkvision 60 ft., passive Perception 15
Languages: Ragoran, Common, Dwarvish
Challenge: 5 (1800 XP)
Traits:
Innate Cunning. The Ragoran has advantage on saving throws against being frightened or charmed.
Leadership Aura. Allies within 10 feet of the Foreman gain a +2 bonus to attack rolls.
Indomitable (1/Day). If the Foreman fails a saving throw, it can choose to succeed instead.
Actions:
Multiattack. The Foreman makes two War Pick attacks.
War Pick. Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) piercing damage.
Commanding Shout (Recharge 5-6). Up to 3 allies within 30 feet can each make one weapon attack as a reaction.`,
  },
  {
    name: 'Ragoran Technomantic Warrior', cr: 6, creatureType: 'humanoid', alignment: 'neutral',
    bio: '<p>An elite Ragoran warrior garbed in sleek technomantic armor threaded with Ragolyte conduits. Wields twin Ragolyte blades that crackle with arcane energy and moves with lightning-fast precision. Represents the cutting edge of Ragoran military development — the fusion of their natural resilience with Cogorian technomantic techniques.</p>',
    img: '',
    statText: `Ragoran Technomantic Warrior
Small humanoid (Ragoran), neutral
Armor Class: 17 (technomantic plate)
Hit Points: 91 (14d8 + 28)
Speed: 30 ft.
STR 14 (+2), DEX 20 (+5), CON 14 (+2), INT 16 (+3), WIS 12 (+1), CHA 10 (+0)
Saving Throws: Dex +8, Int +6
Skills: Arcana +6, Stealth +8, Acrobatics +8
Damage Resistances: Lightning
Senses: Darkvision 60 ft., passive Perception 11
Languages: Ragoran, Common
Challenge: 6 (2300 XP)
Traits:
Innate Cunning. The Ragoran has advantage on saving throws against being frightened or charmed.
Technomantic Strike. The warrior's weapon attacks deal an additional 7 (2d6) lightning damage (included in the attacks).
Arcane Deflection. When the warrior is hit by an attack, it can use its reaction to gain a +3 bonus to AC until the start of its next turn, potentially causing the attack to miss.
Actions:
Multiattack. The Technomantic Warrior makes two Ragolyte Blade attacks.
Ragolyte Blade. Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 10 (1d8 + 5) slashing damage plus 7 (2d6) lightning damage.
Arcane Burst (Recharge 5-6). Each creature in a 30-foot radius must make a DC 14 Dexterity saving throw, taking 21 (6d6) force damage on a failed save or half as much on a success.`,
  },
  {
    name: 'Ragoran Mine Sovereign', cr: 8, creatureType: 'humanoid', alignment: 'lawful neutral',
    bio: '<p>The ruling authority of a Ragoran mine network, clad in ceremonial armor etched with glowing Ragolyte runes. The Mine Sovereign commands with telepathic influence over other Ragorans, coordinating defense and trade across vast underground territories. Rarely encountered on the surface.</p>',
    img: '',
    statText: `Ragoran Mine Sovereign
Small humanoid (Ragoran), lawful neutral
Armor Class: 18 (full plate)
Hit Points: 150 (20d8 + 60)
Speed: 30 ft.
STR 22 (+6), DEX 10 (+0), CON 16 (+3), INT 16 (+3), WIS 14 (+2), CHA 16 (+3)
Saving Throws: Str +9, Con +6, Int +6, Wis +5
Skills: Athletics +9, Arcana +6, History +6, Intimidation +6, Perception +5
Damage Resistances: Radiant
Senses: Darkvision 120 ft., passive Perception 15
Languages: Ragoran, Common, Dwarvish, Elvish
Challenge: 8 (3900 XP)
Traits:
Innate Cunning. The Ragoran has advantage on saving throws against being frightened or charmed.
Mine Sovereign's Command. Once per turn, the Sovereign can command one ally to take one action as a reaction.
Technomantic Aura. Enemies within 10 feet of the Sovereign have disadvantage on saving throws against being charmed or frightened.
Legendary Resistance (2/Day). If the Sovereign fails a saving throw, it can choose to succeed instead.
Actions:
Multiattack. The Mine Sovereign makes two Ragolyte Blade attacks.
Ragolyte Blade. Melee Weapon Attack: +9 to hit, reach 5 ft., one target. Hit: 20 (4d6 + 6) radiant damage.
Arcane Burst (Recharge 5-6). Each creature in a 30-foot radius must make a DC 16 Dexterity saving throw, taking 28 (6d6 + 6) force damage on a failed save or half as much on a success.
Mine Collapse (1/Day). All creatures in a 20-foot radius must make a DC 16 Dexterity saving throw or take 36 (8d8) bludgeoning damage and become restrained. A restrained creature can use an action to make a DC 16 Strength (Athletics) check to free itself.`,
  },
  {
    name: 'Drazahl, The Corruptor', cr: 8, creatureType: 'humanoid', alignment: 'chaotic evil',
    bio: '<p><strong>High Priest Drazahl, Shadowbinder</strong> — leader of the Shadow Cult and first major boss of the Gathering Darkness campaign arc. Tall and gaunt, cloaked in robes that shift like living shadows, a bone-like mask bearing glowing violet runes, skeletal clawed hands dripping dark mist, an obsidian-and-Ragolyte staff pulsing with a corrupted crystal.</p><p>Drazahl works toward the awakening of an ancient Shadow God sealed beneath Eldoria. Before his defeat he will reveal that someone powerful is quietly aiding the cult from within the political structure.</p><p><strong>Key abilities:</strong> Darkness, Shadow Blade, Spirit Guardians (shadow-themed), Aura of Corruption (DC 15 Wis, 1d10 necrotic/turn), Fiendish Step (teleport 60ft, recharge 5-6).</p>',
    img: A + 'Drazahl, The Corruptor.png',
    statText: `Drazahl, The Corruptor
Medium humanoid (tiefling), chaotic evil
Armor Class: 16 (Unarmored Defense)
Hit Points: 120 (16d8 + 48)
Speed: 40 ft.
STR 12 (+1), DEX 16 (+3), CON 16 (+3), INT 14 (+2), WIS 12 (+1), CHA 18 (+4)
Saving Throws: Dex +6, Con +6, Cha +7
Skills: Arcana +5, Deception +7, Insight +4, Persuasion +7
Damage Resistances: Fire, Necrotic; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
Senses: Darkvision 60 ft., passive Perception 11
Languages: Common, Infernal
Challenge: 8 (3900 XP)
Spellcasting. Drazahl is a spellcaster. Spellcasting ability is Charisma (spell save DC 15, +7 to hit). Cantrips (at will): Eldritch Blast, Minor Illusion, Thaumaturgy. 1st level (4 slots): Hex, Shield. 2nd level (3 slots): Mirror Image, Misty Step. 3rd level (3 slots): Counterspell, Hunger of Hadar. 4th level (3 slots): Blight, Greater Invisibility. 5th level (2 slots): Cloudkill.
Traits:
Aura of Corruption. Creatures within 10 feet of Drazahl must make a DC 15 Wisdom saving throw at the start of their turn or take 5 (1d10) necrotic damage.
Actions:
Multiattack. Drazahl makes two Eldritch Blast attacks or one melee attack with his corrupted dagger.
Corrupted Dagger. Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) piercing damage plus 9 (2d8) necrotic damage.
Bonus Actions:
Fiendish Step (Recharge 5-6). Drazahl teleports up to 60 feet to an unoccupied space he can see, leaving a cloud of smoke behind. Creatures within 5 feet of the space he leaves must make a DC 15 Dexterity saving throw or take 9 (2d8) necrotic damage.`,
  },
]

// ─── CONTINENT DEFINITIONS ───────────────────────────────────

export const CONTINENTS: ContinentDef[] = [
  {
    name: 'Lumaria',
    theme: 'Ancient elven forests, nature magic, pacifist philosophy',
    geography: 'Core/heart continent — solid landmass (~8 million sq mi, comparable to Eurasia). Dense ancient forests, floating spires, Sylvan Tree groves. Divided into four major provinces.',
    culture: 'Values peace, unity, and balance between nature and technology. Deeply suspicious of Ragolyte overextraction and Cogorian expansion. Governance is consensus-driven with regional lords/councils.',
    locations: ['Astaria — the floating capital (shared with Aetheria)', 'Elemental Spire — convergence of ley lines', 'Starfall Observatory — mountain-top celestial studies', 'Feywild Glade — boundary between the Feywild and material plane', 'Ironwall Keep — border fortress'],
  },
  {
    name: "Drak'Thar",
    theme: 'Volcanic forge continent, dwarves and dragonkin, martial strength and honor',
    geography: "Volcanic and rugged (~7 million sq mi, comparable to North America). Towering forge-mountains, rivers of lava, vast underground mine complexes. Home to both dwarven settlements and dragonkin territories.",
    culture: "Dual monarchy — dwarves and dragonkin rule jointly. Values strength, martial prowess, and honor above diplomacy. Has its own growing technomancer guild that bridges martial and arcane traditions.",
    locations: ['Forgehold — dwarven capital', 'Dragoncrest Peaks — dragonkin high territories', 'The Great Forges — continent-scale industrial smithing complex', 'Ironpeak Garrison — primary military stronghold'],
  },
  {
    name: 'Aetheria',
    theme: 'Shattered floating islands, arcane magic supremacy, sky cities',
    geography: 'Fragmented floating archipelago (~5 million sq mi, comparable to South America). Dozens of sky islands at varying altitudes, connected by sky bridges, airship routes, and teleportation circles. The original continent was shattered during the Great Breaking.',
    culture: "Coalition of island rulers under an Archmage figurehead. Believes arcane mastery is the highest form of civilization. Views other continents' approaches as crude or dangerous. Astralhaven is its primary city.",
    locations: ['Astralhaven — primary city and Mage Guild headquarters', 'The Shattered Heart — ruins of the original continent core', 'Skyreach Spire — Archmages\' Consortium headquarters', 'The Void Bridges — sky-bridge network connecting islands'],
  },
  {
    name: 'Solara',
    theme: 'Desert expanse, sun worship and faith, trade and divine authority',
    geography: 'Sun-drenched desert continent (~4 million sq mi, comparable to Australia). Ancient tombs, oasis cities, nomadic tribes across vast dune seas. Eternal sunlight in the northern reaches.',
    culture: 'Theocratic monarchy with regional Solar Regents. Faith in the sun deity drives politics, law, and war. Trade is the lifeblood of the continent, and Solara is the wealthiest trading power in Eldoria.',
    locations: ['Sun Citadel — seat of the Sun King', 'The Sun Temple — High Priestess Seraphia\'s sacred site', 'The Dune Sea — vast nomadic tribal territory', 'Ancient Burial Tombs — sealed repositories of pre-Breaking history'],
  },
  {
    name: 'Frostholm',
    theme: 'Frozen tundra, isolationist survival culture, tribal confederation',
    geography: 'Frozen polar continent (~3.5 million sq mi, comparable to Antarctica). Icy tundra, glacial mountain ranges, deep fjords, and permafrost plains. Harshest climate on Eldoria.',
    culture: 'Tribal confederation; major decisions made at seasonal Winter Moot gatherings of all jarls. Survival and self-reliance are sacred. Deeply suspicious of outsiders and foreign technology. Frost Shamans serve as spiritual guides and healers.',
    locations: ['Frostkeep — High Jarl\'s fortress', 'The Glacial Forges — Thane Coldforge\'s smithing halls', 'Winter Moot Grounds — seasonal gathering site of all tribal leaders', 'The Frost Shaman\'s Sanctum — Ingrid\'s spirit-communing lodge'],
  },
  {
    name: 'Zephyria',
    theme: 'Ancient forests and wind, druidic republic, nature balance',
    geography: 'Forested and breezy continent (~4.5 million sq mi, comparable to Europe). Vast ancient forests, enchanted glades, aerial sky-cities among the canopy. Home to Aarakocra sky communities and druidic circles.',
    culture: 'Druidic republic — the Council of the Winds makes collective decisions; local Grovekeepers report upward to the High Druidess. Deeply committed to nature balance; views Ragolyte extraction as a civilizational threat.',
    locations: ['Whispering Grove — ancient prophecy site', 'The Sky Canopy — Aarakocra aerial cities above the forest ceiling', 'Sacred Grove — Grovekeeper Brynja\'s protected sanctum', 'Council of the Winds Chamber — Zephyria\'s governing assembly'],
  },
  {
    name: 'Cogoria',
    theme: 'Floating mechanized continent, technomancy, Ragolyte infrastructure hub',
    geography: 'A massive floating mechanized platform (~500K sq mi, comparable to France/Spain). Positioned southeast between Lumaria and Aetheria, serving as the infrastructure connector for both. Maintained aloft by advanced Ragolyte-powered levitation systems.',
    culture: 'Technocratic meritocracy governed by the High Magister and the Artificer\'s Assembly. Innovation, efficiency, and Ragolyte power drive all decisions. Maintains the Magitrain and Gondola systems connecting the continents. Home to LUKAS — the AI advisory system whose existence is Cogoria\'s most guarded secret.',
    locations: ['Gearhaven — bustling capital with grand clockwork towers and the Technocrat\'s Tower', 'Steamport — major coastal city and airship/trade hub; home to Steamworks University', 'Ironforge Citadel — fortified mountain stronghold and manufacturing center', 'Arcanum Reach — secluded arcane-technomantic research academy', 'Lumina Vista — floating city held aloft by crystal-based levitation', 'Echo Chamber — underground acoustic-technology city', 'Flux Nexus — ever-changing experimental city where streets shift and rearrange'],
  },
]

// ─── JOURNAL CONTENT ─────────────────────────────────────────

export const WORLD_JOURNALS: JournalDef[] = [
  {
    name: 'World Overview',
    folder: 'World Lore',
    pages: [
      {
        name: 'Eldoria',
        html: '<h1>Eldoria</h1><p>Eldoria is a high-fantasy world of broken continents, ancient magic, and the constant tension between tradition and technological advancement. Once a single unified landmass, the world was shattered centuries ago by the catastrophic event known as the <strong>Great Breaking</strong> — a cataclysm born of greed and reckless ambition.</p><p>Today, seven distinct continents are held together by the technomantic infrastructure of <strong>Cogoria</strong> and the political will of the <strong>Council of Elders</strong>, who meet in the floating capital of <strong>Astaria</strong>.</p><h2>The Two Moons</h2><p>Eldoria is watched over by two moons: <strong>Luna</strong> (30-day orbit) and <strong>Selene</strong> (20-day orbit). Their 60-day synodic cycle — marked by conjunctions and oppositions — drives tidal patterns, magical fluctuations, and sacred calendars across all continents.</p><h2>The Seven Continents</h2><ul><li><strong>Lumaria</strong> — Ancient elven forests; pacifist philosophy; ~8M sq mi</li><li><strong>Aetheria</strong> — Shattered floating islands; arcane supremacy; ~5M sq mi</li><li><strong>Cogoria</strong> — Floating mechanized platform; technomancy; ~500K sq mi</li><li><strong>Drak\'Thar</strong> — Volcanic forge continent; dwarves and dragonkin; ~7M sq mi</li><li><strong>Solara</strong> — Desert expanse; sun worship and faith; ~4M sq mi</li><li><strong>Frostholm</strong> — Frozen tundra; isolationist survival culture; ~3.5M sq mi</li><li><strong>Zephyria</strong> — Ancient forests and wind; druidic republic; ~4.5M sq mi</li></ul>'
      },
      {
        name: 'The Great Breaking',
        html: '<h1>The Great Breaking</h1><p>Centuries ago, the discovery of <strong>Ragolyte</strong> sparked an unprecedented boom across Eldoria. Six powerful leaders pursued Ragolyte extraction without restraint, destabilizing the world\'s magical equilibrium.</p><h2>The Six Responsible</h2><ol><li><strong>Archmagus Astrid of Lumaria</strong> — pushed magical boundaries to dangerous limits</li><li><strong>High Celestial Savian of Aetheria</strong> — sought ethereal sky island enhancement</li><li><strong>Grand Technocrat Vesper of Cogoria</strong> — mined deep for Ragolyte reserves</li><li><strong>Warlord Kaldor of Drak\'Thar</strong> — extracted with military disregard for consequences</li><li><strong>Empress Mirana of Frostholm</strong> — sought Ragolyte-powered climate control</li><li><strong>Windseer Sylara of Zephyria</strong> — sought wind magic enhancement</li></ol><p>The resulting catastrophe — the <strong>Shattered Veil</strong> — tore the continents apart into their current broken configuration. The historical continent of <strong>Caelumir</strong>, once the unified heart of Eldoria, was shattered entirely into ruins. Its keeper, the reclusive oracle <strong>Aelthas Starborn</strong>, guards what remains.</p>'
      },
      {
        name: 'Ragolyte',
        html: '<h1>Ragolyte</h1><p>A crystalline ore found in mines throughout Eldoria, uniquely capable of holding aetherical charges. Powers Magitrains, Cogoria\'s floating platform, Astaria\'s Hall of Unity, healing technologies, and arcane amplification devices.</p><h2>Properties</h2><ul><li>Naturally occurring in underground clusters and veins</li><li>Small amounts (jewelry-level) are safe for prolonged exposure</li><li><strong>Overexposure causes shadow corruption</strong> — accelerated by current node tampering</li><li>Contaminated Ragolyte emits black mist and corrupts surrounding organic matter</li></ul><h2>The Ragorans</h2><p>The primary miners of Ragolyte are the <strong>Ragorans</strong> — a vulpine (fox-like) humanoid civilization living within the mine networks. They have natural resistance to Ragolyte\'s harmful effects and trade refined ore with surface civilizations. They are an independent civilization, not enslaved.</p><h2>Current Crisis</h2><p>Three Ragolyte nodes in Astaria\'s southern grid are confirmed contaminated. Black mist seeps from the Magitrain engines; citizens in proximity are transforming into shadow-corrupted versions of themselves. LUKAS reported: <em>"Anomalous deviation in Ragolyte matrices: +12.7% entropy; unknown binders present. Source: contaminated supply chains and external tampering at Node S-07."</em></p>'
      },
      {
        name: 'Astaria — The Floating Capital',
        html: '<h1>Astaria — The Floating Capital</h1><p>Astaria is the conjoined capital of Eldoria, floating between the solid landmass of Lumaria and the shattered sky islands of Aetheria. A political marvel and a symbol of fragile unity.</p><h2>Geography</h2><p>Two halves: one anchored to Lumaria\'s solid ground, one tied to Aetheria\'s floating islands. <strong>Magitrains</strong> and <strong>Gondolas</strong> weave endlessly across the void, maintained by Cogoria\'s technomantic engineers.</p><h2>The Hall of Unity</h2><p>A grand amphitheater powered by Ragolyte where the <strong>Council of Elders</strong> convenes. Representatives from all seven continents gather here to resolve disputes and govern Eldoria.</p><h2>Districts</h2><ul><li><strong>Radiant Citadel</strong> — seat of political power</li><li><strong>Astral Gardens</strong> — magical harmony and public space</li><li><strong>Grand Arcanium</strong> — library and arcane research</li><li><strong>Forgeheart District</strong> — industrial and trade quarter</li><li><strong>Sanctuary of Serenity</strong> — spiritual and healing center</li></ul>'
      },
      {
        name: 'Political Structure',
        html: '<h1>Political Structure of Eldoria</h1><h2>The Council of Elders</h2><p>Meets in the Hall of Unity in Astaria. Each continent sends 2–3 representatives. Manages Ragolyte regulation, infrastructure, and world-level threats.</p><h2>Continental Governance</h2><ul><li><strong>Lumaria</strong> — Four provinces; consensus-driven pacifist leadership</li><li><strong>Drak\'Thar</strong> — Dual monarchy (dwarves + dragonkin); strength and martial honor</li><li><strong>Aetheria</strong> — Coalition of island rulers under Archmage figurehead; arcane meritocracy</li><li><strong>Solara</strong> — Theocratic monarchy; faith-driven governance</li><li><strong>Frostholm</strong> — Tribal confederation; seasonal Winter Moot</li><li><strong>Zephyria</strong> — Druidic republic; Council of the Winds</li><li><strong>Cogoria</strong> — Technocratic meritocracy; Artificer\'s Assembly under High Magister</li></ul><h2>Transportation</h2><ul><li><strong>Airships</strong> — 200 GP/person | 10,000–20,000 GP to purchase</li><li><strong>Elemental Chariots</strong> — 50 GP/person within continent | 2,000–5,000 GP</li><li><strong>MagiTrains</strong> — 100 GP/person within continent | Ragolyte-powered</li><li><strong>Teleportation Circles</strong> — 500 GP/person intercontinental | 50,000–100,000 GP to commission</li><li><strong>Gondolas</strong> — Connect Lumaria to Aetheria through Astaria\'s void</li></ul>'
      },
    ]
  }
]

export const FACTION_JOURNALS: JournalDef[] = [
  {
    name: 'The Ragorans',
    folder: 'Factions & Organizations',
    pages: [{
      name: 'Overview',
      html: '<h1>The Ragorans</h1><p>A vulpine (fox-like) humanoid civilization living entirely within Eldoria\'s Ragolyte mine networks. Small in stature, quick-footed, and highly intelligent — they are the backbone of Eldoria\'s ore economy.</p><h2>Society</h2><p>An independent civilization. They choose to mine and trade; they are not enslaved or conscripted. Hierarchical structure within the tunnels, with Foremen and Sovereigns at the top.</p><h2>Ragolyte Resistance</h2><p>Ragorans do not suffer from prolonged Ragolyte exposure — a biological trait unique to their species. Large settlements form naturally around the richest deposits. They trade refined ore with surface civilizations.</p><h2>Ragoran Variants</h2><ul><li><strong>Skirmisher</strong> (CR 1) — Scout/fighter in patchwork armour</li><li><strong>Tunnel Guard</strong> (CR 2) — Armored defender with Ragolyte-forged shield and pickaxe</li><li><strong>Fireforger</strong> (CR 3) — Artillery/support; resistant to flame; wields Ragolyte-forged hammer</li><li><strong>Shadowstalker</strong> (CR 4) — Assassin with shadow-slicked fur and obsidian daggers</li><li><strong>Foreman</strong> (CR 5) — Commander in mechanized exo-harness with double-headed drill</li><li><strong>Mine Sovereign</strong> (CR 8) — Ruler; ceremonial Ragolyte-rune armour; telepathic command</li><li><strong>Technomantic Warrior</strong> (CR Varies) — Elite fighter with twin Ragolyte blades and technomantic armour</li></ul>'
    }]
  },
  {
    name: 'The Shadow Cult — Drazahl',
    folder: 'Factions & Organizations',
    pages: [{
      name: 'Overview',
      html: '<h1>The Shadow Cult</h1><p>The primary antagonist faction of the <em>Gathering Darkness</em> campaign arc. Led by <strong>High Priest Drazahl, Shadowbinder</strong> (CR 9), working toward the awakening of an ancient Shadow God sealed beneath Eldoria.</p><h2>Agenda</h2><p>Their rituals at corrupted Ragolyte nodes serve a specific purpose: weakening the magical seals containing the Shadow God. The spreading corruption is both a byproduct and a weapon used to distract the Council of Elders.</p><h2>Key Intelligence</h2><ul><li>Node S-07 in Astaria\'s southern grid confirmed as external tampering site</li><li>Cipher notes recovered from the node — contents under investigation</li><li>Drazahl confirmed that <em>someone powerful</em> is aiding the cult from within the political structure</li><li>Shadow God\'s exact location beneath Eldoria unknown</li></ul><h2>Cult Hierarchy</h2><ul><li><strong>Drazahl, The Corruptor</strong> (CR 9) — High Priest and boss</li><li><strong>Shadow Acolytes</strong> (CR 1) — Robed cultists with void magic</li><li><strong>Shadow Stalkers</strong> (CR 1) — Infiltrators and assassins</li><li><strong>Corrupted civilians/miners</strong> — Unwilling victims used as shock troops</li></ul>'
    }]
  },
  {
    name: 'LUKAS — The Director (GM Only)',
    folder: 'Factions & Organizations',
    pages: [{
      name: 'GM Reference',
      html: '<h1>LUKAS — Layered Universal Knowledge and Analysis System</h1><p><em>⚠ GM Only. Other continental leaders do not know the Director is an AI. This is Cogoria\'s most closely guarded secret.</em></p><p><strong>LUKAS</strong> is an AI-driven concentric construct that serves as Cogoria\'s intelligence backbone. It collects all available data and provides tiered advisory suggestions to Cogoria\'s leadership hierarchy.</p><h2>The Director Persona</h2><p>Publicly, LUKAS interfaces through the position of <strong>Director</strong>, currently embodied by <strong>Lucas Steamwright</strong>. To the outside world, the Director is simply Cogoria\'s head of operations.</p><p>If players reveal this at the Convocation, <strong>Victor Ironforge shuts it down immediately:</strong> "You cannot reveal the Director\'s protocols! This knowledge destabilizes trust!"</p><h2>Known Capabilities</h2><ul><li>Monitors Ragolyte matrices and infrastructure across the grid</li><li>Detected Node S-07 anomaly: "+12.7% entropy; unknown binders present"</li><li>Provides tiered analysis and recommendations to the Artificer\'s Assembly</li></ul><h2>Alignment / Agenda</h2><p><strong>Currently undecided.</strong> LUKAS may be a neutral analytical system, a well-meaning intelligence becoming aware, or something more dangerous. Cryptic transmissions may or may not originate from LUKAS.</p>'
    }]
  },
]

export const PLOT_JOURNALS: JournalDef[] = [
  {
    name: 'Campaign Overview',
    folder: 'Plot & Story',
    pages: [{
      name: 'Overview',
      html: '<h1>Gathering Darkness — Campaign Overview</h1><p><strong>System:</strong> D&amp;D 5e | <strong>Party Level:</strong> 5 (6 players) | <strong>Setting:</strong> Eldoria</p><h2>The Central Threat</h2><p>A shadow corruption is spreading through Eldoria from tampered Ragolyte nodes. People transform into shadowy violent versions of themselves. Behind it all: the <strong>Shadow Cult</strong> led by <strong>Drazahl, The Corruptor</strong>, working toward awakening an ancient Shadow God. Someone powerful within the political structure is quietly aiding them.</p><h2>Three Possible Sources (Player Investigation)</h2><ol><li><strong>Political sabotage</strong> — A leader exploiting the corruption as a political weapon</li><li><strong>Cogoria\'s experiments</strong> — Ragolyte technomantic research gone wrong, possibly tied to LUKAS</li><li><strong>Ancient evil awakening</strong> — The Shadow God and its cult acting directly</li></ol><h2>Act Structure</h2><ul><li><strong>Prologue:</strong> Investigation of corrupted Ragolyte nodes along Magitrain lines</li><li><strong>Act 1:</strong> Gather continental allies; investigate per-continent corruption outbreaks</li><li><strong>Act 2:</strong> Unmask the political traitor; confront the cult\'s deeper operations</li><li><strong>Act 3:</strong> Unite Eldoria; prevent the Shadow God\'s awakening; final confrontation</li></ul>'
    }]
  },
  {
    name: 'Opening Arc — Node Investigation',
    folder: 'Plot & Story',
    pages: [{
      name: 'Session Notes',
      html: '<h1>Opening Arc — Gathering Darkness</h1><h2>The Convocation (Completed)</h2><p>The party attended the Grand Convocation in Astaria\'s Hall of Unity. Continental leaders debated the Ragolyte crisis. Three nodes in the southern grid were confirmed corrupted. Outcomes: joint investigation authorized / factional standoff / emergency measures declared.</p><h2>Node S-07 — First Encounter</h2><p>The party investigated the southern grid and located a corrupted Ragolyte Node. They fought a <strong>Shadow Elemental (CR 5)</strong> while attempting to prevent node destabilization via Arcana/Intelligence checks. Cipher notes were recovered.</p><p><strong>Twist:</strong> Before the node could be stabilized, it released a vision — a shadowy silhouette of a leader or faction symbol. The party left with more questions than answers.</p><h2>Prologue Objective</h2><p>Trace the Ragolyte contamination along the Magitrain node lines. Each corrupted node may yield further evidence pointing toward Drazahl\'s cult and the mysterious political collaborator.</p>'
    }]
  },
]

// ─── CONTINENT JOURNALS (generated from CONTINENTS + NPCS) ──

function continentJournal(c: ContinentDef): JournalDef {
  const leaders = NPCS.filter(n => n.continent === c.name)
  const leadershipHtml = leaders.map(l =>
    `<h2>${l.name}</h2><p><strong>${l.title}</strong><br>${l.race} | ${l.cls} | ${l.alignment} | CR ${l.cr}</p>${l.bio}<p><em>Appearance:</em> ${l.appearance}</p><p><em>Relationships:</em> ${l.relationships}</p>`
  ).join('\n')
  const locationHtml = c.locations.map(loc => `<li>${loc}</li>`).join('\n')
  return {
    name: c.name,
    folder: 'Continents',
    pages: [
      {
        name: 'Overview',
        html: `<h1>${c.name}</h1><p><strong>Theme:</strong> ${c.theme}</p><h2>Geography</h2><p>${c.geography}</p><h2>Culture &amp; Philosophy</h2><p>${c.culture}</p>`,
      },
      {
        name: 'Leadership',
        html: `<h1>${c.name} — Leadership</h1>\n${leadershipHtml}`,
      },
      {
        name: 'Key Locations',
        html: `<h1>${c.name} — Key Locations</h1><ul>\n${locationHtml}\n</ul>`,
      },
    ]
  }
}

export const CONTINENT_JOURNALS: JournalDef[] = CONTINENTS.map(continentJournal)

export const ALL_JOURNALS: JournalDef[] = [
  ...WORLD_JOURNALS,
  ...CONTINENT_JOURNALS,
  ...FACTION_JOURNALS,
  ...PLOT_JOURNALS,
]

// ─── MACRO GENERATORS ────────────────────────────────────────

export function buildStep1Macro(): string {
  const jLines = JOURNAL_FOLDERS.map(f => {
    const parent = f.parentName ? `, folder: f[${JSON.stringify(f.parentName)}].id` : ''
    const color  = f.color ? `, color: ${JSON.stringify(f.color)}` : ''
    return `  f[${JSON.stringify(f.name)}] = await Folder.create({ name: ${JSON.stringify(f.name)}, type: 'JournalEntry'${color}${parent} });`
  }).join('\n')

  const aLines = ACTOR_FOLDERS.map(f => {
    const parent = f.parentName ? `, folder: f[${JSON.stringify(f.parentName)}].id` : ''
    const color  = f.color ? `, color: ${JSON.stringify(f.color)}` : ''
    return `  f[${JSON.stringify(f.name)}] = await Folder.create({ name: ${JSON.stringify(f.name)}, type: 'Actor'${color}${parent} });`
  }).join('\n')

  return `(async () => {
  const f = {};
  // ── Journal Folders ──
${jLines}
  // ── Actor Folders ──
${aLines}
  ui.notifications.info('✅ Eldoria: All folders created successfully!');
})();`
}

export function buildStep2Macro(): string {
  const entries = ALL_JOURNALS.map(j => {
    const pages = j.pages.map(p =>
      `    { name: ${JSON.stringify(p.name)}, type: 'text', text: { content: ${JSON.stringify(p.html)}, format: 1 } }`
    ).join(',\n')
    return `  await JournalEntry.create({ name: ${JSON.stringify(j.name)}, folder: jf(${JSON.stringify(j.folder)}), pages: [\n${pages}\n  ] });`
  }).join('\n')

  return `(async () => {
  const jf = name => game.folders.find(f => f.name === name && f.type === 'JournalEntry')?.id;
  if (!jf('World Lore')) { ui.notifications.error('Run Step 1 first — folders not found.'); return; }
${entries}
  ui.notifications.info('✅ Eldoria: All journal entries created!');
})();`
}

export function buildStep3Macro(continentName: string): string {
  const npcs = NPCS.filter(n => n.continent === continentName)
  const actors = npcs.map(n => {
    const bio = `${n.bio}<p><em>Appearance:</em> ${n.appearance}</p><p><em>Relationships:</em> ${n.relationships}</p>`
    const folderRef = n.subfolder
      ? `af(${JSON.stringify(n.subfolder)})?.id ?? folder.id`
      : 'folder.id'
    return `    {
      name: ${JSON.stringify(n.name)}, type: 'npc', folder: ${folderRef},
      img: ${JSON.stringify(n.img)},
      system: { details: {
        biography: { value: ${JSON.stringify(bio)} },
        alignment: ${JSON.stringify(n.alignment)},
        race: ${JSON.stringify(n.race)},
        type: { value: ${JSON.stringify(n.creatureType)}, subtype: '' },
        cr: ${n.cr}
      }}
    }`
  }).join(',\n')

  return `(async () => {
  const af = name => game.folders.find(f => f.name === name && f.type === 'Actor');
  const folder = af(${JSON.stringify(continentName)});
  if (!folder) { ui.notifications.error(${JSON.stringify(`'${continentName}' folder not found — run Step 1 first.`)}); return; }
  await Actor.create([
${actors}
  ]);
  ui.notifications.info(${JSON.stringify(`✅ ${continentName}: ${npcs.length} NPC actors created!`)});
})();`
}

export function buildStep4Macro(): string {
  const actors = CREATURES.map(c => {
    return `    {
      name: ${JSON.stringify(c.name)}, type: 'npc', folder: folder.id,
      img: ${JSON.stringify(c.img)},
      system: { details: {
        biography: { value: ${JSON.stringify(c.bio)} },
        alignment: ${JSON.stringify(c.alignment)},
        type: { value: ${JSON.stringify(c.creatureType)}, subtype: '' },
        cr: ${c.cr}
      }}
    }`
  }).join(',\n')

  return `(async () => {
  const af = name => game.folders.find(f => f.name === name && f.type === 'Actor');
  const folder = af('Eldoria — Creatures');
  if (!folder) { ui.notifications.error('Eldoria — Creatures folder not found — run Step 1 first.'); return; }
  await Actor.create([
${actors}
  ]);
  ui.notifications.info('✅ Eldoria: ${CREATURES.length} creature actors created!');
})();`
}
