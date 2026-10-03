/* ============================================================
   CASE STUDIES: content for the full-screen case panels.

   How to update:
   - growth:   before/after pairs render as animated bars.
               Set a value to null and it shows under "numbers on the way".
   - numbers:  big stand-alone stats.
   - links:    the brand's live website and socials.
   - before/after: optional transformation pair.
   - gallery:  groups of { src, alt, caption } images,
               { type: 'video', src, poster, caption } loops,
               or { type: 'tiktok', id, handle, followers, caption } creator embeds.
   - brands:   a typographic brand wall (used when there are no visuals).
   ============================================================ */

window.CASES = [
  {
    id: 'elles',
    client: "Elle's Coventry",
    title: 'A launch from zero',
    role: 'Marketing lead · From empty unit to full room',
    place: 'Two Friargate, Coventry',
    cover: 'assets/img/work/elles/full-house.jpg',
    hero: { value: '19→47%', label: 'newsletter open rate, against a 17–28% UK hospitality average' },
    summary:
      "Coventry's first social dining hub: six independent kitchens and two boutique bars under one roof, with no marketing infrastructure at all. I built the whole function, from the website, email and media partners to creators, events and reviews, and we opened to a full room.",
    challenge:
      'A brand-new venue across from Coventry station with six independent vendors, one launch date and nobody who knew it existed. There was no list, no channels, no press and no plan.',
    approach: [
      'Took the website live with the dev team and ran the back end from then on.',
      "Secured paid and partner presence with Coventry Live, Destination Coventry, Go CV (116K sign-ups), Coventry Rocks and Bubltown, so Elle's sat inside the city's \"what's on\" ecosystem.",
      'Built the launch guest list, with 60+ civic, press and business invites including the Lord Mayor, councillors and the Chamber of Commerce.',
      'Built the creator and press database: 20 local and national creators with 3.8M combined followers.',
      'Rebuilt email around the reader: segmented active customers from Square data, tested layouts by device and time of day, and moved from one list of 9,805 to a targeted ~400.',
      'Programmed the room with sip & paint, Meet Bluey family days, live music, DJs and sax nights, and watch parties.',
      'Ran ORM across Google, OpenTable and TripAdvisor, turning review reports into fixes for each kitchen.'
    ],
    results: [
      'Newsletter open rate up from 19.33% to 47.40%, and unsubscribes down from 75 to zero.',
      'One Go CV solus email: 67,925 sent, 98% delivered, 30,436 unique opens (46%).',
      '50+ influencers at the launch, for free.',
      'Instagram grew from 700 to 5K followers while I ran it, and the venue holds a 4.5★ Google rating from 366 reviews.'
    ],
    numbers: [
      { value: '47.4%', label: 'newsletter open rate (UK hospitality avg: 17–28%)' },
      { value: '30,436', label: 'unique opens on one B2B solus send' },
      { value: '700→5K', label: 'Instagram followers while I ran it' },
      { value: '4.5★', label: 'Google rating from 366 reviews' },
      { value: '3.8M', label: 'combined reach of the creator database' },
      { value: '60+', label: 'launch invites, incl. the Lord Mayor' }
    ],
    growth: [
      { group: 'Email', label: 'Newsletter open rate', before: 19.33, after: 47.4, suffix: '%', decimals: 2 },
      { group: 'Email', label: 'Unsubscribes per send', before: 75, after: 0, lowerIsBetter: true },
      { group: 'Email', label: 'Mobile opens', before: 6.7, after: 11.4, suffix: '%', decimals: 1 },
      { group: 'Social', label: 'Instagram followers', before: 700, after: 5000 }
    ],
    links: [
      { label: 'ellescoventry.com', href: 'https://ellescoventry.com/' },
      { label: 'Instagram · 7.5K+', href: 'https://www.instagram.com/ellescoventry/' },
      { label: 'TikTok', href: 'https://www.tiktok.com/@ellescoventry' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/ellescoventry/' }
    ],
    gallery: [
      {
        title: 'The launch',
        note: 'From the invite to the photo booth.',
        items: [
          { src: 'assets/img/work/elles/launch-ticket.jpg', alt: "Green and gold VIP ticket to Elle's launch party", caption: 'The VIP launch ticket' },
          { src: 'assets/img/work/elles/launch-arch.jpg', alt: "Green and peach balloon arch at the entrance of Elle's", caption: 'Launch night, Two Friargate' },
          { type: 'video', src: 'assets/img/work/elles/photobooth.mp4', poster: 'assets/img/work/elles/photobooth-poster.jpg', caption: 'Launch-night photo booth (yes, that’s me)' },
          { src: 'assets/img/work/elles/a-board.jpg', alt: 'A-board reading Our Place, Your Pace', caption: '“Our Place, Your Pace” on the street' },
          { type: 'video', src: 'assets/img/work/elles/photobooth-group.mp4', poster: 'assets/img/work/elles/photobooth-group-poster.jpg', caption: 'Photo booth, launch night' },
          { src: 'assets/img/work/elles/team.jpg', alt: "Elle's staff in green uniforms at the bar", caption: 'The crew' }
        ]
      },
      {
        title: 'Print, menus & on-site',
        note: 'The copy that sold six kitchens as one place.',
        items: [
          { src: 'assets/img/work/elles/poster-hub.webp', alt: "Poster: Coventry's social dining hub, six kitchens, two boutique bars", caption: '“Six kitchens, two boutique bars, all under one roof”' },
          { src: 'assets/img/work/elles/poster-corporate.webp', alt: "Poster: Why not choose Elle's for after-work drinks, co-working and team meetings", caption: 'Selling the space to offices next door' },
          { src: 'assets/img/work/elles/poster-takeaway.webp', alt: 'Poster: scan to place an order for takeaway', caption: 'Click & collect for the commute' },
          { src: 'assets/img/work/elles/sharing-menu.jpg', alt: 'Sharing platters menu on a table', caption: 'Sharing platters menu' },
          { src: 'assets/img/work/elles/qr-coaster.jpg', alt: 'Scan, order and pay table coaster', caption: 'Scan, order, pay' }
        ]
      },
      {
        title: 'Programming the room',
        note: 'A reason to come back every week.',
        items: [
          { src: 'assets/img/work/elles/sip-and-paint.jpg', alt: 'Heart for Art sip and paint slide on screen', caption: 'Sip & paint with Heart for Art' },
          { src: 'assets/img/work/elles/meet-bluey.jpg', alt: "Meet Bluey at Elle's on the big screen", caption: 'Meet Bluey family days' },
          { src: 'assets/img/work/elles/live-music.jpg', alt: 'Singer performing live', caption: 'Live music Saturdays' },
          { src: 'assets/img/work/elles/sax-dj.jpg', alt: 'Saxophonist playing with a DJ', caption: 'Sax & DJ nights' }
        ]
      },
      {
        title: 'The outcome',
        note: 'Full rooms.',
        items: [
          { src: 'assets/img/work/elles/full-house.jpg', alt: "A full house at Elle's with the brand on the big screen", caption: 'A full house' },
          { src: 'assets/img/work/elles/live-night.jpg', alt: 'Packed tables on a live-music night', caption: 'Live night' },
          { src: 'assets/img/work/elles/full-room-day.jpg', alt: 'Busy food hall during the day', caption: 'And by day' }
        ]
      },
      {
        title: 'Creators who came',
        note: 'From the creator database.',
        items: [
          { type: 'tiktok', id: '7608305450735668503', handle: '@littlefoodblogger', followers: '13.5K', caption: 'Fat Fox desserts at Elle’s' },
          { type: 'tiktok', id: '7600685194047180054', handle: '@isabellajourno', followers: '', caption: 'Opening-week coverage' }
        ]
      }
    ]
  },
  {
    id: 'almanack',
    client: 'The Almanack',
    title: 'Bringing a local back',
    role: 'Marketing · Relaunch',
    place: '89 Abbey End, Kenilworth',
    cover: 'assets/img/work/almanack/relaunch-day.jpg',
    hero: { value: '200+', label: 'guests on relaunch night, 1 May 2026' },
    summary:
      "A much-loved Kenilworth gastropub, closed and coming back under new hands. The job wasn't to launch something new. It was to make a proud town feel this place was theirs again, from the walls and the menu to the first night.",
    challenge:
      "Kenilworth doesn't look for somewhere new; it looks for somewhere that fits. The relaunch had to win back regulars who were sceptical of change, and win over new guests, without looking like a chain.",
    approach: [
      'Documented the transformation as it happened: a hand-drawn mural over bare walls, a rebuilt bar and the new signage.',
      'Ran tasting nights for locals and guests to try the new menu before it went public.',
      'Produced the menu and cocktail-menu shoot for the relaunch.',
      'Built an experiential programme to give people a reason to come back every week: a pub quiz, live music, a BNI networking breakfast and Mum & Baby play sessions.',
      'Programmed live music, from the grand piano to full-room vocal sets.',
      'Helped bring Shortland Coffee Co, an Elle’s vendor, into The Almanack as an in-house partner.'
    ],
    results: [
      '200+ guests on relaunch night, 1 May 2026.',
      'Quiz night doubled from 15 to 30 covers.',
      'BNI networking breakfast sold 30 covers.',
      'Mum & Baby play sessions sold 35 tickets every Monday for three weeks.',
      'Live music filled the seats.'
    ],
    numbers: [
      { value: '200+', label: 'guests on relaunch night' },
      { value: '15→30', label: 'quiz-night covers' },
      { value: '30', label: 'covers sold for a BNI networking breakfast' },
      { value: '35', label: 'Mum & Baby tickets every Monday, 3 weeks running' },
      { value: '1,987', label: 'followers @almanack.kenilworth' }
    ],
    growth: [
      { group: 'Events', label: 'Quiz-night covers', before: 15, after: 30 }
    ],
    links: [
      { label: 'almanackkenilworth.com', href: 'https://almanackkenilworth.com/' },
      { label: 'Instagram · 1,987', href: 'https://www.instagram.com/almanack.kenilworth/' }
    ],
    before: { src: 'assets/img/work/almanack/mural-start.jpg', label: 'During: the walls, drawn by hand' },
    after: { src: 'assets/img/work/almanack/bar.jpg', label: 'After: the bar, reopened' },
    gallery: [
      {
        title: 'The transformation',
        note: 'Walls, bar and signage.',
        items: [
          { src: 'assets/img/work/almanack/mural-in-progress.jpg', alt: 'Artist hand-drawing a line mural on a pillar', caption: 'The mural, drawn by hand' },
          { src: 'assets/img/work/almanack/exterior.jpg', alt: 'The Almanack exterior with new signage', caption: 'New face on Abbey End' },
          { src: 'assets/img/work/almanack/relaunch-day.jpg', alt: 'Khushi standing at The Almanack entrance beside a balloon column', caption: 'Relaunch day' }
        ]
      },
      {
        title: 'Tasting nights',
        note: 'Let the town taste it first.',
        items: [
          { src: 'assets/img/work/almanack/tasting-table.jpg', alt: 'Long table set for a tasting dinner', caption: 'Set for the tasting' },
          { src: 'assets/img/work/almanack/tasting-menu-card.jpg', alt: 'The Almanack taster menu card', caption: 'The taster menu' },
          { src: 'assets/img/work/almanack/tasting-plating.jpg', alt: 'Chef plating starters on a tray', caption: 'On the pass' },
          { src: 'assets/img/work/almanack/tasting-starter.jpg', alt: 'Plated starter on the pass', caption: 'Course one' },
          { src: 'assets/img/work/almanack/tasting-guests.jpg', alt: 'Guests at the tasting dinner table', caption: 'Locals first' },
          { src: 'assets/img/work/almanack/tasting-full.jpg', alt: 'A full tasting-night table', caption: 'Full table' }
        ]
      },
      {
        title: 'Menu & cocktail shoot',
        note: 'Shot for the relaunch.',
        items: [
          { src: 'assets/img/work/almanack/menu-shoot.jpg', alt: 'Guest at a round table with the new menu spread', caption: 'The new menu, styled' },
          { src: 'assets/img/work/almanack/menu-dish.jpg', alt: 'Close-up of a seasonal dish', caption: 'Seasonal plates' },
          { src: 'assets/img/work/almanack/menu-spread.jpg', alt: 'Table spread with mains and wine', caption: 'Mains & wine' },
          { src: 'assets/img/work/almanack/cocktail-menu.jpg', alt: 'The Almanack cocktail menu cover', caption: 'Cocktail menu' },
          { src: 'assets/img/work/almanack/cocktail-spread.jpg', alt: 'Cocktail menu open on classic cocktails', caption: 'Classic & signature serves' }
        ]
      },
      {
        title: 'Live music',
        note: 'A room worth staying in.',
        items: [
          { src: 'assets/img/work/almanack/live-music-piano.jpg', alt: 'Singer performing beside the grand piano', caption: 'Vocals by the piano' },
          { src: 'assets/img/work/almanack/pianist.jpg', alt: 'Pianist playing the grand piano', caption: 'Afternoon piano' },
          { src: 'assets/img/work/almanack/live-music-full.jpg', alt: 'A full room during live music', caption: 'A full room' }
        ]
      }
    ]
  },
  {
    id: 'wldd',
    client: 'WLDD',
    title: 'Building a creator vertical',
    role: 'Founding hire · Creator partnerships',
    place: 'Bangalore, India',
    cover: null,
    hero: { value: '300+', label: 'creators in a network I built from zero' },
    summary:
      'A brand-new LinkedIn creator vertical with no team and no playbook. I built the network, the process and the margins, ran 15+ campaigns for brands like Upstox, Max Fashion, Vantara and Damensch, and grew it into a 10-person team.',
    challenge:
      'Start a creator vertical from nothing: no relationships, no rate card, no workflow, and clients expecting big names.',
    approach: [
      'Sourced, vetted and onboarded 300+ creators, from micro to 1M+ followers.',
      'Negotiated 1M-follower creators down to £250–300 a post while holding a 65% agency margin.',
      'Rebuilt the campaign workflow and creator payments end to end.',
      'Ran 15+ campaigns for Upstox, Max Fashion, Vantara and Damensch, plus activations for Flipkart and Zepto (~150 creators) and launches for Mamaearth and Minimalist.'
    ],
    results: [
      '95% creator retention, and no bridges burned.',
      'Around 50% more campaigns shipped after the workflow rebuild.',
      'Grew the vertical from a founding hire to a 10-person team.'
    ],
    numbers: [
      { value: '300+', label: 'creators in the network' },
      { value: '15+', label: 'brand campaigns' },
      { value: '95%', label: 'creator retention' },
      { value: '65%', label: 'agency margin held' }
    ],
    growth: [
      { group: 'Network', label: 'Creators in network', before: 0, after: 300, suffix: '+' },
      { group: 'Campaigns', label: 'Brand campaigns run', before: 0, after: 15, suffix: '+' },
      { group: 'Team', label: 'Vertical headcount', before: 1, after: 10 },
      { group: 'Ops', label: 'Campaign throughput (indexed)', before: 100, after: 150 }
    ],
    brands: ['Upstox', 'Max Fashion', 'Vantara', 'Damensch', 'Flipkart', 'Zepto', 'Mamaearth', 'Minimalist'],
    gallery: []
  }
];
