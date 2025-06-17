export interface DPDCredentials {
  username: string;
  password: string;
}

export interface DPDAuthBody {
  UsernameOrEmailAddress: string;
  Password: string;
}

export interface DPDAuthResponse {
  result: string | null;
  targetUrl: null;
  success: boolean;
  error: DPDAuthError;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

export interface DPDAuthError {
  code: number;
  message: string;
  details?: string;
  validationErrors?: any[];
}
