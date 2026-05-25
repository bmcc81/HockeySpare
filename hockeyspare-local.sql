--
-- PostgreSQL database dump
--

\restrict lHwWhC0B7WUmkaYeewZMB0Pm7OtuKFQwVXYMXYorh83ghYY5rzBhGQvodSpza2b

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Team" DROP CONSTRAINT IF EXISTS "Team_ownerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Team" DROP CONSTRAINT IF EXISTS "Team_leagueId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamMember" DROP CONSTRAINT IF EXISTS "TeamMember_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamMember" DROP CONSTRAINT IF EXISTS "TeamMember_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamGame" DROP CONSTRAINT IF EXISTS "TeamGame_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamGame" DROP CONSTRAINT IF EXISTS "TeamGame_opponentTeamId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamGame" DROP CONSTRAINT IF EXISTS "TeamGame_leagueId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamGame" DROP CONSTRAINT IF EXISTS "TeamGame_arenaId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamGameInvite" DROP CONSTRAINT IF EXISTS "TeamGameInvite_memberId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamGameInvite" DROP CONSTRAINT IF EXISTS "TeamGameInvite_gameId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamGameAvailability" DROP CONSTRAINT IF EXISTS "TeamGameAvailability_memberId_fkey";
ALTER TABLE IF EXISTS ONLY public."TeamGameAvailability" DROP CONSTRAINT IF EXISTS "TeamGameAvailability_gameId_fkey";
ALTER TABLE IF EXISTS ONLY public."Request" DROP CONSTRAINT IF EXISTS "Request_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."RequestResponse" DROP CONSTRAINT IF EXISTS "RequestResponse_responderUserId_fkey";
ALTER TABLE IF EXISTS ONLY public."RequestResponse" DROP CONSTRAINT IF EXISTS "RequestResponse_requestId_fkey";
ALTER TABLE IF EXISTS ONLY public."PlayerStat" DROP CONSTRAINT IF EXISTS "PlayerStat_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."PlayerStat" DROP CONSTRAINT IF EXISTS "PlayerStat_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public."PlayerStat" DROP CONSTRAINT IF EXISTS "PlayerStat_memberId_fkey";
ALTER TABLE IF EXISTS ONLY public."PlayerStat" DROP CONSTRAINT IF EXISTS "PlayerStat_leagueId_fkey";
ALTER TABLE IF EXISTS ONLY public."PlayerOffer" DROP CONSTRAINT IF EXISTS "PlayerOffer_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeagueMember" DROP CONSTRAINT IF EXISTS "LeagueMember_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeagueMember" DROP CONSTRAINT IF EXISTS "LeagueMember_leagueId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeagueMember" DROP CONSTRAINT IF EXISTS "LeagueMember_gameScoreSheetId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeagueArena" DROP CONSTRAINT IF EXISTS "LeagueArena_leagueId_fkey";
ALTER TABLE IF EXISTS ONLY public."GameScoreSheet" DROP CONSTRAINT IF EXISTS "GameScoreSheet_teamId_fkey";
ALTER TABLE IF EXISTS ONLY public."GameScoreSheet" DROP CONSTRAINT IF EXISTS "GameScoreSheet_leagueId_fkey";
ALTER TABLE IF EXISTS ONLY public."GameScoreSheet" DROP CONSTRAINT IF EXISTS "GameScoreSheet_gameId_fkey";
ALTER TABLE IF EXISTS ONLY public."GameScoreSheet" DROP CONSTRAINT IF EXISTS "GameScoreSheet_finalizedById_fkey";
ALTER TABLE IF EXISTS ONLY public."GameScoreSheetPlayer" DROP CONSTRAINT IF EXISTS "GameScoreSheetPlayer_scoreSheetId_fkey";
ALTER TABLE IF EXISTS ONLY public."GameScoreSheetPlayer" DROP CONSTRAINT IF EXISTS "GameScoreSheetPlayer_memberId_fkey";
ALTER TABLE IF EXISTS ONLY public."Booking" DROP CONSTRAINT IF EXISTS "Booking_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Booking" DROP CONSTRAINT IF EXISTS "Booking_requestId_fkey";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."Team_leagueId_idx";
DROP INDEX IF EXISTS public."Team_joinCode_key";
DROP INDEX IF EXISTS public."TeamMember_teamId_role_idx";
DROP INDEX IF EXISTS public."TeamMember_teamId_memberType_idx";
DROP INDEX IF EXISTS public."TeamGame_teamId_startsAt_idx";
DROP INDEX IF EXISTS public."TeamGame_opponentTeamId_startsAt_idx";
DROP INDEX IF EXISTS public."TeamGame_leagueId_startsAt_idx";
DROP INDEX IF EXISTS public."TeamGame_arenaId_idx";
DROP INDEX IF EXISTS public."TeamGameInvite_gameId_memberId_key";
DROP INDEX IF EXISTS public."TeamGameAvailability_gameId_status_idx";
DROP INDEX IF EXISTS public."TeamGameAvailability_gameId_memberId_key";
DROP INDEX IF EXISTS public."Request_userId_status_idx";
DROP INDEX IF EXISTS public."Request_type_idx";
DROP INDEX IF EXISTS public."Request_position_skillLevel_idx";
DROP INDEX IF EXISTS public."RequestResponse_requestId_responderUserId_idx";
DROP INDEX IF EXISTS public."PlayerStat_userId_idx";
DROP INDEX IF EXISTS public."PlayerStat_teamId_idx";
DROP INDEX IF EXISTS public."PlayerStat_memberId_season_key";
DROP INDEX IF EXISTS public."PlayerStat_leagueId_idx";
DROP INDEX IF EXISTS public."PlayerOffer_userId_status_idx";
DROP INDEX IF EXISTS public."PlayerOffer_position_skillLevel_idx";
DROP INDEX IF EXISTS public."Notification_userId_isRead_createdAt_idx";
DROP INDEX IF EXISTS public."LeagueMember_leagueId_userId_key";
DROP INDEX IF EXISTS public."LeagueMember_leagueId_role_idx";
DROP INDEX IF EXISTS public."LeagueArena_leagueId_name_key";
DROP INDEX IF EXISTS public."LeagueArena_leagueId_idx";
DROP INDEX IF EXISTS public."GameScoreSheet_gameId_key";
DROP INDEX IF EXISTS public."GameScoreSheetPlayer_scoreSheetId_memberId_key";
DROP INDEX IF EXISTS public."Booking_requestId_userId_key";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Team" DROP CONSTRAINT IF EXISTS "Team_pkey";
ALTER TABLE IF EXISTS ONLY public."TeamMember" DROP CONSTRAINT IF EXISTS "TeamMember_pkey";
ALTER TABLE IF EXISTS ONLY public."TeamGame" DROP CONSTRAINT IF EXISTS "TeamGame_pkey";
ALTER TABLE IF EXISTS ONLY public."TeamGameInvite" DROP CONSTRAINT IF EXISTS "TeamGameInvite_pkey";
ALTER TABLE IF EXISTS ONLY public."TeamGameAvailability" DROP CONSTRAINT IF EXISTS "TeamGameAvailability_pkey";
ALTER TABLE IF EXISTS ONLY public."Request" DROP CONSTRAINT IF EXISTS "Request_pkey";
ALTER TABLE IF EXISTS ONLY public."RequestResponse" DROP CONSTRAINT IF EXISTS "RequestResponse_pkey";
ALTER TABLE IF EXISTS ONLY public."PlayerStat" DROP CONSTRAINT IF EXISTS "PlayerStat_pkey";
ALTER TABLE IF EXISTS ONLY public."PlayerOffer" DROP CONSTRAINT IF EXISTS "PlayerOffer_pkey";
ALTER TABLE IF EXISTS ONLY public."Notification" DROP CONSTRAINT IF EXISTS "Notification_pkey";
ALTER TABLE IF EXISTS ONLY public."League" DROP CONSTRAINT IF EXISTS "League_pkey";
ALTER TABLE IF EXISTS ONLY public."LeagueMember" DROP CONSTRAINT IF EXISTS "LeagueMember_pkey";
ALTER TABLE IF EXISTS ONLY public."LeagueArena" DROP CONSTRAINT IF EXISTS "LeagueArena_pkey";
ALTER TABLE IF EXISTS ONLY public."GameScoreSheet" DROP CONSTRAINT IF EXISTS "GameScoreSheet_pkey";
ALTER TABLE IF EXISTS ONLY public."GameScoreSheetPlayer" DROP CONSTRAINT IF EXISTS "GameScoreSheetPlayer_pkey";
ALTER TABLE IF EXISTS ONLY public."Booking" DROP CONSTRAINT IF EXISTS "Booking_pkey";
ALTER TABLE IF EXISTS public."RequestResponse" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Request" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."PlayerOffer" ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."TeamMember";
DROP TABLE IF EXISTS public."TeamGameInvite";
DROP TABLE IF EXISTS public."TeamGameAvailability";
DROP TABLE IF EXISTS public."TeamGame";
DROP TABLE IF EXISTS public."Team";
DROP SEQUENCE IF EXISTS public."Request_id_seq";
DROP SEQUENCE IF EXISTS public."RequestResponse_id_seq";
DROP TABLE IF EXISTS public."RequestResponse";
DROP TABLE IF EXISTS public."Request";
DROP TABLE IF EXISTS public."PlayerStat";
DROP SEQUENCE IF EXISTS public."PlayerOffer_id_seq";
DROP TABLE IF EXISTS public."PlayerOffer";
DROP TABLE IF EXISTS public."Notification";
DROP TABLE IF EXISTS public."LeagueMember";
DROP TABLE IF EXISTS public."LeagueArena";
DROP TABLE IF EXISTS public."League";
DROP TABLE IF EXISTS public."GameScoreSheetPlayer";
DROP TABLE IF EXISTS public."GameScoreSheet";
DROP TABLE IF EXISTS public."Booking";
DROP TYPE IF EXISTS public."TeamRole";
DROP TYPE IF EXISTS public."TeamMemberType";
DROP TYPE IF EXISTS public."TeamGameInviteStatus";
DROP TYPE IF EXISTS public."TeamGameAvailabilityStatus";
DROP TYPE IF EXISTS public."SkillLevel";
DROP TYPE IF EXISTS public."ScoreSheetStatus";
DROP TYPE IF EXISTS public."ResponseStatus";
DROP TYPE IF EXISTS public."RequestType";
DROP TYPE IF EXISTS public."RequestStatus";
DROP TYPE IF EXISTS public."Position";
DROP TYPE IF EXISTS public."OfferStatus";
DROP TYPE IF EXISTS public."NotificationType";
DROP TYPE IF EXISTS public."LeagueRole";
DROP TYPE IF EXISTS public."BookingStatus";
DROP TYPE IF EXISTS public."AppRole";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AppRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AppRole" AS ENUM (
    'USER',
    'ADMIN'
);


