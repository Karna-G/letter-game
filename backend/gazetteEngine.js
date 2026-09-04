const Gazette = require('./models/Gazette');
const User = require('./models/User');
const Letter = require('./models/Letter');

/**
 * Formats a Date object into an antique 18th-century postal date string.
 * e.g. "Wednesday, the 2nd of September, In the Year of Our Lord 2026"
 */
function formatAntiqueDate(date = new Date()) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayName = dayNames[date.getDay()];
  const dayNum = date.getDate();
  const monthName = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return `${dayName}, the ${ordinal(dayNum)} of ${monthName}, ${year}`;
}

/**
 * Returns current season and seasonal lore
 */
function getSeasonalContext(date = new Date()) {
  const month = date.getMonth(); // 0 to 11
  if (month >= 2 && month <= 4) {
    return {
      season: 'Spring',
      editionTitle: 'The Vernal Equinox & Blossom Post',
      leadHeading: 'Carrier Pigeons Take Flight Across Thawing Alpine Passes',
      leadContent: 'As the winter frosts recede from the highland carriage roads, the Imperial Courier Guild reports the reopening of the Great Northern Mountain Route. Scribes throughout the realm have begun dipping their quills in newly brewed elderberry inks, dispatching declarations of affection and philosophical discourse. The Postmaster reminds all correspondents that flower-scented wax seals must be properly cured before carriage dispatch.',
      weatherForecast: 'Brisk mountain breezes with intermittent April showers; pigeon flights optimal at dawn.',
      quote: '“Let every spring letter be as sweet as newly blooming violets, and as true as a homing compass.”',
      woodcut: 'pigeon'
    };
  } else if (month >= 5 && month <= 7) {
    return {
      season: 'Summer',
      editionTitle: 'The Midsummer Solstice & Maritime Dispatches',
      leadHeading: 'Ocean Bottle Letters Wash Ashore Along the Southern Archipelago',
      leadContent: 'Lighthouse keepers along the Western Cliffs report an unprecedented tide of wax-sealed glass bottles bearing curious poetic fragments from distant shores. The Royal Admiralty has declared that all drifted messages belong to the Sovereign Archive, though citizens may uncork them at the nearest coastal post tavern. Couriers are cautioned against riding during peak noon heat without water rations for their steeds.',
      weatherForecast: 'Golden coastal sunshine; light maritime trade winds favorable for transatlantic packet ships.',
      quote: '“The ocean keeps no secrets that a patient beachcomber and a sharp corkscrew cannot unveil.”',
      woodcut: 'ship'
    };
  } else if (month >= 8 && month <= 10) {
    return {
      season: 'Autumn',
      editionTitle: 'The Autumnal Equinox & Harvest Scriptorium',
      leadHeading: 'A Mysterious Flurry of Wax-Sealed Scrolls Sweeps the Capital',
      leadContent: 'The crisp autumn winds have brought with them a marked surge in sealed epistolary traffic. Night couriers report strange lantern signals exchanged between the towers of the Grand Archive, while tavern patrons whisper of letters that arrive hours before they were ostensibly penned. The Postmaster General urges all noble scribes to inspect their sealing wax for traces of enchanted golden dust and to report any spectral messengers seen hovering near the guild wastebin.',
      weatherForecast: 'Amber autumn twilight with swirling leaf-drifts; lantern oil recommended for night rides.',
      quote: '“When autumn leaves fall like dried parchment, the truest words are written by candlelight.”',
      woodcut: 'quill'
    };
  } else {
    return {
      season: 'Winter',
      editionTitle: 'The Frost & Hearthside Postal Chronicle',
      leadHeading: 'Snowbound Carriages Press On by Lantern Light',
      leadContent: 'Heavy snowdrifts have blanketed the King’s Highway, yet the Royal Couriers have equipped their horse-drawn sleighs with brass bells to warn travelers in the blizzard. Letters penned near the tavern hearths are said to retain a comforting aroma of cedar smoke and mulled spice. The Postmaster warns correspondents against allowing inkpots to freeze on window sills, as frozen iron gall ink may fracture delicate parchment.',
      weatherForecast: 'Sub-zero temperatures across northern provinces; lantern warmth required at all relay posts.',
      quote: '“No winter blizzard is cold enough to chill the warmth of a letter penned from the heart.”',
      woodcut: 'carriage'
    };
  }
}

