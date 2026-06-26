import { apiClient } from '@/src/lib/apiClient';

export async function processAiCommand(input: string, context?: unknown): Promise<string> {
    try {
        const response = await apiClient.post<{response: string}>('/ai/dashboard-assist', {
           message: input,
           context
        });
        return response.response || "Komanda je obrađena.";
    } catch (err) {
        console.error("AI Error:", err);
        return "Došlo je do greške prilikom obrade, proverite konekciju ili ključeve.";
    }
}

export async function generateAdData(description: string, category: string): Promise<Record<string, any>> {
    try {
        const data = await apiClient.post<Record<string, any>>('/ai/generate-ad', {
            description,
            category
        });
        return data;
    } catch (err) {
        console.error("AI generate-ad error:", err);
        return { opis: description };
    }
}
