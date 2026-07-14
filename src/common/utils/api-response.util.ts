import { IApiSuccessResponse } from '../types/api-response.interface';

export class ApiResponseUtil {
  static success<T>(data: T, message?: string): IApiSuccessResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }
}
