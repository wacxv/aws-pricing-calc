import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox'; 
import { MatRadioModule } from '@angular/material/radio'; 
import { RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Service, Region, Country, CallType, CalculationResult } from '../../models/service.model';
import { CollectionModel } from '../../models/collection.model';
import { ServiceTypes, ServiceTypeMap, getServiceTypeById, getServiceIdsByType } from '../../models/service-types';
import { SERVICE_IDS, SERVICES_WITHOUT_REGION_COUNTRY, API_DEFAULTS } from '../../config/service-constants';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { AddToCollectionDialogComponent } from '../add-to-collection-dialog/add-to-collection-dialog.component';

// Define a simple ConnectRates interface to replace the missing model
interface ConnectRates {
  invoice_rate: number;
  outbound_rate: number;
  chat_rate: number;
  email_rate: number;
  task_rate: number;
  sms_rate: number;
  apple_rate: number;
  whatsapp_rate: number;
  guide_rate: number;
  outcamp_rate: number;
}

interface CostSummary {
  label: string;
  amount: number | null;
  serviceId?: number;
  id?: number; // Add the calculation ID to the interface
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [CurrencyPipe, DecimalPipe],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCheckboxModule,
    MatRadioModule,
    NgxMatSelectSearchModule,
    MatTabsModule
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  regions: Region[] = [];
  countries: Country[] = [];
  callTypes: CallType[] = [];
  services: Service[] = [];
  serviceForm: FormGroup;
  usageForm: FormGroup;
  messagingForm: FormGroup;
  emailForm: FormGroup;
  amazonQForm: FormGroup;
  taskForm: FormGroup;
  caseForm: FormGroup;
  customerProfileForm: FormGroup;
  guidesForm: FormGroup;
  voiceIdForm: FormGroup;
  agentAssistForm: FormGroup;
  connectServicesForm: FormGroup;
  connectLensForm: FormGroup;
  forecastingSchedulingForm: FormGroup;
  
  showUsageForm = false;
  costSummaries: CostSummary[] = [];
  calculationResults: CalculationResult[] = [];
  deleteIconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAA+0lEQVRIie2UMU7DQBBF3xoLJDp6UiQh5RKBSyA6CpqIjgtQ0VLQABXH4AqIgoKChhNQ0NJSYCGBdoa0kRxFNvmJRHnlrnbmz87/swv/BZLGks4lHbvM7+RSb5I2Jd3Gy09m1vt5FDXtZnYHDMuipLrb34s/9vvqkk6BfZ+f9AUcAsxs+wEce61fFi35XdXlLMuyU7Ysi6Ioinmn05kAffwpeqYDJpOiKBbDrZJb13EcP9TVJMnMBsBRw/l3pVZTMbPTVVxUDTlpAnypvpKdWoPwFXmSHvixfq6T9AKMADb2qrQ22GQjTXUDfK+L9MuFHklP7mJfVc6X470A3sGVkTvbk3QAAAAASUVORK5CYII=';
  showScroll = false;
  private scrollHeight = 400;
  private isBrowser: boolean;
  countryFilterCtrl = new FormControl('');
  filteredCountries: Country[] = [];
  protected _onDestroy = new Subject<void>();
  
  filteredServices: Service[] = [];
  filteredServiceOptions: Service[] = [];
  serviceSearchValue: string = '';
  
  filteredRegions: Region[] = [];
  regionFilterCtrl = new FormControl('');

  selectedCategory: string = 'all';
  selectedConnectService: number | null = null;
  selectedFeatureService: number | null = null;
  connectServices: Service[] = [];
  omnichannelServices: Service[] = [];
  productivityServices: Service[] = [];
  analyticsServices: Service[] = [];
  featuredServices: Service[] = [];
  readonly SERVICE_CATEGORIES = {
    CONNECT: [
      SERVICE_IDS.VOICE_VIDEO,
      SERVICE_IDS.MESSAGING_CHAT,
      SERVICE_IDS.AMAZON_Q,
      SERVICE_IDS.CONNECT_SERVICES
    ],
    OMNICHANNEL: [
      SERVICE_IDS.VOICE_VIDEO,
      SERVICE_IDS.MESSAGING_CHAT,
      SERVICE_IDS.EMAIL,
      SERVICE_IDS.TASK,
      SERVICE_IDS.AMAZON_Q
    ],
    PRODUCTIVITY: [
      SERVICE_IDS.CASE,
      SERVICE_IDS.CUSTOMER_PROFILE,
      SERVICE_IDS.GUIDES,
      SERVICE_IDS.VOICE_ID // Ensure Voice ID is included here
    ],
    ANALYTICS: [
      SERVICE_IDS.CONNECT_LENS,           // ID: 13
      SERVICE_IDS.FORECASTING_SCHEDULING  // ID: 14
    ],
    FEATURED: [
      SERVICE_IDS.VOICE_VIDEO,
      SERVICE_IDS.MESSAGING_CHAT,
      SERVICE_IDS.EMAIL
    ]
  };

  individualFeaturesMode = false;
  selectedSubCategory: string = 'omnichannel';
  initialCategory: string = 'all';
  selectedOmniChannelService: number | null = null;
  SERVICE_IDS = SERVICE_IDS;
  showServiceOptions = false;
  collections: CollectionModel[] = [];
  loading = false;

  selectedFeaturedCategory: string | null = null;
  availableServiceIds: number[] = [];
  missingServices: string[] = [];
  autoSaveCalculations = false; // Change to true if you want all calculations auto-saved

