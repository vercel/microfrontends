import { Ajv, type ErrorObject } from 'ajv';
import { parse } from 'jsonc-parser';
import { MicrofrontendError } from '../../errors';
import type { Config } from '../../schema/types';
import { SCHEMA } from '../../schema/utils/load';

const LIST_FORMATTER = new Intl.ListFormat('en', {
  style: 'long',
  type: 'disjunction',
});

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors) {
    return [];
  }
  const errorMessages: string[] = [];
  for (const error of errors) {
    // Ignore root errors that arise because AJV can't infer whether the config is a main config or a child config.
    // These errors are confusing for the user.
    if (
      error.instancePath === '' &&
      (error.keyword === 'anyOf' ||
        (error.keyword === 'required' &&
          error.params.missingProperty === 'partOf'))
    ) {
      continue;
    }

    // Ignore the first leading slash in the instance path to make the path more readable.
    const instancePath = error.instancePath.slice(1);
    const formattedInstancePath =
      instancePath === '' ? 'at the root' : `in field ${instancePath}`;

    // AJV errors are really cryptic, so this logic transforms them to nicer ones.
    // It is based on heuristics from introducing errors and observing what AJV produces.
    if (
      error.keyword === 'required' &&
      error.params.missingProperty === 'routing' &&
      instancePath.split('/').length === 2
    ) {
      errorMessages.push(
        `Unable to infer if ${instancePath} is the default app or a child app. This usually means that there is another error in the configuration.`,
      );
    } else if (
      error.keyword === 'anyOf' &&
      instancePath.split('/').length > 2
    ) {
      const anyOfErrors = errors.filter(
        (e) => e.instancePath === error.instancePath && e.keyword !== 'anyOf',
      );
      if (anyOfErrors.every((e) => e.keyword === 'type')) {
        const allowedTypes = LIST_FORMATTER.format(
          anyOfErrors.map((e) => {
            return e.keyword === 'type' ? String(e.params.type) : 'unknown';
          }),
        );
        errorMessages.push(
          `Incorrect type for ${instancePath}. Must be one of ${allowedTypes}`,
        );
      } else {
        errorMessages.push(
          `Invalid field for ${instancePath}. Possible error messages are ${LIST_FORMATTER.format(anyOfErrors.map((e) => e.message ?? ''))}`,
        );
      }
    } else if (
      error.keyword === 'additionalProperties' &&
      !(
        error.params.additionalProperty === 'routing' &&
        instancePath.split('/').length === 2
      )
    ) {
      errorMessages.push(
        `Property '${error.params.additionalProperty}' is not allowed ${formattedInstancePath}`,
      );
    } else if (error.keyword === 'required') {
      errorMessages.push(
        `Property '${error.params.missingProperty}' is required ${formattedInstancePath}`,
      );
    }
  }
  return errorMessages;
}

export function validateSchema(configString: string): Config {
  const parsedConfig = parse(configString) as Config;

  const ajv = new Ajv({ allowUnionTypes: true });
  const validate = ajv.compile(SCHEMA);
  const isValid = validate(parsedConfig);
  if (!isValid) {
    throw new MicrofrontendError(
      `Invalid microfrontends config:${formatAjvErrors(validate.errors)
        .map((error) => `\n - ${error}`)
        .join(
          '',
        )}\n\nSee https://openapi.vercel.sh/microfrontends.json for the schema.`,
      { type: 'config', subtype: 'does_not_match_schema' },
    );
  }

  return parsedConfig;
}
