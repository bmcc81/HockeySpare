--
-- PostgreSQL database dump
--

\restrict d6mIlYuyDYMYX7G0cDtdEVNhV4luficNSUpRJ3cHD1gNSFAZI6bkWem87HkGAtZ

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: hockeyspare
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO hockeyspare;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: hockeyspare
--

COMMENT ON SCHEMA public IS '';


--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'DECLINED',
    'CANCELLED'
);


ALTER TYPE public."BookingStatus" OWNER TO hockeyspare;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."NotificationType" AS ENUM (
    'REQUEST_MATCH',
    'OFFER_MATCH',
    'REQUEST_RESPONSE',
    'REQUEST_ACCEPTED',
    'REQUEST_DECLINED',
    'TEAM_GAME_REMINDER'
);


ALTER TYPE public."NotificationType" OWNER TO hockeyspare;

--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'OPEN',
    'FILLED',
    'CANCELLED'
);


ALTER TYPE public."OfferStatus" OWNER TO hockeyspare;

--
-- Name: Position; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."Position" AS ENUM (
    'GOALIE',
    'DEFENSE',
    'FORWARD'
);


ALTER TYPE public."Position" OWNER TO hockeyspare;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'OPEN',
    'FILLED',
    'CANCELLED'
);


ALTER TYPE public."RequestStatus" OWNER TO hockeyspare;

--
-- Name: RequestType; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."RequestType" AS ENUM (
    'TEAM_NEEDS_PLAYER',
    'PLAYER_NEEDS_TEAM'
);


ALTER TYPE public."RequestType" OWNER TO hockeyspare;

--
-- Name: ResponseStatus; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."ResponseStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED'
);


ALTER TYPE public."ResponseStatus" OWNER TO hockeyspare;

--
-- Name: SkillLevel; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."SkillLevel" AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'ELITE'
);


ALTER TYPE public."SkillLevel" OWNER TO hockeyspare;

--
-- Name: TeamGameInviteStatus; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."TeamGameInviteStatus" AS ENUM (
    'PENDING',
    'SENT',
    'CONFIRMED',
    'DECLINED'
);


ALTER TYPE public."TeamGameInviteStatus" OWNER TO hockeyspare;

--
-- Name: TeamMemberType; Type: TYPE; Schema: public; Owner: hockeyspare
--

CREATE TYPE public."TeamMemberType" AS ENUM (
    'REGULAR',
    'SPARE'
);


ALTER TYPE public."TeamMemberType" OWNER TO hockeyspare;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Booking; Type: TABLE; Schema: public; Owner: hockeyspare
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


ALTER TABLE public."Booking" OWNER TO hockeyspare;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: hockeyspare
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


ALTER TABLE public."Notification" OWNER TO hockeyspare;

--
-- Name: PlayerOffer; Type: TABLE; Schema: public; Owner: hockeyspare
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


ALTER TABLE public."PlayerOffer" OWNER TO hockeyspare;

--
-- Name: PlayerOffer_id_seq; Type: SEQUENCE; Schema: public; Owner: hockeyspare
--

CREATE SEQUENCE public."PlayerOffer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PlayerOffer_id_seq" OWNER TO hockeyspare;

--
-- Name: PlayerOffer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hockeyspare
--

ALTER SEQUENCE public."PlayerOffer_id_seq" OWNED BY public."PlayerOffer".id;


--
-- Name: Request; Type: TABLE; Schema: public; Owner: hockeyspare
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
    status public."RequestStatus" DEFAULT 'OPEN'::public."RequestStatus" NOT NULL
);


ALTER TABLE public."Request" OWNER TO hockeyspare;

--
-- Name: RequestResponse; Type: TABLE; Schema: public; Owner: hockeyspare
--

