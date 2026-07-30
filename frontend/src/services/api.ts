import { Lab } from '../data/labs';

const fetchOptions = {
    credentials: 'include' as RequestCredentials,
    headers: { 'Content-Type': 'application/json' }
};

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface LabWithStatus extends Lab {
  status: 'solved' | 'unsolved' | 'in-progress';
}

export const fetchLabs = async (page?: number, limit = 12): Promise<LabWithStatus[] | PaginatedResponse<LabWithStatus>> => {
    const query = page ? `?page=${page}&limit=${limit}` : '';
    const res = await fetch(`/api/labs${query}`, { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch labs');
    return res.json();
};

export const fetchLab = async (id: string): Promise<Lab> => {
    const res = await fetch(`/api/labs/${id}`, { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch lab');
    return res.json();
};

export const submitFlag = async (id: string, flag: string) => {
    const res = await fetch(`/api/labs/${id}/submit`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({ flag }),
    });
    if (!res.ok) throw new Error('Failed to submit flag');
    return res.json();
};

export const fetchProfile = async () => {
    const res = await fetch('/api/profile', { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
};

export const fetchStats = async () => {
    const res = await fetch('/api/stats', { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
};

export const loginWithGoogle = async (token: string) => {
    const res = await fetch('/api/auth/verify', {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
};

export const logout = async () => {
    const res = await fetch('/api/auth/logout', { ...fetchOptions, method: 'POST' });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
};

export interface Lesson {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    level: string;
    content?: string;
    imageUrl?: string;
    orderIndex: number;
}

export const fetchLessons = async (params?: { category?: string; difficulty?: string; level?: string; page?: number; limit?: number }): Promise<Lesson[] | PaginatedResponse<Lesson>> => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const res = await fetch(`/api/lessons${query}`, { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch lessons');
    return res.json();
};

export const fetchLesson = async (id: string): Promise<Lesson> => {
    const res = await fetch(`/api/lessons/${id}`, { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch lesson');
    return res.json();
};

export const fetchLessonProgress = async (): Promise<Record<string, string>> => {
    const res = await fetch('/api/lessons/progress/mine', { ...fetchOptions, method: 'GET' });
    if (!res.ok) return {};
    return res.json();
};

export const updateLessonProgress = async (id: string, status: 'reading' | 'completed') => {
    const res = await fetch(`/api/lessons/${id}/progress`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update progress');
    return res.json();
};
