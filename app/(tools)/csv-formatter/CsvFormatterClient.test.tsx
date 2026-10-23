import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/shared/Toast";
import { downloadBlob } from "@/lib/download";
import { CsvFormatterClient } from "./CsvFormatterClient";

vi.mock("@/lib/download", () => ({ downloadBlob: vi.fn() }));

const mockWriteText = vi.fn().mockResolvedValue(undefined);

function renderClient() {
  return render(
    <ToastProvider>
      <CsvFormatterClient />
    </ToastProvider>,
  );
}

const textarea = () => screen.getByLabelText("CSV or TSV input") as HTMLTextAreaElement;
const typeCsv = (value: string) => fireEvent.change(textarea(), { target: { value } });

describe("CsvFormatterClient", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    mockWriteText.mockClear();
    vi.mocked(downloadBlob).mockClear();
  });

  afterEach(cleanup);

  it("starts with an empty-state prompt", () => {
    renderClient();
    expect(textarea().value).toBe("");
    expect(screen.getByText(/Paste some CSV or TSV above/)).toBeInTheDocument();
    expect(screen.queryByLabelText("CSV statistics")).not.toBeInTheDocument();
  });

  it("shows the parsed table and stats as soon as CSV is pasted", async () => {
    renderClient();
    typeCsv("name,role,city\nAda,Engineer,London\nGrace,Admiral,New York");

    expect(
      await screen.findByText(/Parsed CSV table, 2 data rows and 3 columns/),
    ).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("Ada")).toBeInTheDocument();
    expect(within(table).getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText("Rows").nextElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Columns").nextElementSibling).toHaveTextContent("3");
  });

  it("auto-detects a semicolon delimiter and says so", async () => {
    renderClient();
    typeCsv("name;age\nAda;36\nGrace;85");

    expect(await screen.findByText("detected Semicolon")).toBeInTheDocument();
    expect(screen.getByText(/Parsed CSV table, 2 data rows and 2 columns/)).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Ada")).toBeInTheDocument();
  });

  it("honours a manually selected delimiter", async () => {
    renderClient();
    typeCsv("name,age\nAda,36");

    await screen.findByText(/Parsed CSV table, 1 data row and 2 columns/);
    fireEvent.click(screen.getByRole("button", { name: "Tab" }));

    expect(
      await screen.findByText(/Parsed CSV table, 1 data row and 1 column/),
    ).toBeInTheDocument();
  });

  it("treats the first row as data when the header checkbox is off", async () => {
    renderClient();
    typeCsv("Ada,36\nGrace,85");
    await screen.findByText(/Parsed CSV table, 1 data row and 2 columns/);

    fireEvent.click(screen.getByLabelText("First row is the header"));

    expect(
      await screen.findByText(/Parsed CSV table, 2 data rows and 2 columns/),
    ).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("column_1")).toBeInTheDocument();
  });

  it("reports ragged rows and unclosed quotes with line numbers", async () => {
    renderClient();
    typeCsv('a,b,c\n1,2,3\n4,5\n6,"never closed');

    expect(await screen.findByText(/Line 3 has 2 columns but the header has 3/)).toBeInTheDocument();
    expect(screen.getByText(/is never closed/)).toBeInTheDocument();
    expect(screen.getAllByText(/3 errors/).length).toBeGreaterThan(0);
  });

  it("converts to JSON", async () => {
    renderClient();
    typeCsv("name,age\nAda,36");
    await screen.findByText(/Parsed CSV table/);

    fireEvent.click(screen.getByRole("tab", { name: "JSON" }));

    expect(await screen.findByText(/"name": "Ada"/)).toBeInTheDocument();
    expect(screen.getByText(/"age": "36"/)).toBeInTheDocument();
  });

  it("converts to TypeScript and renames the interface", async () => {
    renderClient();
    typeCsv("name,age,active\nAda,36,true");
    await screen.findByText(/Parsed CSV table/);

    fireEvent.click(screen.getByRole("tab", { name: "TypeScript" }));
    expect(await screen.findByText(/export interface Row/)).toBeInTheDocument();
    expect(screen.getByText(/age: string;/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Interface"), { target: { value: "Person" } });
    expect(await screen.findByText(/export interface Person/)).toBeInTheDocument();
  });

  it("keeps identifier-like values lossless in every output", async () => {
    renderClient();
    typeCsv("zip,phone,id,null,on\n02134,+15551234567,007,x,y");
    await screen.findByText(/Parsed CSV table/);

    fireEvent.click(screen.getByRole("tab", { name: "TypeScript" }));
    expect(await screen.findByText(/zip: string;/)).toBeInTheDocument();
    expect(screen.getByText(/phone: string;/)).toBeInTheDocument();
    expect(screen.getByText(/id: string;/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "SQL" }));
    expect(
      await screen.findByText(
        "INSERT INTO `records` (`zip`, `phone`, `id`, `null`, `on`) VALUES ('02134', '+15551234567', '007', 'x', 'y');",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "YAML" }));
    const yaml = await screen.findByText(/^- zip: "02134"/);
    expect(yaml.textContent).toContain('phone: "+15551234567"');
    expect(yaml.textContent).toContain('"null": "x"');
    expect(yaml.textContent).toContain('"on": "y"');
  });

  it("converts to YAML and SQL, using the table name field", async () => {
    renderClient();
    typeCsv("name,age\nAda,36");
    await screen.findByText(/Parsed CSV table/);

    fireEvent.click(screen.getByRole("tab", { name: "YAML" }));
    expect(await screen.findByText(/- name: "Ada"/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "SQL" }));
    expect(
      await screen.findByText("INSERT INTO `records` (`name`, `age`) VALUES ('Ada', 36);"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Table"), { target: { value: "people" } });
    expect(
      await screen.findByText("INSERT INTO `people` (`name`, `age`) VALUES ('Ada', 36);"),
    ).toBeInTheDocument();
  });

  it("copies and downloads the current output", async () => {
    renderClient();
    typeCsv("name\nAda");
    await screen.findByText(/Parsed CSV table/);
    fireEvent.click(screen.getByRole("tab", { name: "JSON" }));

    fireEvent.click(await screen.findByRole("button", { name: "Copy" }));
    await waitFor(() => expect(mockWriteText).toHaveBeenCalledWith('[\n  {\n    "name": "Ada"\n  }\n]'));

    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    expect(downloadBlob).toHaveBeenCalledWith(
      expect.stringContaining('"name": "Ada"'),
      "data.json",
      expect.stringContaining("application/json"),
    );
  });

  it("downloads the CSV tab as .tsv when the delimiter is a tab", async () => {
    renderClient();
    typeCsv("name\tage\nAda\t36");
    await screen.findByText(/detected Tab/);

    fireEvent.click(screen.getByRole("tab", { name: "CSV" }));
    fireEvent.click(await screen.findByRole("button", { name: "Download" }));

    expect(downloadBlob).toHaveBeenCalledWith(
      expect.stringContaining("name\tage"),
      "data.tsv",
      expect.stringContaining("tab-separated-values"),
    );
  });

  it("moves between output tabs with the arrow keys", async () => {
    renderClient();
    typeCsv("name\nAda");
    await screen.findByText(/Parsed CSV table/);

    const tableTab = screen.getByRole("tab", { name: "Table" });
    tableTab.focus();
    fireEvent.keyDown(tableTab, { key: "ArrowRight" });

    const csvTab = screen.getByRole("tab", { name: "CSV" });
    expect(csvTab).toHaveAttribute("aria-selected", "true");
    expect(csvTab).toHaveFocus();

    fireEvent.keyDown(csvTab, { key: "End" });
    expect(screen.getByRole("tab", { name: "Aligned" })).toHaveAttribute("aria-selected", "true");
  });

  it("loads the example and clears it again", async () => {
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));

    await waitFor(() => expect(textarea().value).toContain("Ada Lovelace"));
    expect(await screen.findByText(/Parsed CSV table, 4 data rows and 5 columns/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(textarea().value).toBe(""));
    expect(screen.getByText(/Paste some CSV or TSV above/)).toBeInTheDocument();
  });

  it("shows a validation warning for duplicate headers", async () => {
    renderClient();
    typeCsv("name,name\nAda,Lovelace");

    expect(await screen.findByText(/appears more than once/)).toBeInTheDocument();
    expect(screen.getAllByText(/1 warning/).length).toBeGreaterThan(0);
  });
});
