export interface ApiItem {
  uuid: string;
  path: string;
  method: string;
  enabled: boolean;
  mock?: string;
}
