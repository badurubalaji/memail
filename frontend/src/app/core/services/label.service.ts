import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Label {
  id: number;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageLabel {
  id: number;
  userId: string;
  messageUid: string;
  folder: string;
  label: Label;
  createdAt: string;
}

export interface LabelResponse {
  labels: Label[];
  total: number;
}

export interface MessageLabelResponse {
  messageLabels: MessageLabel[];
  total: number;
}

export interface LabelCreateRequest {
  name: string;
  color: string;
}

export interface LabelUpdateRequest {
  name: string;
  color: string;
}

export interface BatchLabelRequest {
  messageUids: string[];
  folder: string;
  labelIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class LabelService {

  constructor(private http: HttpClient) {}

  /**
   * Get all labels for the current user
   */
  getLabels(): Observable<LabelResponse> {
    return this.http.get<LabelResponse>(`${environment.apiUrl}/labels`)
      .pipe(
        catchError(error => {
          console.error('Error fetching labels:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a specific label by ID
   */
  getLabel(id: number): Observable<{ label: Label }> {
    return this.http.get<{ label: Label }>(`${environment.apiUrl}/labels/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching label:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new label
   */
  createLabel(request: LabelCreateRequest): Observable<{ message: string; label: Label }> {
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('color', request.color);

    return this.http.post<{ message: string; label: Label }>(`${environment.apiUrl}/labels`, formData)
      .pipe(
        catchError(error => {
          console.error('Error creating label:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing label
   */
  updateLabel(id: number, request: LabelUpdateRequest): Observable<{ message: string; label: Label }> {
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('color', request.color);

    return this.http.put<{ message: string; label: Label }>(`${environment.apiUrl}/labels/${id}`, formData)
      .pipe(
        catchError(error => {
          console.error('Error updating label:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete a label
   */
  deleteLabel(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/labels/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting label:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all messages with a specific label
   */
  getMessagesWithLabel(labelId: number): Observable<MessageLabelResponse> {
    return this.http.get<MessageLabelResponse>(`${environment.apiUrl}/labels/${labelId}/messages`)
      .pipe(
        catchError(error => {
          console.error('Error fetching messages with label:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Apply a label to a message
   */
  applyLabelToMessage(labelId: number, messageUid: string, folder: string): Observable<{ message: string; messageLabel: MessageLabel }> {
    const formData = new FormData();
    formData.append('messageUid', messageUid);
    formData.append('folder', folder);

    return this.http.post<{ message: string; messageLabel: MessageLabel }>(`${environment.apiUrl}/labels/${labelId}/messages`, formData)
      .pipe(
        catchError(error => {
          console.error('Error applying label to message:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Remove a label from a message
   */
  removeLabelFromMessage(labelId: number, messageUid: string, folder: string): Observable<{ message: string }> {
    const params = new HttpParams()
      .set('messageUid', messageUid)
      .set('folder', folder);

    return this.http.delete<{ message: string }>(`${environment.apiUrl}/labels/${labelId}/messages`, { params })
      .pipe(
        catchError(error => {
          console.error('Error removing label from message:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all labels applied to a specific message
   */
  getMessageLabels(messageUid: string, folder: string): Observable<MessageLabelResponse> {
    const params = new HttpParams().set('folder', folder);

    return this.http.get<MessageLabelResponse>(`${environment.apiUrl}/labels/messages/${messageUid}`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching message labels:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Apply labels to multiple messages in batch
   */
  applyLabelsToMessages(request: BatchLabelRequest): Observable<{ message: string; processedMessages: number; appliedLabels: number }> {
    const formData = new FormData();
    request.messageUids.forEach(uid => formData.append('messageUids', uid));
    formData.append('folder', request.folder);
    request.labelIds.forEach(id => formData.append('labelIds', id.toString()));

    return this.http.post<{ message: string; processedMessages: number; appliedLabels: number }>(`${environment.apiUrl}/labels/batch/apply`, formData)
      .pipe(
        catchError(error => {
          console.error('Error applying labels to messages:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Remove labels from multiple messages in batch
   */
  removeLabelsFromMessages(request: BatchLabelRequest): Observable<{ message: string; processedMessages: number; removedLabels: number }> {
    const formData = new FormData();
    request.messageUids.forEach(uid => formData.append('messageUids', uid));
    formData.append('folder', request.folder);
    request.labelIds.forEach(id => formData.append('labelIds', id.toString()));

    return this.http.post<{ message: string; processedMessages: number; removedLabels: number }>(`${environment.apiUrl}/labels/batch/remove`, formData)
      .pipe(
        catchError(error => {
          console.error('Error removing labels from messages:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get message UIDs for a specific label and folder
   */
  getMessageUidsWithLabel(labelId: number, folder: string): Observable<{ messageUids: string[]; total: number }> {
    const params = new HttpParams().set('folder', folder);

    return this.http.get<{ messageUids: string[]; total: number }>(`${environment.apiUrl}/labels/${labelId}/messages/uids`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching message UIDs with label:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get usage count for a specific label
   */
  getLabelUsageCount(labelId: number): Observable<{ labelId: number; usageCount: number }> {
    return this.http.get<{ labelId: number; usageCount: number }>(`${environment.apiUrl}/labels/${labelId}/count`)
      .pipe(
        catchError(error => {
          console.error('Error fetching label usage count:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Apply a single label to multiple messages
   */
  applyLabel(messageUids: string[], labelId: number, folder: string): Observable<{ message: string; processedMessages: number; appliedLabels: number }> {
    const request: BatchLabelRequest = {
      messageUids,
      folder,
      labelIds: [labelId]
    };
    return this.applyLabelsToMessages(request);
  }

  /**
   * Remove a single label from multiple messages
   */
  removeLabel(messageUids: string[], labelId: number, folder: string): Observable<{ message: string; processedMessages: number; removedLabels: number }> {
    const request: BatchLabelRequest = {
      messageUids,
      folder,
      labelIds: [labelId]
    };
    return this.removeLabelsFromMessages(request);
  }
}