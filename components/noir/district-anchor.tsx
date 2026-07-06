"use client"

/**
 * Drop one of these at the top of each "district" of the site (Roscoe
 * Street, Subway, Ragna Rock, Punchinello's Mansion, The Final Night).
 * <DistrictRail> finds these via the data-district attribute and tracks
 * which one is currently centered in the viewport to light up the rail.
 */
export function DistrictAnchor({ district }: { district: string }) {
  return <div data-district={district} aria-hidden="true" className="h-px w-full" />
}
