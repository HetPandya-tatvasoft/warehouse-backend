export interface IApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface IApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  errorCode?: string;
}

export type IApiResponse<T> = IApiSuccessResponse<T> | IApiErrorResponse;

export interface IPaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