/**
 * Pool of intriguing fictional postal mysteries and classifieds
 */
const POSTAL_STORIES_POOL = [
  {
    category: 'Postal Mystery',
    headline: 'The Curious Case of the Vanishing Courier of Dover Road',
    leadHeading: 'A Sealed Mailbag Discovered Intact in an Ancient Hollow Oak',
    leadContent: 'Late yesterday evening, a woodcutter in the Whispering Forest happened upon a brass-buckled mailbag bearing the royal seal of 1794. Inside, twenty-four perfectly preserved letters were discovered, their wax seals untouched by time or moisture. The letters have been conveyed to the High Postmaster for immediate cataloging, while scholars debate whether the courier succumbed to fairy enchantments or merely retired to become a cider merchant.',
    woodcut: 'wax_seal',
    quote: '“Time may delay the carriage, but the post always arrives at its destiny.”'
  },
  {
    category: 'Philatelic Gazette',
    headline: 'Rare Inverted Griffin Stamp Discovered in Village Estate',
    leadHeading: 'Stamp Collectors Gather at the Royal Philatelic Exchange',
    leadContent: 'A humble estate sale in the valley has yielded a singular treasure: a 4-penny Inverted Griffin stamp printed with copper-red intaglio ink. Philatelic experts from across three kingdoms have gathered at the Guild Exchange to examine the serrated perforation. The Postmaster confirms that this stamp retains its full mailing validity, granting its bearer free courier escort anywhere in the realm.',
    woodcut: 'quill',
    quote: '“A miniature square of parchment can hold more majesty than a monarch’s crown.”'
  },
  {
    category: 'Celestial Dispatch',
    headline: 'Nocturnal Owls Appointed as Official Night Airmail Couriers',
    leadHeading: 'Midnight Letters Delivered Under the Gleam of the Crescent Moon',
    leadContent: 'The Royal Aviary has officially sanctioned a corps of trained Midnight Owls to accompany nocturnal mailmen on dangerous wilderness trails. Equipped with brass message cylinders fastened to their talons, these silent sentinels can glide over impassable ravines and drop urgent decrees directly onto receiver balconies. Citizens are requested not to leave open hearth fires where owls may roost.',
    woodcut: 'owl',
    quote: '“Under the watchful eye of the owl, no secret is lost to the dark.”'
  }
];

const CLASSIFIEDS_POOL = [
  { tag: 'WANTED', text: 'Skilled scribe capable of reading mirrored cursive and Latin shorthand. Generous guild stipend and unlimited lamp oil provided.' },
  { tag: 'FOR SALE', text: 'Set of antique brass postage scales with calibrated dram weights and polished velvet carrying case. Inquire at Stationers Court.' },
  { tag: 'LOST & FOUND', text: 'Lost near the Old Bridge: One scarlet wax seal bearing a rearing stag insignia. Reward of two silver farthings for its safe return.' },
  { tag: 'NOTICE', text: 'The Royal Courier Guild reminds citizens that letters containing live crickets or volatile alchemical mixtures will be summarily quarantined.' },
  { tag: 'SERVICES', text: 'Master Cartographer offers hand-drawn postal maps of newly charted realm roads with postal inns and water troughs clearly demarcated.' },
  { tag: 'ANNOUNCEMENT', text: 'The Annual Philatelic Swap Meet shall convene this Saturday beneath the Great Clocktower. All stamp albums welcome.' }
];

/**
 * Checks and auto-generates any missing Gazettes for a specific user.
 */
