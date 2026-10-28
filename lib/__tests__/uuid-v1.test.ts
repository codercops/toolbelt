import { describe, expect, it } from "vitest";
import { inspectUuid } from "../uuid";
function decode(value: string) {
  const result = inspectUuid(value);
  if (!result.ok || !result.v1) throw new Error("Expected RFC v1");
  return result.v1;
}
describe("UUID v1 decoding", () => {
  // Independent fixture: RFC 9562 Appendix A.1 and Figure 15.
  it("decodes the RFC test vector", () => {
    expect(decode("C232AB00-9414-11EC-B3C8-9F6BDECED846")).toEqual({
      timestamp100ns: "138648505420000000", unixMilliseconds: 1645557742000,
      utc: "2022-02-22T19:22:22.000Z", clockSequence: 13256, node: "9f6bdeced846",
    });
  });
  it("handles zero and maximum 60-bit timestamps and 14-bit clock sequences", () => {
    expect(decode("00000000-0000-1000-8000-000000000000")).toMatchObject({ timestamp100ns: "0", unixMilliseconds: -12219292800000, utc: "1582-10-15T00:00:00.000Z", clockSequence: 0, node: "000000000000" });
    expect(decode("ffffffff-ffff-1fff-bfff-ffffffffffff")).toMatchObject({ timestamp100ns: "1152921504606846975", unixMilliseconds: 103072857660684, clockSequence: 16383, node: "ffffffffffff" });
  });
  it("retains sub-millisecond ticks and floors instants immediately before Unix epoch", () => {
    expect(decode("13813fff-1dd2-11b2-8000-000000000000")).toMatchObject({ timestamp100ns: "122192927999999999", unixMilliseconds: -1, utc: "1969-12-31T23:59:59.999Z" });
    expect(decode("13814001-1dd2-11b2-8000-000000000000")).toMatchObject({ timestamp100ns: "122192928000000001", unixMilliseconds: 0 });
    expect(decode("13814000-1dd2-11b2-8000-000000000000").unixMilliseconds).toBe(0);
  });
  it("accepts compact input", () => {
    expect(decode("C232AB00941411ECB3C89F6BDECED846").clockSequence).toBe(13256);
  });
  it.each(["bad", "00000000-0000-1000-0000-000000000000", "00000000-0000-1000-c000-000000000000", "00000000-0000-1000-e000-000000000000", "00000000-0000-4000-8000-000000000000", "00000000-0000-7000-8000-000000000000"])("does not decode v1 fields for %s", value => {
    expect(inspectUuid(value)).not.toHaveProperty("v1");
  });
});
