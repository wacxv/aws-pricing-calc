import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Region } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getRegions(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.baseUrl}/regions`);
  }
}
