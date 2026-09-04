import { Student, Trainer, ClassRoom, TypingTest, TypingSubmission } from '../types';

// Pre-loaded roster of 139 students from institutional dataset
export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', rollNo: '24P31A42S4', name: 'DANDEM SURYA VENKATA PHANISRI', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-2', rollNo: '24P31A05B3', name: 'Sri nithya Nimishakawi', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-3', rollNo: '24B11AI213', name: 'KURAMDASU GANESWARI', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-4', rollNo: '24B11AI230', name: 'MAHAMMAD SHAMIM BHANU', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-5', rollNo: '24B11AI409', name: 'SURAVARAPU LEELA PAVANI', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-6', rollNo: '24B11CS025', name: 'B Venkata Sruthi', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-7', rollNo: '24B11CS052', name: 'Bonagiri Mahaveera Venkata Shanmukhi Sri', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-8', rollNo: '24B11CS089', name: 'Gollapalli Sai Sravani', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-9', rollNo: '24B11CS114', name: 'Kandregula Manaswini', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-10', rollNo: '24B11CS142', name: 'Kothuri Bala Sai Sreya', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-11', rollNo: '24B11CS173', name: 'Medidi Durga Bhavani', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-12', rollNo: '24B11CS205', name: 'Pappala Deepika', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-13', rollNo: '24B11CS238', name: 'Routhu Anusha', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-14', rollNo: '24B11CS265', name: 'Thota Joshna Sri', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-15', rollNo: '24B11CS295', name: 'Vemulapalli Sai Tejaswi', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-16', rollNo: '24B11CS325', name: 'Yalla Nikhitha', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-17', rollNo: '24B11IT002', name: 'Adapa Valli Pravallika', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-18', rollNo: '24B11IT031', name: 'Chikkam Gayatri', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-19', rollNo: '24B11IT063', name: 'Gudimetla Jahnavi', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-20', rollNo: '24B11IT094', name: 'Kandula Tejaswi', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-21', rollNo: '24B11IT124', name: 'Malladi Sri Sai Tejaswini', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-22', rollNo: '24B11IT155', name: 'Palla Jyothi', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-23', rollNo: '24B11IT182', name: 'Rayudu Hema Harika', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-24', rollNo: '24B11IT210', name: 'Sunkara Lakshmi Prasanna', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-25', rollNo: '24P31A4201', name: 'Akasapu Teja Sri', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-26', rollNo: '24P31A4208', name: 'Bandaru Satya Sri', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-27', rollNo: '24P31A4215', name: 'Bolisetty Divya', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-28', rollNo: '24P31A4222', name: 'Chilukuri Naga Nandini', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-29', rollNo: '24P31A4230', name: 'Dasari Durga Bhavani', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-30', rollNo: '24P31A4239', name: 'Geddam Likhitha', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-31', rollNo: '24P31A4248', name: 'Gubbala Hema Latha', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-32', rollNo: '24P31A4256', name: 'Inti Naga Sai Ramya', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-33', rollNo: '24P31A4264', name: 'Kandregula Sirisha', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-34', rollNo: '24P31A4272', name: 'Koduri Sai Deepika', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-35', rollNo: '24P31A4280', name: 'Koppisetti Uma Maheswari', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-36', rollNo: '24P31A4289', name: 'Maddila Sai Geetha', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-37', rollNo: '24P31A4298', name: 'Mothukuri Harshitha', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-38', rollNo: '24P31A42A6', name: 'Nallamilli Veera Venkata Satya', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-39', rollNo: '24P31A42B5', name: 'Palivela Sai Sowjanya', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-40', rollNo: '24P31A42C3', name: 'Penumalla Bindu Madhavi', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-41', rollNo: '24P31A42D2', name: 'Rayudu Durga Bhavani', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-42', rollNo: '24P31A42E0', name: 'Satti Ananta Lakshmi', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-43', rollNo: '24P31A42E9', name: 'Tadi Naga Jyothi', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-44', rollNo: '24P31A42F7', name: 'Vangapandu Keerthi', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-45', rollNo: '24P31A42G5', name: 'Yeluri Naga Bhavani', batch: '2024-28', classId: 'class-1', createdAt: '2025-01-10' },
  { id: 'std-46', rollNo: '24P31A42H3', name: 'Adabala Rohith Kumar', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-47', rollNo: '24P31A42J1', name: 'Bandaru Surya Teja', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-48', rollNo: '24P31A42K0', name: 'Chappa Karthik', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-49', rollNo: '24P31A42L2', name: 'Donga Manikanta', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-50', rollNo: '24P31A42M1', name: 'Gollapalli Sai Ram', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-51', rollNo: '24P31A42M9', name: 'Jaliparthi Abhiram', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-52', rollNo: '24P31A42N8', name: 'Karri Venkata Reddy', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-53', rollNo: '24P31A42P6', name: 'Koppisetti Tarun', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-54', rollNo: '24P31A42Q5', name: 'Malladi Hemanth Kumar', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-55', rollNo: '24P31A42R3', name: 'Nallamilli Sai Krishna Reddy', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-56', rollNo: '24P31A42T1', name: 'Penumatsa Jagadeesh Varma', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-57', rollNo: '24P31A42U0', name: 'Rayudu Sai Kiran', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-58', rollNo: '24P31A42V2', name: 'Satti Bhanu Prakash Reddy', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-59', rollNo: '24P31A42W1', name: 'Tadi Siva Shankar Reddy', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-60', rollNo: '24P31A42X0', name: 'Vasa Vinay Kumar', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-61', rollNo: '24P31A42Y8', name: 'Yarlagadda Hemanth', batch: '2024-28', classId: 'class-2', createdAt: '2025-01-10' },
  { id: 'std-62', rollNo: '24P31A0502', name: 'Ambati Sriya', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-63', rollNo: '24P31A0515', name: 'Bolisetty Keerthana', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-64', rollNo: '24P31A0528', name: 'Chitturi Sai Deepika', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-65', rollNo: '24P31A0541', name: 'Dwibhashyam Sri Lakshmi', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-66', rollNo: '24P31A0554', name: 'Golla Chandini', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-67', rollNo: '24P31A0567', name: 'Jampana Harika', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-68', rollNo: '24P31A0580', name: 'Kandula Tejaswi Sri', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-69', rollNo: '24P31A0593', name: 'Koppisetti Jyothi', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-70', rollNo: '24P31A05A6', name: 'Madduri Gayatri', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-71', rollNo: '24P31A05C2', name: 'Pala Bhavana', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-72', rollNo: '24P31A05D5', name: 'Rayudu Sirisha', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-73', rollNo: '24P31A05E8', name: 'Tadepalli Navya', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  { id: 'std-74', rollNo: '24P31A05F9', name: 'Vasa Lakshmi Prasanna', batch: '2024-28', classId: 'class-3', createdAt: '2025-01-10' },
  // Dynamically generate the remaining distinct records up to 139 students
  ...Array.from({ length: 65 }, (_, i) => {
    const num = 75 + i;
    const codes = ['24B11CS', '24B11AI', '24B11IT', '24P31A4', '24P31A0'];
    const code = codes[i % codes.length];
    const roll = `${code}${String(350 + i * 3).padStart(3, '0')}`;
    const firstNames = ['Karthik', 'Sravani', 'Prasad', 'Ananya', 'Mounika', 'Suresh', 'Venkata', 'Swathi', 'Rohit', 'Deepak', 'Meghana', 'Varun', 'Tejaswi', 'Chaitanya', 'Kavya'];
    const lastNames = ['Kollipara', 'Gudipati', 'Penumatsa', 'Vundavalli', 'Nallamilli', 'Gollapalli', 'Kandula', 'Chekuri', 'Koppisetty', 'Malladi', 'Bolisetty', 'Addanki'];
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const classId = i % 3 === 0 ? 'class-1' : (i % 3 === 1 ? 'class-2' : 'class-3');
    return {
      id: `std-${num}`,
      rollNo: roll,
      name: `${lastName} ${firstName}`,
      batch: '2024-28',
      classId,
      createdAt: '2025-01-10'
    };
  })
];

// Initial Trainers
export const INITIAL_TRAINERS: Trainer[] = [
  {
    id: 'trn-1',
    username: 'trainer',
    name: 'Prof. Alex Vance (Proctor)',
    email: 'trainer@testtype.edu',
    assignedClasses: ['class-1', 'class-2', 'class-3'],
    createdAt: '2025-01-01'
  },
  {
    id: 'trn-2',
    username: 'proctor_sarah',
    name: 'Dr. Sarah Connor (Head Mentor)',
    email: 'sarah.connor@testtype.edu',
    assignedClasses: ['class-1'],
    createdAt: '2025-01-15'
  }
];

// Initial Classes
export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'class-1',
    name: 'CSE Alpha (2024-28)',
    trainerId: 'trn-1',
    description: 'Computer Science and Engineering - Section A Core Batch',
    studentIds: INITIAL_STUDENTS.filter(s => s.classId === 'class-1').map(s => s.id),
    createdAt: '2025-01-05'
  },
  {
    id: 'class-2',
    name: 'AIML Beta (2024-28)',
    trainerId: 'trn-1',
    description: 'Artificial Intelligence & Machine Learning Track',
    studentIds: INITIAL_STUDENTS.filter(s => s.classId === 'class-2').map(s => s.id),
    createdAt: '2025-01-05'
  },
  {
    id: 'class-3',
    name: 'Data Science Delta (2024-28)',
    trainerId: 'trn-1',
    description: 'Data Engineering and Statistical Computing Division',
    studentIds: INITIAL_STUDENTS.filter(s => s.classId === 'class-3').map(s => s.id),
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
    assignedClassIds: ['class-1'], // Assigned to class-1
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
    assignedClassIds: ['class-1', 'class-2'], // Assigned to class-1 and class-2
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
    assignedClassIds: ['class-1'], // Assigned to class-1
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
    assignedClassIds: ['class-2', 'class-3'], // Assigned to class-2 & 3
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
    assignedClassIds: ['class-1', 'class-2', 'class-3'],
    isPrebuilt: true,
    createdBy: 'system',
    difficulty: 'easy',
    description: 'Balanced paragraph containing high-frequency vocabulary for muscle memory priming.',
    content: `Precision and rhythm define the essence of swift keyboard mastery. Developing proper finger dexterity allows ideas to flow seamlessly into digital prose without the friction of hesitation. Keep your wrists relaxed, maintain an even cadence, and trust the gradual refinement of continuous daily practice.`
  }
];

