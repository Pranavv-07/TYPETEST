export interface LibraryPassage {
  id: string;
  title: string;
  category: 'story' | 'article' | 'code' | 'paragraph' | 'vocabulary' | 'script' | 'citations' | 'career' | 'sprint15' | 'sprint30';
  categoryLabel: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  estimatedSeconds: number;
  text: string;
  authorOrSource?: string;
  tags: string[];
}

export const TEXT_LIBRARY: LibraryPassage[] = [
  // ==========================================
  // 1. 15-SECOND HIGH-OCTANE SPRINTS (Fast Cadence)
  // ==========================================
  {
    id: 'sprint15-1',
    title: 'Neon Velocity',
    category: 'sprint15',
    categoryLabel: '15s Sprint',
    difficulty: 'Beginner',
    estimatedSeconds: 15,
    text: 'Swift agile fingers glide across keys with silent precision and unmatched speed.',
    tags: ['burst', 'warmup', 'rhythm']
  },
  {
    id: 'sprint15-2',
    title: 'Pulse of Silicon',
    category: 'sprint15',
    categoryLabel: '15s Sprint',
    difficulty: 'Intermediate',
    estimatedSeconds: 15,
    text: 'Quantum microchips calculate quadrillions of floating point operations per nanosecond.',
    tags: ['tech', 'speed', 'science']
  },
  {
    id: 'sprint15-3',
    title: 'The Home Row Reflex',
    category: 'sprint15',
    categoryLabel: '15s Sprint',
    difficulty: 'Beginner',
    estimatedSeconds: 15,
    text: 'Keep both index fingers resting gently on the tactile bumps of keys F and J.',
    tags: ['fundamentals', 'drill', 'accuracy']
  },
  {
    id: 'sprint15-4',
    title: 'Algorithmic Rhythm',
    category: 'sprint15',
    categoryLabel: '15s Sprint',
    difficulty: 'Advanced',
    estimatedSeconds: 15,
    text: 'Dynamic programming optimizes overlapping subproblems through recursive memoization matrices.',
    tags: ['algorithms', 'cs', 'dense']
  },

  // ==========================================
  // 2. 30-SECOND CADENCE DRILLS
  // ==========================================
  {
    id: 'sprint30-1',
    title: 'Mechanical Keycap Acoustic',
    category: 'sprint30',
    categoryLabel: '30s Cadence',
    difficulty: 'Intermediate',
    estimatedSeconds: 30,
    text: 'A tactile mechanical switch actuates halfway through its downward travel, producing a crisp acoustic snap that signals flawless finger registration before bottoming out.',
    tags: ['hardware', 'tactile', 'rhythm']
  },
  {
    id: 'sprint30-2',
    title: 'Compiler Optimization',
    category: 'sprint30',
    categoryLabel: '30s Cadence',
    difficulty: 'Advanced',
    estimatedSeconds: 30,
    text: 'Modern optimizing compilers transform abstract syntax trees into vector instructions, eliminating dead branches and inlining critical function loops to maximize processor throughput.',
    tags: ['compilers', 'systems', 'cs']
  },
  {
    id: 'sprint30-3',
    title: 'Distributed Consensus',
    category: 'sprint30',
    categoryLabel: '30s Cadence',
    difficulty: 'Intermediate',
    estimatedSeconds: 30,
    text: 'Distributed leader election algorithms require quorum confirmation among participating nodes to preserve state consistency and prevent split-brain network partitions across clusters.',
    tags: ['networks', 'architecture', 'cloud']
  },
  {
    id: 'sprint30-4',
    title: 'Starlight Transit',
    category: 'sprint30',
    categoryLabel: '30s Cadence',
    difficulty: 'Beginner',
    estimatedSeconds: 30,
    text: 'When night settles over the observatory dome, high-precision astronomical mirrors capture ancient photons that traveled across billions of light years of interstellar vacuum.',
    tags: ['space', 'nature', 'prose']
  },

  // ==========================================
  // 3. STORIES & NARRATIVE (Creative & Immersive)
  // ==========================================
  {
    id: 'story-1',
    title: 'The Silent Observatory',
    category: 'story',
    categoryLabel: 'Stories',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: 'The morning sun pierced the dense silver mist, illuminating the moss-covered granite pathway leading toward the high observatory. Every step echoed against the quiet mountain gorge, accompanied only by the distant whispers of alpine pines bending before the cool northern wind.',
    tags: ['narrative', 'scenic', 'flow']
  },
  {
    id: 'story-2',
    title: 'Midnight in Neo-Kyoto',
    category: 'story',
    categoryLabel: 'Stories',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'Rain droplets fell against the neon-drenched glass of the high-altitude monorail. Below, holographic billboards reflected in endless puddles as courier drones wove effortlessly between chrome skyscrapers, their blue navigation beacons flickering like fireflies against the obsidian sky.',
    tags: ['cyberpunk', 'fiction', 'cinematic']
  },
  {
    id: 'story-3',
    title: 'The Cartographer of Lost Sands',
    category: 'story',
    categoryLabel: 'Stories',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: 'Kael unfolded the weathered parchment map beneath the flickering oil lantern. For three decades, the shifting dunes of the Crimson Expanse had buried ancient kingdoms, yet the brass compass needle pointed steadfastly toward the forgotten oasis of silver water.',
    tags: ['adventure', 'fantasy', 'mystery']
  },
  {
    id: 'story-4',
    title: 'Voyage of the Aurora Borealis',
    category: 'story',
    categoryLabel: 'Stories',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'Cutting through Arctic pack ice, the steel-hulled research vessel pushed northward into uncharted waters. Above the bridge, emerald ribbons of auroral plasma danced across the ionosphere, casting surreal phosphorescent shadows over the frozen tundra.',
    tags: ['polar', 'exploration', 'descriptive']
  },
  {
    id: 'story-5',
    title: 'The Clockwork Automaton',
    category: 'story',
    categoryLabel: 'Stories',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: 'Master horologist Clara placed the sapphire jewel bearing into the central escapement. With a single turn of the brass key, ninety interlocking bronze gears whirred to life, moving the miniature astronomical astrolabe in perfect celestial synchronization.',
    tags: ['steampunk', 'craft', 'artisan']
  },

  // ==========================================
  // 4. ARTICLES & INFORMATIONAL TEXTS (Science & Tech)
  // ==========================================
  {
    id: 'article-1',
    title: 'James Webb and Deep Space Infrared',
    category: 'article',
    categoryLabel: 'Informational Texts',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'By utilizing gold-coated beryllium primary mirrors and cryogenic mid-infrared spectrometers, space telescopes can penetrate cosmic dust clouds to observe the earliest primordial galaxies formed shortly after the Big Bang over thirteen billion years ago.',
    tags: ['astronomy', 'physics', 'cosmology']
  },
  {
    id: 'article-2',
    title: 'Neuroplasticity and Muscle Memory',
    category: 'article',
    categoryLabel: 'Informational Texts',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: 'Deliberate touch typing reorganizes neural pathways in the motor cortex. Through rhythmic repetition, key stroke patterns transition from conscious visual scanning into automatic basal ganglia reflexes, reducing mental fatigue during extended programming sessions.',
    tags: ['neuroscience', 'typing', 'psychology']
  },
  {
    id: 'article-3',
    title: 'Oceanic Hydrothermal Vents',
    category: 'article',
    categoryLabel: 'Informational Texts',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: 'Located miles beneath the ocean surface along tectonic spreading ridges, hydrothermal chimneys discharge mineral-rich superheated fluids into freezing abyssal water, sustaining vibrant chemosynthetic ecosystems completely independent of solar energy.',
    tags: ['biology', 'oceanography', 'earth']
  },
  {
    id: 'article-4',
    title: 'Quantum Computing Superposition',
    category: 'article',
    categoryLabel: 'Informational Texts',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'Unlike classical binary bits constrained to discrete states of zero or one, quantum qubits exploit superposition and quantum entanglement to evaluate vast combinatorial computational search spaces simultaneously.',
    tags: ['quantum', 'computing', 'physics']
  },

  // ==========================================
  // 5. CODING & ALGORITHMS (Syntax, Symbols & Logic)
  // ==========================================
  {
    id: 'code-1',
    title: 'Python: Two Sum & Hash Map',
    category: 'code',
    categoryLabel: 'Coding & Algorithms',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: `def two_sum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`,
    tags: ['python', 'algorithms', 'leetcode']
  },
  {
    id: 'code-2',
    title: 'TypeScript: Generic Async Queue',
    category: 'code',
    categoryLabel: 'Coding & Algorithms',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: `export class AsyncWorkerQueue<T> {\n  private queue: T[] = [];\n  async enqueue(item: T): Promise<void> {\n    this.queue.push(item);\n    await this.processNext();\n  }\n}`,
    tags: ['typescript', 'async', 'concurrency']
  },
  {
    id: 'code-3',
    title: 'SQL: Analytical Window Functions',
    category: 'code',
    categoryLabel: 'Coding & Algorithms',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: `SELECT student_id, test_id, net_wpm,\n       DENSE_RANK() OVER (PARTITION BY test_id ORDER BY net_wpm DESC) as rank\nFROM examination_attempts\nWHERE status = 'verified' AND accuracy >= 95.0;`,
    tags: ['sql', 'database', 'queries']
  },
  {
    id: 'code-4',
    title: 'Rust: Safe Concurrency & Channels',
    category: 'code',
    categoryLabel: 'Coding & Algorithms',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: `use std::sync::mpsc;\nuse std::thread;\nfn spawn_worker() {\n    let (tx, rx) = mpsc::channel();\n    thread::spawn(move || tx.send("Job complete").unwrap());\n    let msg = rx.recv().unwrap();\n}`,
    tags: ['rust', 'threads', 'systems']
  },

  // ==========================================
  // 6. PARAGRAPH PRACTICE (Balanced Flow & Punctuation)
  // ==========================================
  {
    id: 'paragraph-1',
    title: 'The Architecture of Clean Software',
    category: 'paragraph',
    categoryLabel: 'Paragraph Practice',
    difficulty: 'Intermediate',
    estimatedSeconds: 45,
    text: 'Good software architecture resembles an organized workshop. Every tool has a dedicated place, dependencies flow in a predictable direction, and complex responsibilities are partitioned into modular abstractions that can be modified without breaking adjacent components.',
    tags: ['engineering', 'design', 'prose']
  },
  {
    id: 'paragraph-2',
    title: 'The Craft of Typographic Rhythm',
    category: 'paragraph',
    categoryLabel: 'Paragraph Practice',
    difficulty: 'Intermediate',
    estimatedSeconds: 45,
    text: 'Typographic hierarchy guides the human eye through dense information. By calibrating line heights, tracking, and optical kerning, a graphic designer establishes visual harmony that allows the reader to absorb paragraphs effortlessly without cognitive fatigue.',
    tags: ['typography', 'design', 'art']
  },
  {
    id: 'paragraph-3',
    title: 'Ergonomic Posture at the Terminal',
    category: 'paragraph',
    categoryLabel: 'Paragraph Practice',
    difficulty: 'Beginner',
    estimatedSeconds: 45,
    text: 'Maintain an upright posture with shoulders relaxed, elbows positioned at ninety-degree angles, and wrists hovering naturally above the keyboard rather than resting heavily on hard desk edges to protect against strain.',
    tags: ['ergonomics', 'health', 'posture']
  },

  // ==========================================
  // 7. TEST-PREP VOCABULARY & ACADEMIC LEXICON
  // ==========================================
  {
    id: 'vocab-1',
    title: 'Advanced Rhetorical Lexicon',
    category: 'vocabulary',
    categoryLabel: 'Test-Prep Vocabulary',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'The lecturer demonstrated an ephemeral yet ubiquitous eloquence, juxtaposing anachronistic paradigms against avant-garde scientific hypotheses with immaculate precision and unyielding veracity.',
    tags: ['gre', 'sat', 'vocabulary']
  },
  {
    id: 'vocab-2',
    title: 'Scholarly Analytical Discourse',
    category: 'vocabulary',
    categoryLabel: 'Test-Prep Vocabulary',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'To synthesize esoteric philosophical treaties requires evaluating axiomatic premises, interrogating tautological arguments, and contextualizing empirical methodologies within comprehensive historical frameworks.',
    tags: ['academic', 'analysis', 'lexicon']
  },
  {
    id: 'vocab-3',
    title: 'Scientific Taxonomy and Nomenclature',
    category: 'vocabulary',
    categoryLabel: 'Test-Prep Vocabulary',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: 'Taxonomists categorize phylogenetic classifications using binomial nomenclature, distinguishing morphological variations and genetic divergence across divergent biological genera and endemic ecosystems.',
    tags: ['biology', 'nomenclature', 'gre']
  },

  // ==========================================
  // 8. SCRIPT WRITING & DRAMATIC DIALOGUES
  // ==========================================
  {
    id: 'script-1',
    title: 'Flight Controller: Lunar Descent',
    category: 'script',
    categoryLabel: 'Script Writing',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: `COMMANDER (into radio):
Telemetry is green. Approaching landing zone Bravo at forty meters per second.
FLIGHT DYNAMICS OFFICER:
Copy that, Commander. Thruster gimbal is stable. You are Go for final touchdown sequence.`,
    tags: ['dialogue', 'screenplay', 'dramatic']
  },
  {
    id: 'script-2',
    title: 'Keynote Demo: The Neural Engine',
    category: 'script',
    categoryLabel: 'Script Writing',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: `SPEAKER (stepping center stage):
"We spent five years asking a simple question: what if your machine understood your intent before your fingers even finished typing? Today, we are proud to introduce that future."`,
    tags: ['keynote', 'presentation', 'speech']
  },

  // ==========================================
  // 9. MLA & ACADEMIC CITATIONS (Punctuation & Formatting)
  // ==========================================
  {
    id: 'citations-1',
    title: 'MLA 9th Edition Journal Citations',
    category: 'citations',
    categoryLabel: 'MLA Citations',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'Venkatesh, Arjun, and Maya Lin. "Algorithmic Efficiency in Distributed Neural Clusters." Journal of Computational Systems, vol. 42, no. 3, 2025, pp. 118-134. DOI: 10.1016/j.jcs.2025.04.012.',
    tags: ['mla', 'citations', 'academic', 'punctuation']
  },
  {
    id: 'citations-2',
    title: 'APA 7th Edition Book Reference',
    category: 'citations',
    categoryLabel: 'MLA Citations',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'Turing, Alan M. (2024). Principles of Intelligent Computing and Mechanical Automata (3rd ed., Vol. 2). Cambridge University Press. https://doi.org/10.1017/CBO9781107415324',
    tags: ['apa', 'references', 'symbols']
  },

  // ==========================================
  // 10. CAREER & PROFESSIONAL COMMUNICATIONS
  // ==========================================
  {
    id: 'career-1',
    title: 'Executive Incident Post-Mortem',
    category: 'career',
    categoryLabel: 'Career Prep',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: 'Dear Leadership Team, We have resolved the database failover latency issue. Automated circuit breakers engaged successfully at 02:14 UTC, preventing cascading timeouts across our microservice mesh.',
    tags: ['email', 'business', 'workplace']
  },
  {
    id: 'career-2',
    title: 'Technical Proposal (RFC Summary)',
    category: 'career',
    categoryLabel: 'Career Prep',
    difficulty: 'Advanced',
    estimatedSeconds: 60,
    text: 'This proposal outlines our transition to zero-trust architecture. By enforcing mutual TLS authentication between service nodes and rotating ephemeral credentials, we reduce attack surfaces across internal networks.',
    tags: ['rfc', 'engineering', 'proposals']
  },
  {
    id: 'career-3',
    title: 'Client Stakeholder Delivery Update',
    category: 'career',
    categoryLabel: 'Career Prep',
    difficulty: 'Intermediate',
    estimatedSeconds: 60,
    text: 'Thank you for your valuable feedback during yesterday sprint review. We have incorporated the requested responsive dashboard filters and deployed the release candidate to staging for your team evaluation.',
    tags: ['stakeholder', 'consulting', 'communication']
  }
];

// Helper functions for accessing categorized texts
export function getTextByCategory(category: string): LibraryPassage[] {
  if (category === 'all') return TEXT_LIBRARY;
  return TEXT_LIBRARY.filter(p => p.category === category);
}

export function getRandomPassage(category?: string): LibraryPassage {
  const pool = category && category !== 'all' ? getTextByCategory(category) : TEXT_LIBRARY;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] || TEXT_LIBRARY[0];
}
