export type MailError = {
  message?: string;
  code?: string | number;
  response?: unknown;
  responseCode?: number;
};