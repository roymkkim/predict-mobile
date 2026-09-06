import React from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors, marketAccentColor } from "@/lib/sim/colors";
import type { BaseballLiveState, Match, Team } from "@/lib/sim/types";
import { ScoreStrip } from "@/components/sim/ScoreChartUnit";
import { useThemeMode } from "@/lib/sim/dsModeStore";
import { ColumnScore, ScoreUnit } from "@/components/sim/StandardCard";
import { Crest, PhotoAvatar } from "@/components/sim/Crest";
import { useAthletePhotos } from "@/lib/sim/athletePhotosStore";
import { LiveTimestamp } from "@/components/sim/LiveTimestamp";
import { useBaseballHeaderVariant } from "@/lib/sim/baseballHeaderStore";
import { geist } from "@/lib/sim/geistFonts";

// Sport-accurate scoring headers for detail pages, componentized from
// match-detail so any page can drop the right scoring unit into its header:
//  - scoreboard: team sports — avatar · big score · LIVE/clock · score · avatar
//  - duel: 1-v-1 (MMA/boxing, chess, esports) — names + round info, scores only when real
//  - tennis: player rows with flags, per-set boxes and current game points
//  - baseball: shared scoreboard with optional bases + B/S/O indicators
//  - rows: leaderboard sports (golf, racing, poker) — entrant row list
// Dispatch is driven by match.sport (new fixtures MUST set sport or they fall
// back to scoreboard).

export type HeaderKind = "scoreboard" | "duel" | "tennis" | "baseball" | "rows";
const BASEBALL_INACTIVE_COLOR = "#18181B";
const SCORE_HEADER_AVATAR_SIZE = 40;

export function headerKind(match: Match): HeaderKind {
  const sport = match.sport ?? "";
  return sport === "baseball"
    ? "baseball"
    : sport === "golf" || sport === "racing" || sport === "poker"
    ? "rows"
    : sport === "tennis"
      ? "tennis"
      : sport === "mma" || sport === "chess" || sport === "esports"
        ? "duel"
        : "scoreboard";
}

// Sport-specific scoreline text for a team row.
export function scoreline(match: Match, t: Team): string {
  if (t.scoreText !== undefined) {
    if (match.sport === "racing") return `${t.scoreText}${t.gap ? ` · ${t.gap}` : ""}`;
    if (match.sport === "golf") return `${t.scoreText}${t.thru !== undefined ? ` thru ${t.thru}` : ""}`;
    return t.scoreText;
  }
  return t.score !== undefined ? String(t.score) : "";
}

export function TeamAvatar({ t, size = 40, sport, flip = false }: { t: Team; size?: number; sport?: string; flip?: boolean }) {
  const preferFlag = Boolean(t.flag) || sport === "soccer" || sport === "tennis";
  return <Crest team={t} size={size} radius={Math.round(size * 0.25)} variant="logo" preferFlag={preferFlag} iconSport={sport} flip={flip} />;
}

// Centered LIVE stamp (dot + LIVE + clock/round) or date·time when upcoming.
export function LiveStamp({ match }: { match: Match }) {
  useThemeMode();
  return (
    <View style={{ alignItems: "center", gap: 3 }}>
      {match.live ? (
        <LiveTimestamp
          descriptor={match.live.mins}
          variant="stacked"
          liveColor={colors.greenOutline}
          descriptorColor={colors.textMuted}
          fontSize={12}
          align="center"
          pulse
          uppercaseDescriptor
        />
      ) : (
        <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted, textAlign: "center" }}>
          {`${match.date}${match.time ? `\n${match.time}` : ""}`}
        </Text>
      )}
    </View>
  );
}

function baseballInningLabel(value: string) {
  const parsed = value.trim().match(/^([TB])\s*(\d+)$/i);
  if (!parsed) return value;
  const inning = Number(parsed[2]);
  const suffix =
    inning % 100 >= 11 && inning % 100 <= 13
      ? "TH"
      : inning % 10 === 1
        ? "ST"
        : inning % 10 === 2
          ? "ND"
          : inning % 10 === 3
            ? "RD"
            : "TH";
  return `${parsed[1].toUpperCase() === "T" ? "▲" : "▼"} ${inning}${suffix}`;
}

