class groqError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "GroqError";
    this.status = status;
    this.code = code;
  }
}

export default groqError;
