import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./config";

export interface IChatType {
  id: number;
  name: string;
}

export interface IUserShort {
  id: number;
  name: string;
}

export interface ICreateChatRequest {
  name: string;
  chatTypeId: number;
  userIds: number[];
}

const client = axios.create({
  baseURL: API_BASE_URL.replace(/\/+$/, ""),
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const normalize = (x: any): { id: number; name: string } => ({
  id: Number(x.id ?? x.Id),
  name: String(x.name ?? x.Name ?? ""),
});

export async function getChatTypes(): Promise<IChatType[]> {
  const { data } = await client.get<any[]>("/api/Chats/types");
  return data.map(normalize);
}

export async function searchUsers(query: string): Promise<IUserShort[]> {
  const { data } = await client.get<any[]>("/api/Chats/users", {
    params: { Query: query.trim() },
  });
  return data.map(normalize);
}

export async function createChat(request: ICreateChatRequest): Promise<number> {
  const { data } = await client.post<any>("/api/Chats", {
    name: request.name.trim(),
    chatTypeId: request.chatTypeId,
    userIds: request.userIds,
  });
  return Number(typeof data === "object" && data !== null ? (data.id ?? data.chatId) : data);
}

export function isUnauthorized(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

export function getChatApiError(err: unknown): string {
  if (isUnauthorized(err)) return "Сесія завершилась. Увійдіть знову";
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Немає зʼєднання з сервером";
    if (err.response.status === 403) return "Немає доступу до цієї дії";
    const data = err.response.data as any;
    if (typeof data?.error === "string") return data.error;
    if (data?.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors).flat()[0];
      if (typeof first === "string") return first;
    }
    if (typeof data?.title === "string") return data.title;
    if (err.response.status >= 500) return "Помилка сервера. Спробуйте пізніше";
  }
  return "Сталася помилка. Спробуйте ще раз";
}
