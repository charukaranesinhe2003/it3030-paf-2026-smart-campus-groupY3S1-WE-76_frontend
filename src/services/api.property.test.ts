// Feature: paf-fullstack-setup, Property 3: API service URL construction

import * as fc from "fast-check";
import { fetchHello } from "./api";

// Mock global fetch to capture the URL argument
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    text: () => Promise.resolve("Hello, World!"),
  });
});

/**
 * Property 3: API service URL construction
 * Validates: Requirements 8.2
 *
 * For any optional name value (including undefined, empty string, and arbitrary
 * non-empty strings), fetchHello SHALL construct and call the correct backend URL:
 *   - http://localhost:8082/hello  when name is absent or empty
 *   - http://localhost:8082/hello?name={encodeURIComponent(name)}  when name is non-empty
 */
describe("Property 3: API service URL construction", () => {
  it("calls fetch with http://localhost:8082/hello when name is empty or undefined", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate empty strings and undefined-equivalent cases
        fc.oneof(
          fc.constant(undefined),
          fc.constant(""),
          fc.constant(null as unknown as string)
        ),
        async (name) => {
          mockFetch.mockReset();
          mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("Hello, World!"),
          });

          await fetchHello(name as string | undefined);

          expect(mockFetch).toHaveBeenCalledTimes(1);
          expect(mockFetch).toHaveBeenCalledWith("http://localhost:8082/hello");
        }
      )
    );
  });

  it("calls fetch with http://localhost:8082/hello?name=<encoded> when name is non-empty", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary non-empty strings
        fc.string({ minLength: 1 }),
        async (name) => {
          mockFetch.mockReset();
          mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(`Hello, ${name}!`),
          });

          await fetchHello(name);

          const expectedUrl = `http://localhost:8082/hello?name=${encodeURIComponent(name)}`;
          expect(mockFetch).toHaveBeenCalledTimes(1);
          expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
        }
      )
    );
  });
});
