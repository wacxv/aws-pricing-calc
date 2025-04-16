import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Country } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getCountriesByRegion(regionId: number): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.baseUrl}/countries/${regionId}`);
  }
}
