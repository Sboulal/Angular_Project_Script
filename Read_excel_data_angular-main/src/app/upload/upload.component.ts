import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  
  constructor(
    private router: Router,
    private dataService: DataService
  ) {}

  readExcelFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const users = XLSX.utils.sheet_to_json(worksheet);
        
       this.dataService.setUsers(users);
        
        
        this.router.navigate(['/table-display']);
      };
      fileReader.readAsArrayBuffer(file);
    }
  }
}