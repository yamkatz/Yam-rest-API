class BizCardsError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);

    this.status = status;
  }
}

export { BizCardsError };
