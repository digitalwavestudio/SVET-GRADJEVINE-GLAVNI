import { Job } from "@svet-gradjevine/shared";
import { ImageTransformer } from "../utils/image.transformer.ts";

export interface MobileJobResponse {
  id: string;
  title: string;
  comp: string;
  loc: string;
  sal?: string;
  salary?: string;
  logo?: string;
  isUrgent?: boolean;
  benefits?: string[];
}

export interface RawJobInput {
  id?: string;
  title?: string;
  comp?: string;
  loc?: string;
  location?: string;
  sal?: string | number | null;
  salary?: string | number | null;
  logo?: string;
  isUrgent?: boolean;
  photoURL?: string;
  coverImage?: string;
  images?: string[];
  benefits?: string[];
  [key: string]: unknown;
}

export class JobTransformer {
  static toMobile(job: RawJobInput): MobileJobResponse {
    return {
      id: job.id || "",
      title: job.title || "",
      comp: job.comp || "",
      loc: job.loc || job.location || "",
      sal: job.sal?.toString() || job.salary?.toString() || "",
      salary: job.salary?.toString() || job.sal?.toString() || "",
      logo: ImageTransformer.getOptimizedUrl(job.logo, "200x200"),
      isUrgent: job.isUrgent,
      benefits: Array.isArray(job.benefits) ? job.benefits : [],
    };
  }

  static toWeb<T extends object>(job: T): T {
    // Web might want full data or slightly transformed
    const logo = "logo" in job && typeof (job as Record<string, unknown>).logo === "string" ? (job as Record<string, unknown>).logo as string : undefined;
    const photoURL = "photoURL" in job && typeof (job as Record<string, unknown>).photoURL === "string" ? (job as Record<string, unknown>).photoURL as string : undefined;
    const coverImage = "coverImage" in job && typeof (job as Record<string, unknown>).coverImage === "string" ? (job as Record<string, unknown>).coverImage as string : undefined;
    const images = "images" in job && Array.isArray((job as Record<string, unknown>).images) ? (job as Record<string, unknown>).images as string[] : undefined;

    return {
      ...job,
      ...(logo && { logo: ImageTransformer.getOptimizedUrl(logo, "400x400") }),
      ...(photoURL && { photoURL: ImageTransformer.getOptimizedUrl(photoURL, "400x400") }),
      ...(coverImage && { coverImage: ImageTransformer.getOptimizedUrl(coverImage, "800x600") }),
      ...(images && { images: ImageTransformer.optimizeArray(images, "800x600") }),
    } as unknown as T;
  }
}
