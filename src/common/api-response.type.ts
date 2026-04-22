export interface ApiMeta {
  trace_id: string;
  timestamp: string;
  version: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}