// "● Live · {clock}" subheader row (date · time when upcoming).
export function SubHeader({
  match,
  liveDescriptor,
  marginTop = 8,
}: {
  match: Match;
  liveDescriptor?: string;
  marginTop?: number;
}) {
  useThemeMode();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop }}>
      {match.live ? (
        <LiveTimestamp
          descriptor={liveDescriptor ?? match.live.mins}
          variant="linear"
          liveColor={colors.greenOutline}
          descriptorColor={colors.textMuted}
          fontSize={14}
          align="center"
          pulse
          uppercaseDescriptor
        />
      ) : (
        <Text style={{ fontFamily: geist.medium, fontSize: 15, color: colors.textMuted }}>
          {`${match.date}${match.time ? ` · ${match.time}` : ""}`}
        </Text>
      )}
    </View>
  );
}

// Scoreboard header: the shared Panthers vs. Cardinals score strip.
export function ScoreboardHeader({ match, clock }: { match: Match; clock?: string }) {
  const [home, away] = match.teams;
  if (scoreline(match, home) === "" && scoreline(match, away) === "") {
    return <UpcomingVersusHeader match={match} />;
  }
  return (
    <View style={{ marginTop: 18 }}>
      <ScoreStrip
        left={{ icon: <TeamAvatar t={home} size={SCORE_HEADER_AVATAR_SIZE} sport={match.sport} />, score: scoreline(match, home), abbr: home.abbr ?? home.initial }}
        right={{ icon: <TeamAvatar t={away} size={SCORE_HEADER_AVATAR_SIZE} sport={match.sport} flip />, score: scoreline(match, away), abbr: away.abbr ?? away.initial }}
        clock={clock ?? (match.live ? match.live.mins : `${match.date}${match.time ? ` · ${match.time}` : ""}`)}
        live={!!match.live}
        alwaysShowAbbr
      />
    </View>
  );
}

function BaseballDiamond({
  occupied,
  homeColor,
  awayColor,
}: {
  occupied?: BaseballLiveState["bases"];
  homeColor: string;
  awayColor: string;
}) {
  const fill = (base: keyof NonNullable<BaseballLiveState["bases"]>) => {
    const runner = occupied?.[base];
    return runner === "home" ? homeColor : runner === "away" ? awayColor : BASEBALL_INACTIVE_COLOR;
  };
  return (
    <Svg width={51} height={51} viewBox="0 0 51 51" fill="none">
      <Path
        d="M23.1931 2.26274C24.4428 1.01306 26.4689 1.01306 27.7186 2.26274L34.5068 9.05097C35.7565 10.3006 35.7565 12.3268 34.5068 13.5765L27.7186 20.3647C26.4689 21.6144 24.4428 21.6144 23.1931 20.3647L16.4049 13.5765C15.1552 12.3268 15.1552 10.3006 16.4049 9.05097Z"
        fill={fill("second")}
      />
      <Path
        d="M37.3353 16.4048C38.585 15.1552 40.6111 15.1552 41.8608 16.4048L48.649 23.1931C49.8987 24.4427 49.8987 26.4689 48.649 27.7185L41.8608 34.5068C40.6111 35.7564 38.585 35.7564 37.3353 34.5068L30.5471 27.7185C29.2974 26.4689 29.2974 24.4427 30.5471 23.1931Z"
        fill={fill("first")}
      />
      <Path
        d="M9.05098 16.4048C10.3007 15.1552 12.3268 15.1552 13.5765 16.4048L20.3647 23.1931C21.6144 24.4427 21.6144 26.4689 20.3647 27.7185L13.5765 34.5068C12.3268 35.7564 10.3007 35.7564 9.05098 34.5068L2.26275 27.7185C1.01308 26.4689 1.01308 24.4427 2.26275 23.1931Z"
        fill={fill("third")}
      />
    </Svg>
  );
}