CREATE TABLE public."RequestResponse" (
    id integer NOT NULL,
    "requestId" integer NOT NULL,
    "responderUserId" text NOT NULL,
    message text,
    status public."ResponseStatus" DEFAULT 'PENDING'::public."ResponseStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RequestResponse" OWNER TO hockeyspare;

--
-- Name: RequestResponse_id_seq; Type: SEQUENCE; Schema: public; Owner: hockeyspare
--

CREATE SEQUENCE public."RequestResponse_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RequestResponse_id_seq" OWNER TO hockeyspare;

--
-- Name: RequestResponse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hockeyspare
--

ALTER SEQUENCE public."RequestResponse_id_seq" OWNED BY public."RequestResponse".id;


--
-- Name: Request_id_seq; Type: SEQUENCE; Schema: public; Owner: hockeyspare
--

CREATE SEQUENCE public."Request_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Request_id_seq" OWNER TO hockeyspare;

--
-- Name: Request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hockeyspare
--

ALTER SEQUENCE public."Request_id_seq" OWNED BY public."Request".id;


--
-- Name: Team; Type: TABLE; Schema: public; Owner: hockeyspare
--

CREATE TABLE public."Team" (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Team" OWNER TO hockeyspare;

--
-- Name: TeamGame; Type: TABLE; Schema: public; Owner: hockeyspare
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


ALTER TABLE public."TeamGame" OWNER TO hockeyspare;

--
-- Name: TeamGameInvite; Type: TABLE; Schema: public; Owner: hockeyspare
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


ALTER TABLE public."TeamGameInvite" OWNER TO hockeyspare;

--
-- Name: TeamMember; Type: TABLE; Schema: public; Owner: hockeyspare
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
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TeamMember" OWNER TO hockeyspare;

--
-- Name: User; Type: TABLE; Schema: public; Owner: hockeyspare
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "firstName" text,
    "lastName" text
);


ALTER TABLE public."User" OWNER TO hockeyspare;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: hockeyspare
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


ALTER TABLE public._prisma_migrations OWNER TO hockeyspare;

--
-- Name: PlayerOffer id; Type: DEFAULT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."PlayerOffer" ALTER COLUMN id SET DEFAULT nextval('public."PlayerOffer_id_seq"'::regclass);


--
-- Name: Request id; Type: DEFAULT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Request" ALTER COLUMN id SET DEFAULT nextval('public."Request_id_seq"'::regclass);


--
-- Name: RequestResponse id; Type: DEFAULT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."RequestResponse" ALTER COLUMN id SET DEFAULT nextval('public."RequestResponse_id_seq"'::regclass);


--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--



--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--



--
-- Data for Name: PlayerOffer; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--

INSERT INTO public."PlayerOffer" (id, "userId", arena, notes, "createdAt", "updatedAt", "arenaAddress", "payAmount", "playerName", "time", "position", "skillLevel", status) VALUES (2, 'cmng3a6m60001y4ua2b8s85ge', 'Aréna de Beaconsfield', '1974 City Ln, Beaconsfield, Quebec H9W 4A7', '2026-04-02 14:39:23.245', '2026-04-02 14:39:23.245', '', 20, 'Tim Heart', '11:30 PM', 'FORWARD', 'ADVANCED', 'OPEN');


--
-- Data for Name: Request; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--

INSERT INTO public."Request" (id, "userId", arena, notes, "position", "createdAt", "updatedAt", "arenaAddress", "payAmount", "playerName", "skillLevel", "teamName", "time", type, status) VALUES (1, 'cmng3a6m60001y4ua2b8s85ge', 'Sportplexe Pierrefonds', 'Room #5', 'FORWARD', '2026-04-01 13:38:44.326', '2026-04-01 13:38:44.326', '14700 Pierrefonds Blvd., Pierrefonds, Quebec H9H 4Y6', 40, NULL, 'INTERMEDIATE', 'Eagles', '8:30 PM', 'TEAM_NEEDS_PLAYER', 'OPEN');
INSERT INTO public."Request" (id, "userId", arena, notes, "position", "createdAt", "updatedAt", "arenaAddress", "payAmount", "playerName", "skillLevel", "teamName", "time", type, status) VALUES (2, 'cmng3a6m60001y4ua2b8s85ge', 'Bob-Birnie Arena', 'Need left handed player+', 'FORWARD', '2026-04-02 14:35:05.524', '2026-04-02 14:35:05.524', '58 Maywood Ave, Pointe-Claire, Quebec H9R 0A7', 50, NULL, 'BEGINNER', 'Black Aces', '11:30 PM', 'TEAM_NEEDS_PLAYER', 'OPEN');
INSERT INTO public."Request" (id, "userId", arena, notes, "position", "createdAt", "updatedAt", "arenaAddress", "payAmount", "playerName", "skillLevel", "teamName", "time", type, status) VALUES (3, 'cmng3a6m60001y4ua2b8s85ge', 'Aréna de Beaconsfield', 'Room 3', 'FORWARD', '2026-04-02 14:37:54.291', '2026-04-02 14:37:54.291', '1974 City Ln, Beaconsfield, Quebec H9W 4A7', 30, NULL, 'INTERMEDIATE', 'Highlanders', '9:30 PM', 'TEAM_NEEDS_PLAYER', 'OPEN');


--
-- Data for Name: RequestResponse; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--



--
-- Data for Name: Team; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--



--
-- Data for Name: TeamGame; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--



--
-- Data for Name: TeamGameInvite; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--



--
-- Data for Name: TeamMember; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--



--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--

INSERT INTO public."User" (id, email, "passwordHash", "createdAt", "updatedAt", "firstName", "lastName") VALUES ('cmng3a6m60001y4ua2b8s85ge', 'bmcc81@gmail.com', '$2b$12$PODVaGIS73iCsicDtWSWh.LnFOWiesbuXNrxqq/9oaTZbCsjl9OKa', '2026-04-01 13:36:16.638', '2026-04-01 13:36:16.638', 'Brandon', 'McCarthy');


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: hockeyspare
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5729ddcc-a22f-4005-bbcd-6274747cdbdb', '28065243b941d9608eeb746a48d9778bad50bc78c5fb8fdcb4a23aa011a2e070', '2026-04-01 13:35:43.255513+00', '20260318130826_add_notifications_and_ownership', NULL, NULL, '2026-04-01 13:35:42.964977+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('c97dab94-9648-4254-bc84-a448a9a89573', 'f467ac19063145d6e5013e150f3c258d0429dc4303ac45b969f132bf1fba3f92', '2026-04-01 13:35:43.352185+00', '20260320182849_add_my_team', NULL, NULL, '2026-04-01 13:35:43.258315+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2705ca3b-d156-4171-a870-73a64e196288', '073a2339abaf2434d3a68b53cb7b5e6879643f2aa9061d3d10f3905de548b8d3', '2026-04-01 13:35:43.388837+00', '20260326184144_add_bookings', NULL, NULL, '2026-04-01 13:35:43.355136+00', 1);


--
-- Name: PlayerOffer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hockeyspare
--

SELECT pg_catalog.setval('public."PlayerOffer_id_seq"', 2, true);


--
-- Name: RequestResponse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hockeyspare
--

SELECT pg_catalog.setval('public."RequestResponse_id_seq"', 1, false);


--
-- Name: Request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hockeyspare
--

SELECT pg_catalog.setval('public."Request_id_seq"', 3, true);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PlayerOffer PlayerOffer_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."PlayerOffer"
    ADD CONSTRAINT "PlayerOffer_pkey" PRIMARY KEY (id);


--
-- Name: RequestResponse RequestResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."RequestResponse"
    ADD CONSTRAINT "RequestResponse_pkey" PRIMARY KEY (id);


--
-- Name: Request Request_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_pkey" PRIMARY KEY (id);


--
-- Name: TeamGameInvite TeamGameInvite_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."TeamGameInvite"
    ADD CONSTRAINT "TeamGameInvite_pkey" PRIMARY KEY (id);


--
-- Name: TeamGame TeamGame_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."TeamGame"
    ADD CONSTRAINT "TeamGame_pkey" PRIMARY KEY (id);


--
-- Name: TeamMember TeamMember_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_pkey" PRIMARY KEY (id);


--
-- Name: Team Team_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Booking_requestId_userId_key; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE UNIQUE INDEX "Booking_requestId_userId_key" ON public."Booking" USING btree ("requestId", "userId");


--
-- Name: Notification_userId_isRead_createdAt_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON public."Notification" USING btree ("userId", "isRead", "createdAt");


--
-- Name: PlayerOffer_position_skillLevel_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "PlayerOffer_position_skillLevel_idx" ON public."PlayerOffer" USING btree ("position", "skillLevel");


--
-- Name: PlayerOffer_userId_status_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "PlayerOffer_userId_status_idx" ON public."PlayerOffer" USING btree ("userId", status);


--
-- Name: RequestResponse_requestId_responderUserId_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "RequestResponse_requestId_responderUserId_idx" ON public."RequestResponse" USING btree ("requestId", "responderUserId");


--
-- Name: Request_position_skillLevel_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "Request_position_skillLevel_idx" ON public."Request" USING btree ("position", "skillLevel");


--
-- Name: Request_type_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "Request_type_idx" ON public."Request" USING btree (type);


--
-- Name: Request_userId_status_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "Request_userId_status_idx" ON public."Request" USING btree ("userId", status);


--
-- Name: TeamGameInvite_gameId_memberId_key; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE UNIQUE INDEX "TeamGameInvite_gameId_memberId_key" ON public."TeamGameInvite" USING btree ("gameId", "memberId");


--
-- Name: TeamGame_teamId_startsAt_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "TeamGame_teamId_startsAt_idx" ON public."TeamGame" USING btree ("teamId", "startsAt");


--
-- Name: TeamMember_teamId_memberType_idx; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE INDEX "TeamMember_teamId_memberType_idx" ON public."TeamMember" USING btree ("teamId", "memberType");


--
-- Name: Team_ownerId_key; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE UNIQUE INDEX "Team_ownerId_key" ON public."Team" USING btree ("ownerId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: hockeyspare
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Booking Booking_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Booking Booking_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerOffer PlayerOffer_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."PlayerOffer"
    ADD CONSTRAINT "PlayerOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RequestResponse RequestResponse_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."RequestResponse"
    ADD CONSTRAINT "RequestResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RequestResponse RequestResponse_responderUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."RequestResponse"
    ADD CONSTRAINT "RequestResponse_responderUserId_fkey" FOREIGN KEY ("responderUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Request Request_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGameInvite TeamGameInvite_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."TeamGameInvite"
    ADD CONSTRAINT "TeamGameInvite_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."TeamGame"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGameInvite TeamGameInvite_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."TeamGameInvite"
    ADD CONSTRAINT "TeamGameInvite_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."TeamMember"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamGame TeamGame_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."TeamGame"
    ADD CONSTRAINT "TeamGame_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeamMember TeamMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."TeamMember"
    ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Team Team_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hockeyspare
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: hockeyspare
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict d6mIlYuyDYMYX7G0cDtdEVNhV4luficNSUpRJ3cHD1gNSFAZI6bkWem87HkGAtZ