  private calculationSaveInProgress = new Map<string, number>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private currencyPipe: CurrencyPipe,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    this.serviceForm = this.fb.group({
      region: ['', Validators.required],
      callType: ['', Validators.required],
      country: ['', Validators.required],
      service: ['', Validators.required]
    });
    this.usageForm = this.fb.group({
      businessDays: ['', [Validators.required, Validators.min(1), Validators.max(31)]],
      aht: ['', [Validators.required, Validators.min(0.1)]],
      dailyUsage: ['', [Validators.required, Validators.min(1)]]
    });
    this.messagingForm = this.fb.group({
      forBusiness: [false],
      whatsappMessaging: [{value: false, disabled: true}],
      appleMessages: [{value: false, disabled: true}],
      whatsappUsage: [{value: '', disabled: true}],
      appleMessagesUsage: [{value: '', disabled: true}],
      chatUsage: ['', Validators.required],
      smsUsage: ['', Validators.required],
      chatExperiences: ['', Validators.required]
    });
    this.emailForm = this.fb.group({
      emailUsage: ['', Validators.required]
    });
    this.amazonQForm = this.fb.group({
      channelType: ['chat', Validators.required],
      chatMessages: [0, [Validators.required, Validators.min(0)]],
      callDuration: [0, [Validators.required, Validators.min(0)]]
    });
    this.taskForm = this.fb.group({
      taskUsage: ['', Validators.required]
    });
    this.caseForm = this.fb.group({
      caseUsage: ['', Validators.required]
    });
    this.customerProfileForm = this.fb.group({
      cp_daily_azq: ['', [Validators.required, Validators.min(0)]],
      cp_daily_ext: ['', [Validators.required, Validators.min(0)]]
    });
    this.guidesForm = this.fb.group({
      msg_sent: ['', [Validators.required, Validators.min(0)]]
    });
    this.voiceIdForm = this.fb.group({
      voiceidUsage: ['', [Validators.required, Validators.min(0)]]
    });
    this.agentAssistForm = this.fb.group({
      agentUsage: ['', [Validators.required, Validators.min(0)]]
    });
    this.connectServicesForm = this.fb.group({
      invoice_acs: [0],
      outbound_acs: [0],
      chat_usage_acs: [0],
      email_acs: [0],
      task_acs: [0],
      sms_acs: [0],
      apple_acs: [0],
      whatsapp_acs: [0],
      guide_acs: [0],
      outcamp_acs: [0]
    });
    this.connectLensForm = this.fb.group({
      cl_voice_calls: ['', [Validators.required, Validators.min(0)]],
      cl_chat_message: ['', [Validators.required, Validators.min(0)]],
      cl_performance_eval: ['', [Validators.required, Validators.min(0)]],
      cl_screen_rec: ['', [Validators.required, Validators.min(0)]],
      cl_external_voice: ['', [Validators.required, Validators.min(0)]],
      cl_external_connector: ['', [Validators.required, Validators.min(0)]]
    });
    this.forecastingSchedulingForm = this.fb.group({
      agent_forecasted: ['', [Validators.required, Validators.min(0)]]
    });

