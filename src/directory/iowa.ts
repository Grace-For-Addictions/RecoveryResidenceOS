/**
 * Iowa recovery-residence directory listings.
 * External organizations are compiled from public sources and operator
 * submissions; inclusion is not an endorsement, and details change —
 * always verify directly. GFA residences carry a `slug` linking to their
 * full in-app profile and online application.
 */
export type Listing = {
  n: string
  org: string
  city: string
  county: string
  pop: string
  type: string
  contact: string
  d: string
  slug?: 'grace-house' | 'ejwrh' | 'jerrys-house'
}

export const IOWA_DIR: Listing[] = [
  // --- Grace For Addictions residences (full profiles) ---
  { n: 'Grace House', org: 'Grace For Addictions', city: 'Des Moines', county: 'Polk', pop: 'Women', type: 'Nonprofit · Preparing for NARR Level II certification', contact: '515-220-8771 · gracehouse@graceforaddictions.org', slug: 'grace-house', d: "Women's recovery residence operated by Grace For Addictions. Phased program, life & recovery coaching, MAT/MOUD-affirming." },
  { n: 'Ernest & Johnnie White Recovery House', org: 'EJWRH · supported by Grace For Addictions', city: 'Des Moines', county: 'Polk', pop: 'Men', type: 'Peer-led · Iowa DOC approved', contact: '515-220-8771 · ejwrh@rcoiowa.org', slug: 'ejwrh', d: "Men's recovery residence with wraparound recovery support services; Iowa DOC approved placement." },
  { n: "Jerry's House", org: 'Grace For Addictions', city: 'Des Moines', county: 'Polk', pop: 'Men', type: 'Nonprofit · Coming soon', contact: '515-220-8771', slug: 'jerrys-house', d: "Future men's residence honoring Jerry Anderson's open door." },
  // --- Des Moines metro / Polk ---
  { n: 'Beacon of Life', org: 'Beacon of Life', city: 'Des Moines', county: 'Polk', pop: 'Women', type: 'Nonprofit recovery housing', contact: '515-244-4713 · beaconoflifedsm.org', d: "Long-standing Des Moines women's recovery residence offering structured programming and transitional support." },
  { n: 'House of Mercy', org: 'MercyOne', city: 'Des Moines', county: 'Polk', pop: 'Women & children', type: 'Nonprofit · treatment-affiliated housing', contact: '515-643-6500', d: 'Supportive housing for women and their children alongside recovery services.' },
  { n: 'Bridges of Iowa', org: 'Bridges of Iowa', city: 'Des Moines', county: 'Polk', pop: 'Men', type: 'Nonprofit long-term recovery program', contact: '515-263-9030 · bridgesofiowa.org', d: 'Long-term residential recovery program with employment and life-skills pathway.' },
  { n: 'Hope Ministries — Door of Faith', org: 'Hope Ministries', city: 'Des Moines', county: 'Polk', pop: 'Men', type: 'Faith-based recovery residence', contact: '515-265-7272 · hopeiowa.org', d: "Faith-based men's recovery and life-recovery program." },
  { n: 'Hope Ministries — Hope Center for Women & Children', org: 'Hope Ministries', city: 'Des Moines', county: 'Polk', pop: 'Women & children', type: 'Faith-based recovery residence', contact: '515-265-7272 · hopeiowa.org', d: 'Faith-based recovery and housing for women and children.' },
  { n: 'Kingdom Living Iowa', org: 'Kingdom Living', city: 'Des Moines', county: 'Polk', pop: 'All genders', type: 'Structured recovery housing', contact: '4000 SW 9th St, Des Moines', d: 'Structured substance-free housing; double $110/wk, single $135/wk (verify current rates).' },
  { n: 'Oxford House network — Des Moines', org: 'Oxford House, Inc.', city: 'Des Moines', county: 'Polk', pop: 'All genders', type: 'Peer-run · democratically governed (7 houses)', contact: 'oxfordvacancies.com', d: "Seven chartered Oxford Houses across the Des Moines metro (incl. 1801 Hickman Rd). Self-run, self-supporting, substance-free homes; houses are single-gender — men's and women's houses available." },
  // --- Jasper ---
  { n: 'Clearview Recovery', org: 'Clearview Recovery Inc.', city: 'Prairie City', county: 'Jasper', pop: 'Women', type: 'Nonprofit recovery residence', contact: '515-994-2650 · clearviewrecovery.org', d: "Rural women's recovery residence east of Des Moines with structured programming." },
  { n: 'Adult & Teen Challenge of the Midlands', org: 'Adult & Teen Challenge', city: 'Colfax', county: 'Jasper', pop: 'Men', type: 'Faith-based residential recovery', contact: '515-674-3713', d: 'Long-term faith-based residential recovery campus.' },
  // --- Linn ---
  { n: 'Oxford House network — Cedar Rapids', org: 'Oxford House, Inc.', city: 'Cedar Rapids', county: 'Linn', pop: 'All genders', type: 'Peer-run · democratically governed (5 houses)', contact: 'oxfordvacancies.com', d: 'Five chartered Oxford Houses (incl. 3601 16th Ave SW). Single-gender houses; contact for current vacancies.' },
  // --- Scott ---
  { n: 'Oxford House network — Davenport', org: 'Oxford House, Inc.', city: 'Davenport', county: 'Scott', pop: 'All genders', type: 'Peer-run · democratically governed (3 houses)', contact: 'oxfordvacancies.com', d: 'Three chartered Oxford Houses (incl. 1523 S Fairmount St).' },
  { n: 'One Eighty Sober Living', org: 'One Eighty', city: 'Davenport', county: 'Scott', pop: 'All genders', type: 'Faith-based recovery community', contact: '563-424-1961 · one-eighty.org', d: 'Faith-based recovery community offering substance-free homes and recovery programming in the Quad Cities.' },
  // --- Woodbury ---
  { n: 'Oxford House 16th Street', org: 'Oxford House, Inc.', city: 'Sioux City', county: 'Woodbury', pop: 'All genders', type: 'Peer-run', contact: '712-560-4134 · 209 16th St', d: 'Self-run, self-supporting substance-free home (verify current charter/population).' },
  { n: 'Oxford House Douglas Street', org: 'Oxford House, Inc.', city: 'Sioux City', county: 'Woodbury', pop: 'Men', type: 'Peer-run', contact: '712-560-8351 · 2615 Douglas St', d: "Men's Oxford House — democratically run, self-supporting, substance-free." },
  { n: 'Oxford House Nebraska Street', org: 'Oxford House, Inc.', city: 'Sioux City', county: 'Woodbury', pop: 'Women', type: 'Peer-run', contact: '712-224-4546 · 2931 Nebraska St', d: "Women's Oxford House — democratically run, self-supporting, substance-free." },
  { n: 'Rosecrance Jackson Centers — Recovery Housing', org: 'Rosecrance', city: 'Sioux City', county: 'Woodbury', pop: 'All genders', type: 'Treatment-affiliated recovery housing', contact: '712-234-2300 · rosecrance.org', d: 'Recovery-supportive housing connected to Rosecrance Jackson Centers continuum.' },
  // --- Pottawattamie ---
  { n: 'Oxford House Loess Hills', org: 'Oxford House, Inc.', city: 'Council Bluffs', county: 'Pottawattamie', pop: 'Women & children', type: 'Peer-run', contact: '712-256-1954 · 200 S 1st St', d: 'Women & children Oxford House — residents govern the home democratically.' },
  { n: 'Oxford House network — Council Bluffs', org: 'Oxford House, Inc.', city: 'Council Bluffs', county: 'Pottawattamie', pop: 'All genders', type: 'Peer-run (3 houses citywide)', contact: 'oxfordvacancies.com', d: 'Three chartered houses citywide including Loess Hills and Bayliss Park.' },
  // --- Black Hawk ---
  { n: 'Oxford House network — Waterloo', org: 'Oxford House, Inc.', city: 'Waterloo', county: 'Black Hawk', pop: 'All genders', type: 'Peer-run (2 houses)', contact: 'oxfordvacancies.com', d: 'Two chartered Oxford Houses serving the Cedar Valley.' },
  // --- Johnson ---
  { n: 'Oxford House — Iowa City', org: 'Oxford House, Inc.', city: 'Iowa City', county: 'Johnson', pop: 'All genders', type: 'Peer-run', contact: '438 Southgate Ave · oxfordvacancies.com', d: 'Chartered Oxford House serving Johnson County.' },
  // --- Muscatine ---
  { n: 'Cedar River Haven', org: 'Cedar River Haven', city: 'Letts', county: 'Muscatine', pop: 'Women', type: 'Nonprofit · 24-bed rural transitional', contact: '319-726-2360', d: "Rural women's recovery community: safe shelter, employment support, community, and life skills." },
  // --- Clinton ---
  { n: 'Oxford House network — Clinton', org: 'Oxford House, Inc.', city: 'Clinton', county: 'Clinton', pop: 'All genders', type: 'Peer-run (2 houses)', contact: '2727 & 2733 S 19th St · oxfordvacancies.com', d: 'Two chartered Oxford Houses on South 19th Street.' },
  // --- Des Moines County ---
  { n: 'Oxford House — Burlington', org: 'Oxford House, Inc.', city: 'Burlington', county: 'Des Moines Co.', pop: 'All genders', type: 'Peer-run', contact: '1340 Mount Pleasant St · oxfordvacancies.com', d: 'Chartered Oxford House serving southeast Iowa.' },
  // --- Dubuque ---
  { n: 'Oxford House — Dubuque', org: 'Oxford House, Inc.', city: 'Dubuque', county: 'Dubuque', pop: 'All genders', type: 'Peer-run', contact: 'oxfordvacancies.com', d: 'Chartered Oxford House serving Dubuque.' },
  // --- Webster / Cerro Gordo / Clarke / Mahaska / Wapello / Bremer ---
  { n: 'Oxford House — Fort Dodge', org: 'Oxford House, Inc.', city: 'Fort Dodge', county: 'Webster', pop: 'All genders', type: 'Peer-run', contact: 'oxfordvacancies.com', d: 'Chartered Oxford House serving Webster County.' },
  { n: 'Oxford House — Mason City', org: 'Oxford House, Inc.', city: 'Mason City', county: 'Cerro Gordo', pop: 'All genders', type: 'Peer-run', contact: 'oxfordvacancies.com', d: 'Chartered Oxford House serving north-central Iowa.' },
  { n: 'Oxford House — Osceola', org: 'Oxford House, Inc.', city: 'Osceola', county: 'Clarke', pop: 'All genders', type: 'Peer-run', contact: 'oxfordvacancies.com', d: 'Chartered Oxford House serving Clarke County.' },
  { n: 'Oxford House — Oskaloosa', org: 'Oxford House, Inc.', city: 'Oskaloosa', county: 'Mahaska', pop: 'All genders', type: 'Peer-run', contact: 'oxfordvacancies.com', d: 'Chartered Oxford House serving Mahaska County.' },
  { n: 'Oxford House network — Ottumwa', org: 'Oxford House, Inc.', city: 'Ottumwa', county: 'Wapello', pop: 'All genders', type: 'Peer-run (2 houses)', contact: 'oxfordvacancies.com', d: 'Two chartered Oxford Houses serving Wapello County.' },
  { n: 'Oxford House — Waverly', org: 'Oxford House, Inc.', city: 'Waverly', county: 'Bremer', pop: 'All genders', type: 'Peer-run', contact: 'oxfordvacancies.com', d: 'Chartered Oxford House serving Bremer County.' },
]
