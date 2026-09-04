-- ============================================================================
-- TYPETEST INSTITUTIONAL TYPING EXAMINATION PLATFORM
-- Migration 004: Production Seed Dataset
-- Seeds Departments, Batches, Classes, Default Admin, Faculty, and Cohorts
-- ============================================================================

-- 1. Departments
INSERT INTO departments (id, name, code, hod, description, status)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'CSE', 'Dr. V. S. Murthy', 'Department of Computer Science and Engineering', 'active'),
    ('d0000000-0000-0000-0000-000000000002', 'Artificial Intelligence & Machine Learning', 'AIML', 'Dr. Radhika Sen', 'Department of AI & Machine Learning', 'active'),
    ('d0000000-0000-0000-0000-000000000003', 'Information Technology', 'IT', 'Prof. K. Raman', 'Department of Information Technology', 'active')
ON CONFLICT (code) DO NOTHING;

-- 2. Batches
INSERT INTO batches (id, name, batch_year, academic_year, department_id, start_date, end_date, status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Batch 2024-28', '2024-28', '2025-26', 'd0000000-0000-0000-0000-000000000001', '2024-08-01', '2028-05-31', 'active'),
    ('b0000000-0000-0000-0000-000000000002', 'Batch 2023-27', '2023-27', '2025-26', 'd0000000-0000-0000-0000-000000000001', '2023-08-01', '2027-05-31', 'active')
ON CONFLICT DO NOTHING;

-- 3. Classes
INSERT INTO classes (id, name, code, department_id, batch_id, academic_year, section, description, status)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'CSE Alpha (2024-28)', 'CSE-A-24', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '2025-26', 'A', 'Computer Science and Engineering - Section A Core Batch', 'active'),
    ('c0000000-0000-0000-0000-000000000002', 'AIML Beta (2024-28)', 'AIML-B-24', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '2025-26', 'B', 'Artificial Intelligence & Machine Learning Track', 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'Data Science Delta (2024-28)', 'IT-D-24', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '2025-26', 'C', 'Data Engineering and Statistical Computing Division', 'active')
ON CONFLICT (code) DO NOTHING;

-- 4. Initial Administrator
INSERT INTO admins (id, name, email, username, password_hash, role, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Head of Examinations (Admin)', 'admin@testtype.edu', 'admin', crypt('admin123', gen_salt('bf')), 'SUPER ADMIN', 'active')
ON CONFLICT (username) DO NOTHING;

-- 5. Initial Trainers
INSERT INTO trainers (id, name, email, phone, employee_id, department_id, designation, username, password_hash, status)
VALUES
    ('t0000000-0000-0000-0000-000000000001', 'Prof. Alex Vance (Proctor)', 'trainer@testtype.edu', '+91 98480 12345', 'EMP-CSE-01', 'd0000000-0000-0000-0000-000000000001', 'Assistant Professor & Proctor', 'trainer', crypt('trainer@123', gen_salt('bf')), 'active'),
    ('t0000000-0000-0000-0000-000000000002', 'Pranav Vedula (CSE Faculty)', 'mentor_pranav@testtype.edu', '+91 98480 54321', 'EMP-CSE-02', 'd0000000-0000-0000-0000-000000000001', 'Lead Technical Trainer', 'mentor_pranav', crypt('trainer@123', gen_salt('bf')), 'active'),
    ('t0000000-0000-0000-0000-000000000003', 'Faculty CSE Examination Cell', 'faculty_cse@testtype.edu', '+91 98480 98765', 'EMP-CSE-03', 'd0000000-0000-0000-0000-000000000001', 'Senior Examiner', 'faculty_cse', crypt('trainer@123', gen_salt('bf')), 'active')
ON CONFLICT (username) DO NOTHING;

-- 6. Trainer -> Class Linkages
INSERT INTO trainer_classes (trainer_id, class_id)
VALUES
    ('t0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
    ('t0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('t0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 7. Seed Key Students
INSERT INTO students (id, roll_number, name, email, class_id, batch_id, department_id, username, password_hash, status)
VALUES
    ('s0000000-0000-0000-0000-000000000001', '24P31A42S4', 'DANDEM SURYA VENKATA PHANISRI', '24P31A42S4@testtype.edu', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '24P31A42S4', crypt('1234', gen_salt('bf')), 'active'),
    ('s0000000-0000-0000-0000-000000000002', '24P31A05B3', 'Sri nithya Nimishakawi', '24P31A05B3@testtype.edu', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '24P31A05B3', crypt('1234', gen_salt('bf')), 'active'),
    ('s0000000-0000-0000-0000-000000000003', '24B11AI213', 'KURAMDASU GANESWARI', '24B11AI213@testtype.edu', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', '24B11AI213', crypt('1234', gen_salt('bf')), 'active'),
    ('s0000000-0000-0000-0000-000000000004', '24P31A05A1', 'Vemula Sai Teja', '24P31A05A1@testtype.edu', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '24P31A05A1', crypt('1234', gen_salt('bf')), 'active'),
    ('s0000000-0000-0000-0000-000000000005', '24P31A05A2', 'Kondeti Naga Harsha', '24P31A05A2@testtype.edu', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '24P31A05A2', crypt('1234', gen_salt('bf')), 'active')
ON CONFLICT (roll_number) DO NOTHING;

-- 8. Seed Standard & Coding Tests
INSERT INTO tests (id, title, description, category, language, content, duration_minutes, time_limit_seconds, min_accuracy, created_by, status, is_prebuilt, difficulty)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'Python: Two Sum & Hash Map Lookup',
        'Classic LeetCode array problem demonstrating optimal linear time hash map indexing.',
        'code',
        'python',
        'def two_sum(nums, target):\n    seen = {}\n    for index, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], index]\n        seen[num] = index\n    return []',
        2,
        120,
        92.0,
        't0000000-0000-0000-0000-000000000001',
        'active',
        true,
        'medium'
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'C++: Binary Search Tree Inorder Traversal',
        'Recursive and iterative traversal of a balanced binary search tree in C++.',
        'code',
        'cpp',
        '#include <iostream>\n#include <vector>\nusing namespace std;\n\nstruct TreeNode {\n    int val;\n    TreeNode *left;\n    TreeNode *right;\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n};\n\nvoid inorder(TreeNode* root, vector<int>& res) {\n    if (!root) return;\n    inorder(root->left, res);\n    res.push_back(root->val);\n    inorder(root->right, res);\n}',
        3,
        180,
        90.0,
        't0000000-0000-0000-0000-000000000001',
        'active',
        true,
        'hard'
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'Technical Standard: Operating System Kernel Primitives',
        'Assess fundamental typing cadence through real technical documentation on microkernels and synchronization.',
        'standard',
        'none',
        'Operating system kernels manage hardware resources and provide a standardized execution abstraction for user processes. Modern microkernel architectures separate address spaces into distinct protection domains, communicating through efficient message passing IPC channels rather than monolithic trap gates.',
        2,
        120,
        90.0,
        't0000000-0000-0000-0000-000000000001',
        'active',
        true,
        'medium'
    )
ON CONFLICT DO NOTHING;

-- 9. Assign Tests to CSE Alpha Cohort
INSERT INTO test_assignments (test_id, class_id, created_by)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
