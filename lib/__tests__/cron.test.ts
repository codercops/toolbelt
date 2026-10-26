import { describe, expect, it } from "vitest";
import {
  describeCron,
  describeField,
  nextRuns,
  noRunsMessage,
  parseCron,
  type CronFieldName,
  type ParsedCron,
} from "../cron";

function parse(expression: string): ParsedCron {
  const result = parseCron(expression);
  if (!result.ok) throw new Error(`"${expression}" should parse: ${result.error}`);
  return result.value;
}

const describe_ = (expression: string) => describeCron(parse(expression));
const iso = (dates: Date[]) => dates.map((date) => date.toISOString().slice(0, 16) + "Z");
const runs = (expression: string, from: string, count = 5) =>
  iso(nextRuns(parse(expression), new Date(from), count));

describe("parseCron", () => {
  it("reads the five fields into their values", () => {
    const cron = parse("*/15 9-17 1,15 JAN-MAR MON-FRI");
    expect(cron.minute.values).toEqual([0, 15, 30, 45]);
    expect(cron.hour.values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(cron.dayOfMonth.values).toEqual([1, 15]);
    expect(cron.month.values).toEqual([1, 2, 3]);
    expect(cron.dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
    expect(cron.expression).toBe("*/15 9-17 1,15 JAN-MAR MON-FRI");
    expect(cron.macro).toBeUndefined();
  });

  it("expands * to every value, with day of week as 0 to 6", () => {
    const cron = parse("* * * * *");
    expect(cron.minute.values).toHaveLength(60);
    expect(cron.hour.values).toHaveLength(24);
    expect(cron.dayOfMonth.values).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    expect(cron.month.values).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(cron.dayOfWeek.values).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it.each([
    ["*/15 * * * *", "minute", [0, 15, 30, 45]],
    ["*/20 * * * *", "minute", [0, 20, 40]],
    ["5-59/20 * * * *", "minute", [5, 25, 45]],
    ["1-10/2 * * * *", "minute", [1, 3, 5, 7, 9]],
    ["0,30,15 * * * *", "minute", [0, 15, 30]],
    ["5,5,5 * * * *", "minute", [5]],
    ["10-12,20 * * * *", "minute", [10, 11, 12, 20]],
    ["* */6 * * *", "hour", [0, 6, 12, 18]],
    ["* * */10 * *", "dayOfMonth", [1, 11, 21, 31]],
    ["* * * */3 *", "month", [1, 4, 7, 10]],
    ["* * * * */2", "dayOfWeek", [0, 2, 4, 6]],
  ] as const)("reads %s", (expression, field, values) => {
    expect(parse(expression)[field].values).toEqual(values);
  });

  it("reads month and weekday names in any letter case, alone, in lists and in ranges", () => {
    expect(parse("0 0 * jan,Apr,JUL *").month.values).toEqual([1, 4, 7]);
    expect(parse("0 0 * MAR-MAY *").month.values).toEqual([3, 4, 5]);
    expect(parse("0 0 * * mon-fri").dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
    expect(parse("0 0 * * Sun,Sat").dayOfWeek.values).toEqual([0, 6]);
    expect(parse("0 0 * * MON-WED/2").dayOfWeek.values).toEqual([1, 3]);
  });

  it("treats day of week 7 as Sunday", () => {
    expect(parse("0 0 * * 7").dayOfWeek.values).toEqual([0]);
    expect(parse("0 0 * * 5-7").dayOfWeek.values).toEqual([0, 5, 6]);
    expect(parse("0 0 * * 0,7").dayOfWeek.values).toEqual([0]);
    expect(parse("0 0 * * 0-7").dayOfWeek.values).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("accepts extra spaces and tabs between and around the fields", () => {
    const cron = parse("  */5 \t 9   *  *\t1-5  ");
    expect(cron.expression).toBe("*/5 9 * * 1-5");
    expect(cron.minute.values).toHaveLength(12);
  });

  it("marks a field that starts with * as star, which cron treats as unrestricted", () => {
    const cron = parse("0 0 */2 * 1");
    expect(cron.dayOfMonth.star).toBe(true);
    expect(cron.dayOfWeek.star).toBe(false);
    expect(cron.month.star).toBe(true);
  });

  describe("macros", () => {
    it.each([
      ["@yearly", "0 0 1 1 *"],
      ["@annually", "0 0 1 1 *"],
      ["@monthly", "0 0 1 * *"],
      ["@weekly", "0 0 * * 0"],
      ["@daily", "0 0 * * *"],
      ["@midnight", "0 0 * * *"],
      ["@hourly", "0 * * * *"],
    ])("%s is the same as %s", (macro, expanded) => {
      const fromMacro = parse(macro);
      const fromFields = parse(expanded);
      expect(fromMacro.macro).toBe(macro);
      for (const name of ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] as const) {
        expect(fromMacro[name].values).toEqual(fromFields[name].values);
      }
    });

    it("reads a macro in any letter case", () => {
      expect(parse("@DAILY").macro).toBe("@daily");
    });

    it("explains that @reboot has no schedule", () => {
      const result = parseCron("@reboot");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/@reboot/);
    });

    it("rejects an unknown macro and lists the ones that work", () => {
      const result = parseCron("@sometimes");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/@sometimes.*@hourly.*@daily/);
    });
  });

  describe("errors", () => {
    function failure(expression: string) {
      const result = parseCron(expression);
      if (result.ok) throw new Error(`"${expression}" should not parse`);
      return result;
    }

    it("names the minute field for 60 * * * *", () => {
      const result = failure("60 * * * *");
      expect(result.field).toBe("minute");
      expect(result.error).toMatch(/minute/i);
      expect(result.error).toMatch(/60/);
    });

    it.each([
      ["* 24 * * *", "hour", /hour.*24/i],
      ["* * 0 * *", "dayOfMonth", /day of month.*0/i],
      ["* * 32 * *", "dayOfMonth", /day of month.*32/i],
      ["* * * 0 *", "month", /month.*0/i],
      ["* * * 13 *", "month", /month.*13/i],
      ["* * * * 8", "dayOfWeek", /day of week.*8/i],
      ["0-60 * * * *", "minute", /minute.*60/i],
      ["* 5-25 * * *", "hour", /hour.*25/i],
    ] as [string, CronFieldName, RegExp][])("names the field that failed in %s", (expression, field, message) => {
      const result = failure(expression);
      expect(result.field).toBe(field);
      expect(result.error).toMatch(message);
    });

    it.each([
      ["5-1 * * * *", "minute", /ends before it starts/],
      ["*/0 * * * *", "minute", /step "0"/],
      ["*/x * * * *", "minute", /step "x"/],
      ["*/-5 * * * *", "minute", /step "-5"/],
      ["1/2/3 * * * *", "minute", /more than one step/],
      ["5/15 * * * *", "minute", /needs \* or a range/],
      ["1,,2 * * * *", "minute", /empty entry/],
      [",1 * * * *", "minute", /empty entry/],
      ["1- * * * *", "minute", /not a valid range/],
      ["-5 * * * *", "minute", /not a valid range/],
      ["1-2-3 * * * *", "minute", /not a valid range/],
      ["? * * * *", "minute", /not a valid value/],
      ["a * * * *", "minute", /not a valid value/],
      ["MON * * * *", "minute", /not a valid value/],
      ["1.5 * * * *", "minute", /not a valid value/],
      ["* * * FOO *", "month", /"FOO"/],
      ["* * * * FUNDAY", "dayOfWeek", /"FUNDAY"/],
      ["* * * * 5-1", "dayOfWeek", /ends before it starts/],
      ["* * * MAR-JAN *", "month", /ends before it starts/],
      ["* * 5/2 * *", "dayOfMonth", /needs \* or a range/],
    ] as [string, CronFieldName, RegExp][])("rejects %s", (expression, field, message) => {
      const result = failure(expression);
      expect(result.error).toMatch(message);
      expect(result.field).toBe(field);
    });

    it("rejects an empty or blank expression", () => {
      for (const expression of ["", "   ", "\t\n"]) {
        expect(failure(expression).error).toMatch(/enter a cron expression/i);
      }
    });

    it("says how many fields it found when there are too few", () => {
      expect(failure("* * * *").error).toMatch(/Expected 5 fields.*found 4/);
      expect(failure("*").error).toMatch(/found 1/);
    });

    it("says that seconds and year fields are not supported when there are too many", () => {
      const result = failure("0 */5 * * * *");
      expect(result.error).toMatch(/found 6/);
      expect(result.error).toMatch(/Quartz/);
      expect(failure("0 0 0 1 1 ? 2030").error).toMatch(/found 7/);
    });

    it("reports the first field that fails when several do", () => {
      expect(failure("99 99 99 99 99").field).toBe("minute");
      expect(failure("0 99 99 99 99").field).toBe("hour");
    });
  });
});

describe("describeCron", () => {
  it.each([
    ["* * * * *", "Every minute"],
    ["*/15 * * * *", "Every 15 minutes"],
    ["*/5 * * * *", "Every 5 minutes"],
    ["0,30 * * * *", "Every 30 minutes"],
    ["0 * * * *", "Every hour, on the hour"],
    ["30 * * * *", "At minute 30 past every hour"],
    ["5,20,35,50 * * * *", "At minutes 5, 20, 35 and 50 past every hour"],
    ["0 9 * * 1-5", "At 09:00 on weekdays"],
    ["0 9 * * MON-FRI", "At 09:00 on weekdays"],
    ["0 22 * * 1-5", "At 22:00 on weekdays"],
    ["30 9,17 * * *", "At 09:30 and 17:30 every day"],
    ["0 9,12,17 * * *", "At 09:00, 12:00 and 17:00 every day"],
    ["0 */2 * * *", "Every 2 hours"],
    ["30 */6 * * *", "At 00:30, 06:30, 12:30 and 18:30 every day"],
    ["0 0 * * *", "At 00:00 every day"],
    ["0 0 1 * *", "At 00:00 on day 1 of the month"],
    ["0 12 1,15 * *", "At 12:00 on days 1 and 15 of the month"],
    ["0 0 1 1 *", "At 00:00 on day 1 of the month in January"],
    ["0 0 1 JAN,APR,JUL,OCT *", "At 00:00 on day 1 of the month in January, April, July and October"],
    ["0 0 1 */3 *", "At 00:00 on day 1 of the month in January, April, July and October"],
    ["0 0 * * 0", "At 00:00 on Sunday"],
    ["0 0 * * 7", "At 00:00 on Sunday"],
    ["0 0 * * 6,0", "At 00:00 on weekends"],
    ["0 0 * * 5-7", "At 00:00 on Friday through Sunday"],
    ["15 10 * * 1,3,5", "At 10:15 on Monday, Wednesday and Friday"],
    ["0 9-17 * * 1-5", "Every hour, on the hour, from 09:00 through 17:00 on weekdays"],
    ["*/10 9-17 * * 1-5", "Every 10 minutes, from 09:00 through 17:59 on weekdays"],
    ["* 9 * * *", "Every minute, from 09:00 through 09:59"],
    ["0 0 31 2 *", "At 00:00 on day 31 of the month in February"],
  ])("describes %s as %j", (expression, sentence) => {
    expect(describe_(expression)).toBe(sentence);
  });

  it.each([
    // Evenly spaced, but not a whole number of steps in the hour or the day, so not "every N"
    ["0,25,50 * * * *", "At minutes 0, 25 and 50 past every hour"],
    ["0,15,30 * * * *", "At minutes 0, 15 and 30 past every hour"],
    ["15,30,45 * * * *", "At minutes 15, 30 and 45 past every hour"],
    ["0 0,10,20 * * *", "At 00:00, 10:00 and 20:00 every day"],
    ["0 0,6,12 * * *", "At 00:00, 06:00 and 12:00 every day"],
  ])("does not call %s a regular interval", (expression, sentence) => {
    expect(describe_(expression)).toBe(sentence);
  });

  it("calls a schedule that fits whole steps into the hour or the day a regular interval", () => {
    expect(describe_("0,20,40 * * * *")).toBe("Every 20 minutes");
    expect(describe_("0-59/10 * * * *")).toBe("Every 10 minutes");
    expect(describe_("0 */8 * * *")).toBe("At 00:00, 08:00 and 16:00 every day");
    expect(describe_("0 0-23/2 * * *")).toBe("Every 2 hours");
  });

  it("says weekdays and 09:00 for 0 9 * * 1-5", () => {
    expect(describe_("0 9 * * 1-5")).toMatch(/weekdays/);
    expect(describe_("0 9 * * 1-5")).toMatch(/09:00/);
  });

  it("describes the day of month and the day of week together, since either one matches", () => {
    expect(describe_("0 0 1 * 1")).toBe("At 00:00 on day 1 of the month and on Monday");
    expect(describe_("0 8 1-7 * 1")).toBe("At 08:00 on days 1 through 7 of the month and on Monday");
  });

  // The day rule is the one nextRuns uses: when neither field starts with *, a day matches if
  // either one does, so a field that covers every value makes every day match.
  describe("days when a field covers every value", () => {
    it.each([
      ["0 0 1-31 * 1-5", "At 00:00 every day"],
      ["0 0 1-31 * 1", "At 00:00 every day"],
      ["0 0 1-31 * 6,0", "At 00:00 every day"],
      ["0 0 1,15 * 0-6", "At 00:00 every day"],
      ["0 0 1,15 * 0-7", "At 00:00 every day"],
      ["0 0 1 * 0-6", "At 00:00 every day"],
      ["0 0 1-31 * 0-6", "At 00:00 every day"],
      ["0 0 1-31 1 1-5", "At 00:00 in January"],
      ["0 0 1-31 * *", "At 00:00 every day"],
      ["0 0 * * 0-6", "At 00:00 every day"],
    ])("describes %s as %j", (expression, sentence) => {
      expect(describe_(expression)).toBe(sentence);
    });

    it("still says weekdays when the day of month is left open", () => {
      expect(describe_("0 0 * * 1-5")).toBe("At 00:00 on weekdays");
    });

    it("keeps both parts when neither field covers every value", () => {
      expect(describe_("0 0 1 * 1")).toBe("At 00:00 on day 1 of the month and on Monday");
      expect(describe_("0 0 1-15 * 1-5")).toBe("At 00:00 on days 1 through 15 of the month and on weekdays");
      expect(describe_("0 0 31 * 6,0")).toBe("At 00:00 on day 31 of the month and on weekends");
    });

    // Same grid as the next runs: says "every day" exactly when every day of the year runs.
    const DAYS_OF_MONTH = ["*", "*/2", "1", "1,15", "1-15", "15-31", "1-31", "1-30", "*/10"];
    const DAYS_OF_WEEK = ["*", "*/2", "0", "1", "1-5", "6,0", "0-6", "0-7", "1-6", "1-6,0"];
    const runsOnDay = (cron: ParsedCron, date: Date) => {
      const domMatch = cron.dayOfMonth.values.includes(date.getUTCDate());
      const dowMatch = cron.dayOfWeek.values.includes(date.getUTCDay());
      return !cron.dayOfMonth.star && !cron.dayOfWeek.star ? domMatch || dowMatch : domMatch && dowMatch;
    };
    const everyDayOfYear = (cron: ParsedCron) =>
      Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i))).every((date) => runsOnDay(cron, date));

    it.each(DAYS_OF_MONTH.flatMap((dom) => DAYS_OF_WEEK.map((dow) => [dom, dow])))(
      "says every day for day of month %s and day of week %s only when every day runs",
      (dom, dow) => {
        const expression = `0 0 ${dom} * ${dow}`;
        expect(describe_(expression) === "At 00:00 every day", expression).toBe(everyDayOfYear(parse(expression)));
      },
    );

    it("agrees with the next runs for the example in the issue", () => {
      // From Friday 23 October 2026: every day, weekends included
      expect(runs("0 0 1-31 * 1-5", "2026-10-23T10:00:00Z")).toEqual([
        "2026-10-24T00:00Z",
        "2026-10-25T00:00Z",
        "2026-10-26T00:00Z",
        "2026-10-27T00:00Z",
        "2026-10-28T00:00Z",
      ]);
      expect(describe_("0 0 1-31 * 1-5")).toBe("At 00:00 every day");
    });
  });

  // When only one of the two fields starts with *, both have to match, not either one.
  describe("days when a * with a step is combined with the other field", () => {
    it("says that both have to match", () => {
      expect(describe_("0 0 */10 * 1")).toBe("At 00:00 on days 1, 11, 21 and 31 of the month, but only on Monday");
      expect(describe_("0 0 1,15 * */2")).toBe(
        "At 00:00 on days 1 and 15 of the month, but only on Tuesday, Thursday, Saturday and Sunday",
      );
    });

    it("matches the next runs: only a Monday that is also day 1, 11, 21 or 31", () => {
      expect(runs("0 0 */10 * 1", "2026-10-23T10:00:00Z", 3)).toEqual([
        "2026-12-21T00:00Z",
        "2027-01-11T00:00Z",
        "2027-02-01T00:00Z",
      ]);
    });

    it("leaves a star with a step alone when the other field is open", () => {
      expect(describe_("0 0 */10 * *")).toBe("At 00:00 on days 1, 11, 21 and 31 of the month");
      expect(describe_("0 0 * * */2")).toBe("At 00:00 on Tuesday, Thursday, Saturday and Sunday");
    });
  });

  it.each([
    ["@hourly", "Every hour, on the hour"],
    ["@daily", "At 00:00 every day"],
    ["@midnight", "At 00:00 every day"],
    ["@weekly", "At 00:00 on Sunday"],
    ["@monthly", "At 00:00 on day 1 of the month"],
    ["@yearly", "At 00:00 on day 1 of the month in January"],
  ])("describes the macro %s", (macro, sentence) => {
    expect(describe_(macro)).toBe(sentence);
  });

  it("starts every sentence with a capital letter and has no trailing full stop", () => {
    for (const expression of ["* * * * *", "0 9 * * 1-5", "30 */6 * * *", "0 0 1 * 1", "@daily"]) {
      const sentence = describe_(expression);
      expect(sentence[0]).toBe(sentence[0].toUpperCase());
      expect(sentence.endsWith(".")).toBe(false);
    }
  });
});

describe("describeField", () => {
  it("explains each field in words", () => {
    const cron = parse("*/15 9-17 1,15 JAN-MAR MON-FRI");
    expect(describeField(cron.minute)).toBe("every 15 minutes (0, 15, 30, 45)");
    expect(describeField(cron.hour)).toBe("hours 09:00 through 17:00");
    expect(describeField(cron.dayOfMonth)).toBe("days 1 and 15");
    expect(describeField(cron.month)).toBe("January through March");
    expect(describeField(cron.dayOfWeek)).toBe("Monday through Friday");
  });

  it("says every ... for a wildcard", () => {
    const cron = parse("* * * * *");
    expect(describeField(cron.minute)).toBe("every minute");
    expect(describeField(cron.hour)).toBe("every hour");
    expect(describeField(cron.dayOfMonth)).toBe("every day of the month");
    expect(describeField(cron.month)).toBe("every month");
    expect(describeField(cron.dayOfWeek)).toBe("every day of the week");
  });

  it("names single values and keeps Sunday last in a week", () => {
    const cron = parse("5 3 15 6 0,6");
    expect(describeField(cron.minute)).toBe("minute 5");
    expect(describeField(cron.hour)).toBe("hour 03:00");
    expect(describeField(cron.dayOfMonth)).toBe("day 15");
    expect(describeField(cron.month)).toBe("June");
    expect(describeField(cron.dayOfWeek)).toBe("Saturday and Sunday");
  });
});

describe("nextRuns", () => {
  it("lists the next runs of */15 * * * * after a fixed UTC time", () => {
    expect(runs("*/15 * * * *", "2026-10-23T10:07:30Z")).toEqual([
      "2026-10-23T10:15Z",
      "2026-10-23T10:30Z",
      "2026-10-23T10:45Z",
      "2026-10-23T11:00Z",
      "2026-10-23T11:15Z",
    ]);
  });

  it("only returns times after the given time, not at it", () => {
    expect(runs("*/15 * * * *", "2026-10-23T10:15:00Z", 2)).toEqual(["2026-10-23T10:30Z", "2026-10-23T10:45Z"]);
    expect(runs("*/15 * * * *", "2026-10-23T10:14:59.999Z", 1)).toEqual(["2026-10-23T10:15Z"]);
  });

  it("skips the weekend for 0 9 * * 1-5", () => {
    // 2026-10-23 is a Friday, and 10:00 is already past that day's 09:00
    expect(runs("0 9 * * 1-5", "2026-10-23T10:00:00Z")).toEqual([
      "2026-10-26T09:00Z",
      "2026-10-27T09:00Z",
      "2026-10-28T09:00Z",
      "2026-10-29T09:00Z",
      "2026-10-30T09:00Z",
    ]);
    expect(runs("0 9 * * 1-5", "2026-10-23T08:00:00Z", 2)).toEqual(["2026-10-23T09:00Z", "2026-10-26T09:00Z"]);
  });

  it("matches a day when either the day of month or the day of week matches (0 0 1 * 1)", () => {
    expect(runs("0 0 1 * 1", "2026-10-23T10:00:00Z", 6)).toEqual([
      "2026-10-26T00:00Z", // Monday
      "2026-11-01T00:00Z", // the 1st, a Sunday
      "2026-11-02T00:00Z", // Monday
      "2026-11-09T00:00Z",
      "2026-11-16T00:00Z",
      "2026-11-23T00:00Z",
    ]);
  });

  it("matches the first Monday-or-first-week days when both are restricted (0 0 1-7 * 1)", () => {
    expect(runs("0 0 1-7 * 1", "2026-10-23T10:00:00Z", 4)).toEqual([
      "2026-10-26T00:00Z",
      "2026-11-01T00:00Z",
      "2026-11-02T00:00Z",
      "2026-11-03T00:00Z",
    ]);
  });

  it("needs both to match when one starts with * (0 0 */2 * 1: odd days that are a Monday)", () => {
    expect(runs("0 0 */2 * 1", "2026-10-23T10:00:00Z", 4)).toEqual([
      "2026-11-09T00:00Z",
      "2026-11-23T00:00Z",
      "2026-12-07T00:00Z",
      "2026-12-21T00:00Z",
    ]);
  });

  describe("a schedule that never runs", () => {
    it("returns no runs for 0 0 31 2 *, and explains why", () => {
      const cron = parse("0 0 31 2 *");
      expect(nextRuns(cron, new Date("2026-10-23T10:00:00Z"), 5)).toEqual([]);
      const message = noRunsMessage(cron);
      expect(message).toMatch(/never runs/);
      expect(message).toMatch(/February/);
      expect(message).toMatch(/31/);
    });

    it.each([
      ["0 0 30 2 *", /February.*30/],
      ["0 0 31 4,6,9,11 *", /April, June, September and November.*31/],
      ["0 0 30-31 2 *", /February.*30 and 31/],
    ])("returns no runs for %s", (expression, message) => {
      const cron = parse(expression);
      expect(nextRuns(cron, new Date("2026-01-01T00:00:00Z"), 5)).toEqual([]);
      expect(noRunsMessage(cron)).toMatch(message);
    });

    it("answers quickly instead of searching", () => {
      const cron = parse("0 0 31 2 *");
      const started = Date.now();
      nextRuns(cron, new Date("2026-01-01T00:00:00Z"), 100);
      expect(Date.now() - started).toBeLessThan(200);
    });

    it("still finds runs when a leap day is the only match, and skips 2100, which is not a leap year", () => {
      expect(runs("0 0 29 2 *", "2026-10-23T10:00:00Z", 3)).toEqual([
        "2028-02-29T00:00Z",
        "2032-02-29T00:00Z",
        "2036-02-29T00:00Z",
      ]);
      expect(runs("0 0 29 2 *", "2096-03-01T00:00:00Z", 1)).toEqual(["2104-02-29T00:00Z"]);
    });

    it("uses a generic message when the schedule is possible", () => {
      expect(noRunsMessage(parse("0 0 29 2 *"))).toBe("No run was found in the next ten years.");
    });

    it("never gives up on 31st-of-the-month schedules that do have months with 31 days", () => {
      expect(runs("0 0 31 * *", "2026-01-01T00:00:00Z", 4)).toEqual([
        "2026-01-31T00:00Z",
        "2026-03-31T00:00Z",
        "2026-05-31T00:00Z",
        "2026-07-31T00:00Z",
      ]);
    });
  });

  it("restricts to the months asked for", () => {
    expect(runs("0 0 1 JAN,JUL *", "2026-10-23T10:00:00Z", 3)).toEqual([
      "2027-01-01T00:00Z",
      "2027-07-01T00:00Z",
      "2028-01-01T00:00Z",
    ]);
  });

  it("rolls over the year", () => {
    expect(runs("59 23 31 12 *", "2026-12-31T23:59:00Z", 2)).toEqual(["2027-12-31T23:59Z", "2028-12-31T23:59Z"]);
    expect(runs("0 0 * * *", "2026-12-31T12:00:00Z", 2)).toEqual(["2027-01-01T00:00Z", "2027-01-02T00:00Z"]);
  });

  it("treats Sunday as 0 and as 7", () => {
    const expected = ["2026-10-25T00:00Z", "2026-11-01T00:00Z", "2026-11-08T00:00Z"];
    expect(runs("0 0 * * 0", "2026-10-23T10:00:00Z", 3)).toEqual(expected);
    expect(runs("0 0 * * 7", "2026-10-23T10:00:00Z", 3)).toEqual(expected);
    expect(runs("0 0 * * SUN", "2026-10-23T10:00:00Z", 3)).toEqual(expected);
  });

  it("lists the runs of a macro", () => {
    expect(runs("@yearly", "2026-10-23T10:00:00Z", 3)).toEqual(["2027-01-01T00:00Z", "2028-01-01T00:00Z", "2029-01-01T00:00Z"]);
    expect(runs("@hourly", "2026-10-23T10:30:00Z", 2)).toEqual(["2026-10-23T11:00Z", "2026-10-23T12:00Z"]);
  });

  it("lists several times within a day in order", () => {
    expect(runs("30 9,17 * * *", "2026-10-23T00:00:00Z", 4)).toEqual([
      "2026-10-23T09:30Z",
      "2026-10-23T17:30Z",
      "2026-10-24T09:30Z",
      "2026-10-24T17:30Z",
    ]);
  });

  describe("count", () => {
    const cron = parse("* * * * *");
    const from = new Date("2026-10-23T10:00:00Z");

    it("returns nothing for zero or negative counts", () => {
      expect(nextRuns(cron, from, 0)).toEqual([]);
      expect(nextRuns(cron, from, -3)).toEqual([]);
    });

    it("rounds a fractional count down", () => {
      expect(nextRuns(cron, from, 2.9)).toHaveLength(2);
    });

    it("caps the count at 100", () => {
      expect(nextRuns(cron, from, 5000)).toHaveLength(100);
    });
  });

  describe("time zones", () => {
    it("runs in UTC by default and when asked", () => {
      const from = new Date("2026-10-23T10:07:00Z");
      const cron = parse("30 14 * * *");
      expect(nextRuns(cron, from, 1)[0].toISOString()).toBe("2026-10-23T14:30:00.000Z");
      expect(nextRuns(cron, from, 1, { utc: true })[0].toISOString()).toBe("2026-10-23T14:30:00.000Z");
    });

    it("runs at the local time of day when utc is false", () => {
      const from = new Date(2026, 9, 23, 8, 0);
      const found = nextRuns(parse("0 9 * * *"), from, 3, { utc: false });
      expect(found.map((date) => [date.getDate(), date.getHours(), date.getMinutes()])).toEqual([
        [23, 9, 0],
        [24, 9, 0],
        [25, 9, 0],
      ]);
    });

    it("follows the local weekday when utc is false", () => {
      const found = nextRuns(parse("0 0 * * 1"), new Date(2026, 9, 23, 12, 0), 3, { utc: false });
      expect(found.map((date) => [date.getDay(), date.getHours()])).toEqual([[1, 0], [1, 0], [1, 0]]);
      expect(found[0].getDate()).toBe(26);
    });
  });

  describe("compared with a minute-by-minute simulation", () => {
    // A deliberately naive reference: test every minute in the window against the fields.
    function simulate(cron: ParsedCron, from: Date, count: number, days: number): string[] {
      const found: string[] = [];
      const domRestricted = !cron.dayOfMonth.star;
      const dowRestricted = !cron.dayOfWeek.star;
      const start = Math.floor(from.getTime() / 60_000) * 60_000 + 60_000;
      for (let t = start; t < start + days * 1440 * 60_000 && found.length < count; t += 60_000) {
        const d = new Date(t);
        if (!cron.minute.values.includes(d.getUTCMinutes())) continue;
        if (!cron.hour.values.includes(d.getUTCHours())) continue;
        if (!cron.month.values.includes(d.getUTCMonth() + 1)) continue;
        const dom = cron.dayOfMonth.values.includes(d.getUTCDate());
        const dow = cron.dayOfWeek.values.includes(d.getUTCDay());
        if (!(domRestricted && dowRestricted ? dom || dow : dom && dow)) continue;
        found.push(d.toISOString().slice(0, 16) + "Z");
      }
      return found;
    }

    const from = new Date("2026-10-23T10:07:30Z");
    it.each([
      "* * * * *",
      "*/7 * * * *",
      "5,10 3 * * *",
      "0 9 * * 1-5",
      "0 0 1 * 1",
      "0 0 1-7 * 1",
      "0 0 */2 * 1",
      "30 */5 * * *",
      "15 14 1 * *",
      "0 0 * * 0",
      "0 12 15 JAN-MAR *",
      "*/20 8-18 * * MON-FRI",
      "0 0 29 2 *",
      "59 23 31 * *",
      "0 0 13 * 5",
      "0 6 * 2,4 6,0",
    ])("finds the same next runs as the simulation for %s", (expression) => {
      const cron = parse(expression);
      const days = expression === "0 0 29 2 *" ? 366 * 4 : 400;
      // The simulation only looks at a limited window, so compare the runs it finds
      // with the same number of runs from nextRuns, and make sure it found some.
      const expected = simulate(cron, from, 12, days);
      expect(expected.length).toBeGreaterThan(0);
      expect(iso(nextRuns(cron, from, 12)).slice(0, expected.length)).toEqual(expected);
    });
  });
});
