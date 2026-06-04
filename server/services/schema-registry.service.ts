import { EventSchemas } from "@svet-gradjevine/shared";

export class SchemaRegistry {
  static validate(
    type: string,
    payload: any,
    version: number = 1,
  ): { success: boolean; error?: string } {
    const eventVersions = (EventSchemas as any)[type];
    if (!eventVersions) {
      return { success: true };
    }

    const schema = eventVersions[`v${version}`];
    if (!schema) {
      return {
        success: false,
        error: `Version v${version} not found for event ${type}`,
      };
    }

    const result = schema.safeParse(payload);
    if (!result.success) {
      return {
        success: false,
        error: result.error.errors
          .map((e: any) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      };
    }

    return { success: true };
  }
}
