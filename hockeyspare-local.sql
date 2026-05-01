--
-- PostgreSQL database dump
--

\restrict mQau7aCOR5ydHLh5mwuKIVQbpBttvkxmfUdLygMmSjTsJdRhoEYkaArp8fsdZkY

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 17.9 (Debian 17.9-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

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
    'LEAGUE_MANAGER'
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
    'TEAM_GAME_REMINDER'
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
    status public."BookingStatus" DEFAULT 'PENDING'::public."BookingStatus" NOT NULL,
    message text,
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
-- Name: LeagueMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeagueMember" (
    id text NOT NULL,
    "leagueId" text NOT NULL,
    "userId" text NOT NULL,
    role public."LeagueRole" DEFAULT 'PLAYER'::public."LeagueRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    status public."OfferStatus" DEFAULT 'OPEN'::public."OfferStatus" NOT NULL
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
    "leagueId" text
);


--
-- Name: TeamGame; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeamGame" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    title text NOT NULL,
    "startsAt" timestamp(3) without time zone NOT NULL,
    arena text,
    opponent text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    role public."TeamRole" DEFAULT 'PLAYER'::public."TeamRole" NOT NULL
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

COPY public."Booking" (id, "requestId", "userId", status, message, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: League; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."League" (id, name, season, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LeagueMember; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeagueMember" (id, "leagueId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "userId", type, title, body, link, "isRead", metadata, "createdAt") FROM stdin;
cmo8pmxz60004t0uasph0quir	cmng3a6m60001y4ua2b8s85ge	TEAM_GAME_REMINDER	Game reminder: League Game	Brandon's Team has a game on 4/24/2026, 10:10:00 PM	/my-team	f	{"gameId": "cmo8pc5br0000t0ua419bcfma", "teamId": "cmo7mntff000020uaeij3r0iy", "memberId": "cmo7mntfo000120uakdeemsgb"}	2026-04-21 14:19:36.45
cmobtuj250005qwuav2jhkcjl	cmng3a6m60001y4ua2b8s85ge	TEAM_GAME_REMINDER	Game reminder: League Game	The Eagles has a game on 4/24/2026, 11:06:00 AM	/my-team	f	{"gameId": "cmobm77p10000gcua0mvtcrz4", "teamId": "cmo7mntff000020uaeij3r0iy", "memberId": "cmo7mntfo000120uakdeemsgb"}	2026-04-23 18:40:47.357
cmobtuonv000bqwua75anv7t7	cmng3a6m60001y4ua2b8s85ge	TEAM_GAME_REMINDER	Game reminder: League Game	The Eagles has a game on 4/24/2026, 11:06:00 AM	/my-team	f	{"gameId": "cmobm77p10000gcua0mvtcrz4", "teamId": "cmo7mntff000020uaeij3r0iy", "memberId": "cmo7mntfo000120uakdeemsgb"}	2026-04-23 18:40:54.619
\.


--
-- Data for Name: PlayerOffer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlayerOffer" (id, "userId", arena, notes, "createdAt", "updatedAt", "arenaAddress", "payAmount", "playerName", "time", "position", "skillLevel", status) FROM stdin;
2	cmng3a6m60001y4ua2b8s85ge	Aréna de Beaconsfield	1974 City Ln, Beaconsfield, Quebec H9W 4A7	2026-04-02 14:39:23.245	2026-04-02 14:39:23.245		20	Tim Heart	11:30 PM	FORWARD	ADVANCED	OPEN
\.


--
-- Data for Name: PlayerStat; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlayerStat" (id, "userId", "teamId", "leagueId", season, "gamesPlayed", goals, assists, "penaltyMins", "updatedAt", "memberId") FROM stdin;
cmobjqhuk00005guaktiztwrg	\N	cmo7mntff000020uaeij3r0iy	\N	2026-2027	1	3	2	2	2026-04-23 13:57:43.004	cmobi0am10001wcuaond93qf4
cmobssly70000xouawbxfdivp	\N	cmo7mntff000020uaeij3r0iy	\N	2026-2027	7	22	0	0	2026-04-23 18:11:18.175	cmo8pd08j0001t0ua1tuoqjda
cmoa3gyhx0000fcuacldct3u5	cmng3a6m60001y4ua2b8s85ge	cmo7mntff000020uaeij3r0iy	\N	2026-2027	3	3	30	40	2026-04-23 18:11:44.314	cmo7mntfo000120uakdeemsgb
\.


--
-- Data for Name: Request; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Request" (id, "userId", arena, notes, "position", "createdAt", "updatedAt", "arenaAddress", "payAmount", "playerName", "skillLevel", "teamName", "time", type, status, date) FROM stdin;
1	cmng3a6m60001y4ua2b8s85ge	Sportplexe Pierrefonds	Room #5	FORWARD	2026-04-01 13:38:44.326	2026-04-01 13:38:44.326	14700 Pierrefonds Blvd., Pierrefonds, Quebec H9H 4Y6	40	\N	INTERMEDIATE	Eagles	8:30 PM	TEAM_NEEDS_PLAYER	OPEN	2026-04-07 14:25:55.828
2	cmng3a6m60001y4ua2b8s85ge	Bob-Birnie Arena	Need left handed player+	FORWARD	2026-04-02 14:35:05.524	2026-04-02 14:35:05.524	58 Maywood Ave, Pointe-Claire, Quebec H9R 0A7	50	\N	BEGINNER	Black Aces	11:30 PM	TEAM_NEEDS_PLAYER	OPEN	2026-04-07 14:25:55.828
3	cmng3a6m60001y4ua2b8s85ge	Aréna de Beaconsfield	Room 3	FORWARD	2026-04-02 14:37:54.291	2026-04-02 14:37:54.291	1974 City Ln, Beaconsfield, Quebec H9W 4A7	30	\N	INTERMEDIATE	Highlanders	9:30 PM	TEAM_NEEDS_PLAYER	OPEN	2026-04-07 14:25:55.828
4	cmng3a6m60001y4ua2b8s85ge	St-Lazarre	Bring pucks	FORWARD	2026-04-17 18:26:07.24	2026-04-17 18:26:07.24	123 Street	0	\N	INTERMEDIATE	Canadiens	8:30 PM	TEAM_NEEDS_PLAYER	OPEN	2026-04-18 00:00:00
\.


--
-- Data for Name: RequestResponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RequestResponse" (id, "requestId", "responderUserId", message, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Team; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Team" (id, "ownerId", name, "createdAt", "updatedAt", "leagueId") FROM stdin;
cmo7mntff000020uaeij3r0iy	cmng3a6m60001y4ua2b8s85ge	The Eagles	2026-04-20 20:08:32.183	2026-04-23 13:03:23.971	\N
\.


--
-- Data for Name: TeamGame; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamGame" (id, "teamId", title, "startsAt", arena, opponent, notes, "createdAt", "updatedAt") FROM stdin;
cmo8pc5br0000t0ua419bcfma	cmo7mntff000020uaeij3r0iy	League Game	2026-04-25 02:10:00	Beaconsfield	Sharks	Tough team	2026-04-21 14:11:12.759	2026-04-21 14:11:12.759
cmo8pz7fc00006kuaffgwegck	cmo7mntff000020uaeij3r0iy	League Game	2026-04-25 15:30:00	Kirkland	Bulldogs	Easy win for us boys	2026-04-21 14:29:08.567	2026-04-21 14:29:08.567
cmobm77p10000gcua0mvtcrz4	cmo7mntff000020uaeij3r0iy	League Game	2026-04-24 15:06:00	Vaudreuil	Black Bears	Bring beers\n	2026-04-23 15:06:42.229	2026-04-23 15:06:42.229
\.


--
-- Data for Name: TeamGameAvailability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamGameAvailability" (id, "gameId", "memberId", status, note, "createdAt", "updatedAt") FROM stdin;
cmo8pl6u80000t0uab187zj7y	cmo8pc5br0000t0ua419bcfma	cmo7mntfo000120uakdeemsgb	AVAILABLE		2026-04-21 14:18:14.621	2026-04-21 14:28:19.518
cmo8q57ip00016kuazkqv18oi	cmo8pz7fc00006kuaffgwegck	cmo7mntfo000120uakdeemsgb	UNAVAILABLE	sick	2026-04-21 14:33:48.622	2026-04-21 14:33:48.622
cmobstovq0002xouauxs1jhdt	cmobm77p10000gcua0mvtcrz4	cmo7mntfo000120uakdeemsgb	AVAILABLE	\N	2026-04-23 18:12:08.622	2026-04-23 18:40:43.415
\.


--
-- Data for Name: TeamGameInvite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamGameInvite" (id, "gameId", "memberId", status, "sentAt", "respondedAt", "createdAt") FROM stdin;
cmo8pmxyt0001t0uachghvqjh	cmo8pc5br0000t0ua419bcfma	cmo7mntfo000120uakdeemsgb	SENT	2026-04-21 14:19:36.433	\N	2026-04-21 14:19:36.437
cmo8pmxyx0002t0uamynm970c	cmo8pc5br0000t0ua419bcfma	cmo8pd08j0001t0ua1tuoqjda	SENT	2026-04-21 14:19:36.441	\N	2026-04-21 14:19:36.441
cmobtuj1p0000qwuabl40ylic	cmobm77p10000gcua0mvtcrz4	cmo7mntfo000120uakdeemsgb	SENT	2026-04-23 18:40:54.597	\N	2026-04-23 18:40:47.341
cmobtuj1s0001qwualzopzdzk	cmobm77p10000gcua0mvtcrz4	cmo8pd08j0001t0ua1tuoqjda	SENT	2026-04-23 18:40:54.606	\N	2026-04-23 18:40:47.344
cmobtuj1w0002qwua22sl228c	cmobm77p10000gcua0mvtcrz4	cmobi0am10001wcuaond93qf4	SENT	2026-04-23 18:40:54.609	\N	2026-04-23 18:40:47.348
cmobtuj1z0003qwuaut282puw	cmobm77p10000gcua0mvtcrz4	cmobis4nw000090uafka205ry	SENT	2026-04-23 18:40:54.612	\N	2026-04-23 18:40:47.351
cmobtuj210004qwuai04txkjq	cmobm77p10000gcua0mvtcrz4	cmobistua000190uaxu3opyo4	SENT	2026-04-23 18:40:54.616	\N	2026-04-23 18:40:47.353
\.


--
-- Data for Name: TeamMember; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeamMember" (id, "teamId", "userId", "displayName", email, phone, "position", "memberType", "notifyByApp", "notifyByEmail", "isActive", "createdAt", "updatedAt", role) FROM stdin;
cmo7mntfo000120uakdeemsgb	cmo7mntff000020uaeij3r0iy	cmng3a6m60001y4ua2b8s85ge	Brandon McCarthy	bmcc81@gmail.com	\N	FORWARD	REGULAR	t	f	t	2026-04-20 20:08:32.183	2026-04-20 20:08:32.183	GENERAL_MANAGER
cmo8pd08j0001t0ua1tuoqjda	cmo7mntff000020uaeij3r0iy	\N	Wayne Gretzky	melbran126@gmail.com	555-833-2278	FORWARD	SPARE	t	t	t	2026-04-21 14:11:52.819	2026-04-21 14:11:52.819	PLAYER
cmobi0am10001wcuaond93qf4	cmo7mntff000020uaeij3r0iy	\N	Bobby Orr	bobby@gmail.com	514-888-999	FORWARD	REGULAR	t	f	t	2026-04-23 13:09:20.952	2026-04-23 13:09:20.952	PLAYER
cmobis4nw000090uafka205ry	cmo7mntff000020uaeij3r0iy	\N	Stan Makita	stan@gmail.com	514-830-4011	FORWARD	REGULAR	t	f	t	2026-04-23 13:30:59.612	2026-04-23 13:30:59.612	PLAYER
cmobistua000190uaxu3opyo4	cmo7mntff000020uaeij3r0iy	\N	Ray Bourque	ray@gmail.com	41+-999-6666	DEFENSE	REGULAR	t	f	t	2026-04-23 13:31:32.242	2026-04-23 13:31:32.242	PLAYER
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "passwordHash", "createdAt", "updatedAt", "firstName", "lastName", "appRole") FROM stdin;
cmng3a6m60001y4ua2b8s85ge	bmcc81@gmail.com	$2b$12$PODVaGIS73iCsicDtWSWh.LnFOWiesbuXNrxqq/9oaTZbCsjl9OKa	2026-04-01 13:36:16.638	2026-04-01 13:36:16.638	Brandon	McCarthy	USER
cmnot6fc40000q8uayjq623za	bmcc81@icloud.com	$2b$12$VtJ6.GM632X2xaRa/aQsrOalmEJDx.mQF5VmgiyU1QffOCnPVdAgS	2026-04-07 16:03:20.74	2026-04-07 16:03:20.74	Brand	McC	USER
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
5729ddcc-a22f-4005-bbcd-6274747cdbdb	28065243b941d9608eeb746a48d9778bad50bc78c5fb8fdcb4a23aa011a2e070	2026-04-01 13:35:43.255513+00	20260318130826_add_notifications_and_ownership	\N	\N	2026-04-01 13:35:42.964977+00	1
c97dab94-9648-4254-bc84-a448a9a89573	f467ac19063145d6e5013e150f3c258d0429dc4303ac45b969f132bf1fba3f92	2026-04-01 13:35:43.352185+00	20260320182849_add_my_team	\N	\N	2026-04-01 13:35:43.258315+00	1
2705ca3b-d156-4171-a870-73a64e196288	073a2339abaf2434d3a68b53cb7b5e6879643f2aa9061d3d10f3905de548b8d3	2026-04-01 13:35:43.388837+00	20260326184144_add_bookings	\N	\N	2026-04-01 13:35:43.355136+00	1
f605aa00-4607-4550-9f9b-3006540f2a49	9d4c08a223357a486b6fb7e98409585f5bb5ce2a04fd5805ddb7fe905e43bc15	2026-04-07 14:25:40.86498+00	20260407142540_add_request_date_optional	\N	\N	2026-04-07 14:25:40.848105+00	1
7a893cd4-d0bf-44ee-9200-101114e29ea4	653b323d4e03d6e89f548cde1b759adc827f6b3a5177af6805e2a4e6694fd240	2026-04-07 15:49:48.995549+00	20260407154948_make_request_date_required	\N	\N	2026-04-07 15:49:48.984057+00	1
96575d70-2c33-4ac6-a9a9-5947bbcde5b4	7f55cf76657df1e3723a0678c35aa53d4e5a708a8264a86a672af9f8e8cb3098	2026-04-17 13:35:00.177965+00	20260417133500_add_roles_leagues_stats	\N	\N	2026-04-17 13:35:00.045724+00	1
828f78d8-866b-44f2-8ee4-7991ffda9102	3813b831e6f305794c66c1b648ae83e8591c6a33988364723d23c481858b0342	2026-04-23 13:40:50.747305+00	20260423134050_add_member_id_to_player_stats	\N	\N	2026-04-23 13:40:50.710051+00	1
db7d36ee-20ec-4eea-a637-4c26db7c19f3	bfb674e94fffa096bb6c72a32b0d42ac2342b51b5d0197bba1c0a5c52a3fd6bc	2026-04-23 13:46:59.872684+00	20260423134659_switch_player_stats_to_member_based	\N	\N	2026-04-23 13:46:59.829175+00	1
\.


--
-- Name: PlayerOffer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PlayerOffer_id_seq"', 2, true);


--
-- Name: RequestResponse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."RequestResponse_id_seq"', 1, false);


--
-- Name: Request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Request_id_seq"', 4, true);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


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
    ADD CONSTRAINT "Booking_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Booking Booking_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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

\unrestrict mQau7aCOR5ydHLh5mwuKIVQbpBttvkxmfUdLygMmSjTsJdRhoEYkaArp8fsdZkY

