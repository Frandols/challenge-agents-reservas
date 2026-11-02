const UNREACHABLE = "No se pudo conectar con la API. Comprobá que `pnpm dev` esté en ejecución.";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError("unreachable", UNREACHABLE);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      body?.error?.code ?? "unreachable",
      body?.error?.message ?? UNREACHABLE,
      body?.error?.details,
    );
  }

  return body;
}

export function apiGet<T>(path: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query).toString();

  return request<T>(params ? `${path}?${params}` : path);
}

export function apiPost<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