--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'DECLINED',
    'CANCELLED'
);


--
-- Name: LeagueRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LeagueRole" AS ENUM (
    'PLAYER',
    'TEAM_MANAGER',
    'LEAGUE_MANAGER',
    'TIMEKEEPER'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'REQUEST_MATCH',
    'OFFER_MATCH',
    'REQUEST_RESPONSE',
    'REQUEST_ACCEPTED',
    'REQUEST_DECLINED',
    'TEAM_GAME_REMINDER',
    'TEAM_MEMBER_ADDED'
);


--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'OPEN',
    'FILLED',
    'CANCELLED'
);


--
-- Name: Position; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Position" AS ENUM (
    'GOALIE',
    'DEFENSE',
    'FORWARD'
);


--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'OPEN',
    'FILLED',
    'CANCELLED'
);


--
-- Name: RequestType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RequestType" AS ENUM (
    'TEAM_NEEDS_PLAYER',
    'PLAYER_NEEDS_TEAM'
);


--
-- Name: ResponseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ResponseStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED'
);


--
-- Name: ScoreSheetStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ScoreSheetStatus" AS ENUM (
    'DRAFT',
    'FINALIZED'
);


--
-- Name: SkillLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SkillLevel" AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'ELITE'
);


--
-- Name: TeamGameAvailabilityStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TeamGameAvailabilityStatus" AS ENUM (
    'AVAILABLE',
    'UNAVAILABLE',
    'NEED_SPARE'
);


--
-- Name: TeamGameInviteStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TeamGameInviteStatus" AS ENUM (
    'PENDING',
    'SENT',
    'CONFIRMED',
    'DECLINED'
);


--
-- Name: TeamMemberType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TeamMemberType" AS ENUM (
    'REGULAR',
    'SPARE'
);


--
-- Name: TeamRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TeamRole" AS ENUM (
    'PLAYER',
    'CAPTAIN',
    'GENERAL_MANAGER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Booking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    "requestId" integer NOT NULL,
    "userId" text NOT NULL,
    message text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "responseMessage" text,
    status text DEFAULT 'PENDING'::text NOT NULL
);


--
-- Name: GameScoreSheet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GameScoreSheet" (
    id text NOT NULL,
    "gameId" text NOT NULL,
    "leagueId" text NOT NULL,
    "teamId" text NOT NULL,
    "teamScore" integer DEFAULT 0 NOT NULL,
    "opponentScore" integer DEFAULT 0 NOT NULL,
    status public."ScoreSheetStatus" DEFAULT 'DRAFT'::public."ScoreSheetStatus" NOT NULL,
    "finalizedAt" timestamp(3) without time zone,
    "finalizedById" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GameScoreSheetPlayer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GameScoreSheetPlayer" (
    id text NOT NULL,
    "scoreSheetId" text NOT NULL,
    "memberId" text NOT NULL,
    "gamesPlayed" integer DEFAULT 1 NOT NULL,
    goals integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    "penaltyMins" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: League; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."League" (
    id text NOT NULL,
    name text NOT NULL,
    season text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LeagueArena; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeagueArena" (
    id text NOT NULL,
    "leagueId" text NOT NULL,
    name text NOT NULL,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LeagueMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeagueMember" (
    id text NOT NULL,
    "leagueId" text NOT NULL,
    "userId" text NOT NULL,
    role public."LeagueRole" DEFAULT 'PLAYER'::public."LeagueRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "gameScoreSheetId" text
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    link text,
    "isRead" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PlayerOffer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PlayerOffer" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    arena text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "arenaAddress" text,
    "payAmount" integer,
    "playerName" text NOT NULL,
    "time" text NOT NULL,
    "position" public."Position" NOT NULL,
    "skillLevel" public."SkillLevel" NOT NULL,
    status public."OfferStatus" DEFAULT 'OPEN'::public."OfferStatus" NOT NULL,
    date timestamp(3) without time zone NOT NULL
);


--
-- Name: PlayerOffer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PlayerOffer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PlayerOffer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PlayerOffer_id_seq" OWNED BY public."PlayerOffer".id;


--
-- Name: PlayerStat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PlayerStat" (
    id text NOT NULL,
    "userId" text,
    "teamId" text NOT NULL,
    "leagueId" text,
    season text NOT NULL,
    "gamesPlayed" integer DEFAULT 0 NOT NULL,
    goals integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    "penaltyMins" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "memberId" text NOT NULL
);


--
-- Name: Request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Request" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    arena text NOT NULL,
    notes text,
    "position" public."Position" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "arenaAddress" text,
    "payAmount" integer,
    "playerName" text,
    "skillLevel" public."SkillLevel" NOT NULL,
    "teamName" text,
    "time" text NOT NULL,
    type public."RequestType" NOT NULL,
    status public."RequestStatus" DEFAULT 'OPEN'::public."RequestStatus" NOT NULL,
    date timestamp(3) without time zone NOT NULL
);


--
-- Name: RequestResponse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RequestResponse" (
    id integer NOT NULL,
    "requestId" integer NOT NULL,
    "responderUserId" text NOT NULL,
    message text,
    status public."ResponseStatus" DEFAULT 'PENDING'::public."ResponseStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RequestResponse_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."RequestResponse_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RequestResponse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."RequestResponse_id_seq" OWNED BY public."RequestResponse".id;


--
-- Name: Request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Request_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Request_id_seq" OWNED BY public."Request".id;


--
-- Name: Team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Team" (
    id text NOT NULL,
    "ownerId" text,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "leagueId" text,
    "joinCode" text
);


--
-- Name: TeamGame; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeamGame" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    title text NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    opponent text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "arenaId" text,
    "leagueId" text,
    "opponentTeamId" text
);


--
-- Name: TeamGameAvailability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeamGameAvailability" (
    id text NOT NULL,
    "gameId" text NOT NULL,
    "memberId" text NOT NULL,
    status public."TeamGameAvailabilityStatus" DEFAULT 'AVAILABLE'::public."TeamGameAvailabilityStatus" NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TeamGameInvite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeamGameInvite" (
    id text NOT NULL,
    "gameId" text NOT NULL,
    "memberId" text NOT NULL,
    status public."TeamGameInviteStatus" DEFAULT 'PENDING'::public."TeamGameInviteStatus" NOT NULL,
    "sentAt" timestamp(3) without time zone,
    "respondedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TeamMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeamMember" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    "userId" text,
    "displayName" text NOT NULL,
    email text,
    phone text,
    "position" public."Position",
    "memberType" public."TeamMemberType" NOT NULL,
    "notifyByApp" boolean DEFAULT true NOT NULL,
    "notifyByEmail" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    role public."TeamRole" DEFAULT 'PLAYER'::public."TeamRole" NOT NULL,
    "notifyBySms" boolean DEFAULT false NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "firstName" text,
    "lastName" text,
    "appRole" public."AppRole" DEFAULT 'USER'::public."AppRole" NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: PlayerOffer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerOffer" ALTER COLUMN id SET DEFAULT nextval('public."PlayerOffer_id_seq"'::regclass);


--
-- Name: Request id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Request" ALTER COLUMN id SET DEFAULT nextval('public."Request_id_seq"'::regclass);


--
-- Name: RequestResponse id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RequestResponse" ALTER COLUMN id SET DEFAULT nextval('public."RequestResponse_id_seq"'::regclass);


