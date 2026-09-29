import { Student, Trainer, ClassRoom, TypingTest, TypingSubmission, StudentCertificate } from '../types';

// Pre-loaded roster with Pranav Vedula and student examinees
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-24b11cs355',
    rollNo: '24B11CS355',
    name: 'Pranav Vedula',
    email: 'vedulapranav@gmail.com',
    phone: '8179344043',
    batch: 'Batch 2024-28',
    batchId: 'b0000000-0000-0000-0000-000000000001',
    classId: 'cls-cse-a',
    departmentId: 'd0000000-0000-0000-0000-000000000001',
    status: 'active',
    password: '1234',
    createdAt: '2025-01-05'
  },
  {
    id: 'std-24b11cs101',
    rollNo: '24B11CS101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@aditya.ac.in',
    phone: '9876543210',
    batch: 'Batch 2024-28',
    batchId: 'b0000000-0000-0000-0000-000000000001',
    classId: 'cls-cse-a',
    departmentId: 'd0000000-0000-0000-0000-000000000001',
    status: 'active',
    password: '1234',
    createdAt: '2025-01-05'
  },
  {
    id: 'std-24b11ai201',
    rollNo: '24B11AI201',
    name: 'Ananya Rao',
    email: 'ananya.rao@aditya.ac.in',
    phone: '9876543211',
    batch: 'Batch 2024-28',
    batchId: 'b0000000-0000-0000-0000-000000000001',
    classId: 'cls-aiml-b',
    departmentId: 'd0000000-0000-0000-0000-000000000002',
    status: 'active',
    password: '1234',
    createdAt: '2025-01-05'
  },
  {
    id: 'std-24b11it301',
    rollNo: '24B11IT301',
    name: 'Rohan Verma',
    email: 'rohan.verma@aditya.ac.in',
    phone: '9876543212',
    batch: 'Batch 2024-28',
    batchId: 'b0000000-0000-0000-0000-000000000001',
    classId: 'cls-ds-d',
    departmentId: 'd0000000-0000-0000-0000-000000000003',
    status: 'active',
    password: '1234',
    createdAt: '2025-01-05'
  }
];

// Initial Trainers
export const INITIAL_TRAINERS: Trainer[] = [
  {
    id: 'trn-1',
    username: 'trainer',
    name: 'Pavan B',
    email: 'pavan.b@testtype.edu',
    phone: '9848012345',
    designation: 'Senior Faculty & Lead Proctor',
    assignedClasses: ['cls-cse-a', 'cls-aiml-b', 'cls-ds-d'],
    createdAt: '2025-01-01'
  },
  {
    id: 'trn-2',
    username: 'pavan_b',
    name: 'Pavan B (Lead Faculty Mentor)',
    email: 'pavan.lead@testtype.edu',
    phone: '9848012346',
    designation: 'Department Technical Trainer',
    assignedClasses: ['cls-cse-a'],
    createdAt: '2025-01-15'
  }
];

// Initial Classes
export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'cls-cse-a',
    name: 'CSE Alpha (2024-28)',
    trainerId: 'trn-1',
    departmentId: 'd0000000-0000-0000-0000-000000000001',
    batchId: 'b0000000-0000-0000-0000-000000000001',
    section: 'A',
    description: 'Computer Science & Engineering - Core Section A Batch',
    studentIds: ['std-24b11cs355', 'std-24b11cs101'],
    createdAt: '2025-01-05'
  },
  {
    id: 'cls-aiml-b',
    name: 'AIML Beta (2024-28)',
    trainerId: 'trn-1',
    departmentId: 'd0000000-0000-0000-0000-000000000002',
    batchId: 'b0000000-0000-0000-0000-000000000001',
    section: 'B',
    description: 'Artificial Intelligence & Machine Learning Track',
    studentIds: ['std-24b11ai201'],
    createdAt: '2025-01-05'
  },
  {
    id: 'cls-ds-d',
    name: 'Data Science Delta (2024-28)',
    trainerId: 'trn-1',
    departmentId: 'd0000000-0000-0000-0000-000000000003',
    batchId: 'b0000000-0000-0000-0000-000000000001',
    section: 'D',
    description: 'Data Engineering & Statistical Computing Division',
    studentIds: ['std-24b11it301'],
    createdAt: '2025-01-05'
  }
];

