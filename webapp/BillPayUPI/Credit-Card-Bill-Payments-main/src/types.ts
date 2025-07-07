export interface Bank {
  id: string;
  name: string;
  upiFormat: string;
  issuerPattern: RegExp;
  officialName: string;
  logo: string;
  cardTypes: string[];
}

export interface FormData {
  mobileNumber: string;
  cardNumber: string;
  bank: string;
  amount: string;
}

export interface ValidationErrors {
  mobileNumber?: string;
  cardNumber?: string;
  bank?: string;
  amount?: string;
}

export interface CardValidationResponse {
  Status: string;
  Scheme: string;
  Type: string;
  Issuer: string;
  CardTier: string;
  Country: {
    A2: string;
    A3: string;
    N3: string;
    ISD: string;
    Name: string;
    Cont: string;
  };
  Luhn: boolean;
}

export interface CardGroup {
  value: string;
  focused: boolean;
}
