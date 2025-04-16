import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { Region, Country, CallType, Service, CalculationResult } from '../models/service.model';
import { CollectionModel } from '../models/collection.model';
import { VoicePricing, ChatPricing, EmailPricing, AmazonQPricing, TaskPricing } from '../models/pricing.model';
import { map, catchError, tap, switchMap, retry, timeout, finalize } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5000'; // Replace with your API base URL

  constructor(private http: HttpClient) {}

  getRegions(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.baseUrl}/api/regions`);
  }

  getCountriesByRegion(regionId: number): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.baseUrl}/api/countries/${regionId}`);
  }

  getCallTypes(): Observable<CallType[]> {
    return this.http.get<CallType[]>(`${this.baseUrl}/api/call-types`);
  }

  getAllServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.baseUrl}/api/services`);
  }
  
  getAvailableServices(): Observable<number[]> {
    return this.getAllServices().pipe(
      map(services => services.map(service => service.service_id))
    );
  }

  getVoicePricing(): Observable<VoicePricing[]> {
    return this.http.get<VoicePricing[]>(`${this.baseUrl}/api/calculations/voice-pricing`);
  }

  getChatPricing(): Observable<ChatPricing[]> {
    return this.http.get<ChatPricing[]>(`${this.baseUrl}/api/calculations/chat-pricing`);
  }

  getEmailPricing(): Observable<EmailPricing[]> {
    return this.http.get<EmailPricing[]>(`${this.baseUrl}/api/calculations/email-pricing`);
  }

  getAmazonQPricing(): Observable<AmazonQPricing[]> {
    return this.http.get<AmazonQPricing[]>(`${this.baseUrl}/api/calculations/amazonq-pricing`);
  }

  getTaskPricing(): Observable<TaskPricing[]> {
    return this.http.get<TaskPricing[]>(`${this.baseUrl}/api/calculations/task-pricing`);
  }

  getCasePricing(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/calculations/case-pricing`);
  }

  getCustomerProfilePricing(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/calculations/customer-profile-pricing`);
  }

  getGuidesPricing(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/calculations/guides-pricing`);
  }

  getACSPricing(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/calculations/acs-pricing`);
  }


  calculateCosts(calculationRequest: any): Observable<CalculationResult> {
    console.log('Calculating costs with request:', calculationRequest);
    
    // Get the service ID from the request
    const serviceId = calculationRequest.serviceId;
    
    if (!serviceId) {
      return throwError(() => new Error('Service ID is required for calculation'));
    }
    
    // Use the appropriate endpoint based on service
    return this.http.post<CalculationResult>(`${this.baseUrl}/api/calculations`, calculationRequest).pipe(
      map(response => {
        // Ensure consistent response format
        if (!response.serviceId) {
          response.serviceId = serviceId;
        }
        
        // Ensure numeric total_cost
        if (response.total_cost && typeof response.total_cost === 'string') {
          response.total_cost = parseFloat(response.total_cost);
        }
        
        return response;
      }),
      catchError(error => {
        console.error('Calculation error:', error);
        return throwError(() => new Error(`Failed to calculate costs: ${error.message || 'Server error'}`));
      })
    );
  }

  getConnectServicesPricing(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/calculations/connect-services-pricing`);
  }

  getConnectLensPricing(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/calculations/contact-lens-pricing`);
  }

  getForecastingSchedulingPricing(agentForecasted: number): Observable<CalculationResult> {
    return this.http.get<any>(`${this.baseUrl}/api/calculations/forecasting-pricing`);
  }

  getConnectRates(): Observable<ConnectRates> {
    return this.http.get<ConnectRates>(`${this.baseUrl}/connect-rates`);
  }

  getAllCollections(): Observable<CollectionModel[]> {
    return this.http.get<CollectionModel[]>(`${this.baseUrl}/api/calculations/collections`);
  }

  getCollectionCalculations(collectionId: number): Observable<CalculationResult[]> {
    return this.http.get<CalculationResult[]>(`${this.baseUrl}/api/calculations/collections/${collectionId}`);
  }

  createCollection(collectionName: string): Observable<number> {
    return this.http.post<{collection_id: number}>(`${this.baseUrl}/api/calculations/collections`, { 
      collection_name: collectionName 
    }).pipe(
      map(response => response.collection_id)
    );
  }

  deleteCollection(collectionId: number): Observable<void> {
    if (!collectionId) {
      return throwError(() => new Error('Invalid collection ID'));
    }
    
    // Remove the cascade parameter entirely
    const url = `${this.baseUrl}/api/calculations/collections/${collectionId}`;
    
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`Collection ${collectionId} deleted`)),
      catchError(error => {
        console.error('Error deleting collection:', error);
        return throwError(() => new Error(error.message || 'Failed to delete collection'));
      })
    );
  }
  
  renameCollection(collectionId: number, newName: string): Observable<void> {
    if (!collectionId) {
      return throwError(() => new Error('Invalid collection ID'));
    }
    
    if (!newName || newName.trim() === '') {
      return throwError(() => new Error('Collection name cannot be empty'));
    }
    
    const url = `${this.baseUrl}/api/calculations/collections/${collectionId}`;
    const payload = { collection_name: newName };
    
    return this.http.patch<void>(url, payload).pipe(
      tap(() => console.log(`Collection ${collectionId} renamed to "${newName}"`)),
      catchError(error => {
        console.error('Error renaming collection:', error);
        return throwError(() => new Error(error.message || 'Failed to rename collection'));
      })
    );
  }

  addToCollection(collectionId: number, calculationOrId: number | CalculationResult): Observable<any> {
    const url = `${this.baseUrl}/api/calculations/collections/add`;
    
    // If it's a calculation result object, extract its ID or save it first
    if (typeof calculationOrId !== 'number') {
      // Check if the calculation already has an ID
      const calcId = this.extractCalculationId(calculationOrId);
      
      if (calcId) {
        // If we have an ID, use it directly
        console.log(`Using existing calculation ID: ${calcId}`);
        return this.http.post(url, {
          collection_id: collectionId,
          calculation_id: calcId
        });
      } else {
        // If no ID, use forceSaveCalculation to ensure we get an ID
        return this.forceSaveCalculation(calculationOrId).pipe(
          switchMap(savedCalculation => {
            const savedId = this.extractCalculationId(savedCalculation);
            
            if (!savedId) {
              return throwError(() => new Error('Could not obtain a valid ID for this calculation'));
            }
            
            console.log('Calculation saved with ID:', savedId);
            
            // Update the calculationOrId object with the ID
            this.updateCalculationWithId(calculationOrId, savedId);
            
            const payload = {
              collection_id: collectionId,
              calculation_id: savedId
            };
            
            console.log('Adding calculation to collection with payload:', payload);
            return this.http.post(url, payload);
          }),
          catchError(error => {
            console.error('Error saving calculation before adding to collection:', error);
            return throwError(() => new Error('Failed to save calculation before adding to collection.'));
          })
        );
      }
    }
    
    // If it's a number, it's already a calculation ID
    const calculationId = calculationOrId;
    const payload = {
      collection_id: collectionId,
      calculation_id: calculationId
    };

    console.log('Adding calculation to collection with payload:', payload);
    
    return this.http.post(url, payload).pipe(
      tap(response => console.log('Add to collection response:', response)),
      catchError(error => {
        console.error('Error adding to collection:', error);
        return throwError(() => new Error('Failed to add to collection'));
      })
    );
  }

  addCalculationToCollection(calculationId: number, collectionId: number): Observable<any> {
    // Validate parameters
    if (!calculationId || isNaN(Number(calculationId))) {
      console.error('Invalid calculation ID:', calculationId);
      return throwError(() => new Error('Invalid calculation ID. Please save the calculation first.'));
    }
    
    if (!collectionId || isNaN(Number(collectionId))) {
      console.error('Invalid collection ID:', collectionId);
      return throwError(() => new Error('Invalid collection ID. Please select a valid collection.'));
    }

    const payload = {
      calculation_id: Number(calculationId), 
      collection_id: Number(collectionId)
    };
    
    console.log('Adding calculation to collection with payload:', payload);
    
    // Use the correct endpoint for adding calculations to collections
    return this.http.post(`${this.baseUrl}/api/calculations/collections/add`, payload).pipe(
      tap(response => console.log('Add to collection response:', response)),
      catchError(error => {
        console.error('Error adding to collection:', error);
        return throwError(() => new Error('Failed to add to collection: ' + (error.message || 'Unknown error')));
      })
    );
  }

  removeCalculationFromCollection(calculationId: number, collectionId: number): Observable<any> {
    if (!calculationId || isNaN(Number(calculationId))) {
      return throwError(() => new Error('Invalid calculation ID'));
    }
    
    if (!collectionId || isNaN(Number(collectionId))) {
      return throwError(() => new Error('Invalid collection ID'));
    }

    // Use the new endpoint format: DELETE /api/calculations/collections/:collectionId/calculation-results/:calculationId
    const url = `${this.baseUrl}/api/calculations/collections/${collectionId}/calculation-results/${calculationId}`;
    
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`Calculation ${calculationId} removed from collection ${collectionId}`)),
      catchError(error => {
        console.error('Error removing calculation from collection:', error);
        return throwError(() => new Error(error.message || 'Failed to remove calculation from collection'));
      })
    );
  }

  getCalculationResultId(calculationResult: CalculationResult): Observable<number> {
    // First, check if we already have an ID
    const existingId = this.extractCalculationId(calculationResult);
    
    if (existingId) {
      // If we already have a valid ID, return it immediately
      return of(existingId);
    }
    
    // Otherwise, save the calculation to get an ID
    return this.saveCalculation(calculationResult).pipe(
      map(savedResult => {
        const savedId = this.extractCalculationId(savedResult);
        if (!savedId) {
          throw new Error('Could not get a valid ID for the calculation');
        }
        return savedId;
      })
    );
  }

  getCalculationResultById(calculationId: number): Observable<CalculationResult> {
    if (!calculationId || isNaN(Number(calculationId))) {
      return throwError(() => new Error('Invalid calculation ID'));
    }
    
    // Make sure we're using the specific calculation-results endpoint
    const url = `${this.baseUrl}/api/calculations/calculation-results/${calculationId}`;
    console.log(`Fetching calculation result from: ${url}`);
    
    return this.http.get<CalculationResult>(url).pipe(
      tap(result => console.log(`Retrieved calculation result for ID ${calculationId}:`, result)),
      catchError(error => {
        console.error(`Error fetching calculation result with ID ${calculationId}:`, error);
        return throwError(() => new Error(`Failed to fetch calculation result with ID ${calculationId}`));
      })
    );
  }

  getAllCalculationResults(): Observable<CalculationResult[]> {
    const url = `${this.baseUrl}/api/calculations/calculation-results`;
    console.log(`Fetching all calculation results from: ${url}`);
    
    return this.http.get<CalculationResult[]>(url).pipe(
      tap(results => console.log(`Retrieved ${results.length} calculation results`)),
      catchError(this.handleError('getAllCalculationResults', []))
    );
  }

  saveCalculationResult(data: Partial<CalculationResult>): Observable<CalculationResult> {
    const calculationData = {
      id: data.id || undefined,
      countryName: data.countryName || 'Global',
      countryCode: data.countryCode || 'N/A',
      serviceName: data.serviceName || 'Saved Calculation',
      total_cost: data.total_cost || 0,
      cost_invoice_acs: data.cost_invoice_acs || 0,
      cost_outbound_acs: data.cost_outbound_acs || 0,
      cost_chat_usage_acs: data.cost_chat_usage_acs || 0,
      cost_email_acs: data.cost_email_acs || 0,
      cost_task_acs: data.cost_task_acs || 0,
      ...data
    };

    console.log('Saving calculation result:', calculationData);
    
    // Use the existing API endpoint for calculations
    return this.http.post<any>(`${this.baseUrl}/api/calculations`, calculationData).pipe(
      map(response => {
        if (response['insertId']) {
          response['calculation_id'] = response['insertId'];
          response['calculation_result_id'] = response['insertId'];
          response.id = response['insertId'];
        }
        return response as CalculationResult;
      }),
      tap(savedResult => console.log('Calculation saved successfully with ID:', 
        savedResult['calculation_id'] || savedResult['calculation_result_id'] || savedResult.id || savedResult['insertId'])),
      catchError(error => {
        console.error('Error saving calculation result:', error);
        return throwError(() => new Error('Failed to save calculation result.'));
      })
    );
  }

  saveCalculation(calculationResult: CalculationResult): Observable<any> {
    console.log('Saving calculation:', calculationResult);
    
    // Make sure we're sending a clean object without circular references
    const cleanResult = { ...calculationResult };
    
    // Log ID fields before saving
    console.log('ID fields before save:', {
      id: cleanResult.id,
      calculation_id: cleanResult.calculation_id,
      calculation_result_id: cleanResult.calculation_result_id
    });
    
    // Since there's no /api/calculations/save endpoint, we need to use the calculation-results endpoint
    // First, check if the calculation has an ID
    if (this.extractCalculationId(cleanResult)) {
      console.log('Calculation already has an ID, checking if it exists in calculation-results');
      // If it has an ID, we should check if it exists in calculation-results
      return this.getCalculationResultById(this.extractCalculationId(cleanResult) as number).pipe(
        map(existingResult => {
          console.log('Calculation found in calculation-results:', existingResult);
          return existingResult;
        }),
        catchError(error => {
          // If not found, fall back to creating a new calculation
          console.log('Calculation not found in calculation-results, creating a new one');
          return this.createNewCalculation(cleanResult);
        })
      );
    } else {
      // No ID, create a new calculation
      console.log('Calculation has no ID, creating a new one');
      return this.createNewCalculation(cleanResult);
    }
  }

  private createNewCalculation(calculationData: CalculationResult): Observable<CalculationResult> {
    // Use the available endpoint to post the calculation
    const url = `${this.baseUrl}/api/calculations`;
    
    // Ensure we have the minimum required fields
    const payload = {
      ...calculationData,
      // Add any required fields that might be missing
      serviceId: calculationData.serviceId || calculationData['service_id'], 
      total_cost: calculationData.total_cost || 0,
      serviceName: calculationData.serviceName || 'Unknown Service'
    };
    
    console.log('Creating new calculation with payload:', payload);
    
    return this.http.post<any>(url, payload).pipe(
      tap(response => {
        console.log('Create calculation response:', response);
        
        // If we get a calculation ID in the response, update the original calculation
        const savedId = this.extractCalculationId(response);
        if (savedId) {
          console.log(`Calculation created with ID: ${savedId}`);
          
          // Update the original calculation object with the new ID
          this.updateCalculationWithId(calculationData, savedId);
        }
      }),
      map(response => {
        // Ensure the response has consistent ID fields
        const savedId = this.extractCalculationId(response);
        if (savedId) {
          this.updateCalculationWithId(response, savedId);
        }
        return response;
      }),
      catchError(error => {
        console.error('Error creating calculation:', error);
        return throwError(() => new Error('Failed to create calculation: ' + (error.message || 'Server error')));
      })
    );
  }

  forceSaveCalculation(calculationResult: CalculationResult): Observable<CalculationResult> {
    console.log('Force saving calculation to ensure we get an ID:', calculationResult);
    
    // Make sure we're sending a clean object
    const cleanData = { ...calculationResult };
    
    // Try multiple approaches to ensure we get an ID
    return this.saveCalculationResult(cleanData).pipe(
      switchMap(result => {
        const id = this.extractCalculationId(result);
        if (id) {
          console.log(`Force save successful, received ID: ${id}`);
          // Update the original object
          this.updateCalculationWithId(calculationResult, id);
          return of(result);
        } else {
          return this.createNewCalculation(calculationResult).pipe(
            switchMap(createResult => {
              const createId = this.extractCalculationId(createResult);
              if (createId) {
                console.log(`Create method returned ID: ${createId}`);
                this.updateCalculationWithId(calculationResult, createId);
                return of(createResult);
              } else {
                return this.findMatchingCalculation(calculationResult);
              }
            })
          );
        }
      }),
      catchError(error => {
        console.error('All save methods failed:', error);
        return this.findMatchingCalculation(calculationResult);
      })
    );
  }

  /**
   * Try to find a matching calculation in the database based on input parameters
   */
  private findMatchingCalculation(calculationResult: CalculationResult): Observable<CalculationResult> {
    console.log('Attempting to find a matching calculation in the database');
    
    return this.getAllCalculationResults().pipe(
      map(results => {
        if (!results || results.length === 0) {
          throw new Error('No calculations found in the database');
        }
        
        // Extract key identifying information
        const serviceId = calculationResult.serviceId || calculationResult['service_id'];
        const totalCost = calculationResult.total_cost;
        
        console.log(`Looking for calculation with serviceId=${serviceId} and totalCost=${totalCost}`);
        
        // First, sort all results by ID (descending) to prioritize recent matches
        results.sort((a, b) => {
          const idA = this.extractCalculationId(a) || 0;
          const idB = this.extractCalculationId(b) || 0;
          return idB - idA;
        });
        
        // Find exact match by comparing key input parameters
        let match = this.findExactInputMatch(results, calculationResult);
        
        if (match) {
          console.log('Found exact match by input parameters');
          const matchId = this.extractCalculationId(match);
          if (matchId) {
            this.updateCalculationWithId(calculationResult, matchId);
            return match;
          }
        }
        
        // If no exact input match, try matching by service ID and total cost
        match = results.find(r => 
          (r.serviceId === serviceId || r['service_id'] === serviceId) && 
          Math.abs(r.total_cost - totalCost) < 0.001
        );
        
        if (match) {
          console.log('Found match by service ID and total cost');
          const matchId = this.extractCalculationId(match);
          if (matchId) {
            this.updateCalculationWithId(calculationResult, matchId);
            return match;
          }
        }
        
        // Find all service matches (most recent first)
        const serviceMatches = results.filter(r => 
          r.serviceId === serviceId || r['service_id'] === serviceId
        );
        
        if (serviceMatches.length > 0) {
          console.log(`Found ${serviceMatches.length} matches with same service ID`);
          match = serviceMatches[0]; // First is most recent after sorting
          
          const matchId = this.extractCalculationId(match);
          if (matchId) {
            console.log('Using most recent match with same service ID');
            this.updateCalculationWithId(calculationResult, matchId);
            return match;
          }
        }
        
        // Last resort: use most recent calculation of any type
        if (results.length > 0) {
          const latestId = this.extractCalculationId(results[0]);
          if (latestId) {
            console.log(`Using most recent calculation: ${latestId}`);
            this.updateCalculationWithId(calculationResult, latestId);
            return results[0];
          }
        }
        
        throw new Error('Could not find a matching calculation');
      }),
      catchError(error => {
        console.error('Error finding matching calculation:', error);
        throw new Error('Failed to obtain a calculation ID');
      })
    );
  }

  /**
   * Public method to find a matching calculation in the database
   * This exposes the private findMatchingCalculation functionality
   */
  findMatchingCalculationPublic(calculationResult: CalculationResult): Observable<CalculationResult> {
    console.log('Finding matching calculation (public method)');
    return this.findMatchingCalculation(calculationResult);
  }

  /**
   * Efficiently find or create calculations with automatic ID syncing
   * This combines the best logic from findMatchingCalculation and findOrCreateCalculation
   */
  autoSyncCalculationId(calculationResult: CalculationResult): Observable<CalculationResult> {
    // Return immediately if the calculation already has an ID
    if (calculationResult.id || calculationResult.calculation_id || calculationResult.calculation_result_id) {
      return of(calculationResult);
    }
    
    return this.getAllCalculationResults().pipe(
      map(results => {
        if (!results || results.length === 0) {
          throw new Error('No calculations found in the database');
        }
        
        // Get key information for finding a match
        const serviceId = calculationResult.serviceId || calculationResult['service_id'];
        const totalCost = calculationResult.total_cost;
        
        // First try to find exact match by parameters
        const match = this.findExactInputMatch(results, calculationResult);
        
        if (match) {
          const matchId = this.extractCalculationId(match);
          if (matchId) {
            this.updateCalculationWithId(calculationResult, matchId);
            console.log('Auto-synced with exact parameter match, ID:', matchId);
            return match;
          }
        }
        
        // No match by parameters, try matching by service ID and total cost
        const costMatch = results.find(r => 
          (r.serviceId === serviceId || r['service_id'] === serviceId) && 
          Math.abs(r.total_cost - totalCost) < 0.001
        );
        
        if (costMatch) {
          const costMatchId = this.extractCalculationId(costMatch);
          if (costMatchId) {
            this.updateCalculationWithId(calculationResult, costMatchId);
            console.log('Auto-synced with cost match, ID:', costMatchId);
            return costMatch;
          }
        }
        
        // No matches found, will need to create a new one
        throw new Error('No matching calculation found');
      }),
      catchError(() => {
        // Create a new calculation result with automatic ID
        return this.saveCalculationResult(calculationResult).pipe(
          tap(saved => {
            const newId = this.extractCalculationId(saved);
            if (newId) {
              this.updateCalculationWithId(calculationResult, newId);
              console.log('Created new calculation with ID:', newId);
            }
          })
        );
      })
    );
  }

  /**
   * Find exact match based on service-specific input parameters
   */
  private findExactInputMatch(results: CalculationResult[], current: CalculationResult): CalculationResult | undefined {
    // Find service ID first
    const serviceId = current.serviceId || current['service_id'];
    
    // Find candidates with matching service ID
    const serviceMatches = results.filter(r => 
      (r.serviceId === serviceId || r['service_id'] === serviceId)
    );
    
    if (serviceMatches.length === 0) {
      console.log('No results with matching service ID');
      return undefined;
    }
    
    console.log(`Found ${serviceMatches.length} results with matching service ID`);
    
    // Match based on service type
    return serviceMatches.find(r => {
      // Voice/Video calculation (Service ID: 1)
      if (serviceId === 1 && 
          current['business_days'] !== undefined && 
          current['aht'] !== undefined && 
          current['daily_usage'] !== undefined) {
        // Match if business days, AHT and daily usage are the same
        return r['business_days'] === current['business_days'] && 
               (r['aht'] !== undefined && current['aht'] !== undefined ? 
                Math.abs(r['aht'] - current['aht']) < 0.001 : false) && 
               r['daily_usage'] === current['daily_usage'];
      }
      
      // Messaging/Chat calculation (Service ID: 2)
      else if (serviceId === 2 && 
               current['chatUsage'] !== undefined && 
               current['smsUsage'] !== undefined) {
        // Match messaging parameters
        return r['chatUsage'] === current['chatUsage'] && 
               r['smsUsage'] === current['smsUsage'] &&
               r['chatExperiences'] === current['chatExperiences'] &&
               r['forBusiness'] === current['forBusiness'];
      }
      
      // Email calculation (Service ID: 3)
      else if (serviceId === 3 && current['emailUsage'] !== undefined) {
        return r['emailUsage'] === current['emailUsage'];
      }
      
      // Amazon Q calculation (Service ID: 4)
      else if (serviceId === 4) {
        if (current['channelType'] === 'chat' && current['chatMessages'] !== undefined) {
          return r['channelType'] === 'chat' && r['chatMessages'] === current['chatMessages'];
        } else if (current['channelType'] === 'voice' && current['callDuration'] !== undefined) {
          return r['channelType'] === 'voice' && r['callDuration'] === current['callDuration'];
        }
      }
      
      // Task calculation (Service ID: 5)
      else if (serviceId === 5 && current['taskUsage'] !== undefined) {
        return r['taskUsage'] === current['taskUsage'];
      }
      
      // Connect Services (Service ID: 8)
      else if (serviceId === 8) {
        // Match if all connect service values are identical
        return r['invoice_acs'] === current['invoice_acs'] &&
               r['outbound_acs'] === current['outbound_acs'] &&
               r['chat_usage_acs'] === current['chat_usage_acs'] &&
               r['email_acs'] === current['email_acs'] &&
               r['task_acs'] === current['task_acs'] &&
               r['sms_acs'] === current['sms_acs'] &&
               r['apple_acs'] === current['apple_acs'] &&
               r['whatsapp_acs'] === current['whatsapp_acs'] &&
               r['guide_acs'] === current['guide_acs'] &&
               r['outcamp_acs'] === current['outcamp_acs'];
      }
      
      // For other services, fall back to total cost comparison
      return Math.abs(r.total_cost - current.total_cost) < 0.001;
    });
  }

  extractCalculationId(result: any): number | undefined {
    if (!result) return undefined;
    
    // Try to extract the ID from various possible fields
    let id: number | undefined;
    
    if (result.id && !isNaN(Number(result.id))) {
      id = Number(result.id);
    } else if (result.calculation_id && !isNaN(Number(result.calculation_id))) {
      id = Number(result.calculation_id);
    } else if (result.calculation_result_id && !isNaN(Number(result.calculation_result_id))) {
      id = Number(result.calculation_result_id);
    } else if (result.insertId && !isNaN(Number(result.insertId))) {
      id = Number(result.insertId);
    } else {
      // Check for nested structures in case the response wraps our data
      if (result.data) {
        return this.extractCalculationId(result.data);
      }
      
      // Try other common response formats
      if (result.result) {
        return this.extractCalculationId(result.result);
      }
      
      // Check for possible array responses
      if (Array.isArray(result) && result.length > 0) {
        return this.extractCalculationId(result[0]);
      }
      
      // Check for success/message style responses that might include the ID
      if (result.success && result.calculationId && !isNaN(Number(result.calculationId))) {
        return Number(result.calculationId);
      }
      
      // Some APIs return a message with an ID embedded
      if (result.message && typeof result.message === 'string') {
        const match = result.message.match(/ID[:\s]+(\d+)/i);
        if (match && match[1]) {
          return Number(match[1]);
        }
      }
    }
    
    // Return the ID if we found one, otherwise undefined
    return id;
  }

  updateCalculationWithId(calculation: any, id: number): void {
    if (!calculation) return;
    
    calculation.id = id;
    calculation.calculation_id = id;
    calculation.calculation_result_id = id;
  }

  /**
   * Find a matching calculation or create a new one with improved automatic ID syncing
   */
  findOrCreateCalculation(calculationResult: CalculationResult): Observable<CalculationResult> {
    console.log('Auto-syncing calculation ID by finding matching inputs or creating new...');
    
    // First check all calculation results instead of just recent ones
    return this.getAllCalculationResults().pipe(
      map(allResults => {
        console.log(`Checking ${allResults.length} total calculation results for matching inputs`);
        
        // Service ID must match
        const serviceId = calculationResult.serviceId || calculationResult['service_id'];
        const serviceMatches = allResults.filter(r => 
          r.serviceId === serviceId || r['service_id'] === serviceId
        );
        
        if (serviceMatches.length === 0) {
          console.log('No results with matching service ID');
          return null;
        }
        
        console.log(`Found ${serviceMatches.length} results with matching service ID`);
        
        // Sort by ID (most recent first, assuming higher IDs are more recent)
        serviceMatches.sort((a, b) => {
          const idA = this.extractCalculationId(a) || 0;
          const idB = this.extractCalculationId(b) || 0;
          return idB - idA;
        });
        
        // Find exact match based on service-specific parameters
        const exactMatch = this.findExactInputMatch(serviceMatches, calculationResult);
        
        if (exactMatch) {
          console.log('Found exact input parameter match:', exactMatch);
          // Add a property to indicate this was matched, not created
          exactMatch['matched'] = true;
          
          // Important: Update the ID in the original calculation object
          const matchId = this.extractCalculationId(exactMatch);
          if (matchId) {
            this.updateCalculationWithId(calculationResult, matchId);
          }
          
          return exactMatch;
        }
        
        // If no exact match, try most recent with same service ID
        if (serviceMatches.length > 0) {
          const recentMatch = serviceMatches[0]; // First is most recent after sorting
          console.log('No exact match found, using most recent with same service ID:', recentMatch);
          
          const recentId = this.extractCalculationId(recentMatch);
          if (recentId) {
            // Update the original calculation object with this ID
            this.updateCalculationWithId(calculationResult, recentId);
            recentMatch['matched'] = true;
            return recentMatch;
          }
        }
        
        return null;
      }),
      switchMap(match => {
        if (match) {
          return of(match);
        }
        
        // If no match, create a new calculation
        console.log('No matching calculation found, creating new one');
        return this.saveCalculationResult(calculationResult).pipe(
          tap(result => {
            // Extract ID from new result and update original calculation
            const newId = this.extractCalculationId(result);
            if (newId) {
              this.updateCalculationWithId(calculationResult, newId);
            }
            result['matched'] = false;
          })
        );
      })
    );
  }

  /**
   * Get recent calculation results
   */
  getRecentCalculationResults(limit: number = 25): Observable<CalculationResult[]> {
    const url = `${this.baseUrl}/calculation_results/recent?limit=${limit}`;
    return this.http.get<CalculationResult[]>(url).pipe(
      catchError(error => {
        console.error('Error fetching recent calculations:', error);
        return of([]);
      })
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      return throwError(() => new Error(`${operation} failed: ${error.message || 'Server error'}`));
    };
  }
}
