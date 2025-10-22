export type MicrofrontendErrorType =
  | 'config'
  | 'packageJson'
  | 'vercelJson'
  | 'application'
  | 'unknown';

export type MicrofrontendErrorSubtype =
  | 'not_found'
  | 'inference_failed'
  | 'not_found_in_env'
  | 'invalid_asset_prefix'
  | 'invalid_main_path'
  | 'does_not_match_schema'
  | 'unable_to_read_file'
  | 'unsupported_validation_env'
  | 'unsupported_version'
  | 'invalid_path'
  | 'invalid_permissions'
  | 'invalid_syntax'
  | 'missing_microfrontend_config_path'
  | 'unsupported_operation';

// A mapping of error types to their subtypes.
interface TypeToSubtype {
  application:
    | 'invalid_asset_prefix'
    | 'invalid_path'
    | 'multiple_package_managers'
    | 'not_found';
  config:
    | 'conflicting_paths'
    | 'depcrecated_field'
    | 'does_not_match_schema'
    | 'invalid_main_path'
    | 'invalid_preview_deployment_suffix'
    | 'multiple_default_applications'
    | 'no_default_application'
    | 'not_found_in_env'
    | 'not_found'
    | 'inference_failed'
    | 'unable_to_read_file'
    | 'invalid_syntax'
    | 'invalid_permissions'
    | 'unsupported_operation'
    | 'unsupported_validation_env'
    | 'unsupported_version';
  packageJson:
    | 'missing_field_name'
    | 'unable_to_read_file'
    | 'invalid_permissions'
    | 'invalid_syntax';
  vercelJson:
    | 'missing_field_microfrontend_config_path'
    | 'unable_to_read_file'
    | 'invalid_permissions'
    | 'invalid_syntax';
  unknown: never;
}

export type MicrofrontendErrorSource =
  | '@vercel/microfrontends'
  | '@vercel/microfrontends/next'
  | 'fs'
  | 'ajv';

export interface MicrofrontendErrorOptions<T extends MicrofrontendErrorType> {
  cause?: unknown;
  source?: MicrofrontendErrorSource;
  type?: T;
  subtype?: TypeToSubtype[T];
}

interface HandleOptions {
  fileName?: string;
}

export class MicrofrontendError<
  T extends MicrofrontendErrorType = 'unknown',
> extends Error {
  public source: MicrofrontendErrorSource;
  public type: T;
  public subtype?: TypeToSubtype[T];

  constructor(message: string, opts?: MicrofrontendErrorOptions<T>) {
    super(message, { cause: opts?.cause });
    this.name = 'MicrofrontendsError';
    this.source = opts?.source ?? '@vercel/microfrontends';
    this.type = opts?.type ?? ('unknown' as T);
    this.subtype = opts?.subtype;
    Error.captureStackTrace(this, MicrofrontendError);
  }

  isKnown(): boolean {
    return this.type !== 'unknown';
  }

  isUnknown(): boolean {
    return !this.isKnown();
  }

  /**
   * Converts an error to a MicrofrontendsError.
   * @param original - The original error to convert.
   * @returns The converted MicrofrontendsError.
   */
  static convert(
    original: Error,
    opts?: HandleOptions,
  ): MicrofrontendError<MicrofrontendErrorType> {
    if (opts?.fileName) {
      const err = MicrofrontendError.convertFSError(original, opts.fileName);
      if (err) {
        return err;
      }
    }

    if (
      original.message.includes(
        'Code generation from strings disallowed for this context',
      )
    ) {
      return new MicrofrontendError(original.message, {
        type: 'config',
        subtype: 'unsupported_validation_env',
        source: 'ajv',
      });
    }

    // unknown catch-all
    return new MicrofrontendError(original.message);
  }

  static convertFSError(
    original: Error,
    fileName: string,
  ): MicrofrontendError<MicrofrontendErrorType> | null {
    if (original instanceof Error && 'code' in original) {
      if (original.code === 'ENOENT') {
        return new MicrofrontendError(`Could not find "${fileName}"`, {
          type: 'config',
          subtype: 'unable_to_read_file',
          source: 'fs',
        });
      }
      if (original.code === 'EACCES') {
        return new MicrofrontendError(
          `Permission denied while accessing "${fileName}"`,
          {
            type: 'config',
            subtype: 'invalid_permissions',
            source: 'fs',
          },
        );
      }
    }

    if (original instanceof SyntaxError) {
      return new MicrofrontendError(
        `Failed to parse "${fileName}": Invalid JSON format.`,
        {
          type: 'config',
          subtype: 'invalid_syntax',
          source: 'fs',
        },
      );
    }

    return null;
  }

  /**
   * Handles an unknown error and returns a MicrofrontendsError instance.
   * @param err - The error to handle.
   * @returns A MicrofrontendsError instance.
   */
  static handle(
    err: unknown,
    opts?: HandleOptions,
  ): MicrofrontendError<MicrofrontendErrorType> {
    if (err instanceof MicrofrontendError) {
      return err as MicrofrontendError<MicrofrontendErrorType>;
    }

    // handle Error instances
    if (err instanceof Error) {
      return MicrofrontendError.convert(err, opts);
    }

    // handle object errors
    if (typeof err === 'object' && err !== null) {
      if ('message' in err && typeof err.message === 'string') {
        return MicrofrontendError.convert(new Error(err.message), opts);
      }
    }

    return new MicrofrontendError('An unknown error occurred');
  }
}