// Initial Submissions for Proctor & Trainer Analytics
export const INITIAL_SUBMISSIONS: TypingSubmission[] = [
  {
    id: 'sub-1',
    testId: 'test-code-1',
    testTitle: 'Python: Two Sum & Hash Map Lookup',
    testCategory: 'code',
    language: 'python',
    studentId: 'std-1',
    studentName: 'DANDEM SURYA VENKATA PHANISRI',
    rollNo: '24P31A42S4',
    classId: 'class-1',
    className: 'CSE Alpha (2024-28)',
    wpm: 68,
    rawWpm: 72,
    netWpm: 65,
    accuracy: 96.2,
    errors: 3,
    totalChars: 380,
    correctChars: 366,
    timeTaken: 55,
    proctorBlurFlags: 0,
    passed: true,
    history: [
      { second: 10, wpm: 52, errors: 0 },
      { second: 20, wpm: 64, errors: 1 },
      { second: 30, wpm: 68, errors: 1 },
      { second: 40, wpm: 71, errors: 2 },
      { second: 50, wpm: 69, errors: 3 },
      { second: 55, wpm: 68, errors: 3 }
    ],
    timestamp: '2025-01-20 10:15:30'
  },
  {
    id: 'sub-2',
    testId: 'test-code-1',
    testTitle: 'Python: Two Sum & Hash Map Lookup',
    testCategory: 'code',
    language: 'python',
    studentId: 'std-2',
    studentName: 'Sri nithya Nimishakawi',
    rollNo: '24P31A05B3',
    classId: 'class-1',
    className: 'CSE Alpha (2024-28)',
    wpm: 74,
    rawWpm: 76,
    netWpm: 72,
    accuracy: 97.5,
    errors: 2,
    totalChars: 380,
    correctChars: 371,
    timeTaken: 50,
    proctorBlurFlags: 0,
    passed: true,
    history: [
      { second: 10, wpm: 60, errors: 0 },
      { second: 20, wpm: 70, errors: 0 },
      { second: 30, wpm: 75, errors: 1 },
      { second: 40, wpm: 76, errors: 2 },
      { second: 50, wpm: 74, errors: 2 }
    ],
    timestamp: '2025-01-20 10:18:45'
  },
  {
    id: 'sub-3',
    testId: 'test-story-1',
    testTitle: 'Story: The Clockwork Lighthouse',
    testCategory: 'story',
    language: 'none',
    studentId: 'std-6',
    studentName: 'B Venkata Sruthi',
    rollNo: '24B11CS025',
    classId: 'class-1',
    className: 'CSE Alpha (2024-28)',
    wpm: 58,
    rawWpm: 62,
    netWpm: 55,
    accuracy: 94.8,
    errors: 4,
    totalChars: 345,
    correctChars: 327,
    timeTaken: 59,
    proctorBlurFlags: 1, // Flagged tab switch!
    passed: true,
    history: [
      { second: 10, wpm: 48, errors: 1 },
      { second: 20, wpm: 54, errors: 1 },
      { second: 30, wpm: 56, errors: 2 },
      { second: 40, wpm: 59, errors: 3 },
      { second: 50, wpm: 61, errors: 4 },
      { second: 59, wpm: 58, errors: 4 }
    ],
    timestamp: '2025-01-20 11:05:12'
  },
  {
    id: 'sub-4',
    testId: 'test-code-2',
    testTitle: 'JavaScript: Async Data Pipeline',
    testCategory: 'code',
    language: 'javascript',
    studentId: 'std-3',
    studentName: 'KURAMDASU GANESWARI',
    rollNo: '24B11AI213',
    classId: 'class-2',
    className: 'AIML Beta (2024-28)',
    wpm: 62,
    rawWpm: 65,
    netWpm: 59,
    accuracy: 95.1,
    errors: 4,
    totalChars: 410,
    correctChars: 390,
    timeTaken: 66,
    proctorBlurFlags: 0,
    passed: true,
    history: [
      { second: 15, wpm: 55, errors: 1 },
      { second: 30, wpm: 60, errors: 2 },
      { second: 45, wpm: 64, errors: 3 },
      { second: 60, wpm: 63, errors: 4 },
      { second: 66, wpm: 62, errors: 4 }
    ],
    timestamp: '2025-01-20 11:42:00'
  }
];

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
