
export interface AlertState {
    show: boolean;
    type: 'success' | 'error' | 'warning';
    message: string;
    duration?: number;
    actionLabel?: string;
    actionRoute?: string;
}
