import { Student, Trainer, ClassRoom, TypingTest, TypingSubmission } from '../types';

// Pre-loaded roster (Empty by default: all examinees are managed via Admin or Supabase)
export const INITIAL_STUDENTS: Student[] = [];

// Initial Trainers
export const INITIAL_TRAINERS: Trainer[] = [
  {
    id: 'trn-1',
    username: 'trainer',
    name: 'Prof. Alex Vance (Proctor)',
    email: 'trainer@testtype.edu',
    assignedClasses: ['', '', ''],
    createdAt: '2025-01-01'
  },
  {
    id: 'trn-2',
    username: 'proctor_sarah',
    name: 'Dr. Sarah Connor (Head Mentor)',
    email: 'sarah.connor@testtype.edu',
    assignedClasses: [''],
    createdAt: '2025-01-15'
  }
];

// Initial Classes
export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: '',
    name: 'CSE Alpha (2024-28)',
    trainerId: 'trn-1',
    description: 'Computer Science and Engineering - Section A Core Batch',
    studentIds: INITIAL_STUDENTS.filter(s => s.classId === '').map(s => s.id),
    createdAt: '2025-01-05'
  },
  {
    id: '',
    name: 'AIML Beta (2024-28)',
    trainerId: 'trn-1',
    description: 'Artificial Intelligence & Machine Learning Track',
    studentIds: INITIAL_STUDENTS.filter(s => s.classId === '').map(s => s.id),
    createdAt: '2025-01-05'
  },
  {
    id: '',
    name: 'Data Science Delta (2024-28)',
    trainerId: 'trn-1',
    description: 'Data Engineering and Statistical Computing Division',
    studentIds: INITIAL_STUDENTS.filter(s => s.classId === '').map(s => s.id),
    createdAt: '2025-01-05'
  }
];

