import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;

  constructor() {
    console.log('Connecting to WebSocket...');
    this.socket = io(environment.baseUrl, { transports: ['websocket'] });
    this.socket.on('connect', () =>
      console.log('WebSocket connected:', this.socket.id)
    );
  }

  public listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
    });
  }

  public emit(eventName: string, data: any): void {
    this.socket.emit(eventName, data);
  }
}
