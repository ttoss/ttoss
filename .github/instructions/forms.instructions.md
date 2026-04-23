---
applyTo: '**/*.ts, **/*.tsx'
description: Instructions for working with form validation schemas in the project.
---

Prefer using Zod for form validation schemas in new code. Zod provides better TypeScript support and a more intuitive API compared to Yup.

When creating or updating form validation schemas, follow these guidelines:

- Use Zod's schema definitions and validation methods.
- Avoid using Yup for new schemas; only maintain existing Yup schemas if necessary.
