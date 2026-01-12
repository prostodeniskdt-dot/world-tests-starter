export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function handleAPIError(error: unknown): {
  message: string;
  statusCode: number;
} {
  if (error instanceof APIError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    message: "Неизвестная ошибка",
    statusCode: 500,
  };
}
