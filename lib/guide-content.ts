// "New to pilot car work": a plain-words summary of public sources, each with its link. The same text feeds the guide page,
// the structured data in it, and the read-only AI tools (app/api/mcp). Written in our own words, not copied.
// Rules are set state by state and change: every claim that depends on a date says so, and the page tells people to check the state.
export const GUIDE_CHECKED = '2026-10-26'

export type Source = { id: string; short: string; title: string; publisher: string; url: string }

export const SOURCES: Record<string, Source> = {
  m1: { id: 'm1', short: 'FHWA training manual, Module 1', title: 'Pilot/Escort Vehicle Operators Training Manual, Module 1: Course Introduction and Industry Background', publisher: 'FHWA Office of Operations (2016)', url: 'https://ops.fhwa.dot.gov/publications/fhwahop16050/m1.htm' },
  m2: { id: 'm2', short: 'FHWA training manual, Module 2', title: 'Training Manual, Module 2: Operator and Vehicle Equipment Requirements', publisher: 'FHWA Office of Operations (2016)', url: 'https://ops.fhwa.dot.gov/publications/fhwahop16050/m2.htm' },
  m5: { id: 'm5', short: 'FHWA training manual, Module 5', title: 'Training Manual, Module 5: Trip Operations', publisher: 'FHWA Office of Operations (2016)', url: 'https://ops.fhwa.dot.gov/publications/fhwahop16050/m5.htm' },
  guide: { id: 'guide', short: 'FHWA student study guide', title: 'Pilot/Escort Vehicle Operators Student Study Guide', publisher: 'FHWA Office of Operations (2016)', url: 'https://ops.fhwa.dot.gov/publications/fhwahop16054/pevo_study_gde.htm' },
  course: { id: 'course', short: 'FHWA certification course', title: 'Pilot/Escort Certification Course (slides)', publisher: 'FHWA Office of Operations', url: 'https://ops.fhwa.dot.gov/freight/sw/doc/pevoppt/index.htm' },
  best: { id: 'best', short: 'FHWA best practices guide', title: 'Pilot/Escort Vehicle Operators Best Practices Guidelines, Chapter I: Pre-Trip Planning', publisher: 'FHWA Office of Operations (2016)', url: 'https://ops.fhwa.dot.gov/publications/fhwahop16051/ch1.htm' },
  permits: { id: 'permits', short: 'FHWA state permit contacts', title: 'Oversize/Overweight Load Permits and State Permit Contacts', publisher: 'FHWA Office of Operations', url: 'https://ops.fhwa.dot.gov/freight/sw/permit_report/index.htm' },
  esc_fl: { id: 'esc_fl', short: 'Evergreen: Florida page', title: 'Florida Pilot Car Certification (lists the states that accept a Washington P/EVO card)', publisher: 'Evergreen Safety Council', url: 'https://www.esc.org/locations/pilot-car/florida' },
  esc_ut: { id: 'esc_ut', short: 'Evergreen: Utah page', title: 'Utah Pilot Car Certification and Training', publisher: 'Evergreen Safety Council', url: 'https://www.esc.org/utah-pilot-car-certification-and-training/' },
}

export type GuideSection = { id: string; title: string; body: string[]; bullets?: string[]; sources: string[] }

