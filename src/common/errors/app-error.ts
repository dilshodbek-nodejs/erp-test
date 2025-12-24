export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public field?: string
  ) {
    super(message);
  }
}
