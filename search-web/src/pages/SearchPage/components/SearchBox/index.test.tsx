import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchBox from "../SearchBox";
import "@testing-library/jest-dom/jest-globals";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { jest } from "@jest/globals";

// Mock onSearch callback
const mockOnSearch = jest.fn<(query: string) => Promise<void>>().mockResolvedValue(undefined);

describe("SearchBox Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the SearchBox component", () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("should update the input value when typing", () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "test" } });
    expect(input).toHaveValue("test");
  });

  it("should call onSearch when clicking the search button", () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    const searchButton = screen.getByRole("button", { name: /Search/i });
    fireEvent.change(input, { target: { value: "query" } });
    fireEvent.click(searchButton);
    expect(mockOnSearch).toHaveBeenCalledWith("query");
  });

  it("should show suggestions when typing more than 2 characters", async () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "chi" } });
    // Wait for suggestion list (rendered as a <ul>) to appear.
    await waitFor(() => {
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
  });

  it("should not show suggestions when input length is less than or equal to 2", async () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "ch" } });
    // There should be no suggestion list rendered
    await waitFor(() => {
      expect(screen.queryByRole("list")).toBeNull();
    });
  });

  it("should select a suggestion when clicked", async () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "chi" } });
    // Wait for suggestions to appear.
    const suggestionItems = await screen.findAllByText(/chi/i);
    // Click the first suggestion (assuming your suggestions data contains "child care")
    fireEvent.click(suggestionItems[0]);
    // Verify the input now holds the full suggestion text.
    expect(input).toHaveValue("child care");
    expect(mockOnSearch).toHaveBeenCalledWith("child care");
  });

  it("should hide suggestions when clicking outside", async () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "chi" } });
    await waitFor(() => {
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("list")).toBeNull();
    });
  });

  it("should handle Enter key press without an active suggestion", () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "query" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(mockOnSearch).toHaveBeenCalledWith("query");
  });

  it("should handle ArrowDown and ArrowUp navigation", async () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    // Type a term that returns multiple suggestions.
    fireEvent.change(input, { target: { value: "chi" } });
    // Wait for suggestions to appear.
    await waitFor(() => {
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
    const suggestionItems = screen.getAllByRole("listitem");

    // Press ArrowDown to select the first suggestion.
    fireEvent.keyDown(input, { key: "ArrowDown", code: "ArrowDown" });
    // Press ArrowDown again to move to the second suggestion if available.
    if (suggestionItems.length > 1) {
      fireEvent.keyDown(input, { key: "ArrowDown", code: "ArrowDown" });
    }
    // Now press ArrowUp to go back one.
    fireEvent.keyDown(input, { key: "ArrowUp", code: "ArrowUp" });
    // Press Enter to select the active suggestion.
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    // Expect the onSearch to be called with the active suggestion's text.
    // We use the suggestion text from the list item.
    expect(mockOnSearch).toHaveBeenCalledWith(suggestionItems[0].textContent || "");
  });

  it("should display the clear button and clear input when clicked", () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "query" } });
    // Clear button should appear (button displays "×")
    const clearButton = screen.getByRole("button", { name: /×/ });
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    expect(input).toHaveValue("");
  });

  it("should show suggestions on input focus if searchTerm exists", async () => {
    render(<SearchBox onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    // Manually set a value that qualifies for suggestions.
    fireEvent.change(input, { target: { value: "chi" } });
    // Simulate blur and then focus.
    fireEvent.blur(input);
    fireEvent.focus(input);
    // Suggestions should be shown again.
    await waitFor(() => {
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
  });
});
