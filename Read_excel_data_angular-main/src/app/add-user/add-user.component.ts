import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../data.service';

interface User {
  id?: number;
  first_name: string;
  last_name: string;
}

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent {
  fullName: string = '';
  user: User = {
    last_name: '',
    first_name: ''
  };

  // Inject your dataService instead of HttpClient
  constructor(private dataService:DataService,private http: HttpClient) {} // Replace 'any' with your actual DataService type

  onSubmit() {
    if (this.fullName.trim()) {
      // Store the entire full name in first_name
      this.user.first_name = this.fullName.trim();
      
      // Store a single space in last_name
      this.user.last_name = " ";
  
      // Use your dataService instead of direct HTTP call
      this.dataService.postUserinput(this.user).subscribe(response => {
        console.log('User added:', this.user);
        console.log('Response:', response);
        this.dataService.setUsers([...this.dataService.getUsers(), this.user]);
        this.fullName = '';
      });
    } else {
      alert('Veuillez entrer le last_name et prélast_name');
    }
  }
 
}