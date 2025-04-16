export interface CollectionModel {
  // Support both property naming conventions
  id?: number;
  name?: string;
  collection_id?: number;
  collection_name?: string;
  
  // Use one set of properties internally but support both
  // for backwards compatibility
  created_at?: Date;
  updated_at?: Date;
}

export interface CollectionItem {
  collection_id: number;
  calculation_id: number;
  added_at?: string;
}
