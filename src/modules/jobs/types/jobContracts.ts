export interface JobApplicationContract {
  jobId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  resumeUrl?: string;
  coverLetter?: string;
  jobTitle?: string;
  employerId?: string;
  applicantData?: {
    role?: string;
    city?: string;
    profileImage?: string;
    skillsSummary?: string;
    profileScore?: number;
  };
  metadata?: {
    browser: string;
    ip_placeholder?: string;
  };
}
