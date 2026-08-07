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
    title_en?: string;
    description: string;
    description_en?: string;
    category: string;
    difficulty: string;
    level: string;
    content?: string;
    content_en?: string;
    imageUrl?: string;
    orderIndex: number;
    learners?: number;
}

export interface LessonQuestion {
    id: number;
    lessonId: string;
    question_vi: string;
    question_en: string;
    orderIndex: number;
    solved?: boolean;
}

export interface LessonComment {
    id: number;
    lessonId: string;
    parentId: number | null;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    imageUrl: string | null;
    timestamp: number;
    replies?: LessonComment[];
}

export interface PaginatedComments {
    items: LessonComment[];
    hasMore: boolean;
    total: number;
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
    if (!res.ok) {
        let msg = 'Failed to update progress';
        try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return res.json();
};

export const fetchLessonQuestions = async (id: string): Promise<LessonQuestion[]> => {
    const res = await fetch(`/api/lessons/${id}/questions`, { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
};

export const checkLessonAnswer = async (id: string, questionId: number, answer: string) => {
    const res = await fetch(`/api/lessons/${id}/questions/${questionId}/check`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({ answer }),
    });
    if (!res.ok) throw new Error('Failed to check answer');
    return res.json();
};

export const fetchLessonComments = async (id: string, offset = 0, limit = 10): Promise<PaginatedComments> => {
    const res = await fetch(`/api/lessons/${id}/comments?offset=${offset}&limit=${limit}`, { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
};

export const postLessonComment = async (id: string, payload: { content: string; parentId?: number | null; imageUrl?: string | null }) => {
    const res = await fetch(`/api/lessons/${id}/comments`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        let msg = 'Failed to post comment';
        try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return res.json();
};

export interface LearningPath {
    id: string;
    title: string;
    title_en?: string;
    description: string;
    description_en?: string;
    jobTitle: string;
    jobTitle_en?: string;
    type: 'RED' | 'BLUE' | 'PEN' | 'PURPLE';
    status?: 'updating' | 'final' | 'coming_soon';
    imageUrl?: string;
    icon?: string;
    orderIndex: number;
    lessonCount?: number;
    joined?: boolean;
    joinedCount?: number;
    nextLessonId?: string | null;
    nextLessonTitle?: string | null;
    nextLessonTitle_en?: string | null;
    lessons?: PathLessonDetail[];
}

export interface LessonPathContext {
    inPath: boolean;
    pathId?: string;
    pathTitle?: string;
    pathTitle_en?: string;
    currentLessonCompleted?: boolean;
    lessonIndex?: number;
    totalLessons?: number;
    nextLessonId?: string | null;
    nextLessonTitle?: string | null;
    nextLessonTitle_en?: string | null;
}

export interface PathLessonDetail {
    lessonId: string;
    orderIndex: number;
    title: string;
    title_en?: string;
    description: string;
    description_en?: string;
    category: string;
    difficulty: string;
    level: string;
    imageUrl?: string;
    status?: 'not_started' | 'reading' | 'completed';
}

export const fetchPaths = async (): Promise<LearningPath[]> => {
    const res = await fetch('/api/paths', { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch paths');
    return res.json();
};

export const fetchPath = async (id: string): Promise<LearningPath> => {
    const res = await fetch(`/api/paths/${id}`, { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch path');
    return res.json();
};

export const joinPath = async (id: string): Promise<{ success: boolean; joined: boolean }> => {
    const res = await fetch(`/api/paths/${id}/join`, { ...fetchOptions, method: 'POST' });
    if (!res.ok) {
        let msg = 'Failed to join path';
        let code = '';
        try { const data = await res.json(); if (data?.message) msg = data.message; if (data?.code) code = data.code; } catch {}
        const err: any = new Error(msg);
        err.status = res.status;
        err.code = code;
        throw err;
    }
    return res.json();
};

export const leavePath = async (id: string): Promise<{ success: boolean; joined: boolean }> => {
    const res = await fetch(`/api/paths/${id}/join`, { ...fetchOptions, method: 'DELETE' });
    if (!res.ok) {
        let msg = 'Failed to leave path';
        try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return res.json();
};

export const fetchLessonPathContext = async (lessonId: string): Promise<LessonPathContext> => {
    const res = await fetch(`/api/paths/lesson-context/${lessonId}`, { ...fetchOptions, method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch path context');
    return res.json();
};

export const uploadLessonCommentImage = async (id: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`/api/lessons/${id}/comments/upload`, {
        credentials: 'include',
        method: 'POST',
        body: fd,
    });
    if (!res.ok) {
        let msg = 'Failed to upload image';
        try { const data = await res.json(); if (data?.message) msg = data.message; } catch {}
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return res.json();
};
