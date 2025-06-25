import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService, PaginationConfig } from '../data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-table-display',
  templateUrl: './table-display.component.html',
  styleUrls: ['./table-display.component.scss']
})
export class TableDisplayComponent implements OnInit, OnDestroy {
  users: any[] = [];
  filteredUsers: any[] = [];
  paginatedUsers: any[] = [];
  nonEmptyColumns: string[] = [];
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  selectedUserIndex: number = 0;

  // Pagination properties
  pagination: PaginationConfig = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  };

  private destroy$ = new Subject<void>();

  constructor(public dataService: DataService, private router: Router) {}

  ngOnInit() {
    // Subscribe to users data
    this.dataService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users = users;
        if (this.users.length === 0) {
          this.router.navigate(['/upload']);
        } else {
          this.filterNonEmptyColumns();
          this.updatePaginatedUsers();
        }
      });

    // Subscribe to pagination changes
    this.dataService.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.pagination = pagination;
        this.updatePaginatedUsers();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update paginated users based on filtered data
   */
  private updatePaginatedUsers() {
    if (this.filteredUsers.length > 0) {
      const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
      const endIndex = startIndex + this.pagination.itemsPerPage;
      this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
    } else {
      this.paginatedUsers = [];
    }
  }

  /**
   * Identifie les colonnes qui contiennent au moins une valeur non vide
   */
  private getNonEmptyColumns(): string[] {
    if (this.users.length === 0) return [];

    const allColumns = Object.keys(this.users[0]);
    
    return allColumns.filter(column => {
      return this.users.some(user => {
        const value = user[column];
        return value !== null && 
               value !== undefined && 
               value !== '' && 
               (typeof value === 'string' ? value.trim() !== '' : true);
      });
    });
  }

  /**
   * Filtre les données pour ne garder que les colonnes non vides
   */
  private filterNonEmptyColumns(): void {
    this.nonEmptyColumns = this.getNonEmptyColumns();
    
    this.filteredUsers = this.users.map(user => {
      const filteredUser: any = {};
      this.nonEmptyColumns.forEach(column => {
        filteredUser[column] = user[column];
      });
      return filteredUser;
    });

    // Update pagination after filtering
    this.updatePaginationForFilteredData();
  }

  /**
   * Update pagination configuration for filtered data
   */
  private updatePaginationForFilteredData(): void {
    const totalItems = this.filteredUsers.length;
    const totalPages = Math.ceil(totalItems / this.pagination.itemsPerPage);
    
    this.pagination = {
      ...this.pagination,
      totalItems,
      totalPages,
      currentPage: 1 // Reset to first page when data changes
    };

    // Update the service's pagination state
    this.dataService.setPaginationManually(this.pagination);
  }

  /**
   * Retourne les données paginées (utilisez cette méthode dans le template)
   */
  getPaginatedData(): any[] {
    return this.paginatedUsers;
  }

  /**
   * Retourne les données filtrées complètes
   */
  getFilteredData(): any[] {
    return this.filteredUsers;
  }

  /**
   * Retourne les noms des colonnes non vides (pour les en-têtes du tableau)
   */
  getColumnNames(): string[] {
    return this.nonEmptyColumns;
  }

  /**
   * Méthode pour obtenir le nom d'affichage de la colonne
   */
  getDisplayName(columnName: string): string {
    const displayNames: { [key: string]: string } = {
      'Prenom': 'Prénom',
      'nom': 'Nom',
      'Email': 'Email',
      'Phone': 'Téléphone',
      'Address': 'Adresse',
      'Statut': 'Statut',
    };
    return displayNames[columnName] || columnName;
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.updatePaginatedUsers();
    }
  }

  nextPage() {
    if (this.pagination.currentPage < this.pagination.totalPages) {
      this.goToPage(this.pagination.currentPage + 1);
    }
  }

  previousPage() {
    if (this.pagination.currentPage > 1) {
      this.goToPage(this.pagination.currentPage - 1);
    }
  }

  onItemsPerPageChange(event: any) {
    const itemsPerPage = parseInt(event.target.value, 10);
    this.pagination.itemsPerPage = itemsPerPage;
    this.pagination.currentPage = 1; // Reset to first page
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / itemsPerPage);
    this.updatePaginatedUsers();
  }

  // Helper methods for pagination display
  getStartIndex(): number {
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

    // Show 3 pages around current page
    const start = Math.max(1, current - 1);
    const end = Math.min(total, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  goBackToUpload() {
    this.router.navigate(['/upload']);
  }

  selectAndSubmitUser(userIndex: number) {
    // Convert paginated index to actual index in the original filtered data
    const actualIndex = this.getActualIndex(userIndex);
    this.selectedUserIndex = actualIndex;
    this.SubmitData();
  }

  SubmitData() {
    const selectedUser = this.filteredUsers[this.selectedUserIndex];
    
    // Debug: Log the selected user to see what data is available
    console.log('Selected user data:', selectedUser);
    console.log('Available keys:', Object.keys(selectedUser));
    console.log('Prenom value:', selectedUser.prenom);
    console.log('Nom value:', selectedUser.nom);
    
    if (selectedUser) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
  
      // Check all possible name fields and combine them
      const possibleNameFields = ['prenom', 'nom', 'Prenom', 'Nom', 'name', 'Name', 'fullName', 'full_name'];
      const nameValues = possibleNameFields
        .map(field => selectedUser[field])
        .filter(value => value && value.toString().trim() !== '');
  
      console.log('Found name values:', nameValues);
  
      // Create the modified user with combined name
      const modifiedUser = {
        first_name: nameValues.length > 0 ? nameValues.join(' ').trim() : 'No Name Found',
        last_name: " "
      };
  
      console.log('Modified user to send:', modifiedUser);
  
      this.dataService.postUser(modifiedUser).subscribe({
        next: (response) => {
          console.log('Posted user:', modifiedUser);
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
    } else {
      console.log('No user selected or user not found at index:', this.selectedUserIndex);
    }
  }
}