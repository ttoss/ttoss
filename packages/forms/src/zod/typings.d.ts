import type { z } from 'zod';

declare module 'zod' {
  interface ZodString {
    cnpj(message?: string): z.ZodEffects<this, string, string>;
    cpf(message?: string): z.ZodEffects<this, string, string>;
  }

  interface ZodEffects<
    T extends z.ZodTypeAny,
    Output = T['_output'],
    Input = T['_input'],
  > {
    cnpj(message?: string): z.ZodEffects<this, Output, Input>;
    cpf(message?: string): z.ZodEffects<this, Output, Input>;
  }
}

export {};
