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
  benefiti?: string[];
  rawBenefits?: string[];
  plataMin?: number;
  plataMax?: number;
  salaryType?: string;
  smestaj?: boolean;
  prevoz?: boolean;
  hrana?: boolean;
  housing?: boolean;
  transport?: boolean;
  food?: boolean;
  topliObrok?: boolean;
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
      benefiti: Array.isArray(job.benefiti) ? (job.benefiti as string[]) : undefined,
      rawBenefits: Array.isArray(job.rawBenefits) ? (job.rawBenefits as string[]) : undefined,
      plataMin: typeof job.plataMin === 'number' ? job.plataMin : (typeof job.plataMin === 'string' && !isNaN(Number(job.plataMin)) ? Number(job.plataMin) : undefined),
      plataMax: typeof job.plataMax === 'number' ? job.plataMax : (typeof job.plataMax === 'string' && !isNaN(Number(job.plataMax)) ? Number(job.plataMax) : undefined),
      salaryType: typeof job.salaryType === 'string' ? job.salaryType : undefined,
      smestaj: typeof job.smestaj === 'boolean' ? job.smestaj : undefined,
      prevoz: typeof job.prevoz === 'boolean' ? job.prevoz : undefined,
      hrana: typeof job.hrana === 'boolean' ? job.hrana : undefined,
      housing: typeof job.housing === 'boolean' ? job.housing : undefined,
      transport: typeof job.transport === 'boolean' ? job.transport : undefined,
      food: typeof job.food === 'boolean' ? job.food : undefined,
      topliObrok: typeof job.topliObrok === 'boolean' ? job.topliObrok : undefined,
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
