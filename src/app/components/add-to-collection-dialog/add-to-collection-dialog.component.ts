import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { CollectionModel } from '../../models/collection.model';

@Component({
  selector: 'app-add-to-collection-dialog',
  templateUrl: './add-to-collection-dialog.component.html',
  styleUrls: ['./add-to-collection-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatIconModule,
    FormsModule
  ]
})
export class AddToCollectionDialogComponent implements OnInit {
  collections: CollectionModel[] = [];
  selectedCollectionId: number | null = null;
  loading = false;
  error = '';
  
  constructor(
    private apiService: ApiService,
    public dialogRef: MatDialogRef<AddToCollectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { calculationId: number }
  ) { }

  ngOnInit(): void {
    console.log('Add to Collection Dialog initialized with calculation ID:', this.data.calculationId);
    
    // Validate that we have a proper calculation ID
    if (!this.data.calculationId || isNaN(Number(this.data.calculationId))) {
      this.error = 'Invalid calculation ID. Please try again.';
      console.error('Invalid calculation ID provided to dialog:', this.data.calculationId);
    } else {
      // Verify the calculation exists in the calculation-results endpoint
      this.loading = true;
      this.apiService.getCalculationResultById(this.data.calculationId).subscribe({
        next: (result) => {
          console.log('Calculation verified with ID:', this.data.calculationId);
          this.loadCollections();
        },
        error: (err) => {
          this.error = 'Could not verify calculation. It may not be saved correctly.';
          this.loading = false;
          console.error('Error verifying calculation:', err);
        }
      });
    }
  }

  loadCollections(): void {
    this.apiService.getAllCollections().subscribe({
      next: (collections) => {
        this.collections = collections;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load collections. Please try again.';
        this.loading = false;
        console.error('Error loading collections:', err);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.selectedCollectionId) {
      this.error = 'Please select a collection.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.apiService.addCalculationToCollection(this.data.calculationId, this.selectedCollectionId).subscribe({
      next: (result) => {
        // Find the collection name for the selected ID
        const selectedCollection = this.collections.find(c => c.collection_id === this.selectedCollectionId);
        const collectionName = selectedCollection ? selectedCollection.collection_name : 'Collection';
        
        this.loading = false;
        // Close the dialog with success data including the collection name
        this.dialogRef.close({ 
          success: true, 
          collectionId: this.selectedCollectionId,
          collectionName: collectionName,
          message: `Successfully added to ${collectionName}`
        });
      },
      error: (err) => {
        this.loading = false;
        
        // More comprehensive check for duplicate entry errors
        if (err.status === 500 || err.status === 400 || err.status === 409) {
          // Check the error message content in different possible locations
          const errorMsg = err.error?.message || err.error || err.message || JSON.stringify(err);
          
          if (typeof errorMsg === 'string' && 
             (errorMsg.toLowerCase().includes('duplicate') || 
              errorMsg.toLowerCase().includes('already exists') || 
              errorMsg.toLowerCase().includes('already added') || 
              errorMsg.toLowerCase().includes('unique constraint'))) {
            
            this.error = 'This Calculation is already added';
          } else {
            this.error = 'Failed to add to collection. Please try again.';
          }
        } else {
          this.error = 'Failed to add to collection. Please try again.';
        }
        
        console.error('Error adding to collection:', err);
      }
    });
  }

  createNewCollection(): void {
    const name = prompt('Enter a name for the new collection:');
    if (!name) return;
    
    this.loading = true;
    this.apiService.createCollection(name).subscribe({
      next: (collectionId) => {
        this.collections.push({ collection_id: collectionId, collection_name: name });
        this.selectedCollectionId = collectionId;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to create collection. Please try again.';
        this.loading = false;
      }
    });
  }
}