    if (this.isBrowser) {
      window.addEventListener('scroll', this.checkScroll);
    }
  }

  ngOnInit() {
    this.loadRegions();
    this.loadCallTypes();
    this.loadAllServices();
    this.filteredCountries = this.countries.slice();
    if (this.isBrowser) {
      this.countryFilterCtrl.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterCountries();
        });
    }
    this.serviceForm.get('service')?.valueChanges.subscribe(serviceId => {
      if (serviceId) {
        const service = this.services.find(s => s.service_id === serviceId);
        if (service) {
          const callTypeControl = this.serviceForm.get('callType');
          if (callTypeControl && service.call_type_id !== callTypeControl.value) {
            callTypeControl.setValue(service.call_type_id);
          }
          const requiresRegionCountry = this.isServiceRequiringRegionCountry();
          if (requiresRegionCountry) {
            this.serviceForm.get('region')?.enable();
            this.serviceForm.get('country')?.enable();
            this.serviceForm.get('callType')?.enable();
          } else {
            this.serviceForm.get('region')?.setValue(null);
            this.serviceForm.get('country')?.setValue(null);
            this.serviceForm.get('callType')?.setValue(null);
            this.serviceForm.get('region')?.disable();
            this.serviceForm.get('country')?.disable();
            this.serviceForm.get('callType')?.disable();
          }
        }
        this.showUsageForm = false;
        this.showServiceOptions = false;
      }
    });
    this.filteredRegions = this.regions.slice();
    this.regionFilterCtrl.valueChanges.pipe(
      takeUntil(this._onDestroy)
    ).subscribe(value => {
      // Handle null values by passing an empty string
      this.filterRegions(value || '');
    });
    this.amazonQForm.get('channelType')?.valueChanges.subscribe(channelType => {
      this.updateAmazonQFormFields(channelType);
    });
    this.updateAmazonQFormFields(this.amazonQForm.get('channelType')?.value);
    this.initialCategory = 'connect';
    this.loadCollections();

    // Add this code to handle messaging form controls
    this.messagingForm.get('forBusiness')?.valueChanges.subscribe(forBusiness => {
      if (forBusiness) {
        this.messagingForm.get('whatsappMessaging')?.enable();
        this.messagingForm.get('appleMessages')?.enable();
      } else {
        this.messagingForm.get('whatsappMessaging')?.disable();
        this.messagingForm.get('appleMessages')?.disable();
        this.messagingForm.get('whatsappUsage')?.disable();
        this.messagingForm.get('appleMessagesUsage')?.disable();
        
        // Reset values
        this.messagingForm.get('whatsappMessaging')?.setValue(false);
        this.messagingForm.get('appleMessages')?.setValue(false);
        this.messagingForm.get('whatsappUsage')?.setValue('');
        this.messagingForm.get('appleMessagesUsage')?.setValue('');
      }
    });

    // Add change handlers for the messaging checkboxes
    this.messagingForm.get('whatsappMessaging')?.valueChanges.subscribe(checked => {
      if (checked) {
        this.messagingForm.get('whatsappUsage')?.enable();
        this.messagingForm.get('whatsappUsage')?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        this.messagingForm.get('whatsappUsage')?.disable();
        this.messagingForm.get('whatsappUsage')?.setValue('');
        this.messagingForm.get('whatsappUsage')?.clearValidators();
      }
      this.messagingForm.get('whatsappUsage')?.updateValueAndValidity();
    });

    this.messagingForm.get('appleMessages')?.valueChanges.subscribe(checked => {
      if (checked) {
        this.messagingForm.get('appleMessagesUsage')?.enable();
        this.messagingForm.get('appleMessagesUsage')?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        this.messagingForm.get('appleMessagesUsage')?.disable();
        this.messagingForm.get('appleMessagesUsage')?.setValue('');
        this.messagingForm.get('appleMessagesUsage')?.clearValidators();
      }
      this.messagingForm.get('appleMessagesUsage')?.updateValueAndValidity();
    });

    // Add explicit Console log for SERVICE_IDS for debugging
    console.log('SERVICE_IDS used in application:', this.SERVICE_IDS);

    // Add console logs to track when forms are being shown
    this.serviceForm.get('service')?.valueChanges.subscribe(serviceId => {
      console.log('Selected service ID changed to:', serviceId);
      console.log('Is Voice ID service?', this.isVoiceIdService());
      console.log('Voice ID service ID from constants:', SERVICE_IDS.VOICE_ID);
    });
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      window.removeEventListener('scroll', this.checkScroll);
    }
    this._onDestroy.next();
    this._onDestroy.complete();
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

  loadRegions() {
    this.apiService.getRegions().subscribe({
      next: (data) => {
        this.regions = data;
        this.filteredRegions = this.regions.slice();
      },
      error: (err) => {
        this.regions = [];
        this.filteredRegions = [];
      }
    });
  }

  loadCallTypes() {
    this.apiService.getCallTypes().subscribe(data => {
      this.callTypes = data;
    });
  }

  loadAllServices() {
    // First, get all services to populate the services array
    this.apiService.getAllServices().subscribe({
      next: (services: Service[]) => {
        this.services = services;
        console.log('Loaded services:', this.services);
        
        // If subcategory is already selected, update filtered services
        if (this.individualFeaturesMode && this.selectedSubCategory) {
          this.filterServicesBySubCategory();
        }

        // Also get available service IDs for tracking
        this.apiService.getAvailableServices().subscribe((availableServiceIds: number[]) => {
          this.availableServiceIds = availableServiceIds;

          // Identify missing services
          const allServiceIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
          const missingServices = allServiceIds.filter(id => !availableServiceIds.includes(id));

          this.missingServices = missingServices.map(id => {
            if (id === 13) return 'Connect Lens (ID 13)';
            if (id === 14) return 'Forecasting and Scheduling (ID 14)';
            return `Unknown Service (ID ${id})`;
          });

          console.log('Missing services from API response:', this.missingServices);
        });
      },
      error: (err) => {
        console.error('Error loading services:', err);
        this.services = [];
      }
    });
  }

  onFeaturedCategorySelect(): void {
    this.serviceForm.get('service')?.setValue('');
    this.showUsageForm = false;
    this.showServiceOptions = false;
    this.filteredServiceOptions = this.services.filter(service => 
      this.SERVICE_CATEGORIES.FEATURED.includes(service.service_id)
    );
  }

  onInitialCategoryChange(): void {
    console.log('Initial category changed to:', this.initialCategory);

    this.serviceForm.get('service')?.setValue('');
    this.showUsageForm = false;
    this.showServiceOptions = false;

    this.selectedFeaturedCategory = null;

    if (this.initialCategory === 'features') {
      this.individualFeaturesMode = true;

      if (!this.selectedSubCategory) {
        this.selectedSubCategory = 'omnichannel';
      }

      this.filterServicesBySubCategory();
    } else if (this.initialCategory === 'connect') {
      this.individualFeaturesMode = false;
      this.selectedSubCategory = 'omnichannel';
    }
  }
  
  onFeaturedCategoryChange(): void {
    this.showServiceOptions = false;
    
    if (this.selectedFeaturedCategory === 'connect_services') {
      // Get the Connect Services service ID
      const connectServicesId = SERVICE_IDS.CONNECT_SERVICES;
      
      // Set the service in the form
      this.serviceForm.get('service')?.setValue(connectServicesId);
      
      // Show the usage form directly
      this.showUsageForm = true;
    }
  }

  onSubCategoryChange(): void {
    console.log('Selected subcategory changed to:', this.selectedSubCategory);
    
    // Reset service selection
    this.serviceForm.get('service')?.setValue('');
    this.showUsageForm = false;
    
    // Apply the category filter
    this.filterServicesBySubCategory();
  }

  filterServicesBySubCategory(): void {
    let serviceIds: number[] = [];

    switch (this.selectedSubCategory) {
      case 'omnichannel':
        serviceIds = this.SERVICE_CATEGORIES.OMNICHANNEL;
        break;
      case 'productivity':
        serviceIds = this.SERVICE_CATEGORIES.PRODUCTIVITY;
        break;
      case 'analytics':
        serviceIds = this.SERVICE_CATEGORIES.ANALYTICS;
        break;
      default:
        serviceIds = [];
    }

    const existingServices = this.services.filter(service =>
      serviceIds.includes(service.service_id)
    );

    if (this.selectedSubCategory === 'analytics') {
      if (!existingServices.some(s => s.service_id === SERVICE_IDS.CONNECT_LENS)) {
        existingServices.push({
          service_id: SERVICE_IDS.CONNECT_LENS,
          service_name: 'Connect Lens'
        });
      }
      if (!existingServices.some(s => s.service_id === SERVICE_IDS.FORECASTING_SCHEDULING)) {
        existingServices.push({
          service_id: SERVICE_IDS.FORECASTING_SCHEDULING,
          service_name: 'Forecasting and Scheduling'
        });
      }
    }

    this.filteredServiceOptions = existingServices;
    this.showServiceOptions = true;

    console.log(`Filtered services for ${this.selectedSubCategory}:`, 
      this.filteredServiceOptions.map(service => `${service.service_name} (ID: ${service.service_id})`));
  }

  loadCollections() {
    this.apiService.getAllCollections().subscribe({
      next: (data) => {
        this.collections = data;
      },
      error: (err) => {
        this.collections = [];
      }
    });
  }

  isServiceRequiringRegionCountry(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId && !SERVICES_WITHOUT_REGION_COUNTRY.includes(serviceId);
  }

  isVoiceVideoService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.VOICE_VIDEO;
  }

  isMessagingChatService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.MESSAGING_CHAT;
  }

  isEmailService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.EMAIL;
  }

  isAmazonQService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.AMAZON_Q;
  }

  isTaskService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.TASK;
  }

  isCaseService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.CASE;
  }

  isCustomerProfileService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.CUSTOMER_PROFILE;
  }

  isGuidesService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.GUIDES;
  }

  isVoiceIdService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    const isVoiceId = serviceId === SERVICE_IDS.VOICE_ID;
    return isVoiceId;
  }

  isAgentAssistService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.AGENT_ASSIST;
  }

  isConnectServicesService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.CONNECT_SERVICES;
  }

  isConnectLensService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.CONNECT_LENS; // ID: 13
  }

  isForecastingSchedulingService(): boolean {
    const serviceId = this.serviceForm.get('service')?.value;
    return serviceId === SERVICE_IDS.FORECASTING_SCHEDULING; // ID: 14
  }

  isOutboundCampaignService(): boolean {
    return false; // Outbound Campaign is no longer available
  }

  isVoiceVideoFormValid(): boolean {
    return this.serviceForm.valid;
  }

  isAmazonQFormValid(): boolean {
    const channelType = this.amazonQForm.get('channelType')?.value;
    if (channelType === 'chat') {
      return this.amazonQForm.get('chatMessages')?.valid || false;
    } else if (channelType === 'voice') {
      return this.amazonQForm.get('callDuration')?.valid || false;
    }
    return false;
  }

  onInitialServiceSelection(): void {
    const serviceId = this.serviceForm.get('service')?.value;
    if (!serviceId) return;
    
    if (this.isVoiceVideoService()) {
      this.showServiceOptions = true;
    } else {
      this.showUsageForm = true;
    }
  }

  onServiceFormSubmit(): void {
    if (this.isVoiceVideoFormValid()) {
      this.showServiceOptions = false;
      this.showUsageForm = true;
    }
  }

  onCalculate(): void {
    if (!this.usageForm.valid) return;
    
    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      regionId: this.serviceForm.get('region')?.value,
      countryId: this.serviceForm.get('country')?.value,
      callTypeId: this.serviceForm.get('callType')?.value,
      businessDays: this.usageForm.get('businessDays')?.value,
      aht: this.usageForm.get('aht')?.value,
      dailyUsage: this.usageForm.get('dailyUsage')?.value
    };
    
    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        this.handleCalculationResult(result);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateMessaging(): void {
    if (!this.messagingForm.valid) return;
    
    // Get the service information first
    const serviceId = this.serviceForm.get('service')?.value;
    const serviceName = this.getServiceNameById(serviceId);
    console.log('Messaging service:', serviceName, 'ID:', serviceId);
    
    // Get the form values
    const formValues = this.messagingForm.value;
    
    // Create calculation request
    const calculationRequest = {
      serviceId: serviceId,
      forBusiness: formValues.forBusiness,
      whatsappMessaging: formValues.whatsappMessaging,
      appleMessages: formValues.appleMessages,
      whatsappUsage: formValues.whatsappMessaging ? formValues.whatsappUsage : 0,
      appleMessagesUsage: formValues.appleMessages ? formValues.appleMessagesUsage : 0,
      chatUsage: formValues.chatUsage,
      smsUsage: formValues.smsUsage,
      chatExperiences: formValues.chatExperiences
    };
    
    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        console.log('Raw Messaging API response:', result);
        
        // Make sure we set the service information
        const processedResult: CalculationResult = {
          ...result,
          serviceId: serviceId,
          serviceName: serviceName,  // Explicitly set the service name
          // Include the form values for display purposes
          forBusiness: formValues.forBusiness,
          whatsappMessaging: formValues.whatsappMessaging,
          appleMessages: formValues.appleMessages,
          whatsappUsage: formValues.whatsappMessaging ? formValues.whatsappUsage : 0,
          appleMessagesUsage: formValues.appleMessages ? formValues.appleMessagesUsage : 0,
          chatUsage: formValues.chatUsage,
          smsUsage: formValues.smsUsage,
          chatExperiences: formValues.chatExperiences,
          
          // Ensure cost fields are treated as numbers
          cost_chat_usage: Number(result.cost_chat_usage || 0),
          cost_sms_usage: Number(result.cost_sms_usage || 0),
          cost_apple_messages: Number(result.cost_apple_messages || 0),
          cost_whatsapp_messaging: Number(result.cost_whatsapp_messaging || 0),
          cost_chat_experiences: Number(result.cost_chat_experiences || 0)
        };
        
        // Calculate total cost if not provided
        if (!processedResult.total_cost) {
          processedResult.total_cost = 
            (processedResult.cost_chat_usage || 0) +
            (processedResult.cost_sms_usage || 0) +
            (processedResult.cost_apple_messages || 0) +
            (processedResult.cost_whatsapp_messaging || 0) +
            (processedResult.cost_chat_experiences || 0);
        }
        
        console.log('Processed Messaging result:', processedResult);
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating messaging costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateEmail(): void {
    if (!this.emailForm.valid) return;
    
    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      emailUsage: this.emailForm.get('emailUsage')?.value
    };
    
    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        this.handleCalculationResult(result);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating email costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateAmazonQ(): void {
    if (!this.isAmazonQFormValid()) return;
    
    const serviceId = this.serviceForm.get('service')?.value;
    const channelType = this.amazonQForm.get('channelType')?.value;
    const chatMessages = channelType === 'chat' ? Number(this.amazonQForm.get('chatMessages')?.value) || 0 : 0;
    const callDuration = channelType === 'voice' ? Number(this.amazonQForm.get('callDuration')?.value) || 0 : 0;
    
    const calculationRequest = {
      serviceId: serviceId,
      chat_azq_usage: chatMessages, // Backend-expected field name
      voice_azq_usage: callDuration, // Backend-expected field name
      channelType: channelType
    };

    console.log('Amazon Q API request:', calculationRequest);
    
    this.loading = true;
    
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        console.log('Raw Amazon Q API response:', result);
        
        const processedResult: CalculationResult = {
          ...result,
          serviceId: serviceId,
          channelType: channelType,
          chatMessages: chatMessages,
          callDuration: callDuration,
          total_cost: parseFloat(Number(result.total_cost).toFixed(2))
        };
        
        console.log('Processed Amazon Q result:', processedResult);
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating Amazon Q costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateTask(): void {
    if (!this.taskForm.valid) return;
    
    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      taskUsage: this.taskForm.get('taskUsage')?.value
    };
    
    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        this.handleCalculationResult(result);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating task costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateCase(): void {
    if (!this.caseForm.valid) return;
    
    const serviceId = this.serviceForm.get('service')?.value;
    const case_usage = this.caseForm.get('caseUsage')?.value;
    
    const calculationRequest = {
      serviceId: serviceId,
      case_usage: case_usage // Use snake_case for API compatibility
    };
    
    console.log('Case calculation request:', calculationRequest);
    
    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        console.log('Raw Case API response:', result);
        
        const processedResult: CalculationResult = {
          ...result,
          serviceId: serviceId,
          serviceName: 'Case',
          case_usage: case_usage,
          serviceCategoryId: this.individualFeaturesMode ? 2 : undefined,
          serviceCategoryName: this.individualFeaturesMode ? 'Individual Features' : undefined,
          featureCategoryId: this.selectedSubCategory === 'productivity' ? 2 : undefined,
          featureCategoryName: this.selectedSubCategory === 'productivity' ? 'Agent Productivity' : undefined,
          cost_case_usage: Number(result.cost_case_usage || 0),
          total_cost: parseFloat(Number(result.total_cost).toFixed(2))
        };
        
        console.log('Processed Case result:', processedResult);
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating case costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateCustomerProfile(): void {
    if (!this.customerProfileForm.valid) return;
    
    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      cp_daily_azq: this.customerProfileForm.get('cp_daily_azq')?.value,
      cp_daily_ext: this.customerProfileForm.get('cp_daily_ext')?.value
    };
    
    console.log('Customer Profile calculation request:', calculationRequest);
    
    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        console.log('Raw Customer Profile API response:', result);
        
        const processedResult: CalculationResult = {
          ...result,
          serviceId: calculationRequest.serviceId,
          serviceName: 'Customer Profile',
          cp_daily_azq: Number(calculationRequest.cp_daily_azq),
          cp_daily_ext: Number(calculationRequest.cp_daily_ext),
          cost_cp_daily_azq: Number(result.cost_cp_daily_azq || 0),
          cost_cp_daily_ext: Number(result.cost_cp_daily_ext || 0),
          total_cost: parseFloat(Number(result.total_cost).toFixed(2))
        };
        
        console.log('Processed Customer Profile result:', processedResult);
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating customer profile costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateGuides(): void {
    if (!this.guidesForm.valid) return;
    
    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      msg_sent: this.guidesForm.get('msg_sent')?.value
    };
    
    console.log('Guides calculation request:', calculationRequest);
    
    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        console.log('Raw Guides API response:', result);
        
        const processedResult: CalculationResult = {
          ...result,
          serviceId: calculationRequest.serviceId,
          serviceName: 'Guides',
          msg_sent: Number(calculationRequest.msg_sent),
          cost_msg_sent: Number(result.cost_msg_sent || 0),
          total_cost: parseFloat(Number(result.total_cost).toFixed(2))
        };
        
        console.log('Processed Guides result:', processedResult);
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating guides costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateVoiceId(): void {
    if (!this.voiceIdForm.valid) return;

    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      voiceid_usage: this.voiceIdForm.get('voiceidUsage')?.value
    };

    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        const processedResult: CalculationResult = {
          ...result,
          serviceId: calculationRequest.serviceId,
          voiceid_usage: calculationRequest.voiceid_usage,
          cost_voiceid_usage: Number(result['cost_voiceid_usage'] || 0),
          total_cost: Number(result.total_cost || 0)
        };
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating Voice ID costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateVoiceIdProductivity(): void {
    if (!this.voiceIdForm.valid) return;

    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      voiceid_usage: this.voiceIdForm.get('voiceidUsage')?.value,
      serviceCategoryId: 2, // Individual Features
      featureCategoryId: 2  // Agent Productivity
    };

    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        const processedResult: CalculationResult = {
          ...result,
          serviceId: calculationRequest.serviceId,
          serviceName: "Voice ID",
          serviceCategoryId: 2,
          serviceCategoryName: "Individual Features",
          featureCategoryId: 2,
          featureCategoryName: "Agent Productivity",
          voiceid_usage: calculationRequest.voiceid_usage,
          cost_voiceid_usage: Number(result['cost_voiceid_usage'] || 0),
          total_cost: Number(result.total_cost || 0)
        };
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating Voice ID costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateAgentAssist(): void {
    if (!this.agentAssistForm.valid) return;

    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      agent_usage: this.agentAssistForm.get('agentUsage')?.value
    };

    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        const processedResult: CalculationResult = {
          ...result,
          serviceId: calculationRequest.serviceId,
          agent_usage: calculationRequest.agent_usage,
          cost_agent_usage: Number(result['cost_agent_usage'] || 0),
          total_cost: Number(result.total_cost || 0)
        };
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating Agent Assist costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateConnectServices(): void {
    const formValues = this.connectServicesForm.getRawValue();
    console.log('Connect Services form values:', formValues);
    
    const serviceId = this.serviceForm.get('service')?.value;
    
    const calculationRequest = {
      serviceId: serviceId,
      task_acs: Number(formValues.task_acs),
      invoice_acs: Number(formValues.invoice_acs),
      outbound_acs: Number(formValues.outbound_acs),
      chat_usage_acs: Number(formValues.chat_usage_acs),
      email_acs: Number(formValues.email_acs),
      sms_acs: Number(formValues.sms_acs),
      apple_acs: Number(formValues.apple_acs),
      whatsapp_acs: Number(formValues.whatsapp_acs),
      guide_acs: Number(formValues.guide_acs),
      outcamp_acs: Number(formValues.outcamp_acs)
    };

    console.log('Connect Services API request:', calculationRequest);
    
    this.loading = true;
    
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        console.log('Raw Connect Services API response:', result);
        
        const processedResult: CalculationResult = {
          ...result,
          serviceId: serviceId,
          serviceName: "Amazon Connect Services",
          
          // Input values from form
          invoice_acs: calculationRequest.invoice_acs || 0,
          outbound_acs: calculationRequest.outbound_acs || 0,
          chat_usage_acs: calculationRequest.chat_usage_acs || 0,
          email_acs: calculationRequest.email_acs || 0,
          task_acs: calculationRequest.task_acs || 0,
          sms_acs: calculationRequest.sms_acs || 0,
          apple_acs: calculationRequest.apple_acs || 0,
          whatsapp_acs: calculationRequest.whatsapp_acs || 0,
          guide_acs: calculationRequest.guide_acs || 0,
          outcamp_acs: calculationRequest.outcamp_acs || 0,
          
          // Cost fields from API response
          cost_invoice_acs: Number(result.cost_invoice_acs || 0),
          cost_outbound_acs: Number(result.cost_outbound_acs || 0),
          cost_chat_usage_acs: Number(result.cost_chat_usage_acs || 0),
          cost_email_acs: Number(result.cost_email_acs || 0),
          cost_task_acs: Number(result.cost_task_acs || 0),
          cost_sms_acs: Number(result.cost_sms_acs || 0),
          cost_apple_acs: Number(result.cost_apple_acs || 0),
          cost_whatsapp_acs: Number(result.cost_whatsapp_acs || 0),
          cost_guide_acs: Number(result.cost_guide_acs || 0),
          cost_outcamp_acs: Number(result.cost_outcamp_acs || 0),
          
          // Calculate total cost if not provided by API
          total_cost: Number(result.total_cost) || (
            Number(result.cost_invoice_acs || 0) +
            Number(result.cost_outbound_acs || 0) +
            Number(result.cost_chat_usage_acs || 0) +
            Number(result.cost_email_acs || 0) +
            Number(result.cost_task_acs || 0) +
            Number(result.cost_sms_acs || 0) +
            Number(result.cost_apple_acs || 0) +
            Number(result.cost_whatsapp_acs || 0) +
            Number(result.cost_guide_acs || 0) +
            Number(result.cost_outcamp_acs || 0)
          )
        };
        
        console.log('Processed Connect Services result:', processedResult);
        
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating connect services costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateConnectLens(): void {
    if (!this.connectLensForm.valid) return;

    // Extract form values
    const formValues = this.connectLensForm.value;

    // Create the request with ONLY the input values (not calculations)
    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      cl_voice_calls: Number(formValues.cl_voice_calls),
      cl_chat_message: Number(formValues.cl_chat_message),
      cl_performance_eval: Number(formValues.cl_performance_eval),
      cl_screen_rec: Number(formValues.cl_screen_rec),
      cl_external_voice: Number(formValues.cl_external_voice),
      cl_external_connector: Number(formValues.cl_external_connector)
    };

    console.log('Connect Lens API request:', calculationRequest);
    this.loading = true;
    
    // Let the backend handle all calculations
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        console.log('Raw Connect Lens API response:', result);
        
        // Check what form the cost data is in
        console.log('Cost data type check:', {
          cost_cl_voice_calls_type: typeof result['cost_cl_voice_calls'],
          cost_cl_voice_calls_value: result['cost_cl_voice_calls'],
          // Check bracket notation only
          bracket_type: typeof result['cost_cl_voice_calls'],
          bracket_value: result['cost_cl_voice_calls']
        });
        
        // Process the result to ensure numeric values
        const processedResult: CalculationResult = {
          ...result,
          serviceId: calculationRequest.serviceId,
          serviceName: "Connect Lens",
          
          // Ensure all input values are stored as numbers
          cl_voice_calls: calculationRequest.cl_voice_calls,
          cl_chat_message: calculationRequest.cl_chat_message,
          cl_performance_eval: calculationRequest.cl_performance_eval,
          cl_screen_rec: calculationRequest.cl_screen_rec,
          cl_external_voice: calculationRequest.cl_external_voice,
          cl_external_connector: calculationRequest.cl_external_connector,
          
          // Extract cost values using bracket notation to avoid TypeScript errors
          cost_cl_voice_calls: parseFloat(String(result['cost_cl_voice_calls'] || 0)),
          cost_cl_chat_message: parseFloat(String(result['cost_cl_chat_message'] || 0)),
          cost_cl_performance_eval: parseFloat(String(result['cost_cl_performance_eval'] || 0)),
          cost_cl_screen_rec: parseFloat(String(result['cost_cl_screen_rec'] || 0)),
          cost_cl_external_voice: parseFloat(String(result['cost_cl_external_voice'] || 0)),
          cost_cl_external_connector: parseFloat(String(result['cost_cl_external_connector'] || 0)),
        };
        
        // Calculate total cost manually to ensure it's correct, using bracket notation
        processedResult.total_cost = 
          processedResult['cost_cl_voice_calls'] +
          processedResult['cost_cl_chat_message'] +
          processedResult['cost_cl_performance_eval'] +
          processedResult['cost_cl_screen_rec'] +
          processedResult['cost_cl_external_voice'] +
          processedResult['cost_cl_external_connector'];
        
        console.log('Processed Connect Lens result with calculated costs:', processedResult);
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating connect lens costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateForecastingScheduling(): void {
    if (!this.forecastingSchedulingForm.valid) return;
    
    const calculationRequest = {
      serviceId: this.serviceForm.get('service')?.value,
      agent_forecasted: this.forecastingSchedulingForm.get('agent_forecasted')?.value
    };
    
    this.loading = true;
    this.apiService.calculateCosts(calculationRequest).subscribe({
      next: (result) => {
        const processedResult: CalculationResult = {
          ...result,
          serviceId: calculationRequest.serviceId,
          serviceName: "Forecasting and Scheduling",
          agent_forecasted: calculationRequest.agent_forecasted,
          cost_forecasting_scheduling: Number(result['cost_forecasting_scheduling'] || 0),
          total_cost: Number(result.total_cost || result['cost_forecasting_scheduling'] || 0)
        };
        this.handleCalculationResult(processedResult);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error calculating forecasting and scheduling costs:', error);
        this.loading = false;
      }
    });
  }

  onCalculateOutboundCampaign(): void {
    console.warn('Outbound Campaign is no longer available.');
  }

  onRegionChange(regionId: number): void {
    if (regionId) {
      this.loadCountriesByRegion(regionId);
    }
  }

  onCallTypeChange(callTypeId: number): void {
    if (callTypeId) {
      this.filterServicesByCallType(callTypeId);
    }
  }

  filterRegions(event: any): void {
    let searchValue = '';
    
    // Handle both direct string input and event input
    if (typeof event === 'object' && event.target && event.target.value !== undefined) {
      searchValue = event.target.value.toLowerCase();
    } else if (typeof event === 'string') {
      searchValue = event.toLowerCase();
    }
    
    this.filteredRegions = this.regions.filter(region => 
      region.region_name.toLowerCase().includes(searchValue)
    );
  }

  filterCountries(): void {
    if (!this.countries) {
      return;
    }
    
    // Get search keyword
    let search = this.countryFilterCtrl.value;
    if (!search) {
      this.filteredCountries = this.countries.slice();
      return;
    } else {
      search = search.toLowerCase();
    }
    
    // Filter countries
    this.filteredCountries = this.countries.filter(country => 
      country.country_name.toLowerCase().indexOf(search) > -1
    );
  }

  filterServicesByCallType(callTypeId: number): void {
    this.services.forEach(service => {
      service.matchesCallType = service.call_type_id === callTypeId || !service.call_type_id;
    });
  }

  handleCalculationResult(result: CalculationResult): void {
    if (!result) {
      console.error('No result provided to handleCalculationResult');
      return;
    }

    console.log('Handling calculation result:', result);
    
    // Create a clone to avoid reference issues
    const processedResult: CalculationResult = { ...result };
    
    // Add to our collections array
    this.calculationResults.unshift(processedResult);

    // Generate summary item
    let label = processedResult.serviceName || this.getServiceNameById(processedResult.serviceId || 0) || 'Unknown Service';
    if (processedResult.countryName) {
      label += ` (${processedResult.countryName})`;
    }

    const summary: CostSummary = {
      label: label,
      amount: Number(processedResult.total_cost) || 0,
      serviceId: processedResult.serviceId,
      id: processedResult.id || processedResult.calculation_id || processedResult.calculation_result_id 
    };
    
    this.costSummaries.unshift(summary);
    
    // Always attempt to find and sync the ID immediately
    if (!processedResult.id) {
      this.loading = true;
      
      // Use a key to identify this calculation and prevent duplicate syncs
      const syncKey = `${processedResult.serviceId}-${processedResult.total_cost}`;
      
      // Only sync if not already in progress for this calculation
      if (!this.calculationSaveInProgress.has(syncKey)) {
        console.log(`Auto-syncing calculation with key: ${syncKey}`);
        
        // Mark as in progress
        this.calculationSaveInProgress.set(syncKey, Date.now());
        
        // Use our improved match/create method
        this.apiService.findMatchingCalculationPublic(processedResult).subscribe({
          next: (match) => {
            const syncedId = this.apiService.extractCalculationId(match);
            this.loading = false;
            
            if (syncedId) {
              console.log(`Found existing calculation with ID: ${syncedId}`);
              
              // Update both the calculation result and cost summary with the ID
              processedResult.id = syncedId;
              processedResult.calculation_id = syncedId;
              processedResult.calculation_result_id = syncedId;
              
              this.costSummaries[0].id = syncedId;
            } else {
              console.log('No match found, creating new calculation');
              // If no match found, create a new one
              this.apiService.forceSaveCalculation(processedResult).subscribe({
                next: (savedResult) => {
                  const newId = this.apiService.extractCalculationId(savedResult);
                  
                  if (newId) {
                    console.log(`Created new calculation with ID: ${newId}`);
                    
                    // Update both the calculation result and cost summary
                    processedResult.id = newId;
                    processedResult.calculation_id = newId;
                    processedResult.calculation_result_id = newId;
                    
                    this.costSummaries[0].id = newId;
                  }
                },
                error: (err) => {
                  console.error('Error creating new calculation:', err);
                }
              });
            }
            
            // Remove from in-progress tracking
            this.calculationSaveInProgress.delete(syncKey);
          },
          error: (err) => {
            console.error('Error syncing calculation ID:', err);
            this.loading = false;
            this.calculationSaveInProgress.delete(syncKey);
          }
        });
      } else {
        console.log(`Sync already in progress for calculation with key: ${syncKey}`);
      }
    }
  }

  /**
   * Debug method to manually save a calculation
   */
  debugSaveCalculation(calculationResult: CalculationResult): void {
    if (calculationResult.id) {
      console.log('Calculation already has ID:', calculationResult.id);
      return;
    }
    
    this.loading = true;
    console.log('Manually syncing calculation ID');
    
    this.apiService.forceSaveCalculation(calculationResult).subscribe({
      next: (savedResult) => {
        this.loading = false;
        const id = this.apiService.extractCalculationId(savedResult);
        
        if (id) {
          console.log(`Calculation synced with ID: ${id}`);
          
          // Update the calculation with the ID
          calculationResult.id = id;
          calculationResult.calculation_id = id;
          calculationResult.calculation_result_id = id;
          
          // Update the cost summary with the ID
          const index = this.calculationResults.indexOf(calculationResult);
          if (index >= 0 && index < this.costSummaries.length) {
            this.costSummaries[index].id = id;
          }
        } else {
          console.warn('Failed to get ID for calculation');
        }
      },
      error: (err) => {
        console.error('Error syncing calculation ID:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Save a calculation to a collection
   */
  saveToCollection(index: number): void {
    const calculation = this.calculationResults[index];
    const calculationId = calculation.id || calculation.calculation_id || calculation.calculation_result_id;
    
    if (!calculationId) {
      console.warn('No ID found for this calculation, trying to sync ID first...');
      this.syncCalculationId(calculation);
      return;
    }
    
    // Open dialog to select or create a collection
    this.openAddToCollectionDialog(calculationId);
  }

  /**
   * Sync calculation ID with the backend
   */
  syncCalculationId(calculationResult: CalculationResult): void {
    if (calculationResult.id) {
      console.log('Calculation already has ID:', calculationResult.id);
      return;
    }
    
    this.loading = true;
    console.log('Auto-syncing calculation ID...');
    
    this.apiService.autoSyncCalculationId(calculationResult).subscribe({
      next: (result) => {
        this.loading = false;
        const id = this.apiService.extractCalculationId(result);
        
        if (id) {
          console.log(`Auto-synced with ID: ${id}`);
          
          // Update the calculation with the ID
          calculationResult.id = id;
          calculationResult.calculation_id = id;
          calculationResult.calculation_result_id = id;
          
          // Update the corresponding cost summary with ID
          const index = this.calculationResults.indexOf(calculationResult);
          if (index >= 0 && index < this.costSummaries.length) {
            this.costSummaries[index].id = id;
          }
        }
      },
      error: (err) => {
        console.error('Error auto-syncing calculation ID:', err);
        this.loading = false;
      }
    });
  }

  getTotalCost(): number {
    return this.costSummaries.reduce((total, summary) => total + (summary.amount || 0), 0);
  }

  scrollToResult(index: number): void {
    if (this.isBrowser) {
      const resultElement = document.getElementById(`result-${index}`);
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        resultElement.classList.add('highlight-result');
        setTimeout(() => {
          resultElement.classList.remove('highlight-result');
        }, 2000);
      }
    }
  }

  removeCostSummary(index: number): void {
    this.costSummaries.splice(index, 1);
    this.calculationResults.splice(index, 1);
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '$0.00';
    return this.currencyPipe.transform(amount, 'USD', 'symbol', '1.2-2') || '$0.00';
  }

  getServiceNameById(serviceId: number): string {
    if (!serviceId) return 'Unknown Service';
    const service = this.services.find(s => s.service_id === serviceId);
    if (service) {
      return service.service_name;
    }

    // Fallback for known service IDs
    switch(serviceId) {
      case SERVICE_IDS.CONNECT_LENS:
        return 'Connect Lens';
      case SERVICE_IDS.FORECASTING_SCHEDULING:
        return 'Forecasting and Scheduling';
      case SERVICE_IDS.VOICE_VIDEO:
        return 'Voice and Video';
      case SERVICE_IDS.MESSAGING_CHAT:
        return 'Messaging and Chat';
      case SERVICE_IDS.EMAIL:
        return 'Email';
      case SERVICE_IDS.TASK:
        return 'Task';
      case SERVICE_IDS.AMAZON_Q:
        return 'Amazon Q';
      case SERVICE_IDS.CASE:
        return 'Case';
      case SERVICE_IDS.CUSTOMER_PROFILE:
        return 'Customer Profile';
      case SERVICE_IDS.GUIDES:
        return 'Guides';
      case SERVICE_IDS.VOICE_ID:
        return 'Voice ID';
      case SERVICE_IDS.AGENT_ASSIST:
        return 'Agent Assist';
      case SERVICE_IDS.CONNECT_SERVICES:
        return 'Amazon Connect Services';
      default:
        console.warn(`Service ID ${serviceId} not found in services array`);
        return `Service ID ${serviceId}`;
    }
  }

  isMessagingChatResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.MESSAGING_CHAT;
  }

  isEmailResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.EMAIL;
  }

  isAmazonQResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.AMAZON_Q;
  }

  isTaskResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.TASK;
  }

  isCaseResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.CASE;
  }

  isCustomerProfileResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.CUSTOMER_PROFILE;
  }

  isGuidesResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.GUIDES;
  }

  isVoiceIdResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.VOICE_ID;
  }

  isAgentAssistResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.AGENT_ASSIST;
  }

  isConnectServicesResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.CONNECT_SERVICES;
  }

  isConnectLensResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.CONNECT_LENS;
  }

  isForecastingSchedulingResult(index: number): boolean {
    return this.calculationResults[index]?.serviceId === SERVICE_IDS.FORECASTING_SCHEDULING;
  }

  isOutboundCallType(index: number): boolean {
    return this.calculationResults[index]?.call_type_id === 2;
  }

  isInboundCallType(index: number): boolean {
    return this.calculationResults[index]?.call_type_id === 1;
  }

  /**
   * Update form fields for Amazon Q based on the selected channel type
   */
  updateAmazonQFormFields(channelType: string): void {
    if (channelType === 'chat') {
      this.amazonQForm.get('chatMessages')?.enable();
      this.amazonQForm.get('callDuration')?.disable();
    } else {
      this.amazonQForm.get('chatMessages')?.disable();
      this.amazonQForm.get('callDuration')?.enable();
    }
  }

  /**
   * Load countries based on the selected region
   */
  loadCountriesByRegion(regionId: number): void {
    this.apiService.getCountriesByRegion(regionId).subscribe({
      next: (data) => {
        this.countries = data;
        this.filteredCountries = this.countries.slice();
      },
      error: (err) => {
        console.error('Error loading countries:', err);
        this.countries = [];
        this.filteredCountries = [];
      }
    });
  }

  /**
   * Open dialog to add a calculation to a collection
   */
  private openAddToCollectionDialog(calculationId: number): void {
    if (!calculationId) {
      console.error('No calculation ID provided to openAddToCollectionDialog');
      return;
    }
    
    const dialogRef = this.dialog.open(AddToCollectionDialogComponent, {
      width: '400px',
      data: {
        calculationId: calculationId,
        collections: this.collections
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Refresh collections after successful addition
        this.loadCollections();
      }
    });
  }
}