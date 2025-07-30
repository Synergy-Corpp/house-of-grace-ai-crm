
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Shared customer store - in a real app, this would be managed by a state management library or backend
export const customers: Customer[] = [];