function BaseballCountDots({ label, count, total }: { label: string; count: number; total: number }) {
  const DOT_SIZE = 10;
  const DOT_GAP = 4;
  const LABEL_GAP = 4;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: LABEL_GAP }}>
      <Text style={{ width: 12, fontFamily: geist.bold, fontSize: 12, lineHeight: 16, color: colors.textMuted }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: DOT_GAP }}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={`${label}-${index}`}
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: index < count ? colors.textPrimary : BASEBALL_INACTIVE_COLOR,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function UpcomingVersusHeader({ match }: { match: Match }) {
  const [home, away] = match.teams;
  const teamLabel = (team: Team) => team.abbr ?? team.initial;

  const teamColumn = (team: Team, flip = false) => (
    <View style={{ width: SCORE_HEADER_AVATAR_SIZE, alignItems: "center", gap: 8 }}>
      <TeamAvatar t={team} size={SCORE_HEADER_AVATAR_SIZE} sport={match.sport} flip={flip} />
      <Text
        numberOfLines={1}
        style={{
          width: 88,
          marginHorizontal: -24,
          textAlign: "center",
          fontFamily: geist.medium,
          fontSize: 14,
          lineHeight: 18,
          color: colors.textAlternative,
        }}
      >
        {teamLabel(team).toUpperCase()}
      </Text>
    </View>
  );

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {teamColumn(home)}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 8 }}>
          <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted, textAlign: "center" }}>
            {match.date}
          </Text>
          {match.time ? (
            <Text style={{ fontFamily: geist.medium, fontSize: 12, lineHeight: 16, color: colors.textMuted, textAlign: "center" }}>
              {match.time}
            </Text>
          ) : null}
        </View>
        {teamColumn(away, true)}
      </View>
    </View>
  );
}

export function BaseballHeader({ match }: { match: Match }) {
  const [home, away] = match.teams;
  const baseball: BaseballLiveState = match.live?.baseball ?? {};

  if (!match.live) {
    return <UpcomingVersusHeader match={match} />;
  }

  return (
    <View>
      {/* Bases keeps the tennis timestamp placement and 14px typography, then
          uses the original score strip with the bases in its center slot. */}
      <SubHeader
        match={match}
        liveDescriptor={match.live ? baseballInningLabel(match.live.mins) : undefined}
        marginTop={0}
      />
      <View style={{ marginTop: 16 }}>
        <ScoreStrip
          left={{ icon: <TeamAvatar t={home} size={SCORE_HEADER_AVATAR_SIZE} sport={match.sport} />, score: scoreline(match, home), abbr: home.abbr ?? home.initial }}
          right={{ icon: <TeamAvatar t={away} size={SCORE_HEADER_AVATAR_SIZE} sport={match.sport} flip />, score: scoreline(match, away), abbr: away.abbr ?? away.initial }}
          clock=""
          live={false}
          alwaysShowAbbr
          centerContent={
             <View style={{ width: 63, height: 65, alignItems: "center", justifyContent: "center" }}>
              <BaseballDiamond
                occupied={baseball.bases}
                homeColor={marketAccentColor(home.color)}
                awayColor={marketAccentColor(away.color)}
              />
            </View>
          }
        />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16 }}>
          <BaseballCountDots label="B" count={baseball.balls ?? 0} total={4} />
          <BaseballCountDots label="S" count={baseball.strikes ?? 0} total={3} />
          <BaseballCountDots label="O" count={baseball.outs ?? 0} total={3} />
        </View>
      </View>
    </View>
  );
}

// 1-v-1 header: avatar + name columns; center shows LIVE + round/game info.
// Real match scores (chess points, esports maps) render under the names;
// fights without a score show nothing fake.
export function DuelHeader({ match }: { match: Match }) {
  const [home, away] = match.teams;
  const fighter = (t: Team) => (
    <View style={{ width: SCORE_HEADER_AVATAR_SIZE, alignItems: "center", gap: 8 }}>
      <TeamAvatar t={t} size={SCORE_HEADER_AVATAR_SIZE} />
      <Text
        numberOfLines={1}
        style={{
          width: 96,
          marginHorizontal: -28,
          textAlign: "center",
          fontFamily: geist.semibold,
          fontSize: 16,
          color: colors.textPrimary,
        }}
      >
        {t.name}
      </Text>
      {scoreline(match, t) !== "" ? (
        <Text style={{ fontFamily: geist.medium, fontSize: 24, color: colors.textPrimary }}>{scoreline(match, t)}</Text>
      ) : null}
    </View>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 26 }}>
      {fighter(home)}
      <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 8 }}>
        <LiveStamp match={match} />
      </View>
      {fighter(away)}
    </View>
  );
}

