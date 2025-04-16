import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CollectionModel } from '../../models/collection.model';
import { CalculationResult } from '../../models/service.model';
import { finalize } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddToCollectionDialogComponent } from '../../components/add-to-collection-dialog/add-to-collection-dialog.component';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
    MatListModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [CurrencyPipe]
})
export class CollectionComponent implements OnInit {
  collections: CollectionModel[] = [];
  selectedCollection: CollectionModel | null = null;
  calculationResults: CalculationResult[] = [];
  showScroll = false;
  loading = false;
  error = '';
  private scrollHeight = 400;
  private isBrowser: boolean;

  constructor(
    private apiService: ApiService,
    private currencyPipe: CurrencyPipe,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Only add scroll listener if in browser
    if (this.isBrowser) {
      window.addEventListener('scroll', this.checkScroll);
    }
  }

  ngOnInit() {
    this.loadCollections();
  }

  ngOnDestroy() {
    // Only remove listener if in browser
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.checkScroll);
    }
  }

  checkScroll = (): void => {
    if (this.isBrowser) {
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollPosition = window.pageYOffset;
      this.showScroll = (scrollPosition + viewportHeight) > (documentHeight * 0.5);
    }
  }

  scrollToTop(): void {
    if (this.isBrowser) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  loadCollections() {
    this.loading = true;
    this.error = '';
    this.apiService.getAllCollections().subscribe({
      next: (data) => {
        this.collections = data;
        this.loading = false;
        console.log('Loaded collections:', this.collections);
        // If collections exist, select the first one by default
        if (this.collections.length > 0) {
          this.selectCollection(this.collections[0]);
        }
      },
      error: (err) => {
        console.error('Error loading collections:', err);
        this.error = 'Failed to load collections. Duplicate entry. Please try again.';
        this.loading = false;
        this.collections = [];
      }
    });
  }

  selectCollection(collection: CollectionModel) {
    this.selectedCollection = collection;
    this.loadCollectionCalculations(collection);
  }

  loadCollectionCalculations(collection: CollectionModel): void {
    // Handle potentially undefined collection_id
    const collectionId = collection.collection_id || collection.id;
    if (!collectionId) {
      console.error('No valid collection ID found');
      return;
    }

    this.loading = true;
    this.apiService.getCollectionCalculations(collectionId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (calculations) => {
          this.calculationResults = calculations;
          console.log(`Loaded ${calculations.length} calculations for collection "${collection.collection_name || collection.name}"`);
          if (calculations.length === 0) {
            console.log('No calculations found in this collection');
          } else {
            console.log(`Loaded ${calculations.length} calculations for collection "${collection.collection_name || collection.name}"`);
          }
        },
        error: (err) => {
          console.error(`Error loading calculations for collection "${collection.collection_name || collection.name}". ${err.message || 'Please try again.'}`);
          this.error = `Failed to load calculations for collection "${collection.collection_name || collection.name}". ${err.message || 'Please try again later.'}`;
          this.calculationResults = [];
        }
      });
  }

  createNewCollection() {
    const collectionName = prompt('Enter a name for the new collection:', `Collection ${new Date().toLocaleDateString()}`);
    if (collectionName) {
      this.loading = true;
      this.error = '';
      this.apiService.createCollection(collectionName).subscribe({
        next: (collectionId) => {
          console.log('Created new collection with ID:', collectionId);
          // Show success message
          alert(`Collection "${collectionName}" created successfully!`);
          // Reload collections to get the new one
          this.loadCollections();
        },
        error: (err) => {
          console.error('Error creating collection:', err);
          this.error = 'Failed to create collection. Please try again later.';
          this.loading = false;
        }
      });
    }
  }

  deleteCollection(collection: CollectionModel, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling
    
    // Handle potentially undefined collection_id and collection_name
    const collectionId = collection.collection_id || collection.id;
    const collectionName = collection.collection_name || collection.name;
    
    if (!collectionId) {
      console.error('No valid collection ID found');
      return;
    }

    const hasCalculations = this.selectedCollection?.collection_id === collection.collection_id && 
                            this.calculationResults.length > 0;
    
    let confirmMessage = `Are you sure you want to delete "${collectionName}"?`;
    if (hasCalculations) {
      confirmMessage += `\n\nThis collection contains ${this.calculationResults.length} calculation(s) that will also be removed.`;
    }

    if (confirm(confirmMessage)) {
      this.loading = true;
      this.error = '';
      
      this.apiService.deleteCollection(collectionId)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            // Remove the deleted collection from the list
            this.collections = this.collections.filter(c => 
              (c.collection_id !== collection.collection_id) && 
              (c.id !== collection.id)
            );
            
            // Clear selection if the deleted collection was selected
            if (this.selectedCollection?.collection_id === collection.collection_id || 
                this.selectedCollection?.id === collection.id) {
              this.selectedCollection = null;
              this.calculationResults = [];
            }
            
            // If collections still exist, select the first one
            if (this.collections.length > 0) {
              this.selectCollection(this.collections[0]);
            }
            
            console.log(`Collection "${collectionName}" deleted successfully`);
          },
          error: (error) => {
            console.error(`Error deleting collection:`, error);
            
            // More specific error messages based on the error
            if (error.status === 400) {
              this.error = `Cannot delete collection "${collectionName}". The collection might contain calculations that cannot be deleted.`;
            } else {
              this.error = `Failed to delete collection "${collectionName}". ${error.message || 'Please try again later.'}`;
            }
            
            // Maybe toast notification for error
          }
        });
    }
  }

  renameCollection(collection: CollectionModel, event: Event): void {
    event.stopPropagation(); // Prevent event bubbling to avoid selecting the collection
    
    // Handle potentially undefined collection_id and collection_name
    const collectionId = collection.collection_id || collection.id;
    const currentName = collection.collection_name || collection.name;
    
    if (!collectionId) {
      console.error('No valid collection ID found');
      return;
    }
  
    const newName = prompt('Enter new name for the collection:', currentName);
    
    // Cancel if user clicked Cancel or entered empty name
    if (!newName || newName === currentName) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.apiService.renameCollection(collectionId, newName)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          // Update collection name in local array
          if (collection.collection_name !== undefined) {
            collection.collection_name = newName;
          } else if (collection.name !== undefined) {
            collection.name = newName;
          }
          
          // Also update selectedCollection if this is the currently selected one
          if (this.selectedCollection && 
              (this.selectedCollection.collection_id === collection.collection_id || 
               this.selectedCollection.id === collection.id)) {
            if (this.selectedCollection.collection_name !== undefined) {
              this.selectedCollection.collection_name = newName;
            } else if (this.selectedCollection.name !== undefined) {
              this.selectedCollection.name = newName;
            }
          }
          
          console.log(`Collection renamed to "${newName}" successfully`);
        },
        error: (error) => {
          console.error(`Error renaming collection:`, error);
          this.error = `Failed to rename collection to "${newName}". ${error.message || 'Please try again later.'}`;
        }
      });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Unknown';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }

  saveToCollection(calculationIndex: number): void {
    const calculation = this.calculationResults[calculationIndex];

    if (!calculation) {
      alert('Invalid calculation');
      return;
    }

    // Ensure calculation has an ID
    if (!calculation.id) {
      console.error('Calculation missing ID!');
      alert('Cannot save: calculation is missing an ID');
      return;
    }

    this.loading = true;
    console.log('Opening dialog to add calculation with ID:', calculation.id);

    // Open dialog to select collection
    this.dialog.open(AddToCollectionDialogComponent, {
      width: '400px',
      data: { calculationId: calculation.id }
    }).afterClosed().subscribe(result => {
      this.loading = false;

      if (result && typeof result.collectionId === 'number') {
        console.log('Dialog returned with collection ID:', result.collectionId);

        const calculationId = calculation.id as number;
        const collectionId = result.collectionId;

        this.apiService.addCalculationToCollection(calculationId, collectionId).subscribe({
          next: () => {
            alert('Calculation added to collection successfully');
          },
          error: (err) => {
            const errorMessage = err.message || 'Unknown error';
            alert(`Error adding calculation to collection: ${errorMessage}`);
            console.error('Error adding calculation to collection:', err);
          }
        });
      }
    });
  }

  deleteCalculationFromCollection(calculationIndex: number): void {
    if (!this.selectedCollection) {
      console.error('No collection selected');
      return;
    }

    const calculation = this.calculationResults[calculationIndex];
    if (!calculation || !calculation.id) {
      console.error('Invalid calculation or missing ID');
      return;
    }

    const collectionId = this.selectedCollection.collection_id || this.selectedCollection.id;
    if (!collectionId) {
      console.error('Invalid collection ID');
      return;
    }

    const confirmMessage = `Are you sure you want to remove this calculation from the collection?`;
    if (confirm(confirmMessage)) {
      this.loading = true;
      this.error = '';
      
      this.apiService.removeCalculationFromCollection(calculation.id, collectionId)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            // Remove the calculation from the local array
            this.calculationResults = this.calculationResults.filter((_, i) => i !== calculationIndex);
            console.log(`Calculation removed from collection`);
          },
          error: (error) => {
            console.error('Error removing calculation from collection:', error);
            this.error = `Failed to remove calculation: ${error.message || 'Unknown error'}`;
          }
        });
    }
  }

  // Constants for service IDs
  private readonly SERVICE_IDS = {
    VOICE_VIDEO: 1,
    EMAIL: 2, 
    MESSAGING_CHAT: 3,
    AMAZON_Q: 4,
    TASK: 5,
    CASE: 6,
    GUIDES: 7,
    CUSTOMER_PROFILE: 8,
    VOICE_ID: 10,
    AGENT_ASSIST: 11,
    CONNECT_SERVICES: 8,  // Same as CUSTOMER_PROFILE in original code, update if needed
    CONNECT_LENS: 13,
    FORECASTING_SCHEDULING: 14
  };

  /**
   * Check if the calculation is for an outbound call type
   */
  isOutboundCallType(resultIndex: number): boolean {
    return this.calculationResults[resultIndex]?.call_type_id === 2;
  }

  /**
   * Check if the calculation is for an inbound call type
   */
  isInboundCallType(index: number): boolean {
    return this.calculationResults[index]?.call_type_id === 1;
  }

  isMessagingChatResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.MESSAGING_CHAT;
    }
    
    // Otherwise infer from the costs
    const result = this.calculationResults[resultIndex];
    return !!(
      result['cost_chat_usage'] || 
      result['cost_sms_usage'] || 
      result['cost_apple_messages'] || 
      result['cost_whatsapp_messaging'] || 
      result['cost_chat_experiences']
    );
  }

  isEmailResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.EMAIL;
    }
    
    // Check by service name
    if (this.calculationResults[resultIndex].serviceName) {
      return this.calculationResults[resultIndex].serviceName.toLowerCase().includes('email');
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!result['cost_email_usage'];
  }

  isAmazonQResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.AMAZON_Q;
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!(
      result['cost_azq_chat_usage'] || 
      result['cost_azq_voice_usage']
    );
  }

  isTaskResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.TASK;
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!result['cost_task_usage'];
  }

  isCaseResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.CASE;
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!result['cost_case_usage'];
  }

  isCustomerProfileResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.CUSTOMER_PROFILE;
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!(result['cost_cp_daily_azq'] || result['cost_cp_daily_ext']);
  }

  isGuidesResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.GUIDES;
    }
    
    // Otherwise infer from costs or specific fields
    const result = this.calculationResults[resultIndex];
    return !!(result['cost_guides_usage'] || result['msg_sent']);
  }

  isVoiceIdResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.VOICE_ID;
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!result['cost_voiceid_usage'];
  }

  isAgentAssistResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.AGENT_ASSIST;
    }
    
    // Check by service name
    if (this.calculationResults[resultIndex].serviceName) {
      return this.calculationResults[resultIndex].serviceName.toLowerCase().includes('agent assist');
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!result['cost_agent_usage'];
  }

  isConnectServicesResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.CONNECT_SERVICES;
    }
    
    // Check by service name
    if (this.calculationResults[resultIndex].serviceName) {
      return this.calculationResults[resultIndex].serviceName.toLowerCase().includes('connect services');
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!(
      result['cost_invoice_acs'] || 
      result['cost_outbound_acs'] || 
      result['cost_chat_usage_acs'] ||
      result['cost_email_acs'] ||
      result['cost_task_acs'] ||
      result['cost_sms_acs'] ||
      result['cost_apple_acs'] ||
      result['cost_whatsapp_acs'] ||
      result['cost_guide_acs'] ||
      result['cost_outcamp_acs']
    );
  }

  isConnectLensResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.CONNECT_LENS;
    }
    
    // Check by service name
    if (this.calculationResults[resultIndex].serviceName) {
      return this.calculationResults[resultIndex].serviceName.toLowerCase().includes('connect lens');
    }
    
    // Otherwise infer from costs
    const result = this.calculationResults[resultIndex];
    return !!(
      result['cost_cl_voice_calls'] || 
      result['cost_cl_chat_message'] || 
      result['cost_cl_performance_eval'] ||
      result['cost_cl_screen_rec'] ||
      result['cost_cl_external_voice'] ||
      result['cost_cl_external_connector']
    );
  }

  isForecastingSchedulingResult(resultIndex: number): boolean {
    if (!this.calculationResults[resultIndex]) {
      return false;
    }
    
    // Check by serviceId
    if (this.calculationResults[resultIndex].serviceId !== undefined) {
      return this.calculationResults[resultIndex].serviceId === this.SERVICE_IDS.FORECASTING_SCHEDULING;
    }
    
    // Check by service name
    if (this.calculationResults[resultIndex].serviceName) {
      return this.calculationResults[resultIndex].serviceName.toLowerCase().includes('forecasting');
    }
    
    // Otherwise infer from the agent_forecasted property
    return !!this.calculationResults[resultIndex]['agent_forecasted'];
  }

  calculateTotalCost(): number {
    if (!this.calculationResults || this.calculationResults.length === 0) {
      return 0;
    }
    
    return this.calculationResults.reduce((sum, result) => {
      // Handle potential undefined or non-numeric values
      const cost = result.total_cost ? Number(result.total_cost) : 0;
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);
  }

  /**
   * Get the display name of a service based on the calculation result
   */
  getServiceName(result: CalculationResult): string {
    // If service name is directly available, use it
    if (result.serviceName) {
      return result.serviceName;
    }
    
    // Try to determine service from serviceId
    if (result.serviceId !== undefined) {
      // Map service IDs to readable names
      const serviceNames: {[key: number]: string} = {
        [this.SERVICE_IDS.VOICE_VIDEO]: 'Voice & Video',
        [this.SERVICE_IDS.EMAIL]: 'Email',
        [this.SERVICE_IDS.MESSAGING_CHAT]: 'Messaging & Chat',
        [this.SERVICE_IDS.AMAZON_Q]: 'Amazon Q',
        [this.SERVICE_IDS.TASK]: 'Tasks',
        [this.SERVICE_IDS.CASE]: 'Cases',
        [this.SERVICE_IDS.GUIDES]: 'Guides',
        [this.SERVICE_IDS.CUSTOMER_PROFILE]: 'Customer Profiles',
        [this.SERVICE_IDS.VOICE_ID]: 'Voice ID',
        [this.SERVICE_IDS.AGENT_ASSIST]: 'Agent Assist',
        [this.SERVICE_IDS.CONNECT_LENS]: 'Connect Lens',
        [this.SERVICE_IDS.FORECASTING_SCHEDULING]: 'Forecasting & Scheduling'
      };
      
      return serviceNames[result.serviceId] || 'Service ID: ' + result.serviceId;
    }
    
    // Infer service type from available properties
    const resultIndex = this.calculationResults.indexOf(result);
    if (this.isMessagingChatResult(resultIndex)) {
      return 'Messaging & Chat';
    } else if (this.isEmailResult(resultIndex)) {
      return 'Email';
    } else if (this.isAmazonQResult(resultIndex)) {
      return 'Amazon Q';
    } else if (this.isTaskResult(resultIndex)) {
      return 'Tasks';
    } else if (this.isCaseResult(resultIndex)) {
      return 'Cases';
    } else if (this.isCustomerProfileResult(resultIndex)) {
      return 'Customer Profiles';
    } else if (this.isGuidesResult(resultIndex)) {
      return 'Guides';
    } else if (this.isVoiceIdResult(resultIndex)) {
      return 'Voice ID';
    } else if (this.isConnectServicesResult(resultIndex)) {
      return 'Connect Services';
    } else if (this.isConnectLensResult(resultIndex)) {
      return 'Connect Lens';
    } else if (this.isForecastingSchedulingResult(resultIndex)) {
      return 'Forecasting & Scheduling';
    }
    
    // Default to Voice & Video if no specific type is detected
    return 'Voice & Video';
  }
}
