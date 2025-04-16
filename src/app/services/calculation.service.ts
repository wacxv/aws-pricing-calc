import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalculationResult } from '../models/service.model';
import { CalculationRequest } from '../models/calculation-request.model';
import { VoicePricing, ChatPricing, EmailPricing, AmazonQPricing, TaskPricing } from '../models/pricing.model';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  calculateCost(request: any): Observable<CalculationResult> {
    return this.http.post<CalculationResult>(`${this.baseUrl}/calculations`, request);
  }

  getVoicePricing(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/calculations/voice-pricing`);
  }

  getChatPricing(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/calculations/chat-pricing`);
  }

  getEmailPricing(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/calculations/email-pricing`);
  }

  getAmazonQPricing(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/calculations/amazonq-pricing`);
  }

  getTaskPricing(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/calculations/task-pricing`);
  }

  // Add Voice ID pricing method
  getVoiceIdPricing(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/calculations/voiceid-pricing`);
  }

  getAgentAssistPricing(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/calculations/agentassist-pricing`);
  }

  getCalculationResults(): Observable<CalculationResult[]> {
    return this.http.get<CalculationResult[]>(`${this.baseUrl}/calculations/calculation-results`);
  }
}
