import "server-only";

const apiUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000/api/v1";

export async function getApiReadiness(): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/health/ready`, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === "ok" && data.database === "connected";
  } catch {
    return false;
  }
}
