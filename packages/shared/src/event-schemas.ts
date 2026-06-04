import { z } from 'zod';

export const JOB_CREATED_SCHEMA = z.object({
  jobId: z.string(),
  jobData: z.any() // Može se dodatno učvrstiti sa Job šemom
});

export const USER_UPDATED_SCHEMA = z.object({
  userId: z.string()
});

export const APPLICATION_SUBMITTED_SCHEMA = z.object({
  employerId: z.string(),
  jobId: z.string(),
  jobTitle: z.string(),
  applicantName: z.string()
});

export const AD_EVENT_SCHEMA = z.object({
  category: z.string(),
  id: z.string(),
  uid: z.string().optional()
});

export const USER_VERIFIED_SCHEMA = z.object({
  userId: z.string(),
  isVerified: z.boolean()
});

export const EventSchemas = {
  JOB_CREATED: {
    v1: JOB_CREATED_SCHEMA
  },
  JOB_UPDATED: {
    v1: JOB_CREATED_SCHEMA
  },
  USER_UPDATED: {
    v1: USER_UPDATED_SCHEMA
  },
  USER_VERIFIED: {
    v1: USER_VERIFIED_SCHEMA
  },
  APPLICATION_SUBMITTED: {
    v1: APPLICATION_SUBMITTED_SCHEMA
  },
  AD_CREATED: {
    v1: AD_EVENT_SCHEMA
  },
  AD_UPDATED: {
    v1: AD_EVENT_SCHEMA
  },
  AD_DELETED: {
    v1: AD_EVENT_SCHEMA
  }
};

export type DomainEventPayloads = {
  JOB_CREATED: z.infer<typeof JOB_CREATED_SCHEMA>;
  JOB_UPDATED: z.infer<typeof JOB_CREATED_SCHEMA>;
  USER_UPDATED: z.infer<typeof USER_UPDATED_SCHEMA>;
  USER_VERIFIED: z.infer<typeof USER_VERIFIED_SCHEMA>;
  APPLICATION_SUBMITTED: z.infer<typeof APPLICATION_SUBMITTED_SCHEMA>;
  AD_CREATED: z.infer<typeof AD_EVENT_SCHEMA>;
  AD_UPDATED: z.infer<typeof AD_EVENT_SCHEMA>;
  AD_DELETED: z.infer<typeof AD_EVENT_SCHEMA>;
};
