export type StringType = string;

export type UserType = {
  id: string;
  name: string;
  email: string;
};

export type ProjectType = {
  id: string;
  title: string;
  description: string;
  userId: string;
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
