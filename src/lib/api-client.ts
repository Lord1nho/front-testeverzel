const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export class ApiError extends Error {
  status: number;
  issues?: unknown;

  constructor(message: string, status: number, issues?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
};

function shouldSerializeBody(body: RequestOptions["body"]) {
  return (
    body &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    typeof body !== "string"
  );
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const url = new URL(path, apiBaseUrl);
  const headers = new Headers(options.headers);

  let body: BodyInit | null | undefined;

  if (shouldSerializeBody(options.body)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  } else {
    body = options.body as BodyInit | null | undefined;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      body,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor.", 0);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(
      errorBody?.message ?? `Erro inesperado (${response.status}).`,
      response.status,
      errorBody?.issues,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// Dispara um POST e não espera resposta — usado no cleanup de useEffect
// quando a página está saindo (voltar/avançar do navegador, navegar pra
// outra rota) e ainda dá tempo de avisar o backend. `keepalive` garante
// que o navegador termina de enviar a requisição mesmo com a página
// fechando; erros são propositalmente ignorados (não há UI pra mostrá-los).
function postBeacon(path: string): void {
  const url = new URL(path, apiBaseUrl);
  fetch(url, {
    method: "POST",
    credentials: "include",
    keepalive: true,
  }).catch((error) => {
    console.error(`postBeacon falhou para ${path}:`, error);
  });
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: RequestOptions["body"], options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: RequestOptions["body"], options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: RequestOptions["body"], options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
  postBeacon,
};