--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Booking" (id, "requestId", "userId", message, "createdAt", "updatedAt", "responseMessage", status) FROM stdin;
cmovjzq2v0000ycuayxj6054f	3	cmorpbv6r000018ua0b0a8jvz	See you then	2026-05-07 14:00:17.095	2026-05-07 16:36:35.729	Game back on	CONFIRMED
cmouj2e8f0000xkuaqrno98xr	2	cmolkbwjp0000tcuaa8bb1b0e	See you Tom	2026-05-06 20:46:35.919	2026-05-07 17:28:23.271	Okay I'll be there	CONFIRMED
\.


--
-- Data for Name: GameScoreSheet; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GameScoreSheet" (id, "gameId", "leagueId", "teamId", "teamScore", "opponentScore", status, "finalizedAt", "finalizedById", notes, "createdAt", "updatedAt") FROM stdin;
cmp5qtp1z0005qsua8o3ie8jc	cmp1ff5mb00010gua86ag65em	cmolkd06f0003tcuafo1qx59y	cmox0k3ql0001l0uakkdyrr50	0	0	DRAFT	\N	\N	\N	2026-05-14 17:09:14.903	2026-05-14 17:09:14.903
cmp5qsp7f0000qsuatdvsnid2	cmp1igagp0002dkua9rgpfiab	cmolkd06f0003tcuafo1qx59y	cmolkca8x0001tcua0b1cd7i9	1	2	FINALIZED	2026-05-14 18:36:47.681	cmolkbwjp0000tcuaa8bb1b0e	\N	2026-05-14 17:08:28.443	2026-05-14 18:36:47.684
cmp5ua3pu0000d8ua00mill64	cmp5o7hhb0001e4ua6fhywfak	cmolkd06f0003tcuafo1qx59y	cmomznhzb0001e8uanwxh3j8x	0	0	FINALIZED	2026-05-14 20:04:54.661	cmolkbwjp0000tcuaa8bb1b0e	\N	2026-05-14 18:45:59.25	2026-05-14 20:04:54.684
cmp5x779u000kukuaqwhaw6cp	cmp1ie5ol0000dkual5ip4zdm	cmolkd06f0003tcuafo1qx59y	cmolkca8x0001tcua0b1cd7i9	0	0	DRAFT	\N	\N	\N	2026-05-14 20:07:42.738	2026-05-14 20:07:42.738
\.


--
-- Data for Name: GameScoreSheetPlayer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GameScoreSheetPlayer" (id, "scoreSheetId", "memberId", "gamesPlayed", goals, assists, "penaltyMins", "createdAt", "updatedAt") FROM stdin;
cmp5qsp7w0002qsuahx65v75u	cmp5qsp7f0000qsuatdvsnid2	cmou9wzf8000290uaxwcapqxm	1	0	0	0	2026-05-14 17:08:28.458	2026-05-14 17:08:28.458
cmp5qsp7w0003qsuaxyi5oti5	cmp5qsp7f0000qsuatdvsnid2	cmox0veb9000el0uaz6187vb1	1	0	0	0	2026-05-14 17:08:28.458	2026-05-14 17:08:28.458
cmp5qsp7w0004qsuaao141w7g	cmp5qsp7f0000qsuatdvsnid2	cmox0xef2000hl0uam2xmfjyb	1	0	0	0	2026-05-14 17:08:28.458	2026-05-14 17:08:28.458
cmp5qsp7w0001qsuauv0c96fu	cmp5qsp7f0000qsuatdvsnid2	cmolkca8z0002tcua3829j4sm	1	2	0	0	2026-05-14 17:08:28.458	2026-05-14 18:34:23.344
cmp5tsu440004zguas92i3j3x	cmp5qsp7f0000qsuatdvsnid2	cmp2msmxy000094uahcc2s8kf	1	0	0	0	2026-05-14 18:32:33.648	2026-05-14 18:35:29.85
cmp5ua3q80004d8uaw8ky41tj	cmp5ua3pu0000d8ua00mill64	cmox0xef2000hl0uam2xmfjyb	1	1	0	0	2026-05-14 18:45:59.262	2026-05-14 20:04:51.502
cmp5ua3q80002d8uasutappll	cmp5ua3pu0000d8ua00mill64	cmou9wzf8000290uaxwcapqxm	1	1	0	0	2026-05-14 18:45:59.262	2026-05-14 20:04:51.518
cmp5ua3q80005d8uaw0e93yxf	cmp5ua3pu0000d8ua00mill64	cmp5jdm1z0000boua6l9ul0p0	1	1	0	0	2026-05-14 18:45:59.262	2026-05-14 20:04:51.582
cmp5ua3q80003d8uab72jux3s	cmp5ua3pu0000d8ua00mill64	cmox0veb9000el0uaz6187vb1	1	0	0	0	2026-05-14 18:45:59.262	2026-05-14 20:04:51.617
cmp5ua3q80001d8ua5esr57tw	cmp5ua3pu0000d8ua00mill64	cmolkca8z0002tcua3829j4sm	1	1	0	0	2026-05-14 18:45:59.262	2026-05-14 20:04:51.902
cmp5x77e2000lukuatc7oxiyq	cmp5x779u000kukuaqwhaw6cp	cmolkca8z0002tcua3829j4sm	1	0	0	0	2026-05-14 20:07:42.878	2026-05-14 20:07:42.878
cmp5x77e3000mukua1ix8g0xv	cmp5x779u000kukuaqwhaw6cp	cmou9wzf8000290uaxwcapqxm	1	0	0	0	2026-05-14 20:07:42.878	2026-05-14 20:07:42.878
cmp5x77e3000nukuac98t34ln	cmp5x779u000kukuaqwhaw6cp	cmox0veb9000el0uaz6187vb1	1	0	0	0	2026-05-14 20:07:42.878	2026-05-14 20:07:42.878
cmp5x77e3000oukuas2ad1tew	cmp5x779u000kukuaqwhaw6cp	cmox0xef2000hl0uam2xmfjyb	1	0	0	0	2026-05-14 20:07:42.878	2026-05-14 20:07:42.878
cmp5x77e3000pukuavdtwfhwj	cmp5x779u000kukuaqwhaw6cp	cmp5jdm1z0000boua6l9ul0p0	1	0	0	0	2026-05-14 20:07:42.878	2026-05-14 20:07:42.878
cmp5xzgx5000wd4uaklfz6c4o	cmp5qtp1z0005qsua8o3ie8jc	cmox0veb9000el0uaz6187vb1	1	0	0	0	2026-05-14 20:29:41.607	2026-05-14 20:29:41.607
cmp5xzgx5000xd4uavk8acli3	cmp5qtp1z0005qsua8o3ie8jc	cmox0xef2000hl0uam2xmfjyb	1	0	0	0	2026-05-14 20:29:41.607	2026-05-14 20:29:41.607
cmp5xzgx5000ud4uaj19gfirv	cmp5qtp1z0005qsua8o3ie8jc	cmolkca8z0002tcua3829j4sm	1	1	0	0	2026-05-14 20:29:41.607	2026-05-14 20:29:51.65
cmp5xzgx5000vd4ua1tgdqoe0	cmp5qtp1z0005qsua8o3ie8jc	cmou9wzf8000290uaxwcapqxm	1	1	0	0	2026-05-14 20:29:41.607	2026-05-14 20:32:40.464
cmp5yju8a000l74uaqatt2t8k	cmp5qtp1z0005qsua8o3ie8jc	cmp5yjgz2000g74uavicom00v	1	0	0	0	2026-05-14 20:45:31.977	2026-05-14 20:45:31.977
\.


--
-- Data for Name: League; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."League" (id, name, season, "createdAt", "updatedAt") FROM stdin;
cmomz6iji0000louap6zrfs3y	MTHL	2026-2027	2026-05-01 13:55:32.54	2026-05-01 13:55:32.54
cmolkd06f0003tcuafo1qx59y	Vaudreuil Hockey League	2026-2027	2026-04-30 14:12:54.94	2026-04-30 14:12:54.94
\.


--
-- Data for Name: LeagueArena; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeagueArena" (id, "leagueId", name, address, "createdAt", "updatedAt") FROM stdin;
cmovsvndl00005kuaiqjen9pe	cmolkd06f0003tcuafo1qx59y	Bob Bernie	58 Maywood Ave, Pointe-Claire, Quebec H9R 0A7	2026-05-07 18:09:03.512	2026-05-07 18:09:03.512
cmovswteb00015kuaevc0zx71	cmolkd06f0003tcuafo1qx59y	Vaudreuil Arena	9 Jeannotte Rue, Vaudreuil-Dorion, QC J7V 6E6	2026-05-07 18:09:57.971	2026-05-07 18:09:57.971
cmovsxrzq00025kuaedb1541c	cmolkd06f0003tcuafo1qx59y	Kirkland Arena	16950 Boul Hymus, Kirkland, QC H9H 3W7	2026-05-07 18:10:42.806	2026-05-07 18:10:42.806
cmovsyr0n00035kuaoorf3542	cmolkd06f0003tcuafo1qx59y	Beaconsfield Recreation Centre	1974 City Ln, Beaconsfield, Quebec H9W 4A7	2026-05-07 18:11:28.199	2026-05-07 18:11:28.199
cmowy4eig0000a4uatvag1dq9	cmolkd06f0003tcuafo1qx59y	Bell Center	1909 Av. des Canadiens-de-Montréal, Montréal, QC H3B 2S2	2026-05-08 13:23:36.183	2026-05-08 13:23:36.183
cmox0jk2p0000l0uaqwpv8pbu	cmolkd06f0003tcuafo1qx59y	Ile-Bizzard	750 Bd Jacques Bizard, L'Île-Bizard-Sainte-Geneviève, QC H9C 2Y2	2026-05-08 14:31:22.465	2026-05-08 14:31:22.465
cmp1c2btv0000acuamw68v721	cmolkd06f0003tcuafo1qx59y	Sportplexe Pierrefonds	14700 Pierrefonds Blvd., Pierrefonds, Quebec H9H 4Y6	2026-05-11 15:04:58.723	2026-05-11 15:04:58.723
\.


