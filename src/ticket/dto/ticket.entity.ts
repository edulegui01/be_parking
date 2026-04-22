export interface Ticket {
  id: number;
  ticket_code: string;
  entry_date: Date;
  exit_date?: Date;
  is_auxiliary_ticket: boolean;
}
