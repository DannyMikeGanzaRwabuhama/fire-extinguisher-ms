--
-- PostgreSQL database dump
--

\restrict 1XJ4qHgKI2X1g93KYfV84MaeQJeQ23XWExyUrUeg0GxzIl0DTfAmBpO7F5eVAso

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Name: notify_on_inspection_scheduled(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_on_inspection_scheduled() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'SCHEDULED' THEN
    -- Notify the user who scheduled the inspection
    INSERT INTO notifications(user_id, message, created_at, is_read)
    VALUES (
      NEW.user_id,
      'Dear ' || (SELECT first_name FROM users WHERE id = NEW.user_id)
      || ', an inspection for extinguisher '
      || (SELECT serial_number FROM extinguishers WHERE id = NEW.extinguisher_id)
      || ' at '
      || (SELECT location FROM extinguishers WHERE id = NEW.extinguisher_id)
      || ' has been scheduled for '
      || NEW.inspection_date || ' at ' || NEW.inspection_time || '.',
      NOW(),
      false
    );

    -- Notify the assigned inspector (if one is assigned and is not the scheduler)
    IF NEW.inspector_id IS NOT NULL AND NEW.inspector_id != NEW.user_id THEN
      INSERT INTO notifications(user_id, message, created_at, is_read)
      VALUES (
        NEW.inspector_id,
        'Dear ' || (SELECT first_name FROM users WHERE id = NEW.inspector_id)
        || ', an inspection for extinguisher '
        || (SELECT serial_number FROM extinguishers WHERE id = NEW.extinguisher_id)
        || ' at '
        || (SELECT location FROM extinguishers WHERE id = NEW.extinguisher_id)
        || ' has been scheduled for '
        || NEW.inspection_date || ' at ' || NEW.inspection_time || '.',
        NOW(),
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_on_inspection_scheduled() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extinguishers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extinguishers (
    id integer NOT NULL,
    serial_number character varying(100) NOT NULL,
    location character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    size character varying(50) NOT NULL,
    installation_date date NOT NULL,
    expiry_date date NOT NULL,
    status character varying(50) DEFAULT 'OPERATIONAL'::character varying NOT NULL
);


ALTER TABLE public.extinguishers OWNER TO postgres;

--
-- Name: extinguishers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.extinguishers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.extinguishers_id_seq OWNER TO postgres;

--
-- Name: extinguishers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.extinguishers_id_seq OWNED BY public.extinguishers.id;


--
-- Name: inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspections (
    id integer NOT NULL,
    user_id integer,
    extinguisher_id integer,
    inspector_id integer,
    inspection_date date NOT NULL,
    inspection_time time without time zone NOT NULL,
    status character varying(50) DEFAULT 'SCHEDULED'::character varying NOT NULL
);


ALTER TABLE public.inspections OWNER TO postgres;

--
-- Name: inspections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inspections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inspections_id_seq OWNER TO postgres;

--
-- Name: inspections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inspections_id_seq OWNED BY public.inspections.id;


--
-- Name: maintenance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance (
    id integer NOT NULL,
    inspection_id integer,
    inspector_id integer,
    actions text NOT NULL,
    maintenance_date date NOT NULL,
    conditions_noted text NOT NULL
);


ALTER TABLE public.maintenance OWNER TO postgres;

--
-- Name: maintenance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maintenance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_id_seq OWNER TO postgres;

--
-- Name: maintenance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.maintenance_id_seq OWNED BY public.maintenance.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_read boolean DEFAULT false NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    phone character varying(50)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: extinguishers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers ALTER COLUMN id SET DEFAULT nextval('public.extinguishers_id_seq'::regclass);


--
-- Name: inspections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections ALTER COLUMN id SET DEFAULT nextval('public.inspections_id_seq'::regclass);


--
-- Name: maintenance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance ALTER COLUMN id SET DEFAULT nextval('public.maintenance_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: extinguishers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extinguishers (id, serial_number, location, type, size, installation_date, expiry_date, status) FROM stdin;
1	EXT-001	Main Hall A	CO2	5LBS	2023-01-15	2025-01-15	EXPIRED
3	EXT-003	Server Room	CO2	9LBS	2025-10-10	2028-10-10	OPERATIONAL
4	EXT-004	Warehouse B	FOAM	12LBS	2024-02-12	2027-02-12	OPERATIONAL
5	EXT-005	Office C	WATER	2.5LBS	2025-03-01	2028-03-01	OPERATIONAL
6	EXT-006	Main Lobby	DRY_CHEMICAL	5LBS	2024-05-15	2027-05-15	OPERATIONAL
7	EXT-007	Corridor D	WATER	9LBS	2024-08-20	2027-08-20	OPERATIONAL
8	EXT-008	Staff Room	FOAM	5LBS	2024-09-01	2027-09-01	DECOMMISSIONED
9	EXT-009	Electrical Closet	CO2	5LBS	2024-10-15	2027-10-15	OPERATIONAL
10	EXT-010	Loading Dock	DRY_CHEMICAL	12LBS	2024-11-20	2027-11-20	OPERATIONAL
11	EXT-011	Reception Area	WATER	2.5LBS	2024-12-05	2027-12-05	OPERATIONAL
12	EXT-012	Conference Room A	CO2	9LBS	2025-01-10	2028-01-10	OPERATIONAL
13	EXT-013	Cafeteria	FOAM	9LBS	2025-02-18	2028-02-18	OPERATIONAL
14	EXT-014	Parking Level 1	DRY_CHEMICAL	12LBS	2025-03-22	2028-03-22	OPERATIONAL
15	EXT-015	Parking Level 2	DRY_CHEMICAL	12LBS	2025-04-10	2028-04-10	OPERATIONAL
2	EXT-002	Kitchen Area	DRY_CHEMICAL	12LBS	2023-06-20	2025-06-20	EXPIRED
\.


--
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspections (id, user_id, extinguisher_id, inspector_id, inspection_date, inspection_time, status) FROM stdin;
1	4	3	2	2026-05-10	14:30:00	COMPLETED
2	4	4	3	2026-05-12	10:00:00	COMPLETED
3	5	5	2	2026-05-14	11:00:00	COMPLETED
4	5	6	3	2026-05-15	09:00:00	COMPLETED
5	4	7	2	2026-05-16	13:00:00	COMPLETED
6	4	9	3	2026-05-18	15:30:00	COMPLETED
7	5	10	2	2026-05-20	10:30:00	COMPLETED
8	5	11	3	2026-05-22	16:00:00	COMPLETED
9	4	12	2	2026-07-10	09:30:00	SCHEDULED
10	5	13	3	2026-07-12	11:30:00	SCHEDULED
11	4	14	2	2026-05-05	14:00:00	CANCELLED
12	5	15	3	2026-05-08	15:00:00	ONGOING
\.


--
-- Data for Name: maintenance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance (id, inspection_id, inspector_id, actions, maintenance_date, conditions_noted) FROM stdin;
1	1	2	Recharged cylinder and verified pressure level.	2026-05-10	Pressure was below threshold.
2	2	3	Replaced discharge hose and safety pin.	2026-05-12	Hose showed minor cracks.
3	3	2	Wiped body shell, replaced bracket lock.	2026-05-14	Bracket lock was loose.
4	4	3	Replaced nozzle and tag seal.	2026-05-15	Tag seal was broken.
5	5	2	Cleaned discharge horn, tightened wall bracket.	2026-05-16	Wall bracket slightly loose.
6	6	3	Hydrostatic testing completed and certified.	2026-05-18	Due for regular hydrostatic test.
7	7	2	Recharged gas cartridge and checked safety valve.	2026-05-20	Low pressure warning.
8	8	3	Cleaned body assembly and updated inspection sticker.	2026-05-22	Sticker was dirty.
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, message, created_at, is_read) FROM stdin;
1	4	Dear Regular, an inspection for extinguisher EXT-012 at Conference Room A has been scheduled for 2026-07-10 at 09:30:00.	2026-06-03 13:52:43.077818	f
2	2	Dear Inspector, an inspection for extinguisher EXT-012 at Conference Room A has been scheduled for 2026-07-10 at 09:30:00.	2026-06-03 13:52:43.077818	f
3	5	Dear Regular, an inspection for extinguisher EXT-013 at Cafeteria has been scheduled for 2026-07-12 at 11:30:00.	2026-06-03 13:52:43.080252	f
4	3	Dear Inspector, an inspection for extinguisher EXT-013 at Cafeteria has been scheduled for 2026-07-12 at 11:30:00.	2026-06-03 13:52:43.080252	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, first_name, last_name, email, password, role, phone) FROM stdin;
1	Admin	User	admin@tzw.rw	$2b$10$59QELe7jXaG25Wr3n.Jr2Oe8S8gbQXOD6RQyp1gkD5fGRALvI8NfC	ROLE_ADMIN	0781000001
2	Inspector	One	inspector1@tzw.rw	$2b$10$59QELe7jXaG25Wr3n.Jr2Oe8S8gbQXOD6RQyp1gkD5fGRALvI8NfC	ROLE_INSPECTOR	0781000002
3	Inspector	Two	inspector2@tzw.rw	$2b$10$59QELe7jXaG25Wr3n.Jr2Oe8S8gbQXOD6RQyp1gkD5fGRALvI8NfC	ROLE_INSPECTOR	0781000003
4	Regular	One	user1@tzw.rw	$2b$10$59QELe7jXaG25Wr3n.Jr2Oe8S8gbQXOD6RQyp1gkD5fGRALvI8NfC	ROLE_USER	0781000004
5	Regular	Two	user2@tzw.rw	$2b$10$59QELe7jXaG25Wr3n.Jr2Oe8S8gbQXOD6RQyp1gkD5fGRALvI8NfC	ROLE_USER	0781000005
\.


--
-- Name: extinguishers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.extinguishers_id_seq', 15, true);


--
-- Name: inspections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inspections_id_seq', 12, true);


--
-- Name: maintenance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.maintenance_id_seq', 8, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: extinguishers extinguishers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_serial_number_key UNIQUE (serial_number);


--
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- Name: maintenance maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT maintenance_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: inspections unique_extinguisher_datetime; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT unique_extinguisher_datetime UNIQUE (extinguisher_id, inspection_date, inspection_time);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: inspections inspection_scheduled_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER inspection_scheduled_trigger AFTER INSERT ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.notify_on_inspection_scheduled();


--
-- Name: inspections inspections_extinguisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_extinguisher_id_fkey FOREIGN KEY (extinguisher_id) REFERENCES public.extinguishers(id) ON DELETE CASCADE;


--
-- Name: inspections inspections_inspector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inspections inspections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: maintenance maintenance_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT maintenance_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;


--
-- Name: maintenance maintenance_inspector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance
    ADD CONSTRAINT maintenance_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 1XJ4qHgKI2X1g93KYfV84MaeQJeQ23XWExyUrUeg0GxzIl0DTfAmBpO7F5eVAso

