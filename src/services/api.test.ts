import { fetchHealth, fetchHello } from "./api";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fetchHealth", () => {
  it("calls fetch with http://localhost:8081/", async () => {
    // Req 8.1
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("PAF Backend Running"),
    });

    await fetchHealth();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8081/");
  });

  it("throws a descriptive error when fetch rejects", async () => {
    // Req 8.4
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(fetchHealth()).rejects.toThrow(/Network error/);
  });
});

describe("fetchHello", () => {
  it("calls fetch with http://localhost:8081/hello when called with no argument", async () => {
    // Req 8.2
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("Hello, World!"),
    });

    await fetchHello();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8081/hello");
  });

  it('calls fetch with http://localhost:8081/hello?name=Amith when called with "Amith"', async () => {
    // Req 8.2
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("Hello, Amith!"),
    });

    await fetchHello("Amith");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8081/hello?name=Amith"
    );
  });

  it("throws a descriptive error when fetch rejects", async () => {
    // Req 8.4
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(fetchHello()).rejects.toThrow(/Network error/);
  });
});