// Initial Tests (Standard, Stories, Coding Modules)
// Requirement: Coding questions and Stories modules MUST only be seen once the trainer assigns them to the class!
export const INITIAL_TESTS: TypingTest[] = [
  // Coding Module 1
  {
    id: 'test-code-1',
    title: 'Python: Two Sum & Hash Map Lookup',
    category: 'code',
    language: 'python',
    timeLimit: 120,
    minAccuracy: 92,
    assignedClassIds: [''], // Assigned to class-1
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'medium',
    description: 'Classic LeetCode array problem demonstrating optimal linear time hash map indexing.',
    content: `def two_sum(nums, target):
    seen = {}
    for index, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], index]
        seen[num] = index
    return []`
  },
  // Coding Module 2
  {
    id: 'test-code-2',
    title: 'JavaScript: Async Data Pipeline',
    category: 'code',
    language: 'javascript',
    timeLimit: 180,
    minAccuracy: 90,
    assignedClassIds: ['', ''], // Assigned to class-1 and class-2
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'hard',
    description: 'Asynchronous fetch pipeline utilizing Promises, error boundaries, and stream decoding.',
    content: `async function fetchStudentBatch(apiEndpoint, batchSize) {
  try {
    const response = await fetch(\`\${apiEndpoint}?limit=\${batchSize}\`);
    if (!response.ok) throw new Error("Network latency failure");
    const payload = await response.json();
    return payload.items.filter(item => item.active === true);
  } catch (error) {
    console.error("Pipeline crashed:", error.message);
    return [];
  }
}`
  },
  // Coding Module 3
  {
    id: 'test-code-3',
    title: 'Java: Binary Search Implementation',
    category: 'code',
    language: 'java',
    timeLimit: 150,
    minAccuracy: 95,
    assignedClassIds: [], // UNASSIGNED by default - Locked to students!
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'medium',
    description: 'Logarithmic time divide-and-conquer binary search on sorted integer buffers.',
    content: `public static int binarySearch(int[] array, int target) {
    int low = 0;
    int high = array.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (array[mid] == target) return mid;
        if (array[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`
  },
  // Coding Module 4
  {
    id: 'test-code-4',
    title: 'C++: Fast I/O & Dynamic Vectors',
    category: 'code',
    language: 'cpp',
    timeLimit: 120,
    minAccuracy: 90,
    assignedClassIds: [], // UNASSIGNED by default - Locked!
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'easy',
    description: 'High performance competitive programming template with decoupled standard streams.',
    content: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    vector<int> numbers = {14, 2, 77, 43, 9};
    sort(numbers.begin(), numbers.end());
    for (int value : numbers) {
        cout << value << " ";
    }
    return 0;
}`
  },
  // Story Module 1
  {
    id: 'test-story-1',
    title: 'Story: The Clockwork Lighthouse',
    category: 'story',
    language: 'none',
    timeLimit: 90,
    minAccuracy: 94,
    assignedClassIds: [''], // Assigned to class-1
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'medium',
    description: 'An evocative tale of an automaton tending the beacon at the edge of the forgotten ocean.',
    content: `The brass gears of the tower turned with a rhythmic click that resonated through the salt mist. Every dusk, the brass keeper ascended the spiraling granite steps, carrying oil distilled from ancient resin. Below, waves crashed violently against the basalt cliffs, but inside the lantern chamber, the golden lens reflected a steady, amber luminescence guiding lost vessels back to haven.`
  },
  // Story Module 2
  {
    id: 'test-story-2',
    title: 'Story: Echoes of the Deep Forest',
    category: 'story',
    language: 'none',
    timeLimit: 120,
    minAccuracy: 92,
    assignedClassIds: [], // UNASSIGNED by default - Locked!
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'easy',
    description: 'A serene journey beneath emerald canopies where sunlight weaves through ancient cedar.',
    content: `Beneath the emerald canopy, the morning mist lingered like spun silver across the mossy floor. Deep within the ancient grove, birds called to one another in melodies that predated written speech. Every breath of wind stirred the fragrant cedar boughs, sending showers of dew drops glistening into the ferns where silent creatures watched with patient eyes.`
  },
  // Story Module 3
  {
    id: 'test-story-3',
    title: 'Story: The Silicon Dawn',
    category: 'story',
    language: 'none',
    timeLimit: 90,
    minAccuracy: 95,
    assignedClassIds: ['', ''], // Assigned to class-2 & 3
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'medium',
    description: 'Reflections on the dawn of personal computing and early microprocessor breakthroughs.',
    content: `In a nondescript garage cluttered with soldering irons and breadboards, two visionaries worked through cold winter evenings. The pale monochrome monitor flickered to life, rendering green letters that acknowledged human keystrokes for the very first time. They understood immediately that humanity had crossed an irreversible threshold into an era of boundless computation.`
  },
  // Standard Practice Test (Open for everyone in Free Practice)
  {
    id: 'test-standard-1',
    title: 'Standard Warm-Up: Quick Words',
    category: 'standard',
    language: 'none',
    timeLimit: 60,
    minAccuracy: 88,
    assignedClassIds: ['', '', ''],
    isPrebuilt: true,
    createdBy: 'system',
    difficulty: 'easy',
    description: 'Balanced paragraph containing high-frequency vocabulary for muscle memory priming.',
    content: `Precision and rhythm define the essence of swift keyboard mastery. Developing proper finger dexterity allows ideas to flow seamlessly into digital prose without the friction of hesitation. Keep your wrists relaxed, maintain an even cadence, and trust the gradual refinement of continuous daily practice.`
  }
];

// Initial Submissions (Empty by default: all submissions are recorded dynamically during exams)
export const INITIAL_SUBMISSIONS: TypingSubmission[] = [];

// Common Monkeytype English words for practice mode
export const MONKEYTYPE_WORDS = [
  'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'I',
  'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'from', 'or',
  'which', 'one', 'would', 'all', 'will', 'there', 'say', 'who', 'make', 'when', 'can', 'more',
  'if', 'no', 'man', 'out', 'other', 'so', 'what', 'time', 'up', 'go', 'about', 'than', 'into',
  'could', 'state', 'only', 'new', 'year', 'some', 'take', 'come', 'these', 'know', 'see', 'use',
  'get', 'like', 'then', 'first', 'any', 'work', 'now', 'may', 'such', 'give', 'over', 'think',
  'most', 'even', 'find', 'day', 'also', 'after', 'way', 'many', 'must', 'look', 'before', 'great',
  'back', 'through', 'long', 'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just',
  'system', 'code', 'function', 'class', 'object', 'data', 'algorithm', 'server', 'logic', 'array',
  'string', 'number', 'memory', 'speed', 'target', 'index', 'module', 'stream', 'value', 'return'
];
