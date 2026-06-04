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
