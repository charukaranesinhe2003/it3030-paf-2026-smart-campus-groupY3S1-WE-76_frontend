const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

export async function fetchHealth(): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/`);
  } catch (err) {
    throw new Error(
      `Network error while fetching health endpoint: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (!response.ok) {
    throw new Error(
      `Health endpoint returned non-OK status: ${response.status} ${response.statusText}`
    );
  }
  return response.text();
}

export async function fetchHello(name?: string): Promise<string> {
  const url =
    name && name.length > 0
      ? `${API_BASE_URL}/hello?name=${encodeURIComponent(name)}`
      : `${API_BASE_URL}/hello`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(
      `Network error while fetching hello endpoint: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (!response.ok) {
    throw new Error(
      `Hello endpoint returned non-OK status: ${response.status} ${response.statusText}`
    );
  }
  return response.text();
}