async function checkAndGenerateGazettes(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentWeekNum = Math.ceil((now.getDate()) / 7);

    // Count user letters and deliveries from DB
    const lettersSentCount = await Letter.countDocuments({ senderRef: user._id, status: { $ne: 'draft' } });
    const lettersReceivedCount = await Letter.countDocuments({ receiverRef: user._id, status: 'delivered' });
    const unreadMailboxCount = await Letter.countDocuments({ receiverRef: user._id, status: 'delivered', isRead: false });

    const userJourneyData = {
      lettersSent: lettersSentCount || user.lettersSent || 0,
      lettersReceived: lettersReceivedCount || 0,
      reputationScore: user.reputationScore || 0,
      deliveriesCompleted: user.deliveriesCompleted || 0,
      xp: user.xp || 0,
      rank: user.rank || (user.role === 'mailman' ? 'Novice Courier' : 'Noble Scribe'),
      unreadMailboxCount: unreadMailboxCount || 0,
      milestoneAchieved: null
    };

    const generated = [];

    // 1. Current Seasonal / Monthly Gazette
    const seasonal = getSeasonalContext(now);
    const monthlyEditionCode = `monthly_${currentYear}_m${currentMonth < 10 ? '0' + currentMonth : currentMonth}`;
    
    const existingMonthly = await Gazette.findOne({ userId: user._id, editionCode: monthlyEditionCode });
    if (!existingMonthly) {
      // Pick random classifieds
      const selectedClassifieds = [...CLASSIFIEDS_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const totalGazetteCount = await Gazette.countDocuments({ userId: user._id });
      const editionNum = totalGazetteCount + 1;

      const monthlyGazette = new Gazette({
        userId: user._id,
        editionCode: monthlyEditionCode,
        editionNumber: editionNum,
        volume: `Vol. ${currentYear - 2000}`,
        title: "THE POSTMASTER'S PHANTOM GAZETTE",
        headline: seasonal.editionTitle,
        subtitle: `Dispatched from the Central Post Office — Realm Edition for ${formatAntiqueDate(now)}`,
        date: now,
        formattedDateStr: formatAntiqueDate(now),
        category: 'Seasonal Chronicle',
        weatherForecast: seasonal.weatherForecast,
        leadStory: {
          heading: seasonal.leadHeading,
          content: seasonal.leadContent,
          woodcutIllustration: seasonal.woodcut
        },
        editorialQuote: {
          quote: seasonal.quote,
          author: 'The Royal Postmaster General'
        },
        communityHighlights: [
          {
            title: 'Sovereign Scriptorium Report',
            body: `Over ${Math.max(12, lettersSentCount * 3 + 18)} letters have crossed the realm borders this fortnight. Scribes of all stations continue to preserve the immortal craft of handwritten letters.`
          },
          {
            title: 'Notice Regarding Sealing Wax Quality',
            body: 'Correspondents are advised that genuine beeswax formulated with Venetian turpentine produces the crispest seal impressions and resists cracking in transit.'
          }
        ],
        userPostalJourney: {
          ...userJourneyData,
          milestoneAchieved: lettersSentCount >= 1 ? `Inscribed ${lettersSentCount} Realm Letter${lettersSentCount === 1 ? '' : 's'}` : 'Embarked upon the Epistolary Pilgrimage'
        },
        fictionalPostalClassifieds: selectedClassifieds,
        isRead: false
      });

      await monthlyGazette.save();
      generated.push(monthlyGazette);
    }

    // 2. Activity Milestone Gazette (e.g. at 5, 10, 25 letters sent, or 5 deliveries completed)
    if (lettersSentCount >= 5) {
      const milestoneCode = `milestone_sent_5`;
      const existing = await Gazette.findOne({ userId: user._id, editionCode: milestoneCode });
      if (!existing) {
        const milestoneGazette = new Gazette({
          userId: user._id,
          editionCode: milestoneCode,
          editionNumber: (await Gazette.countDocuments({ userId: user._id })) + 1,
          volume: `Vol. Spec.`,
          title: "THE POSTMASTER'S PHANTOM GAZETTE",
          headline: `Royal Honor: Scribe ${user.name} Attains the Quill of Diligence`,
          subtitle: `Special Proclamation by Decree of the Imperial Postmaster`,
          date: now,
          formattedDateStr: formatAntiqueDate(now),
          category: 'Milestone Decree',
          weatherForecast: 'Golden celebratory beams shining over the Scriptorium.',
          leadStory: {
            heading: 'Five Letters Dispatched: The Mark of a Master Correspondent',
            content: `The Grand Registry of Scribes notes with great pride that noble citizen ${user.name} has dispatched five sealed letters across our postal routes. In an age of fleeting words, such dedication to the written parchment brings honor to our entire fellowship. May your ink never run dry!`,
            woodcutIllustration: 'wax_seal'
          },
          editorialQuote: {
            quote: '“Five letters written with care hold more virtue than ten thousand spoken idle words.”',
            author: 'Master Archivist of the High Post'
          },
          communityHighlights: [
            {
              title: 'Scriptorium Recognition',
              body: `${user.name} has been inscribed into the Roll of Diligent Scribes in the Grand Archive Library.`
            }
          ],
          userPostalJourney: {
            ...userJourneyData,
            milestoneAchieved: '🏆 Quill of Diligence (5 Dispatched Letters)'
          },
          fictionalPostalClassifieds: [...CLASSIFIEDS_POOL].slice(0, 2),
          isRead: false
        });
        await milestoneGazette.save();
        generated.push(milestoneGazette);
      }
    }

    return generated;
  } catch (err) {
    console.error('Error in checkAndGenerateGazettes:', err);
    return [];
  }
}

