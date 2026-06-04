import { describe, it, expect } from "vitest";
import { z } from "zod";

// Define the Job Contract (Schema)
const JobSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  opis: z.string(),
  comp: z.string(),
  loc: z.string(),
  status: z.enum(["active", "pending", "expired", "archived"]),
  createdAt: z.any().optional(), // Firebase Timestamp or Date
});

const UserProfileSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  role: z.enum(["majstor", "poslodavac", "admin"]),
  isVerified: z.boolean(),
});

describe("API Contract Tests", () => {
  it("Job object should match the intended contract", () => {
    const mockJob = {
      id: "job_123",
      title: "Zidar / Tesar",
      opis: "Potreban iskusan zidar...",
      comp: "Bau d.o.o.",
      loc: "Beograd",
      status: "active",
    };

    const result = JobSchema.safeParse(mockJob);
    expect(result.success).toBe(true);
  });

  it("User profile should match the intended contract", () => {
    const mockUser = {
      uid: "user_456",
      displayName: "Marko Marković",
      role: "majstor",
      isVerified: true,
    };

    const result = UserProfileSchema.safeParse(mockUser);
    expect(result.success).toBe(true);
  });
});