// Initial Tests (Standard, Stories, Coding Modules)
export const INITIAL_TESTS: TypingTest[] = [
  // Coding Module 1
  {
    id: 'test-code-1',
    title: 'Python: Two Sum & Hash Map Lookup',
    category: 'code',
    language: 'python',
    timeLimit: 120,
    minAccuracy: 92,
    assignedClassIds: ['cls-cse-a', 'cls-aiml-b'],
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'medium',
    description: 'Classic array indexing problem demonstrating optimal linear time hash map indexing.',
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
    assignedClassIds: ['cls-cse-a'],
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
    assignedClassIds: [],
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
    assignedClassIds: [],
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
    assignedClassIds: ['cls-cse-a', 'cls-aiml-b', 'cls-ds-d'],
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
    assignedClassIds: ['cls-cse-a'],
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
    assignedClassIds: [],
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'medium',
    description: 'Chronicle of the first crystalline neural networks computing under subterranean vaults.',
    content: `At the dawn of the synthetic age, crystalline processors hummed inside subterranean research vaults. The engineers monitored shimmering phosphor oscilloscopes as the neural matrix solved thermodynamic equations in nanoseconds. What had once demanded supercomputer clusters now sparked across microscopic silicon pathways with silent elegance.`
  },
  // Standard Academic Benchmark 1
  {
    id: 'test-std-1',
    title: 'Institutional Speed Benchmark — CSE Track',
    category: 'standard',
    language: 'none',
    timeLimit: 60,
    minAccuracy: 95,
    assignedClassIds: ['cls-cse-a', 'cls-aiml-b', 'cls-ds-d'],
    isPrebuilt: true,
    createdBy: 'trn-1',
    difficulty: 'medium',
    description: 'Official collegiate typing assessment evaluating rhythm, cadence, and stroke precision.',
    content: `Touch typing is a foundational skill for computer science and engineering professionals. By maintaining correct finger placement on the home row keys, typists build muscle memory that drastically improves both typing speed and accuracy. Consistent daily practice with varied text helps eliminate keyboard hunting, allowing the mind to focus entirely on algorithmic design and creative problem solving.`
  }
];

export const INITIAL_SUBMISSIONS: TypingSubmission[] = [
  {
    id: 'sub-sample-1',
    testId: 'test-std-1',
    testTitle: 'Institutional Speed Benchmark — CSE Track',
    testCategory: 'standard',
    studentId: 'std-24b11cs355',
    studentName: 'Pranav Vedula',
    rollNo: '24B11CS355',
    classId: 'cls-cse-a',
    className: 'CSE Alpha (2024-28)',
    wpm: 86,
    rawWpm: 88,
    netWpm: 86,
    accuracy: 99,
    errors: 1,
    totalChars: 430,
    correctChars: 425,
    timeTaken: 60,
    proctorBlurFlags: 0,
    history: [],
    passed: true,
    timestamp: '2026-09-28T14:30:00.000Z',
    status: 'submitted'
  }
];

export const INITIAL_CERTIFICATES: StudentCertificate[] = [
  {
    id: 'cert-pranav-24b11cs355-apex',
    studentId: 'std-24b11cs355',
    studentName: 'Pranav Vedula',
    rollNo: '24B11CS355',
    achievementTitle: '🏆 Grandmaster Touch Typist Apex Credential',
    wpm: 86,
    accuracy: 99,
    testTitle: 'Department of Technical Training Official Certification Exam',
    issuedAt: '2026-09-28T14:35:00.000Z',
    issuingAuthority: 'Department of Technical Training (DOTT), Aditya University',
    verificationCode: 'DOTT-ADITYA-24B11CS355-APEX',
    certificateNumber: 'DOTT-TTC-2026-817934',
    status: 'valid'
  }
];

export const MONKEYTYPE_WORDS: string[] = [
  'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'his', 'from', 'they', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'system', 'code', 'function', 'class', 'const', 'return', 'async', 'await', 'import', 'export', 'interface', 'string', 'number', 'boolean', 'array', 'object', 'data', 'algorithm', 'binary', 'tree', 'stack', 'queue', 'graph', 'database', 'network', 'thread', 'process', 'memory', 'pointer', 'compile', 'runtime', 'terminal', 'server', 'client', 'engine', 'speed', 'accuracy', 'keyboard', 'keystroke', 'cadence', 'velocity', 'finger', 'rhythm', 'tactile', 'switch', 'mechanical', 'optical', 'latency', 'benchmark', 'quantum', 'matrix', 'vector', 'neural', 'tensor', 'stream', 'buffer', 'socket', 'packet', 'protocol', 'syntax', 'logic', 'variable', 'method', 'promise', 'callback', 'closure', 'scope', 'module', 'package', 'build', 'deploy', 'proctor', 'aditya', 'university', 'mentor', 'training', 'mastery', 'apex'
];

