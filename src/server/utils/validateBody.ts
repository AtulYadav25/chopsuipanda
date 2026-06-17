import z from "zod";

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T; error: null } | { success: false; data: null; error: string } {
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        return {
            success: false,
            data: null,
            error: parsed.error.issues.map((i) => i.message).join(", ")
        };
    }

    return {
        success: true,
        data: parsed.data as T,
        error: null
    };
}