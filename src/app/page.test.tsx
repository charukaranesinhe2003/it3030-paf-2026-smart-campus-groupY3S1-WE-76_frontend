import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "./page";

// Mock the API service module
jest.mock("@/services/api");

import { fetchHealth, fetchHello } from "@/services/api";

const mockFetchHealth = fetchHealth as jest.MockedFunction<typeof fetchHealth>;
const mockFetchHello = fetchHello as jest.MockedFunction<typeof fetchHello>;

beforeEach(() => {
  jest.clearAllMocks();
});

// Req 9.5: Static heading is always present
test('shows static heading "PAF Frontend Running"', async () => {
  // Use never-resolving promises so we stay in loading state
  mockFetchHealth.mockReturnValue(new Promise(() => {}));
  mockFetchHello.mockReturnValue(new Promise(() => {}));

  render(<Home />);

  expect(
    screen.getByRole("heading", { name: /PAF Frontend Running/i })
  ).toBeInTheDocument();
});

// Req 9.3: Loading indicator is visible while fetches are pending
test("shows loading indicator while fetches are pending", () => {
  mockFetchHealth.mockReturnValue(new Promise(() => {}));
  mockFetchHello.mockReturnValue(new Promise(() => {}));

  render(<Home />);

  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
});

// Req 9.1: Health response string is rendered after fetch resolves
test("displays health response after fetch resolves", async () => {
  mockFetchHealth.mockResolvedValue("PAF Backend Running");
  mockFetchHello.mockResolvedValue("Hello, World!");

  render(<Home />);

  await waitFor(() => {
    expect(screen.getByText("PAF Backend Running")).toBeInTheDocument();
  });
});

// Req 9.2: Hello response string is rendered after fetch resolves
test("displays hello response after fetch resolves", async () => {
  mockFetchHealth.mockResolvedValue("PAF Backend Running");
  mockFetchHello.mockResolvedValue("Hello, World!");

  render(<Home />);

  await waitFor(() => {
    expect(screen.getByText("Hello, World!")).toBeInTheDocument();
  });
});

// Req 9.4: Error message is displayed when fetch rejects; component does not crash
test("displays error message when fetch rejects and does not crash", async () => {
  mockFetchHealth.mockRejectedValue(new Error("Network error: backend unreachable"));
  mockFetchHello.mockRejectedValue(new Error("Network error: backend unreachable"));

  await act(async () => {
    render(<Home />);
  });

  await waitFor(() => {
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });

  // Component should still render the static heading (no crash)
  expect(
    screen.getByRole("heading", { name: /PAF Frontend Running/i })
  ).toBeInTheDocument();
});