// Racquet-sport rows: identical to the market-card scoring unit (bare set
// numbers + bordered game chip), with two detail-page exceptions: no
// probability bar line, and 32px avatars (matching the cards).
export function TennisHeader({ match, inset = true }: { match: Match; inset?: boolean }) {
  return (
    <View style={{ paddingHorizontal: inset ? 16 : 0, marginTop: inset ? 16 : 0, gap: 16, width: "100%" }}>
      {match.teams.map((t) => (
          <View key={t.abbr ?? t.initial} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ marginRight: 12 }}>
              <HeaderAvatar t={t} />
            </View>
            <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: geist.semibold, fontSize: 14, lineHeight: 22, color: colors.textPrimary }}>
                {t.name}
              </Text>
              {t.hasBall && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green }} />}
            </View>
            <View style={{ marginLeft: 16 }}>
              <ScoreUnit
                value={t.scoreText ?? ""}
                sets={t.setScores ?? []}
                activeSetIdx={(t.setScores ?? []).length - 1}
              />
            </View>
          </View>
        ))}
    </View>
  );
}

// Detail-page avatar: same sources as the card crest (athlete headshot when the
// toggle is on, else flag/initial), at the detail-page 32px size.
function HeaderAvatar({ t }: { t: Team }) {
  const athletePhotos = useAthletePhotos();
  if (athletePhotos && t.photo) return <PhotoAvatar source={t.photo} aspect={t.photoAspect ?? 1.33} size={32} radius={10} />;
  return <TeamAvatar t={t} size={32} />;
}

// Leaderboard rows (golf, racing, poker): identical to the market-card scoring
// unit — golf shows to-par + "THRU N", racing shows position + time gap (gap
// emphasized), via the card's ColumnScore with shared-width cells. Detail-page
// exceptions: no probability bar line, 32px avatars.
export function RowsHeader({ match }: { match: Match }) {
  // Shared width candidates across ALL rows so the columns line up (same rule
  // as the cards).
  const valueCandidates = match.teams.map((t) => t.scoreText ?? "");
  const subCandidates = match.teams.map((t) =>
    match.sport === "golf" ? (t.thru != null ? `THRU ${t.thru}` : "") : match.sport === "racing" ? (t.gap ?? "") : "",
  );
  return (
    <>
      <SubHeader match={match} />
      <View style={{ paddingHorizontal: 16, marginTop: 22, gap: 16 }}>
        {match.teams.map((t) => (
          <View key={t.abbr ?? t.initial} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ marginRight: 12 }}>
              <HeaderAvatar t={t} />
            </View>
            <Text numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: geist.semibold, fontSize: 14, lineHeight: 22, color: colors.textPrimary }}>
              {t.name}
            </Text>
            <View style={{ marginLeft: 16 }}>
              {match.sport === "golf" ? (
                <ColumnScore value={t.scoreText ?? ""} sub={t.thru != null ? `THRU ${t.thru}` : undefined} valueCandidates={valueCandidates} subCandidates={subCandidates} />
              ) : match.sport === "racing" ? (
                <ColumnScore value={t.scoreText ?? ""} sub={t.gap} valueCandidates={valueCandidates} subCandidates={subCandidates} emphasizeSub />
              ) : (
                <Text style={{ fontFamily: geist.medium, fontSize: 14, lineHeight: 24, color: colors.textPrimary }}>
                  {scoreline(match, t)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

// One-stop dispatcher: drop into any detail page header and it renders the
// right scoring structure for the match's sport.
export function SportScoreHeader({ match }: { match: Match }) {
  useThemeMode();
  const baseballHeaderVariant = useBaseballHeaderVariant();
  switch (headerKind(match)) {
    case "duel":
      return <DuelHeader match={match} />;
    case "tennis":
      return <TennisHeader match={match} />;
    case "baseball":
      return baseballHeaderVariant === "bases" ? (
        <BaseballHeader match={match} />
      ) : (
        <ScoreboardHeader
          match={match}
          clock={match.live ? match.live.mins : undefined}
        />
      );
    case "rows":
      return <RowsHeader match={match} />;
    default:
      return <ScoreboardHeader match={match} />;
  }
}
