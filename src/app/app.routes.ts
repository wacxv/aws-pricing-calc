import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CollectionComponent } from './components/collection/collection.component';
import { AddToCollectionDialogComponent } from './components/add-to-collection-dialog/add-to-collection-dialog.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'collections', component: CollectionComponent },
  { path: 'add-to-collection', component: AddToCollectionDialogComponent },
  { path: '**', redirectTo: '/home' }
];