import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface OptimisticUpdate {
  id: string;
  action: string;
  data: any;
  originalData?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OptimisticUpdateService {
  private pendingUpdates = new Map<string, OptimisticUpdate>();
  private updateSubject = new BehaviorSubject<OptimisticUpdate[]>([]);

  public pendingUpdates$ = this.updateSubject.asObservable();

  constructor(private snackBar: MatSnackBar) {}

  performOptimisticUpdate<T>(
    updateId: string,
    action: string,
    optimisticData: any,
    originalData: any,
    apiCall: Observable<T>
  ): Observable<T> {
    // Store the optimistic update
    const update: OptimisticUpdate = {
      id: updateId,
      action,
      data: optimisticData,
      originalData,
      timestamp: Date.now()
    };

    this.addPendingUpdate(update);

    // Perform the API call
    return apiCall.pipe(
      tap(() => {
        // Success: remove from pending updates
        this.removePendingUpdate(updateId);
      }),
      catchError((error) => {
        // Failure: revert the optimistic update and show error
        this.revertOptimisticUpdate(updateId);
        this.showErrorMessage(action, error);
        return throwError(error);
      })
    );
  }

  addPendingUpdate(update: OptimisticUpdate): void {
    this.pendingUpdates.set(update.id, update);
    this.updateSubject.next(Array.from(this.pendingUpdates.values()));
  }

  removePendingUpdate(updateId: string): void {
    this.pendingUpdates.delete(updateId);
    this.updateSubject.next(Array.from(this.pendingUpdates.values()));
  }

  revertOptimisticUpdate(updateId: string): void {
    const update = this.pendingUpdates.get(updateId);
    if (update) {
      // Emit revert event if needed
      this.removePendingUpdate(updateId);
    }
  }

  isPending(updateId: string): boolean {
    return this.pendingUpdates.has(updateId);
  }

  getPendingUpdate(updateId: string): OptimisticUpdate | undefined {
    return this.pendingUpdates.get(updateId);
  }

  private showErrorMessage(action: string, error: any): void {
    let message = `Failed to ${action.toLowerCase()}`;

    if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      message = error.message;
    }

    this.snackBar.open(message, 'Retry', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Utility methods for common email actions
  markAsRead(messageIds: string[], apiCall: Observable<any>): Observable<any> {
    const updateId = `mark-read-${messageIds.join(',')}`;
    return this.performOptimisticUpdate(
      updateId,
      'Mark as read',
      { messageIds, read: true },
      { messageIds, read: false },
      apiCall
    );
  }

  markAsUnread(messageIds: string[], apiCall: Observable<any>): Observable<any> {
    const updateId = `mark-unread-${messageIds.join(',')}`;
    return this.performOptimisticUpdate(
      updateId,
      'Mark as unread',
      { messageIds, read: false },
      { messageIds, read: true },
      apiCall
    );
  }

  deleteMessages(messageIds: string[], apiCall: Observable<any>): Observable<any> {
    const updateId = `delete-${messageIds.join(',')}`;
    return this.performOptimisticUpdate(
      updateId,
      'Delete messages',
      { messageIds, deleted: true },
      { messageIds, deleted: false },
      apiCall
    );
  }

  starMessages(messageIds: string[], starred: boolean, apiCall: Observable<any>): Observable<any> {
    const updateId = `star-${messageIds.join(',')}-${starred}`;
    return this.performOptimisticUpdate(
      updateId,
      starred ? 'Star messages' : 'Unstar messages',
      { messageIds, starred },
      { messageIds, starred: !starred },
      apiCall
    );
  }

  moveToFolder(messageIds: string[], folder: string, apiCall: Observable<any>): Observable<any> {
    const updateId = `move-${messageIds.join(',')}-${folder}`;
    return this.performOptimisticUpdate(
      updateId,
      `Move to ${folder}`,
      { messageIds, folder },
      { messageIds, folder: 'INBOX' }, // assuming original folder
      apiCall
    );
  }
}