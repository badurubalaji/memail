import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmailNotification {
  type: 'NEW_EMAIL' | 'EMAIL_READ' | 'EMAIL_DELETED';
  messageId: string;
  from?: string;
  subject?: string;
  folder?: string;
  preview?: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client;
  private connected = false;
  private notificationsSubject = new BehaviorSubject<EmailNotification | null>(null);

  constructor() {
    this.stompClient = new Client({
      brokerURL: `ws://localhost:8585/api/ws`,
      connectHeaders: {},
      debug: (str: string) => {
        console.log('STOMP Debug: ', str);
      },
      onConnect: () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.subscribeToNotifications();
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        this.connected = false;
      },
      onStompError: (frame) => {
        console.error('STOMP Error: ', frame);
      }
    });
  }

  connect(userEmail: string): void {
    if (!this.connected) {
      this.stompClient.connectHeaders = {
        'user': userEmail
      };
      this.stompClient.activate();
    }
  }

  disconnect(): void {
    if (this.connected) {
      this.stompClient.deactivate();
    }
  }

  private subscribeToNotifications(): void {
    this.stompClient.subscribe('/user/queue/notifications', (message) => {
      const notification: EmailNotification = JSON.parse(message.body);
      console.log('Received notification:', notification);
      this.notificationsSubject.next(notification);
    });
  }

  getNotifications(): Observable<EmailNotification | null> {
    return this.notificationsSubject.asObservable();
  }

  isConnected(): boolean {
    return this.connected;
  }
}