--
-- Data for Name: LeagueMember; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeagueMember" (id, "leagueId", "userId", role, "createdAt", "gameScoreSheetId") FROM stdin;
cmolkd06i0004tcuacllegndr	cmolkd06f0003tcuafo1qx59y	cmolkbwjp0000tcuaa8bb1b0e	LEAGUE_MANAGER	2026-04-30 14:12:54.94	\N
cmomz6ijn0001louaudv9mq19	cmomz6iji0000louap6zrfs3y	cmolkbwjp0000tcuaa8bb1b0e	LEAGUE_MANAGER	2026-05-01 13:55:32.54	\N
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "userId", type, title, body, link, "isRead", metadata, "createdAt") FROM stdin;
cmosoa94w00003wuaps5cds8n	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Brandon McCarthy can’t make it	Brandon McCarthy responded "can’t make it" for Eagles vs Anaheim Ducks.	/my-team	f	{"note": "Vacation", "gameId": "cmomzqcid0004e8uadcb33s99", "status": "UNAVAILABLE", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-05 13:37:08.288
cmosofn2100013wualg3l83uc	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Brandon McCarthy can’t make it	Brandon McCarthy responded "can’t make it" for Eagles vs Anaheim Ducks.	/my-team	f	{"note": "Vacation", "gameId": "cmomzqcid0004e8uadcb33s99", "status": "UNAVAILABLE", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-05 13:41:19.609
cmosot24c0003fwuanqs8tqwk	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game reminder: Eagles vs Anaheim Ducks	Eagles has a game on 5/9/2026, 12:12:00 PM	/my-team	f	{"gameId": "cmomzqcid0004e8uadcb33s99", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-05 13:51:45.66
cmosot24c0004fwuacztapi5g	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game reminder: Eagles vs Anaheim Ducks	Eagles has a game on 5/9/2026, 12:12:00 PM	/my-team	f	{"gameId": "cmomzqcid0004e8uadcb33s99", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmon3cgvk0000wcuaunjb083n"}	2026-05-05 13:51:45.66
cmosot24d0005fwua93vb7lm5	cmorpbv6r000018ua0b0a8jvz	TEAM_GAME_REMINDER	Game reminder: Eagles vs Anaheim Ducks	Eagles has a game on 5/9/2026, 12:12:00 PM	/my-team	f	{"gameId": "cmomzqcid0004e8uadcb33s99", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmorpef04000118uakb5bgu89"}	2026-05-05 13:51:45.66
cmouhl93i000ausuaa1nywcpw	cmolkbwjp0000tcuaa8bb1b0e	REQUEST_MATCH	New request matches your availability	FORWARD needed at Vaudreuil Arena for $20	/requests/2	f	{"offerId": 1, "requestId": 2, "requestType": "TEAM_NEEDS_PLAYER"}	2026-05-06 20:05:16.493
cmox0pxht0009l0uazc62es9y	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game reminder: Eagles vs Boston Bulldogs	Eagles has a game on 5/16/2026, 10:00:00 PM	/my-team	f	{"gameId": "cmowx4a8q0001m4uan80ld6y7", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-08 14:36:19.793
cmox0pxht000al0ua5mno6iyt	cmorpbv6r000018ua0b0a8jvz	TEAM_GAME_REMINDER	Game reminder: Eagles vs Boston Bulldogs	Eagles has a game on 5/16/2026, 10:00:00 PM	/my-team	f	{"gameId": "cmowx4a8q0001m4uan80ld6y7", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmorpef04000118uakb5bgu89"}	2026-05-08 14:36:19.793
cmox0pxht000bl0uarxprlz78	cmou9hlnk000190uahl33g4hf	TEAM_GAME_REMINDER	Game reminder: Eagles vs Boston Bulldogs	Eagles has a game on 5/16/2026, 10:00:00 PM	/my-team	f	{"gameId": "cmowx4a8q0001m4uan80ld6y7", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmou9wzf8000290uaxwcapqxm"}	2026-05-08 14:36:19.793
cmox0xegy000il0ua0hmywjzy	cmorpbv6r000018ua0b0a8jvz	TEAM_MEMBER_ADDED	You've been added to Eagles	Eagles added you to their roster.	/my-team	f	{"teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmox0xef2000hl0uam2xmfjyb"}	2026-05-08 14:42:08.386
cmox0zsmu000pl0uacsujto3v	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game reminder: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-08 14:44:00.054
cmox0zsmu000ql0uaw1i40zyp	cmou9hlnk000190uahl33g4hf	TEAM_GAME_REMINDER	Game reminder: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmou9wzf8000290uaxwcapqxm"}	2026-05-08 14:44:00.054
cmox0zsmu000sl0ua39jscy46	cmorpbv6r000018ua0b0a8jvz	TEAM_GAME_REMINDER	Game reminder: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmox0xef2000hl0uam2xmfjyb"}	2026-05-08 14:44:00.054
cmox1hx6o000590uabfwpiq9b	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game availability request: Eagles vs Tampa Bay Lighting	Eagles has a game on 5/27/2026, 12:37:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0pbrx0003l0uadyjcuzdb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-08 14:58:05.76
cmox1hx6p000690ua1uefqjuc	cmou9hlnk000190uahl33g4hf	TEAM_GAME_REMINDER	Game availability request: Eagles vs Tampa Bay Lighting	Eagles has a game on 5/27/2026, 12:37:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0pbrx0003l0uadyjcuzdb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmou9wzf8000290uaxwcapqxm"}	2026-05-08 14:58:05.761
cmox1hx6p000890uaaxldfalu	cmorpbv6r000018ua0b0a8jvz	TEAM_GAME_REMINDER	Game availability request: Eagles vs Tampa Bay Lighting	Eagles has a game on 5/27/2026, 12:37:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0pbrx0003l0uadyjcuzdb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmox0xef2000hl0uam2xmfjyb"}	2026-05-08 14:58:05.761
cmox1qn7q0005ocua9ode472i	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game availability request: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-08 15:04:52.742
cmox1qn7q0006ocuafe9lalq0	cmou9hlnk000190uahl33g4hf	TEAM_GAME_REMINDER	Game availability request: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmou9wzf8000290uaxwcapqxm"}	2026-05-08 15:04:52.742
cmox1qn7q0008ocuaw49cnn7m	cmorpbv6r000018ua0b0a8jvz	TEAM_GAME_REMINDER	Game availability request: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmox0xef2000hl0uam2xmfjyb"}	2026-05-08 15:04:52.742
cmox1tl9u000eocuai6fngmzv	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game availability request: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-08 15:07:10.194
cmox1xn3o000oocua47bctfhq	cmou9hlnk000190uahl33g4hf	TEAM_GAME_REMINDER	Game availability request: Eagles vs Boston Bulldogs	Eagles has a game on 5/16/2026, 10:00:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmowx4a8q0001m4uan80ld6y7", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmou9wzf8000290uaxwcapqxm"}	2026-05-08 15:10:19.188
cmox1xn3o000nocuaff309aqb	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game availability request: Eagles vs Boston Bulldogs	Eagles has a game on 5/16/2026, 10:00:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmowx4a8q0001m4uan80ld6y7", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-08 15:10:19.188
cmox1xn3o000qocua3ybkloxw	cmorpbv6r000018ua0b0a8jvz	TEAM_GAME_REMINDER	Game availability request: Eagles vs Boston Bulldogs	Eagles has a game on 5/16/2026, 10:00:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmowx4a8q0001m4uan80ld6y7", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmox0xef2000hl0uam2xmfjyb"}	2026-05-08 15:10:19.188
cmox1tl9v000focua6a9ppidy	cmou9hlnk000190uahl33g4hf	TEAM_GAME_REMINDER	Game availability request: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmou9wzf8000290uaxwcapqxm"}	2026-05-08 15:07:10.195
cmp2pxziq0006qoua1zwwhfft	cmorpbv6r000018ua0b0a8jvz	TEAM_GAME_REMINDER	Game availability request: Ottawa Senators vs Eagles	Eagles has a game against Ottawa Senators on 5/13/2026, 3:30:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmp1f9txy00000gua7b3akv81", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmox0xef2000hl0uam2xmfjyb"}	2026-05-12 14:21:16.946
cmp2pxzip0004qouakivknmis	cmolkbwjp0000tcuaa8bb1b0e	TEAM_GAME_REMINDER	Game availability request: Ottawa Senators vs Eagles	Eagles has a game against Ottawa Senators on 5/13/2026, 3:30:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmp1f9txy00000gua7b3akv81", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmolkca8z0002tcua3829j4sm"}	2026-05-12 14:21:16.945
cmp2pxziq0005qoua0xr947xt	cmou9hlnk000190uahl33g4hf	TEAM_GAME_REMINDER	Game availability request: Ottawa Senators vs Eagles	Eagles has a game against Ottawa Senators on 5/13/2026, 3:30:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmp1f9txy00000gua7b3akv81", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmou9wzf8000290uaxwcapqxm"}	2026-05-12 14:21:16.946
cmox1tla4000hocuagkmsvtt7	cmorpbv6r000018ua0b0a8jvz	TEAM_GAME_REMINDER	Game availability request: Eagles vs Montreal Canadians	Eagles has a game on 5/12/2026, 1:42:00 PM. Please respond if you are available.	/my-team	f	{"gameId": "cmox0u75f000dl0ua9qtd94xb", "teamId": "cmolkca8x0001tcua0b1cd7i9", "memberId": "cmox0xef2000hl0uam2xmfjyb"}	2026-05-08 15:07:10.204
\.


--
-- Data for Name: PlayerOffer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlayerOffer" (id, "userId", arena, notes, "createdAt", "updatedAt", "arenaAddress", "payAmount", "playerName", "time", "position", "skillLevel", status, date) FROM stdin;
1	cmolkbwjp0000tcuaa8bb1b0e	Anywhere in West Island	Backcheck, forecheck = paycheck 	2026-05-01 15:15:26.651	2026-05-01 15:15:26.651		20	Brandon McCarthy	8:30 PM	FORWARD	INTERMEDIATE	OPEN	2026-05-15 00:00:00
\.


--
-- Data for Name: PlayerStat; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlayerStat" (id, "userId", "teamId", "leagueId", season, "gamesPlayed", goals, assists, "penaltyMins", "updatedAt", "memberId") FROM stdin;
cmorpfykc000318uatjhkwwbw	cmorpbv6r000018ua0b0a8jvz	cmolkca8x0001tcua0b1cd7i9	cmolkd06f0003tcuafo1qx59y	2026-2027	4	99	1	1	2026-05-06 16:55:29.36	cmorpef04000118uakb5bgu89
cmp5obs5h0000hkuanud8r8fz	\N	cmolkfhm60006tcuafngyrmfo	\N	2026-2027	1	0	0	0	2026-05-14 15:59:19.873	cmp2nybm2000594uaw9b3o5ck
cmp5tya4f000jzguac7l0sa1g	\N	cmouhf9co0006usua7kfbmtxh	cmolkd06f0003tcuafo1qx59y	2026-2027	1	0	0	0	2026-05-14 18:36:47.679	cmp2msmxy000094uahcc2s8kf
cmomzsdlq0006e8uavkxzp8ye	cmolkbwjp0000tcuaa8bb1b0e	cmolkca8x0001tcua0b1cd7i9	cmolkd06f0003tcuafo1qx59y	2026-2027	4	6	3	2	2026-05-14 20:04:54.501	cmolkca8z0002tcua3829j4sm
cmouac2zp00007wua7khi65rf	cmou9hlnk000190uahl33g4hf	cmolkca8x0001tcua0b1cd7i9	cmolkd06f0003tcuafo1qx59y	2026-2027	5	5	3	2	2026-05-14 20:04:54.524	cmou9wzf8000290uaxwcapqxm
cmox0vtf1000fl0uafj5iy936	\N	cmolkca8x0001tcua0b1cd7i9	cmolkd06f0003tcuafo1qx59y	2026-2027	3	1	1	0	2026-05-14 20:04:54.573	cmox0veb9000el0uaz6187vb1
cmp5tya4b000izguaco7g8jmp	cmorpbv6r000018ua0b0a8jvz	cmolkca8x0001tcua0b1cd7i9	cmolkd06f0003tcuafo1qx59y	2026-2027	2	1	0	0	2026-05-14 20:04:54.598	cmox0xef2000hl0uam2xmfjyb
cmp5o4du10000e4uaq146urub	\N	cmomznhzb0001e8uanwxh3j8x	cmolkd06f0003tcuafo1qx59y	2026-2027	3	3	0	0	2026-05-14 20:04:54.641	cmp5jdm1z0000boua6l9ul0p0
\.


--
-- Data for Name: Request; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Request" (id, "userId", arena, notes, "position", "createdAt", "updatedAt", "arenaAddress", "payAmount", "playerName", "skillLevel", "teamName", "time", type, status, date) FROM stdin;
1	cmolkbwjp0000tcuaa8bb1b0e	Vaudreuil Arena	bring flip flops	FORWARD	2026-05-01 15:41:03.302	2026-05-01 15:41:03.302	9 Jeannotte Rue, Vaudreuil-Dorion, QC J7V 6E6	40	\N	INTERMEDIATE	Anaheim Ducks	8:30 PM	TEAM_NEEDS_PLAYER	OPEN	2026-05-28 00:00:00
3	cmolkbwjp0000tcuaa8bb1b0e	Cite Des Jeunes	Bring white jersey and socks	FORWARD	2026-05-07 13:59:30.371	2026-05-07 14:21:15.424	2580 Rue Paul Gérin-Lajoie, Vaudreuil-Dorion, QC J7V 9H8	45	\N	ADVANCED	Eagles	8:30 PM	TEAM_NEEDS_PLAYER	FILLED	2026-05-09 00:00:00
2	cmorpbv6r000018ua0b0a8jvz	Vaudreuil Arena	Room 6	FORWARD	2026-05-06 20:05:16.447	2026-05-07 14:40:51.017	9 Jeannotte Rue, Vaudreuil-Dorion, QC J7V 6E6	20	\N	INTERMEDIATE	Anaheim Ducks	10:30 PM	TEAM_NEEDS_PLAYER	FILLED	2026-05-09 00:00:00
\.


--
-- Data for Name: RequestResponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RequestResponse" (id, "requestId", "responderUserId", message, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Team; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Team" (id, "ownerId", name, "createdAt", "updatedAt", "leagueId", "joinCode") FROM stdin;
cmolkfhm60006tcuafngyrmfo	cmolkbwjp0000tcuaa8bb1b0e	Boston Bulldogs	2026-04-30 14:14:50.862	2026-04-30 14:14:50.862	cmolkd06f0003tcuafo1qx59y	\N
cmomznb600000e8ua9dejdwac	cmolkbwjp0000tcuaa8bb1b0e	Toronto Maple Leafs	2026-05-01 14:08:36.16	2026-05-01 14:08:36.16	cmolkd06f0003tcuafo1qx59y	\N
cmomznhzb0001e8uanwxh3j8x	cmolkbwjp0000tcuaa8bb1b0e	Anaheim Ducks	2026-05-01 14:08:44.997	2026-05-01 14:08:44.997	cmolkd06f0003tcuafo1qx59y	\N
cmomznqv00002e8uamtqqqiwk	cmolkbwjp0000tcuaa8bb1b0e	Ottawa Senators	2026-05-01 14:08:56.507	2026-05-01 14:08:56.507	cmolkd06f0003tcuafo1qx59y	\N
cmouhf9co0006usua7kfbmtxh	cmolkbwjp0000tcuaa8bb1b0e	Montreal Canadians	2026-05-06 20:00:36.884	2026-05-06 20:00:36.884	cmolkd06f0003tcuafo1qx59y	\N
cmox0k3ql0001l0uakkdyrr50	cmolkbwjp0000tcuaa8bb1b0e	Tampa Bay Lighting	2026-05-08 14:31:47.945	2026-05-08 14:31:47.945	cmolkd06f0003tcuafo1qx59y	\N
cmolkca8x0001tcua0b1cd7i9	cmolkbwjp0000tcuaa8bb1b0e	Eagles	2026-04-30 14:12:21.343	2026-05-08 14:38:35.717	cmolkd06f0003tcuafo1qx59y	\N
cmp1j4fjv0002ssuahbsgkngg	\N	Tampa Bay Lightning	2026-05-11 18:22:34.17	2026-05-11 18:22:34.17	\N	\N
\.


--
-- Data for Name: TeamGame; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamGame" (id, "teamId", title, "startsAt", opponent, notes, "createdAt", "updatedAt", "arenaId", "leagueId", "opponentTeamId") FROM stdin;
cmolke6h80005tcuakqqk6iv5	cmolkca8x0001tcua0b1cd7i9	League Game	2026-05-01 22:15:00	Bulldogs	Need pucks	2026-04-30 14:13:49.772	2026-04-30 14:13:49.772	\N	\N	\N
cmomzosq80003e8uaw4uiiqmm	cmomznb600000e8ua9dejdwac	Toronto Maple Leafs vs Anaheim Ducks	2026-05-03 23:30:00	Anaheim Ducks	Pucks needed and ref	2026-05-01 14:09:45.583	2026-05-01 14:09:45.583	\N	\N	\N
cmovtcssy0001w8uaptlkg2s8	cmouhf9co0006usua7kfbmtxh	Montreal Canadians vs Ottawa Senators	2026-05-11 02:30:00	Ottawa Senators	asddddd	2026-05-07 18:22:23.698	2026-05-07 18:22:23.698	\N	\N	\N
cmp1f9txy00000gua7b3akv81	cmomznqv00002e8uamtqqqiwk	Ottawa Senators vs Eagles	2026-05-13 19:30:00	Eagles	socks red	2026-05-11 16:34:47.636	2026-05-11 16:34:47.636	cmp1c2btv0000acuamw68v721	cmolkd06f0003tcuafo1qx59y	cmolkca8x0001tcua0b1cd7i9
cmp1ff5mb00010gua86ag65em	cmox0k3ql0001l0uakkdyrr50	Tampa Bay Lighting vs Eagles	2026-05-25 18:38:00	Eagles	Water	2026-05-11 16:38:56.05	2026-05-11 16:38:56.05	cmovswteb00015kuaevc0zx71	cmolkd06f0003tcuafo1qx59y	cmolkca8x0001tcua0b1cd7i9
cmp1ie5ol0000dkual5ip4zdm	cmolkca8x0001tcua0b1cd7i9	Eagles vs Anaheim Ducks	2026-05-27 02:00:00	Anaheim Ducks	Red shirts	2026-05-11 18:02:08.324	2026-05-11 18:02:08.324	cmp1c2btv0000acuamw68v721	cmolkd06f0003tcuafo1qx59y	cmomznhzb0001e8uanwxh3j8x
cmp1ifcri0001dkuapruniwta	cmolkfhm60006tcuafngyrmfo	Boston Bulldogs vs Montreal Canadians	2026-05-13 19:00:00	Montreal Canadians	Call Yuppi	2026-05-11 18:03:04.157	2026-05-11 18:03:04.157	cmowy4eig0000a4uatvag1dq9	cmolkd06f0003tcuafo1qx59y	cmouhf9co0006usua7kfbmtxh
cmp1igagp0002dkua9rgpfiab	cmolkca8x0001tcua0b1cd7i9	Eagles vs Montreal Canadians	2026-05-14 18:03:00	Montreal Canadians	Yuppi can't make it	2026-05-11 18:03:47.831	2026-05-11 18:03:47.831	cmovsvndl00005kuaiqjen9pe	cmolkd06f0003tcuafo1qx59y	cmouhf9co0006usua7kfbmtxh
cmp5o7hhb0001e4ua6fhywfak	cmomznhzb0001e8uanwxh3j8x	Anaheim Ducks vs Eagles	2026-05-16 16:00:00	Eagles	3 refs	2026-05-14 15:55:59.422	2026-05-14 15:55:59.422	cmovsvndl00005kuaiqjen9pe	cmolkd06f0003tcuafo1qx59y	cmolkca8x0001tcua0b1cd7i9
\.


--
-- Data for Name: TeamGameAvailability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamGameAvailability" (id, "gameId", "memberId", status, note, "createdAt", "updatedAt") FROM stdin;
cmp2o2kmh000794ua46taosmb	cmp1ifcri0001dkuapruniwta	cmp2nybm2000594uaw9b3o5ck	AVAILABLE	\N	2026-05-12 13:28:51.686	2026-05-12 13:28:51.686
cmp2q4nvv0007qouasdxyrhvh	cmp1f9txy00000gua7b3akv81	cmolkca8z0002tcua3829j4sm	AVAILABLE	\N	2026-05-12 14:26:28.456	2026-05-12 14:26:28.456
cmp2sfe1p0000zoua5cy46hew	cmp1igagp0002dkua9rgpfiab	cmolkca8z0002tcua3829j4sm	NEED_SPARE	I can’t make it and need a spare.	2026-05-12 15:30:48.152	2026-05-12 17:39:04.694
cmp1iy5ei0000ssuauof4h8vu	cmp1ie5ol0000dkual5ip4zdm	cmolkca8z0002tcua3829j4sm	NEED_SPARE	I can’t make it and need a spare.	2026-05-11 18:17:41.077	2026-05-12 17:44:51.129
cmp1iyo3p0001ssuazjdhvcvp	cmp1ff5mb00010gua86ag65em	cmolkca8z0002tcua3829j4sm	NEED_SPARE	Sick 🤮	2026-05-11 18:18:05.315	2026-05-12 17:44:59.592
\.


--
-- Data for Name: TeamGameInvite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamGameInvite" (id, "gameId", "memberId", status, "sentAt", "respondedAt", "createdAt") FROM stdin;
cmp2pxzic0000qouajqlzwuxp	cmp1f9txy00000gua7b3akv81	cmolkca8z0002tcua3829j4sm	SENT	2026-05-12 14:21:16.922	\N	2026-05-12 14:21:16.929
cmp2pxzic0001qoua67qm4sti	cmp1f9txy00000gua7b3akv81	cmou9wzf8000290uaxwcapqxm	SENT	2026-05-12 14:21:16.922	\N	2026-05-12 14:21:16.929
cmp2pxzic0002qouav760ut7g	cmp1f9txy00000gua7b3akv81	cmox0veb9000el0uaz6187vb1	SENT	2026-05-12 14:21:16.922	\N	2026-05-12 14:21:16.929
cmp2pxzic0003qouan0rifmvo	cmp1f9txy00000gua7b3akv81	cmox0xef2000hl0uam2xmfjyb	SENT	2026-05-12 14:21:16.922	\N	2026-05-12 14:21:16.929
cmp2sfe2b0001zouaqmc226du	cmp1igagp0002dkua9rgpfiab	cmox0veb9000el0uaz6187vb1	SENT	2026-05-12 15:30:48.175	\N	2026-05-12 15:30:48.178
cmp2sfe2b0002zouaggyje8sd	cmp1igagp0002dkua9rgpfiab	cmox0xef2000hl0uam2xmfjyb	SENT	2026-05-12 15:30:48.175	\N	2026-05-12 15:30:48.178
cmp2x0sj50000zwuazsl6u3c1	cmp1ie5ol0000dkual5ip4zdm	cmox0veb9000el0uaz6187vb1	SENT	2026-05-12 17:39:25.165	\N	2026-05-12 17:39:25.168
cmp2x0sj50001zwualgaftvat	cmp1ie5ol0000dkual5ip4zdm	cmox0xef2000hl0uam2xmfjyb	SENT	2026-05-12 17:39:25.165	\N	2026-05-12 17:39:25.168
cmp2x7yl900003cuauuody2x4	cmp1ff5mb00010gua86ag65em	cmox0veb9000el0uaz6187vb1	SENT	2026-05-12 17:44:59.609	\N	2026-05-12 17:44:59.612
cmp2x7yl900013cuaxoab6qbe	cmp1ff5mb00010gua86ag65em	cmox0xef2000hl0uam2xmfjyb	SENT	2026-05-12 17:44:59.609	\N	2026-05-12 17:44:59.612
\.


--
-- Data for Name: TeamMember; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamMember" (id, "teamId", "userId", "displayName", email, phone, "position", "memberType", "notifyByApp", "notifyByEmail", "isActive", "createdAt", "updatedAt", role, "notifyBySms") FROM stdin;
cmou9wzf8000290uaxwcapqxm	cmolkca8x0001tcua0b1cd7i9	cmou9hlnk000190uahl33g4hf	Melissa Heaven	brandonmccarthy@hotmail.com	1-514-830-4011	FORWARD	REGULAR	t	t	t	2026-05-06 16:30:26.9	2026-05-06 16:41:25.258	CAPTAIN	f
cmox0xef2000hl0uam2xmfjyb	cmolkca8x0001tcua0b1cd7i9	cmorpbv6r000018ua0b0a8jvz	Tom McCarthy	bmcc81@icloud.com	1-514-830-4011	FORWARD	SPARE	t	t	t	2026-05-08 14:42:08.318	2026-05-08 14:42:08.318	PLAYER	t
cmp5jdm1z0000boua6l9ul0p0	cmomznhzb0001e8uanwxh3j8x	\N	Brett Hull	brett@gmail.com	1-514-830-4011	FORWARD	REGULAR	t	f	t	2026-05-14 13:40:47.207	2026-05-14 13:40:47.207	PLAYER	f
cmp5yjgz2000g74uavicom00v	cmox0k3ql0001l0uakkdyrr50	\N	Vincent Lecavalier	vinny@gmail.com	1-555-888-9999	FORWARD	REGULAR	t	f	t	2026-05-14 20:45:14.798	2026-05-14 20:45:14.798	PLAYER	f
cmp2msmxy000094uahcc2s8kf	cmouhf9co0006usua7kfbmtxh	\N	Thiery Valade	thieryvalade@yahoo.com	514-888-9999	FORWARD	REGULAR	t	t	t	2026-05-12 12:53:08.518	2026-05-12 12:53:08.518	GENERAL_MANAGER	f
cmp2nxkik000494ua1gmih1mc	cmomznb600000e8ua9dejdwac	\N	Chris Senapi	chris.sanapi@gmail.com	777-888-9999	FORWARD	REGULAR	t	t	t	2026-05-12 13:24:58.268	2026-05-12 13:24:58.268	GENERAL_MANAGER	f
cmp2nybm2000594uaw9b3o5ck	cmolkfhm60006tcuafngyrmfo	cmp2nswsf000394uatcfxykwd	Charlie McCarthy	melbran126@gmail.com	777-888-9999	FORWARD	REGULAR	t	t	t	2026-05-12 13:25:33.386	2026-05-12 13:25:33.386	GENERAL_MANAGER	f
cmox0veb9000el0uaz6187vb1	cmolkca8x0001tcua0b1cd7i9	\N	Wayne Gretzky	wayne@gmail.com	555-888-9999	FORWARD	SPARE	t	t	t	2026-05-08 14:40:34.869	2026-05-08 14:40:34.869	PLAYER	t
cmorpef04000118uakb5bgu89	cmolkca8x0001tcua0b1cd7i9	cmorpbv6r000018ua0b0a8jvz	Tom McCarthy	bmcc81@icloud.com	1-514-830-4011	DEFENSE	REGULAR	t	f	f	2026-05-04 21:20:35.956	2026-05-08 14:41:39.804	PLAYER	f
cmolkca8z0002tcua3829j4sm	cmolkca8x0001tcua0b1cd7i9	cmolkbwjp0000tcuaa8bb1b0e	Brandon McCarthy	bmcc81@gmail.com	1-514-830-4011	GOALIE	REGULAR	t	f	t	2026-04-30 14:12:21.343	2026-04-30 14:12:21.343	GENERAL_MANAGER	f
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "passwordHash", "createdAt", "updatedAt", "firstName", "lastName", "appRole") FROM stdin;
cmolkbwjp0000tcuaa8bb1b0e	bmcc81@gmail.com	$2b$12$9plv8lZ7yi8rwyrWjqF5/.8pIHlnZwS3fVQsnk376dDLTXnImq6py	2026-04-30 14:12:03.589	2026-04-30 14:12:03.589	Brandon	McCarthy	USER
cmorpbv6r000018ua0b0a8jvz	bmcc81@icloud.com	$2b$12$fqMcPcqt2TLhQJk3KcqksOYuwoAzFDBePwQogalQLXP/xwVBy7/cG	2026-05-04 21:18:36.963	2026-05-04 21:18:36.963	Tom	McCarthy	USER
cmou9hlnk000190uahl33g4hf	brandonmccarthy@hotmail.com	$2b$12$uYOUZPvdmdlT95zPKhwnZelldXknGP.2GXFxOQdPzs/fOn5Za34JS	2026-05-06 16:18:29.216	2026-05-06 16:18:29.216	Melissa	Heaven	USER
cmp2nswsf000394uatcfxykwd	melbran126@gmail.com	$2b$12$x/te4l.VmIGzcwsj549lMeuOlonsOhFff3cZFhMtW7gjTBSuPnKTK	2026-05-12 13:21:20.895	2026-05-12 13:21:20.895	Charlie	McCarthy	USER
cmp2o20pf000694uacetlibyw	melbranb126@gmail.com	$2b$12$hEeWKudC2pq/o1SDfLVC3.d4tQxuo/UAX.A9ozD8rSpysaJPCjwRO	2026-05-12 13:28:25.875	2026-05-12 13:28:25.875	Charlie	McCarthy	USER
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c76390b0-8898-4054-bcbe-ffea2ecd7a6d	28065243b941d9608eeb746a48d9778bad50bc78c5fb8fdcb4a23aa011a2e070	2026-04-30 14:06:15.424531+00	20260318130826_add_notifications_and_ownership	\N	\N	2026-04-30 14:06:15.288672+00	1
a61b240e-3124-46b2-af9e-f3913f905793	f467ac19063145d6e5013e150f3c258d0429dc4303ac45b969f132bf1fba3f92	2026-04-30 14:06:15.495467+00	20260320182849_add_my_team	\N	\N	2026-04-30 14:06:15.426888+00	1
b9bcc5a7-e9f8-438b-b986-5ca3b504e9b8	b011ed453e57eadaf15a0a0f8f343b61b510c064653d774545f51c1a49beb4c1	2026-05-11 14:39:28.914407+00	20260511143802_add_league_game_relations	\N	\N	2026-05-11 14:39:28.880364+00	1
7b9912ec-a3d4-4cd4-bd3c-440d47159910	073a2339abaf2434d3a68b53cb7b5e6879643f2aa9061d3d10f3905de548b8d3	2026-04-30 14:06:15.517877+00	20260326184144_add_bookings	\N	\N	2026-04-30 14:06:15.497572+00	1
1a30555e-629c-4067-8b9c-2b382c93d7d9	9d4c08a223357a486b6fb7e98409585f5bb5ce2a04fd5805ddb7fe905e43bc15	2026-04-30 14:06:15.52798+00	20260407142540_add_request_date_optional	\N	\N	2026-04-30 14:06:15.520559+00	1
810187d7-2e3d-4053-a0a5-680a2e17b79d	653b323d4e03d6e89f548cde1b759adc827f6b3a5177af6805e2a4e6694fd240	2026-04-30 14:06:15.53866+00	20260407154948_make_request_date_required	\N	\N	2026-04-30 14:06:15.530988+00	1
6d118427-5986-4d93-bfcf-127738675d50	f2f8464b080689c3905a35f003a249635e1432e5dd7a7230991f983625b41c4c	2026-05-11 15:56:57.472041+00	20260511155651_add_opponent_team_to_games	\N	\N	2026-05-11 15:56:57.452894+00	1
9e93bf9e-4aef-4478-8328-dc669b4596e9	7f55cf76657df1e3723a0678c35aa53d4e5a708a8264a86a672af9f8e8cb3098	2026-04-30 14:06:15.652136+00	20260417133500_add_roles_leagues_stats	\N	\N	2026-04-30 14:06:15.541342+00	1
e8001bd0-a896-46be-927e-ea6de1ea6350	3813b831e6f305794c66c1b648ae83e8591c6a33988364723d23c481858b0342	2026-04-30 14:06:15.668492+00	20260423134050_add_member_id_to_player_stats	\N	\N	2026-04-30 14:06:15.6548+00	1
1b93f708-9f27-450e-b8e8-e0808d01dc8d	bfb674e94fffa096bb6c72a32b0d42ac2342b51b5d0197bba1c0a5c52a3fd6bc	2026-04-30 14:06:15.70343+00	20260423134659_switch_player_stats_to_member_based	\N	\N	2026-04-30 14:06:15.670936+00	1
ef870b64-e324-4ba7-bb9b-6f522cada0f5	884d5db2e89d977e6ac4adabf99cc80dabca21fe92d94d8f82ef38b68ccf4727	2026-05-12 14:45:14.662517+00	20260512144514_add_team_member_sms_preference	\N	\N	2026-05-12 14:45:14.643247+00	1
49b79a72-4d49-427c-b3b0-b1197c9bf0f1	31d8b65eb3c3d45959aa74c6b2defff96bcf37f9177e3091e0f543a28655e4d4	2026-05-01 15:09:26.729517+00	20260501150926_add_player_offer_date	\N	\N	2026-05-01 15:09:26.702796+00	1
5a5ed2a5-ad10-4426-94e0-d3dba05713fd	533f9df2d9762f4ac58ab4c97eb353ab99cc94fc07979301769de8d37766235a	2026-05-04 21:10:26.106947+00	20260504211026_add_team_join_code	\N	\N	2026-05-04 21:10:26.089107+00	1
cb5b2d5a-7b75-44b0-971e-22c68aa1ac26	8041ba0e19ec73d53bdef3c2355e8e01bf086aa8a35be527b153c3db8d4610fd	2026-05-06 17:39:21.188568+00	20260506173921_add_team_member_added_notification_type	\N	\N	2026-05-06 17:39:21.177443+00	1
adfaa462-72c5-49be-86b0-77f1aab71cdd	ee5b8001d67a8d7738bffc634e818730e5330b64f276a486f07390a855286db1	2026-05-14 16:42:15.272818+00	20260514164215_add_score_sheets	\N	\N	2026-05-14 16:42:15.196565+00	1
27a6d095-813c-4570-8e0e-9b60cffab6c1	b091c2d9913bc853568c7595a1cbd0b40492715935e3be569b808fe3a2e88d87	2026-05-07 15:33:47.594697+00	20260507153347_add_booking_response_message	\N	\N	2026-05-07 15:33:47.558151+00	1
b849eec4-f166-4143-a7c9-e86b0216594d	8411f11e842d971e9facceb92d89d9d93dc04fe2e6f33c474c63102bebc18cec	2026-05-07 17:52:22.49438+00	20260507175222_add_league_arenas	\N	\N	2026-05-07 17:52:22.448188+00	1
\.


--
-- Name: PlayerOffer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PlayerOffer_id_seq"', 1, true);


--
-- Name: RequestResponse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."RequestResponse_id_seq"', 1, false);


--
-- Name: Request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Request_id_seq"', 3, true);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: GameScoreSheetPlayer GameScoreSheetPlayer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScoreSheetPlayer"
    ADD CONSTRAINT "GameScoreSheetPlayer_pkey" PRIMARY KEY (id);


--
-- Name: GameScoreSheet GameScoreSheet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScoreSheet"
    ADD CONSTRAINT "GameScoreSheet_pkey" PRIMARY KEY (id);


--
-- Name: LeagueArena LeagueArena_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeagueArena"
    ADD CONSTRAINT "LeagueArena_pkey" PRIMARY KEY (id);


--
-- Name: LeagueMember LeagueMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeagueMember"
    ADD CONSTRAINT "LeagueMember_pkey" PRIMARY KEY (id);


--
-- Name: League League_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."League"
    ADD CONSTRAINT "League_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PlayerOffer PlayerOffer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerOffer"
    ADD CONSTRAINT "PlayerOffer_pkey" PRIMARY KEY (id);


--
-- Name: PlayerStat PlayerStat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerStat"
    ADD CONSTRAINT "PlayerStat_pkey" PRIMARY KEY (id);


--
-- Name: RequestResponse RequestResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RequestResponse"
    ADD CONSTRAINT "RequestResponse_pkey" PRIMARY KEY (id);


--
-- Name: Request Request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_pkey" PRIMARY KEY (id);


--
-- Name: TeamGameAvailability TeamGameAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGameAvailability"
    ADD CONSTRAINT "TeamGameAvailability_pkey" PRIMARY KEY (id);


--
-- Name: TeamGameInvite TeamGameInvite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGameInvite"
    ADD CONSTRAINT "TeamGameInvite_pkey" PRIMARY KEY (id);


--
-- Name: TeamGame TeamGame_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGame"
    ADD CONSTRAINT "TeamGame_pkey" PRIMARY KEY (id);


--
-- Name: TeamMember TeamMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_pkey" PRIMARY KEY (id);


--
-- Name: Team Team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Booking_requestId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Booking_requestId_userId_key" ON public."Booking" USING btree ("requestId", "userId");


--
-- Name: GameScoreSheetPlayer_scoreSheetId_memberId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GameScoreSheetPlayer_scoreSheetId_memberId_key" ON public."GameScoreSheetPlayer" USING btree ("scoreSheetId", "memberId");


--
-- Name: GameScoreSheet_gameId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GameScoreSheet_gameId_key" ON public."GameScoreSheet" USING btree ("gameId");


--
-- Name: LeagueArena_leagueId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LeagueArena_leagueId_idx" ON public."LeagueArena" USING btree ("leagueId");


--
-- Name: LeagueArena_leagueId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LeagueArena_leagueId_name_key" ON public."LeagueArena" USING btree ("leagueId", name);


--
-- Name: LeagueMember_leagueId_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LeagueMember_leagueId_role_idx" ON public."LeagueMember" USING btree ("leagueId", role);


--
-- Name: LeagueMember_leagueId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON public."LeagueMember" USING btree ("leagueId", "userId");


--
-- Name: Notification_userId_isRead_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON public."Notification" USING btree ("userId", "isRead", "createdAt");


--
-- Name: PlayerOffer_position_skillLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlayerOffer_position_skillLevel_idx" ON public."PlayerOffer" USING btree ("position", "skillLevel");


--
-- Name: PlayerOffer_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlayerOffer_userId_status_idx" ON public."PlayerOffer" USING btree ("userId", status);


--
-- Name: PlayerStat_leagueId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlayerStat_leagueId_idx" ON public."PlayerStat" USING btree ("leagueId");


--
-- Name: PlayerStat_memberId_season_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PlayerStat_memberId_season_key" ON public."PlayerStat" USING btree ("memberId", season);


--
-- Name: PlayerStat_teamId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlayerStat_teamId_idx" ON public."PlayerStat" USING btree ("teamId");


--
-- Name: PlayerStat_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlayerStat_userId_idx" ON public."PlayerStat" USING btree ("userId");


--
-- Name: RequestResponse_requestId_responderUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RequestResponse_requestId_responderUserId_idx" ON public."RequestResponse" USING btree ("requestId", "responderUserId");


--
-- Name: Request_position_skillLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Request_position_skillLevel_idx" ON public."Request" USING btree ("position", "skillLevel");


--
-- Name: Request_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Request_type_idx" ON public."Request" USING btree (type);


--
-- Name: Request_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Request_userId_status_idx" ON public."Request" USING btree ("userId", status);


--
-- Name: TeamGameAvailability_gameId_memberId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TeamGameAvailability_gameId_memberId_key" ON public."TeamGameAvailability" USING btree ("gameId", "memberId");


--
-- Name: TeamGameAvailability_gameId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeamGameAvailability_gameId_status_idx" ON public."TeamGameAvailability" USING btree ("gameId", status);


--
-- Name: TeamGameInvite_gameId_memberId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TeamGameInvite_gameId_memberId_key" ON public."TeamGameInvite" USING btree ("gameId", "memberId");


--
-- Name: TeamGame_arenaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeamGame_arenaId_idx" ON public."TeamGame" USING btree ("arenaId");


--
-- Name: TeamGame_leagueId_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeamGame_leagueId_startsAt_idx" ON public."TeamGame" USING btree ("leagueId", "startsAt");


--
-- Name: TeamGame_opponentTeamId_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeamGame_opponentTeamId_startsAt_idx" ON public."TeamGame" USING btree ("opponentTeamId", "startsAt");


--
-- Name: TeamGame_teamId_startsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeamGame_teamId_startsAt_idx" ON public."TeamGame" USING btree ("teamId", "startsAt");


--
-- Name: TeamMember_teamId_memberType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeamMember_teamId_memberType_idx" ON public."TeamMember" USING btree ("teamId", "memberType");


--
-- Name: TeamMember_teamId_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeamMember_teamId_role_idx" ON public."TeamMember" USING btree ("teamId", role);


--
-- Name: Team_joinCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Team_joinCode_key" ON public."Team" USING btree ("joinCode");


--
-- Name: Team_leagueId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Team_leagueId_idx" ON public."Team" USING btree ("leagueId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Booking Booking_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GameScoreSheetPlayer GameScoreSheetPlayer_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScoreSheetPlayer"
    ADD CONSTRAINT "GameScoreSheetPlayer_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."TeamMember"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameScoreSheetPlayer GameScoreSheetPlayer_scoreSheetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScoreSheetPlayer"
    ADD CONSTRAINT "GameScoreSheetPlayer_scoreSheetId_fkey" FOREIGN KEY ("scoreSheetId") REFERENCES public."GameScoreSheet"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameScoreSheet GameScoreSheet_finalizedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScoreSheet"
    ADD CONSTRAINT "GameScoreSheet_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GameScoreSheet GameScoreSheet_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScoreSheet"
    ADD CONSTRAINT "GameScoreSheet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."TeamGame"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameScoreSheet GameScoreSheet_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScoreSheet"
    ADD CONSTRAINT "GameScoreSheet_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameScoreSheet GameScoreSheet_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScoreSheet"
    ADD CONSTRAINT "GameScoreSheet_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeagueArena LeagueArena_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeagueArena"
    ADD CONSTRAINT "LeagueArena_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeagueMember LeagueMember_gameScoreSheetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeagueMember"
    ADD CONSTRAINT "LeagueMember_gameScoreSheetId_fkey" FOREIGN KEY ("gameScoreSheetId") REFERENCES public."GameScoreSheet"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LeagueMember LeagueMember_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeagueMember"
    ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeagueMember LeagueMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeagueMember"
    ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerOffer PlayerOffer_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerOffer"
    ADD CONSTRAINT "PlayerOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerStat PlayerStat_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerStat"
    ADD CONSTRAINT "PlayerStat_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PlayerStat PlayerStat_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerStat"
    ADD CONSTRAINT "PlayerStat_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."TeamMember"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerStat PlayerStat_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerStat"
    ADD CONSTRAINT "PlayerStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerStat PlayerStat_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerStat"
    ADD CONSTRAINT "PlayerStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RequestResponse RequestResponse_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RequestResponse"
    ADD CONSTRAINT "RequestResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RequestResponse RequestResponse_responderUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RequestResponse"
    ADD CONSTRAINT "RequestResponse_responderUserId_fkey" FOREIGN KEY ("responderUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Request Request_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGameAvailability TeamGameAvailability_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGameAvailability"
    ADD CONSTRAINT "TeamGameAvailability_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."TeamGame"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGameAvailability TeamGameAvailability_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGameAvailability"
    ADD CONSTRAINT "TeamGameAvailability_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."TeamMember"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGameInvite TeamGameInvite_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGameInvite"
    ADD CONSTRAINT "TeamGameInvite_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."TeamGame"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGameInvite TeamGameInvite_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGameInvite"
    ADD CONSTRAINT "TeamGameInvite_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."TeamMember"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGame TeamGame_arenaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGame"
    ADD CONSTRAINT "TeamGame_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES public."LeagueArena"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TeamGame TeamGame_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGame"
    ADD CONSTRAINT "TeamGame_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGame TeamGame_opponentTeamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGame"
    ADD CONSTRAINT "TeamGame_opponentTeamId_fkey" FOREIGN KEY ("opponentTeamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TeamGame TeamGame_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamGame"
    ADD CONSTRAINT "TeamGame_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Team Team_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Team Team_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict lHwWhC0B7WUmkaYeewZMB0Pm7OtuKFQwVXYMXYorh83ghYY5rzBhGQvodSpza2b

