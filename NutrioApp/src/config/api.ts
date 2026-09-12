import { API_BASE_URL as configuredApiBaseUrl, IMAGEKIT_URL_ENDPOINT } from "@env";

export const API_BASE_URL = configuredApiBaseUrl;
export const IMAGEKIT_BASE_URL = IMAGEKIT_URL_ENDPOINT.replace(/\/$/, "");

export async function authRequest<T>(path: string, body: unknown): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.detail || "Request failed.");
	}
	return data as T;
}