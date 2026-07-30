import { Lab } from '../data/labs';

// Dòng này cực kỳ quan trọng: Ép trình duyệt luôn mang theo Cookie khi gọi API
const fetchOptions = {
    credentials: 'include' as RequestCredentials,
    headers: { 'Content-Type': 'application/json' }
};

export const fetchLabs = async (): Promise<Lab[]> => {
    const res = await fetch('/api/labs', { ...fetchOptions, method: 'GET' });
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

export const fetchLessons = async (params?: { category?: string; difficulty?: string; level?: string }): Promise<Lesson[]> => {
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
