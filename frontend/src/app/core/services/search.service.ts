import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  private isSearchingSubject = new BehaviorSubject<boolean>(false);

  searchQuery$ = this.searchQuerySubject.asObservable();
  isSearching$ = this.isSearchingSubject.asObservable();

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
    this.isSearchingSubject.next(!!query);
  }

  clearSearch() {
    this.searchQuerySubject.next('');
    this.isSearchingSubject.next(false);
  }

  getCurrentQuery(): string {
    return this.searchQuerySubject.value;
  }

  getIsSearching(): boolean {
    return this.isSearchingSubject.value;
  }
}