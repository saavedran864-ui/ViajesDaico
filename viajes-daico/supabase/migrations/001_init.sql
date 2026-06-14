-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- Tabla de perfiles
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  nombre      text,
  avatar_url  text,
  pais        text,
  moneda      text not null default 'USD',
  created_at  timestamptz default now()
);

-- Tabla de viajes
create table public.viajes (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references auth.users on delete cascade not null,
  nombre          text not null,
  descripcion     text,
  imagen_portada  text,
  fecha_inicio    date not null,
  fecha_fin       date not null,
  presupuesto     numeric,
  moneda          text not null default 'USD',
  estado          text not null default 'planificando' check (estado in ('planificando','en_curso','completado')),
  created_at      timestamptz default now()
);

-- Tabla de días del itinerario
create table public.dias (
  id        uuid default uuid_generate_v4() primary key,
  viaje_id  uuid references public.viajes on delete cascade not null,
  fecha     date not null,
  titulo    text,
  orden     integer not null default 0,
  created_at timestamptz default now()
);

-- Tabla de actividades
create table public.actividades (
  id          uuid default uuid_generate_v4() primary key,
  dia_id      uuid references public.dias on delete cascade not null,
  viaje_id    uuid references public.viajes on delete cascade not null,
  nombre      text not null,
  descripcion text,
  hora        time,
  ubicacion   text,
  categoria   text not null default 'otro' check (categoria in ('transporte','alojamiento','comida','atraccion','compras','otro')),
  notas       text,
  orden       integer not null default 0,
  created_at  timestamptz default now()
);

-- Tabla de reservas
create table public.reservas (
  id           uuid default uuid_generate_v4() primary key,
  viaje_id     uuid references public.viajes on delete cascade not null,
  tipo         text not null check (tipo in ('vuelo','hotel','tren','ferry','auto','entrada','otro')),
  nombre       text not null,
  descripcion  text,
  fecha_desde  date,
  fecha_hasta  date,
  confirmacion text,
  precio       numeric,
  moneda       text not null default 'USD',
  archivo_url  text,
  notas        text,
  created_at   timestamptz default now()
);

-- Tabla de gastos
create table public.gastos (
  id          uuid default uuid_generate_v4() primary key,
  viaje_id    uuid references public.viajes on delete cascade not null,
  categoria   text not null check (categoria in ('vuelos','hoteles','comida','transporte','entradas','compras','otro')),
  descripcion text not null,
  monto       numeric not null,
  moneda      text not null default 'USD',
  fecha       date not null,
  created_at  timestamptz default now()
);

-- Tabla de checklist
create table public.checklist_items (
  id          uuid default uuid_generate_v4() primary key,
  viaje_id    uuid references public.viajes on delete cascade not null,
  categoria   text not null default 'General',
  texto       text not null,
  completado  boolean not null default false,
  orden       integer not null default 0,
  created_at  timestamptz default now()
);

-- Tabla de entradas del diario
create table public.entradas_diario (
  id          uuid default uuid_generate_v4() primary key,
  viaje_id    uuid references public.viajes on delete cascade not null,
  fecha       date not null,
  titulo      text,
  contenido   text not null,
  ubicacion   text,
  created_at  timestamptz default now()
);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles         enable row level security;
alter table public.viajes           enable row level security;
alter table public.dias             enable row level security;
alter table public.actividades      enable row level security;
alter table public.reservas         enable row level security;
alter table public.gastos           enable row level security;
alter table public.checklist_items  enable row level security;
alter table public.entradas_diario  enable row level security;

-- Políticas: cada usuario solo ve sus propios datos
create policy "Usuarios ven su perfil"         on public.profiles         for all using (auth.uid() = id);
create policy "Usuarios gestionan sus viajes"  on public.viajes           for all using (auth.uid() = user_id);
create policy "Usuarios gestionan sus dias"    on public.dias             for all using (auth.uid() = (select user_id from public.viajes where id = viaje_id));
create policy "Usuarios gestionan actividades" on public.actividades      for all using (auth.uid() = (select user_id from public.viajes where id = viaje_id));
create policy "Usuarios gestionan reservas"    on public.reservas         for all using (auth.uid() = (select user_id from public.viajes where id = viaje_id));
create policy "Usuarios gestionan gastos"      on public.gastos           for all using (auth.uid() = (select user_id from public.viajes where id = viaje_id));
create policy "Usuarios gestionan checklist"   on public.checklist_items  for all using (auth.uid() = (select user_id from public.viajes where id = viaje_id));
create policy "Usuarios gestionan diario"      on public.entradas_diario  for all using (auth.uid() = (select user_id from public.viajes where id = viaje_id));
