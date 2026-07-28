/// <reference types="vite/client" />

interface ContactAddress {
  addressLine?: string[];
  city?: string;
  country?: string;
  dependentLocality?: string;
  postalCode?: string;
  region?: string;
  sortingCode?: string;
}

interface ContactEmail {
  address?: string;
}

interface ContactName {
  given?: string[];
  family?: string[];
  formatted?: string[];
}

interface ContactProperty {
  address?: ContactAddress[];
  email?: ContactEmail[];
  icon?: Blob[];
  name?: ContactName[];
  tel?: string[];
}

interface ContactsManager {
  select(properties: ('name' | 'tel' | 'email' | 'address' | 'icon')[], options?: { multiple?: boolean }): Promise<ContactProperty[]>;
}

interface Navigator {
  contacts?: ContactsManager;
}