export const CERTIFYING_STATES_2016 = ['Arizona', 'Colorado', 'Florida', 'Georgia', 'Minnesota', 'New York', 'North Carolina', 'Oklahoma', 'Utah', 'Virginia', 'Washington']
export const WA_CARD_STATES = ['Arizona', 'Colorado', 'Florida', 'Georgia', 'Kansas', 'Minnesota', 'North Carolina', 'Oklahoma', 'Pennsylvania', 'Texas', 'Utah', 'Virginia']

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'what-it-is', title: 'What a pilot car (P/EVO) does',
    body: [
      'A pilot/escort vehicle operator, called a P/EVO or pilot car driver, drives a vehicle with the oversize load. The job is to warn other drivers that a large, slow vehicle is coming, tell the load driver about hazards ahead or behind, and control traffic when the load has to stop or the road has to be closed for a moment.',
      'Escorts exist to protect other road users, bridges and signs, the load, the load driver and the escort crew. Almost all of the rules come from the states, not the federal government, so what is required depends on where you drive.',
    ],
    sources: ['m1'],
  },
  {
    id: 'positions', title: 'The positions on a move',
    body: ['Which positions a load needs is written on its state permit. These are the common ones.'],
    bullets: [
      'Lead (front) escort: navigates, spots hazards, warns oncoming and merging traffic, and talks to the load driver by radio. The training manual suggests staying roughly 4 seconds ahead of the load, adding about a second for each 10 feet of load length, but not so far that radio contact is lost (never more than about half a mile).',
      'Rear (chase) escort: watches traffic behind and beside the load, and keeps an eye on the load, tires, lights and straps. The manual suggests about 3 to 4 seconds behind.',
      'Height pole: used by the lead escort on tall loads to check overhead clearance. It is usually set a few inches above the tallest point of the load and checked with the load driver. The height that triggers it is set by each state and shown on the permit.',
      'Route survey: someone drives and writes up the route ahead of time (railroad crossings, low clearances, shoulders, emergency contacts). The team reads it before each day.',
      'Steer (tillerman): steers a rear axle on a long trailer. The manual says one person should not do both escort and steer, and many states require a commercial license for the steer position.',
    ],
    sources: ['m5'],
  },
  {
    id: 'certification', title: 'Certification: who needs it',
    body: [
      'There is no single national rule. FHWA\'s study guide said that, as of early 2016, these states required pilot/escort operators to be certified: ' + CERTIFYING_STATES_2016.join(', ') + '. That list is from 2016, so other states may have added requirements since. Check the state before you drive in it.',
      'Most states that certify use a one-day class and a written test, and the card usually lasts 3 to 5 years. Many states want drivers to be at least 21, and several allow 18. Some states also want a defensive driving certificate, a flagger card, or both.',
      'Many states accept each other\'s certification, but that only covers the card. Vehicle, equipment and insurance rules do not carry over from state to state.',
      'Evergreen Safety Council, a training company, says on its own state pages that a Washington P/EVO card is accepted in ' + WA_CARD_STATES.join(', ') + '. That is the company\'s statement, its pages do not always agree with each other, and Florida also asks for an 8-hour National Safety Council defensive driving course. Confirm with the state before you rely on it.',
    ],
    sources: ['guide', 'm2', 'esc_fl', 'esc_ut'],
  },
  {
    id: 'vehicle', title: 'Your vehicle and gear',
    body: ['Rules differ by state, and not every state asks for everything. The training manual lists the usual equipment and says to check each state.'],
    bullets: [
      'Vehicle: some states set a minimum such as a passenger car of at least 2,000 pounds or a pickup of at least a quarter ton. Others want a clear view all around the driver, which rules out cargo vans and panel trucks.',
      '"Oversize Load" signs, black letters on yellow, usually on top of the vehicle. Size and lettering vary by state, so many drivers buy the largest size any state asks for. Many states also want the company name and home city on the sides.',
      'Flags: two or four, in 12 or 18 inch sizes depending on the state. Larger flags usually satisfy states that ask for smaller ones.',
      'Warning lights: working headlights, brake lights and flashers, plus at least one amber flashing or rotating light, typically visible from about 500 feet.',
      'Radio: a two-way radio that talks to the load driver and other escorts, with at least about half a mile of range, is required by most states. The manual prefers CB radios to cell phones.',
      'Also on the usual list: fire extinguisher, spare tire and tools, STOP/SLOW paddle, cones or reflectors, hard hat and high-visibility vest, flashlight, first aid kit, and a height pole for tall loads.',
      'Signs and lights should be showing only while you are escorting. Some states fine drivers who leave them on otherwise.',
    ],
    sources: ['m2'],
  },
  {
    id: 'insurance', title: 'Insurance',
    body: [
      'Some states require a minimum amount of insurance for pilot car drivers, and the amounts differ. There is no national figure to quote, so ask the state permit office and your insurance agent. The training manual notes that insurers often give lower rates to drivers who have completed a defensive driving course.',
    ],
    sources: ['m2', 'guide'],
  },
  {
    id: 'before-trip', title: 'Before the trip',
    body: ['The federal best-practice guide for escorts starts with planning.'],
    bullets: [
      'Confirm the assignment: vehicle details, the permit papers, travel and hotel estimates, who to call, and what to do if something goes wrong.',
      'Review the route against the permit: railroad crossings, low overhead clearances, and bridges with weight limits.',
      'Check your vehicle and gear: tires, fluids, insurance, and every item the states on the route require.',
      'Check yourself: valid license and certification, enough rest, fit for duty, and no clothing that looks like a police uniform.',
      'Know the rules of every state the load passes through, not only your home state.',
    ],
    sources: ['best', 'm1'],
  },
  {
    id: 'safety', title: 'Staying safe on the road',
    body: ['A few points from the FHWA training manual that new drivers often get wrong.'],
    bullets: [
      'Stopping distance grows with the square of speed: twice as fast takes about four times the distance, and loaded trucks need far more room than cars.',
      'Signal early. Have the escort change lanes first, and tap the brakes to warn traffic behind when you slow down.',
      'When flagging, stand outside the vehicle facing traffic with the STOP/SLOW paddle visible, and keep going until the blocked lanes are clear. Police in charge at the scene take over.',
      'At a railroad crossing, never race a train, and do not enter if the load cannot clear the tracks completely.',
      'Plan rest into the trip. A tired driver can be as impaired as one who has been drinking.',
    ],
    sources: ['m5'],
  },
  {
    id: 'permits', title: 'Where to check each state\'s rules',
    body: [
      'The federal government does not issue oversize permits. Each state does, and each state\'s permit office can tell you how many escorts a load needs and what they must carry. FHWA keeps a list of every state\'s oversize/overweight permit office with phone numbers and web links.',
    ],
    sources: ['permits'],
  },
  {
    id: 'free-training', title: 'Free training from the government',
    body: [
      'FHWA publishes a full pilot/escort training manual, a student study guide and a slide course for free. They do not replace a state\'s own certification class, but they are the best starting point for someone new.',
    ],
    sources: ['course', 'guide', 'm1'],
  },
  {
    id: 'finding-work', title: 'Finding work on Oversize Escort Hub',
    body: [
      'Oversize Escort Hub is a free place where carriers and brokers post loads and pilot car drivers find them. Creating an account is free while we launch.',
      'Make a free account as an escort, add the states you cover so you get alerts for them, and fill in your certifications and vehicle. You can then browse three boards: Flat Rate (fixed pay, direct hire), Open Bid (you bid, the carrier compares) and the 5-Minute Bid Board (live loads on a timer). When a carrier accepts you, you each get the other\'s phone and email. Phone numbers are never shown publicly.',
      'Nobody here checks or verifies anyone: licenses, certifications and insurance are shown as the people entered them. Check them yourself before you hire or accept work. You can add documents to your profile if you want carriers to see them.',
    ],
    sources: [],
  },
]

export const GUIDE_FAQ: { q: string; a: string }[] = [
  { q: 'Do I need a certification to be a pilot car driver?', a: 'It depends on the state. FHWA reported in early 2016 that Arizona, Colorado, Florida, Georgia, Minnesota, New York, North Carolina, Oklahoma, Utah, Virginia and Washington required it. Other states may have added rules since, so check each state you will drive in.' },
  { q: 'How long does pilot car certification last?', a: 'In states that certify, it typically lasts 3 to 5 years and starts with a one-day class and a written test.' },
  { q: 'Does one state\'s pilot car certification work in another state?', a: 'Many states accept each other\'s certification, but only the card. Vehicle, equipment and insurance rules still follow each state. Confirm with the state before you drive.' },
  { q: 'What equipment does a pilot car need?', a: 'Commonly an Oversize Load sign, flags, an amber warning light, a two-way radio, a fire extinguisher, a STOP/SLOW paddle, cones or reflectors, a first aid kit, and a height pole for tall loads. The exact list differs by state.' },
  { q: 'How do I find pilot car work?', a: 'Make a free account on Oversize Escort Hub, add the states you cover, and watch the flat-rate, open-bid and 5-minute bid boards.' },
]
