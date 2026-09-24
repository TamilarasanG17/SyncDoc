import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const client = axios.create({
  baseURL: `${API_URL}/api/auth`,
});

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/register', {
    name,
    email,
    password,
  });

  return data;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/login', {
    email,
    password,
  });

  return data;
}