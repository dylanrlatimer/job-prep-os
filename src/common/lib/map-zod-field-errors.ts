type ZodIssueLike = {
  path: PropertyKey[];
  message: string;
};

type ZodErrorLike = {
  issues: Array<ZodIssueLike>;
};

export function mapZodFieldErrorsFlat(error: ZodErrorLike): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in fieldErrors)) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export function mapZodFieldErrorsNested(error: ZodErrorLike): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.');
    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }

    const top = issue.path[0];
    if (typeof top === 'string' && !(top in fieldErrors)) {
      fieldErrors[top] = issue.message;
    }
  }

  return fieldErrors;
}
