import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
});

export interface APODData {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  copyright?: string;
}

export interface Favorite extends APODData {
  id: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  dark_mode: boolean;
  deep_black_mode: boolean;
  notifications_enabled: boolean;
  notification_time: string;
  updated_at: string;
}

// APOD Endpoints
export const getTodayAPOD = async (): Promise<APODData> => {
  const response = await api.get('/apod/today');
  return response.data;
};

export const getAPODByDate = async (date: string): Promise<APODData> => {
  const response = await api.get(`/apod/date/${date}`);
  return response.data;
};

export const getRandomAPOD = async (): Promise<APODData> => {
  const response = await api.get('/apod/random');
  return response.data;
};

// Favorites Endpoints
export const getFavorites = async (): Promise<Favorite[]> => {
  const response = await api.get('/favorites');
  return response.data;
};

export const addFavorite = async (apod: APODData): Promise<Favorite> => {
  const response = await api.post('/favorites', apod);
  return response.data;
};

export const removeFavorite = async (date: string): Promise<void> => {
  await api.delete(`/favorites/${date}`);
};

export const checkFavorite = async (date: string): Promise<boolean> => {
  const response = await api.get(`/favorites/check/${date}`);
  return response.data.is_favorite;
};

// Preferences Endpoints
export const getPreferences = async (): Promise<UserPreferences> => {
  const response = await api.get('/preferences');
  return response.data;
};

export const updatePreferences = async (prefs: Partial<UserPreferences>): Promise<UserPreferences> => {
  const response = await api.put('/preferences', prefs);
  return response.data;
};

export default api;
