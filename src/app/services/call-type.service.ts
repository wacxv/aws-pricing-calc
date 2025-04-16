import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CallType } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class CallTypeService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getCallTypes(): Observable<CallType[]> {
    return this.http.get<CallType[]>(`${this.baseUrl}/call-types`);
  }
}
