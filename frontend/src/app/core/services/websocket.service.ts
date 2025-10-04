import { Injectable } from '@angular/core';
import { Client, StompConfig } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private userEmail: string | null = null;
  private notificationsSubject = new BehaviorSubject<EmailNotification | null>(null);
  private connectionAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    this.stompClient = new Client({
      brokerURL: '', // Will be set in connect()
      connectHeaders: {},
      debug: (str: string) => {
        console.log('STOMP Debug: ', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log('✅ WebSocket STOMP connected successfully');
        this.connected = true;
        this.connectionAttempts = 0;
        this.subscribeToNotifications();
      },
      onDisconnect: () => {
        console.log('⚠️ WebSocket disconnected');
        this.connected = false;
      },
      onStompError: (frame) => {
        console.error('❌ STOMP Error: ', frame);
        this.connected = false;
        this.attemptReconnect();
      },
      onWebSocketClose: () => {
        console.log('⚠️ WebSocket connection closed');
        this.connected = false;
        this.attemptReconnect();
      }
    });
  }

  connect(userEmail: string): void {
    this.userEmail = userEmail;
    if (!this.connected && !this.stompClient.active) {
      console.log(`🔌 Connecting WebSocket for user: ${userEmail}`);

      // Use SockJS endpoint URL (Spring Boot will handle the protocol upgrade)
      this.stompClient.brokerURL = `ws://localhost:8585/api/ws`;

      this.stompClient.connectHeaders = {
        'user': userEmail
      };
      this.stompClient.activate();
    } else {
      console.log('WebSocket already connected or connecting');
    }
  }

  disconnect(): void {
    if (this.connected || this.stompClient.active) {
      this.stompClient.deactivate();
      this.connected = false;
      this.userEmail = null;
    }
  }

  private attemptReconnect(): void {
    if (this.userEmail && this.connectionAttempts < this.maxReconnectAttempts) {
      this.connectionAttempts++;
      console.log(`Attempting to reconnect (${this.connectionAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        if (!this.connected && this.userEmail) {
          this.connect(this.userEmail);
        }
      }, 5000);
    }
  }

  private subscribeToNotifications(): void {
    if (!this.userEmail) {
      console.error('Cannot subscribe: userEmail is null');
      return;
    }

    console.log(`📬 Subscribing to notifications for user: ${this.userEmail}`);
    this.stompClient.subscribe('/user/queue/notifications', (message) => {
      const notification: EmailNotification = JSON.parse(message.body);
      console.log('📧 Received notification:', notification);
      this.notificationsSubject.next(notification);
    });
    console.log('✅ Successfully subscribed to /user/queue/notifications');
  }

  getNotifications(): Observable<EmailNotification | null> {
    return this.notificationsSubject.asObservable();
  }

  isConnected(): boolean {
    return this.connected;
  }
}