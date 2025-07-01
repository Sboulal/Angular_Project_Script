import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';

interface User {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
}

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent {
  user: User = {
    nom: '',
    prenom: '',
    email: ''
  };

  constructor(private dataService: DataService, private http: HttpClient) {}

  onSubmit() {
    // Validate all fields are filled
    if (this.user.nom.trim() && this.user.prenom.trim() && this.user.email.trim()) {
      // Prepare complete user data for the service
      const userData = {
        nom: this.user.nom.trim().toUpperCase(),
        prenom: this.user.prenom.trim().toUpperCase(),
        email: this.user.email.trim()
      };
  
      // Use your dataService to post user input
      this.dataService.postUserinput(userData).subscribe({
        next: (response) => {
          console.log('User added:', userData);
          console.log('Response:', response);
          this.dataService.setUsers([...this.dataService.getUsers(), userData]);
          
          // Reset form
          this.user = {
            nom: '',
            prenom: '',
            email: ''
          };
        },
        error: (error) => {
          console.error('Error adding user:', error);
          alert('Erreur lors de l\'ajout de l\'utilisateur');
        }
      });
    } else {
      alert('Veuillez remplir tous les champs: nom, prénom et email');
    }
  }
}