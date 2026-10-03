/**
 * Whiteboard Sync Service
 * Real-time two-way synchronization between Teacher Control Dashboard and Student Whiteboard Display
 * Uses BroadcastChannel with localStorage fallback for zero-latency cross-tab / dual-screen communication.
 */

export interface WhiteboardSyncMessage {
  type:
    | 'SELECT_DRAWING'
    | 'START_SESSION'
    | 'FINISH_SESSION'
    | 'CLEAR_BOARD'
    | 'SET_GUIDE_COLOR'
    | 'SET_BRUSH_SIZE'
    | 'SET_SENSITIVITY'
    | 'STUDENT_PROGRESS'
    | 'REQUEST_STATE'
    | 'SYNC_STATE';
  payload?: any;
}

const STORAGE_KEY = 'baseera_whiteboard_state';
const CHANNEL_NAME = 'baseera_smartboard_channel';

class WhiteboardSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: WhiteboardSyncMessage) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }

    // Storage event fallback for cross-window events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'baseera_whiteboard_msg' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notifyListeners(parsed);
          } catch {
            // Ignore
          }
        }
      });
    }
  }

  public subscribe(callback: (msg: WhiteboardSyncMessage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(msg: WhiteboardSyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in whiteboard listener:', err);
      }
    });
  }

  public send(msg: WhiteboardSyncMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {
        // Fallback
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'baseera_whiteboard_msg',
          JSON.stringify({ ...msg, _t: Date.now() })
        );
      } catch {
        // Ignore
      }
    }
  }

  public saveLatestDrawingId(id: string) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('baseera_active_whiteboard_drawing', id);
      } catch {
        // Ignore
      }
    }
  }

  public getLatestDrawingId(): string | null {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('baseera_active_whiteboard_drawing');
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const whiteboardSyncService = new WhiteboardSyncService();
