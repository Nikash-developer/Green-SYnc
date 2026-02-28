export interface User {
  id: number;
  email: string;
  role: 'student' | 'faculty' | 'hod' | 'admin';
  name: string;
  department: string;
  avatar?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  subject: string;
  deadline: string;
  max_marks: number;
  faculty_id: number;
  department: string;
  status?: 'pending' | 'in-progress' | 'submitted';
}

export interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  file_url: string;
  submission_date: string;
  grade?: number;
  feedback?: string;
  plagiarism_score: number;
  student_name?: string;
  student_avatar?: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  attachment_url?: string;
  target_department: string;
  publish_date: string;
  expiry_date?: string;
  is_emergency: boolean;
  author_id: number;
  author_name?: string;
  image_url?: string;
}
