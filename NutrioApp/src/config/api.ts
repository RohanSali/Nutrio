import { API_BASE_URL as configuredApiBaseUrl, IMAGEKIT_URL_ENDPOINT } from "@env";

export const API_BASE_URL = configuredApiBaseUrl;
export const IMAGEKIT_BASE_URL = IMAGEKIT_URL_ENDPOINT.replace(/\/$/, "");