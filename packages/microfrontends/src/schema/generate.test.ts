import { writeFileSync } from 'node:fs';
import { generateSchema, SCHEMA_ROOT } from './generate';

jest.mock('node:fs');

const destinationPath = 'schema/schema.json';

describe('generateSchema', () => {
  beforeEach(() => {
    (writeFileSync as jest.MockedFunction<typeof writeFileSync>).mockClear();
    (writeFileSync as jest.MockedFunction<typeof writeFileSync>)
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});
  });

  it('should not throw an error when generating the schema', () => {
    expect(() => {
      generateSchema({ destination: destinationPath });
    }).not.toThrow();
  });

  it('should call writeFileSync with the correct destination and schema content', () => {
    // Call the function to test the behavior
    generateSchema({ destination: destinationPath });

    // Check that writeFileSync was called with the correct destination path
    expect(writeFileSync).toHaveBeenCalledWith(
      destinationPath,
      expect.any(String), // Schema content should be a string (JSON stringified schema)
    );
  });

  it('generated schema should include a reference to the root type "Config"', () => {
    // Call the function
    generateSchema({ destination: destinationPath });
    expect.assertions(1);

    const callArgs = (
      writeFileSync as jest.MockedFunction<typeof writeFileSync>
    ).mock.calls[0];

    // Check that the callArgs exists and is an array before destructuring
    if (callArgs) {
      const [_, schemaContent] = callArgs;
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const parsedSchema = JSON.parse(schemaContent.toString()) as {
        $ref: string;
      };

      // eslint-disable-next-line jest/no-conditional-expect
      expect(parsedSchema.$ref).toEqual(`#/definitions/${SCHEMA_ROOT}`);
    }
  });
});
