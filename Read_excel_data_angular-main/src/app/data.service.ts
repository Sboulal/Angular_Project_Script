import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private usersSubject = new BehaviorSubject<any[]>([]);
  public users$ = this.usersSubject.asObservable();
  
  // Pagination properties
  private paginationSubject = new BehaviorSubject<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });
  public pagination$ = this.paginationSubject.asObservable();

  constructor(private http: HttpClient) {}

  setUsers(users: any[]) {
    this.usersSubject.next(users);
    this.updatePagination(users.length);
  }

  getUsers() {
    return this.usersSubject.value;
  }

  // Get paginated users
  getPaginatedUsers(): any[] {
    const pagination = this.paginationSubject.value;
    const users = this.usersSubject.value;
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return users.slice(startIndex, endIndex);
  }

  // Update pagination configuration
  private updatePagination(totalItems: number) {
    const currentPagination = this.paginationSubject.value;
    const totalPages = Math.ceil(totalItems / currentPagination.itemsPerPage);
    
    this.paginationSubject.next({
      ...currentPagination,
      totalItems,
      totalPages
    });
  }

  // Set items per page
  setItemsPerPage(itemsPerPage: number) {
    const currentPagination = this.paginationSubject.value;
    this.paginationSubject.next({
      ...currentPagination,
      itemsPerPage,
      currentPage: 1, // Reset to first page
      totalPages: Math.ceil(currentPagination.totalItems / itemsPerPage)
    });
  }

  // Navigate to specific page
  goToPage(page: number) {
    const currentPagination = this.paginationSubject.value;
    if (page >= 1 && page <= currentPagination.totalPages) {
      this.paginationSubject.next({
        ...currentPagination,
        currentPage: page
      });
    }
  }

  // Navigate to next page
  nextPage() {
    const currentPagination = this.paginationSubject.value;
    if (currentPagination.currentPage < currentPagination.totalPages) {
      this.goToPage(currentPagination.currentPage + 1);
    }
  }

  // Navigate to previous page
  previousPage() {
    const currentPagination = this.paginationSubject.value;
    if (currentPagination.currentPage > 1) {
      this.goToPage(currentPagination.currentPage - 1);
    }
  }

  // Get current pagination state
  getPagination(): PaginationConfig {
    return this.paginationSubject.value;
  }

  // Set pagination manually (for component-level pagination control)
  setPaginationManually(pagination: PaginationConfig) {
    this.paginationSubject.next(pagination);
  }

  // Updated postUser method using forkJoin to call multiple APIs in parallel
  postUser(user: any): Observable<any[]> {
    const firstAPI$ = this.http.post('https://jsonplaceholder.typicode.com/todos/', user);
    const secondAPI$ = this.http.post('https://jsonplaceholder.typicode.com/todos/', user); // Replace with your actual second endpoint
    
    return forkJoin([firstAPI$, secondAPI$])
      .pipe(
        catchError(this.handleError)
      );
  }

  postUser_data(user: any): Observable<any[]> {
    const firstAPI$ = this.http.post('https://jsonplaceholder.typicode.com/todos/', user);
    const secondAPI$ = this.http.post('https://jsonplaceholder.typicode.com/todos/', user); // Replace with your actual second endpoint
    
    return forkJoin([firstAPI$, secondAPI$])
      .pipe(
        catchError(this.handleError)
      );
  }
  
  // postUserinput(user: any): Observable<any[]> {
  //   const firstAPI$ = this.http.post('http://127.0.0.1:5000/print-label', user);
  //   const secondAPI$ = this.http.post('https://badges.spherebleue.com/badge', user); // Replace with your actual second endpoint
    
  //   return forkJoin([firstAPI$, secondAPI$])
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }

  postUserinput(user: any): Observable<any[]> {
    // First API receives only nom and prenom
    const firstAPIData = {
      nom: user.nom,
      prenom: user.prenom
    };
    
    // Second API receives nom, prenom, and email
    const secondAPIData = {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email
    };
    
    const firstAPI$ = this.http.post('https://jsonplaceholder.typicode.com/todos/', firstAPIData);
    const secondAPI$ = this.http.post('https://jsonplaceholder.typicode.com/todos/', secondAPIData);
    
    return forkJoin([firstAPI$, secondAPI$])
      .pipe(
        catchError(this.handleError)
      );
  }
  // Error handling method

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.message || 'Server Error'));
  }
}