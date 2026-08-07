import { describe, expect, it } from "vitest";
import { availabilityOf, isOpen } from "@/lib/availability";

const BASE = {
  isActive: true,
  questionCount: 20,
  startsAt: null,
  opensAt: null,
  closesAt: null,
};

const NOW = new Date("2026-06-15T10:00:00Z");

describe("availabilityOf", () => {
  it("ouvre un concours actif sans contrainte de date", () => {
    expect(availabilityOf(BASE, NOW).state).toBe("open");
    expect(isOpen(BASE, NOW)).toBe(true);
  });

  it("ferme un concours désactivé", () => {
    expect(availabilityOf({ ...BASE, isActive: false }, NOW).state).toBe("inactive");
  });

  it("signale un concours sans question", () => {
    expect(availabilityOf({ ...BASE, questionCount: 0 }, NOW).state).toBe("empty");
  });

  it("verrouille l'épreuve avant l'heure officielle", () => {
    const startsAt = new Date("2026-06-15T12:00:00Z");
    const availability = availabilityOf({ ...BASE, startsAt }, NOW);

    expect(availability.state).toBe("scheduled");
    expect(availability.state === "scheduled" && availability.startsAt).toEqual(startsAt);
  });

  it("ouvre l'épreuve dès l'heure officielle atteinte", () => {
    const startsAt = new Date("2026-06-15T10:00:00Z");
    expect(availabilityOf({ ...BASE, startsAt }, NOW).state).toBe("open");
  });

  it("respecte la fenêtre d'inscription", () => {
    expect(
      availabilityOf({ ...BASE, opensAt: new Date("2026-07-01T00:00:00Z") }, NOW).state,
    ).toBe("not-yet-open");

    expect(
      availabilityOf({ ...BASE, closesAt: new Date("2026-06-01T00:00:00Z") }, NOW).state,
    ).toBe("closed");
  });

  it("fait primer la clôture sur l'heure d'épreuve", () => {
    const availability = availabilityOf(
      {
        ...BASE,
        startsAt: new Date("2026-06-20T10:00:00Z"),
        closesAt: new Date("2026-06-01T00:00:00Z"),
      },
      NOW,
    );

    expect(availability.state).toBe("closed");
  });
});
