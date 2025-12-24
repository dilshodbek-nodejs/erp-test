export interface AuditFields {
  created_at: Date;
  created_by: string;

  confirmed_at?: Date;
  confirmed_by?: string;

  cancelled_at?: Date;
  cancelled_by?: string;
  cancellation_reason?: string;
}