/**
 * Creates a special on-demand edition (e.g. from the user clicking "Summon Fresh Gazette" in UI)
 */
async function generateSpecialGazette(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const randomStory = POSTAL_STORIES_POOL[Math.floor(Math.random() * POSTAL_STORIES_POOL.length)];
  const randomClassifieds = [...CLASSIFIEDS_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
  
  const lettersSentCount = await Letter.countDocuments({ senderRef: user._id, status: { $ne: 'draft' } });
  const lettersReceivedCount = await Letter.countDocuments({ receiverRef: user._id, status: 'delivered' });
  const unreadMailboxCount = await Letter.countDocuments({ receiverRef: user._id, status: 'delivered', isRead: false });

  const totalCount = await Gazette.countDocuments({ userId: user._id });
  const editionCode = `special_bulletin_${Date.now()}`;

  const specialGazette = new Gazette({
    userId: user._id,
    editionCode,
    editionNumber: totalCount + 1,
    volume: `Vol. ${now.getFullYear() - 2000}`,
    title: "THE POSTMASTER'S PHANTOM GAZETTE",
    headline: randomStory.headline,
    subtitle: `Extraordinary Postal Dispatch — Special Evening Gazette for ${formatAntiqueDate(now)}`,
    date: now,
    formattedDateStr: formatAntiqueDate(now),
    category: randomStory.category,
    weatherForecast: 'Ominous twilight haze with sudden gusts of courier horn fanfares.',
    leadStory: {
      heading: randomStory.leadHeading,
      content: randomStory.leadContent,
      woodcutIllustration: randomStory.woodcut
    },
    editorialQuote: {
      quote: randomStory.quote,
      author: 'The Postmaster General'
    },
    communityHighlights: [
      {
        title: 'Fellowship Courier Alert',
        body: 'Couriers are cautioned that the old willow bridge near the mill is currently undergoing timber reinforcement.'
      },
      {
        title: 'Philatelic Exchange Bulletin',
        body: 'New ceremonial stamps minted in honor of the Postal Scribes Guild are now circulating in limited quantities.'
      }
    ],
    userPostalJourney: {
      lettersSent: lettersSentCount,
      lettersReceived: lettersReceivedCount,
      reputationScore: user.reputationScore || 0,
      deliveriesCompleted: user.deliveriesCompleted || 0,
      xp: user.xp || 0,
      rank: user.rank || (user.role === 'mailman' ? 'Novice Courier' : 'Noble Scribe'),
      unreadMailboxCount: unreadMailboxCount || 0,
      milestoneAchieved: 'Extraordinary Dispatch Summoned'
    },
    fictionalPostalClassifieds: randomClassifieds,
    isRead: false
  });

  await specialGazette.save();
  return specialGazette;
}

module.exports = {
  checkAndGenerateGazettes,
  generateSpecialGazette,
  formatAntiqueDate
};