import { ConversationThemes } from "../interfaces/conversation-themes.interface";

export const CONVERSATION_THEMES: ConversationThemes[] = [
    { type: 'default', label: 'Mặc định', bg: '#FFFFFF', bubbleMe: '#0ea5e9', bubbleOther: '#f3f4f6', textMe: '#ffffff', textOther: '#111827' },
    { type: 'ocean', label: 'Đại dương', bg: '#e6f7ff', bubbleMe: '#0369a1', bubbleOther: '#dbeffc', textMe: '#ffffff', textOther: '#0f172a' },
    { type: 'sunset', label: 'Hoàng hôn', bg: '#fff7ed', bubbleMe: '#fb923c', bubbleOther: '#ffedd5', textMe: '#ffffff', textOther: '#78350f' },
    { type: 'mint', label: 'Bạc hà', bg: '#f0fdf4', bubbleMe: '#059669', bubbleOther: '#dcfce7', textMe: '#ffffff', textOther: '#064e3b' },
    { type: 'lavender', label: 'Oải hương', bg: '#faf5ff', bubbleMe: '#7c3aed', bubbleOther: '#f3e8ff', textMe: '#ffffff', textOther: '#4c1d95' },
    { type: 'midnight', label: 'Giữa khuya', bg: '#0b1226', bubbleMe: '#0ea5e9', bubbleOther: '#1f2937', textMe: '#ffffff', textOther: '#e6eef8' },
];

export function getThemeByType(type?: string): ConversationThemes {
    const t = (type || 'default').toString();
    const base = CONVERSATION_THEMES.find(x => x.type === t) || CONVERSATION_THEMES[0];
    return { ...base, bubble: base.bubbleMe };
}