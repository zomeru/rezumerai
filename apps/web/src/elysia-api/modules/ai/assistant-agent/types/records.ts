export interface ResumeListRow {
  id: string;
  public: boolean;
  title: string | null;
  updatedAt: Date;
}

export interface DraftListRow {
  id: string;
  title: string | null;
  updatedAt: Date;
}

export interface UserListRow {
  createdAt: Date;
  email: string;
  id: string;
  name: string | null;
  role: string;
}

export interface ErrorLogListRow {
  createdAt: Date;
  endpoint: string | null;
  errorName: string;
  functionName: string | null;
  id: string;
  isRead: boolean;
  method: string | null;
}

export interface AuditLogListRow {
  action: string;
  category: string;
  createdAt: Date;
  eventType: string;
  id: string;
  method: string | null;
  resourceType: string | null;
  serviceName: string;
  user: {
    email: string;
  } | null;
}

export interface AnalyticsActiveUserRow {
  userId: string | null;
}
