declare module 'zod' {
  interface ZodString {
    cnpj(message?: string): ZodString;
    cpf(message?: string): ZodString;
  }
}

export {};
