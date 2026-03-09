import type { Role, SessionUser } from "@/lib/auth";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  role: Role;
};

type AuthResponse = {
  user: SessionUser;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data.detail === "string" ? data.detail : "Request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<AuthResponse>(response);
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<AuthResponse>(response);
}