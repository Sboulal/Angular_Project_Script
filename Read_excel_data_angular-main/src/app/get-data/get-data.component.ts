import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Interface for User data structure
interface User {
  id?: number;
  nom: string;
  prenom: string;

  valide: string;
  created_at: string;
  updated_at: string;
}

interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-get-data',
  templateUrl: './get-data.component.html',
  styleUrls: ['./get-data.component.scss']
})
export class GetDataComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  selectedUserIndex: number = 0;
  searchTerm: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Pagination properties
  pagination: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  };

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Replace with your actual API endpoint
  private apiUrl = 'https://amfromevent.ma/api/getbadges';

  constructor(private http: HttpClient, public dataService: DataService) {
    // Debounce search input to avoid excessive filtering
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }

  ngOnInit(): void {
    this.fetchUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<User[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = [...this.users];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.errorMessage = 'Erreur lors du chargement des données.';
        this.isLoading = false;
      }
    });
  }

  refreshData(): void {
    this.searchTerm = '';
    this.pagination.currentPage = 1;
    this.fetchUsers();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  private performSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const searchLower = searchTerm.toLowerCase().trim();
      this.filteredUsers = this.users.filter(user => {
        return (
          user.nom.toLowerCase().includes(searchLower) ||
          user.prenom.toLowerCase().includes(searchLower) ||
          (user.id && user.id.toString().includes(searchLower))
        );
      });
    }
    
    // Reset to first page when search changes
    this.pagination.currentPage = 1;
    this.updatePagination();
  }

  private updatePagination(): void {
    this.pagination.totalItems = this.filteredUsers.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);
    
    // Ensure current page is valid
    if (this.pagination.currentPage > this.pagination.totalPages && this.pagination.totalPages > 0) {
      this.pagination.currentPage = this.pagination.totalPages;
    }
    
    this.updatePaginatedUsers();
  }

  private updatePaginatedUsers(): void {
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.updatePaginatedUsers();
    }
  }

  nextPage(): void {
    if (this.pagination.currentPage < this.pagination.totalPages) {
      this.goToPage(this.pagination.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.pagination.currentPage > 1) {
      this.goToPage(this.pagination.currentPage - 1);
    }
  }

  onItemsPerPageChange(event: any): void {
    const itemsPerPage = parseInt(event.target.value, 10);
    this.pagination.itemsPerPage = itemsPerPage;
    this.pagination.currentPage = 1; // Reset to first page
    this.updatePagination();
  }

  // Helper methods for pagination display
  getStartIndex(): number {
    if (this.pagination.totalItems === 0) return 0;
    return (this.pagination.currentPage - 1) * this.pagination.itemsPerPage + 1;
  }

  getEndIndex(): number {
    const end = this.pagination.currentPage * this.pagination.itemsPerPage;
    return Math.min(end, this.pagination.totalItems);
  }

  getActualIndex(paginatedIndex: number): number {
    return (this.pagination.currentPage - 1) * this.pagination.itemsPerPage + paginatedIndex;
  }

  getVisiblePages(): number[] {
    const current = this.pagination.currentPage;
    const total = this.pagination.totalPages;
    const pages: number[] = [];

    if (total <= 5) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show current page ± 2
      const start = Math.max(1, current - 2);
      const end = Math.min(total, current + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getOriginalIndex(user: User): number {
    return this.users.findIndex(u => u === user);
  }

  selectAndSubmitUser(paginatedIndex: number): void {
    // Get the actual user from paginated data
    const user = this.paginatedUsers[paginatedIndex];
    if (user) {
      // Find the original index in the full users array
      this.selectedUserIndex = this.getOriginalIndex(user);
      this.SubmitData();
    }
  }

  SubmitData(): void {
    const selectedUser = this.users[this.selectedUserIndex];
    console.log('Selected User:', selectedUser);
    
    if (selectedUser) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
  
      // Create object with only nom and prenom
      const userData = {
        last_name: selectedUser.nom,
        first_name: selectedUser.prenom
      };
  
      this.dataService.postUser_data(userData).subscribe({
        next: (response) => {
          console.log('Posted user data:', userData);
          console.log('Response:', response);
          this.successMessage = 'Données envoyées avec succès!';
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error posting user:', error);
          this.errorMessage = 'Erreur lors de l\'envoi des données.';
          this.isLoading = false;
        }
      });
    }
  }

  // Getter methods for template
  getPaginatedUsers(): User[] {
    return this.paginatedUsers;
  }

  getFilteredUsers(): User[] {
    return this.filteredUsers;
  }
}