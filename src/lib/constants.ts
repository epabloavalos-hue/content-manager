export const EVENT_TYPES = [
  { value: "GIRAS", label: "Giras" },
  { value: "EVENTOS", label: "Eventos" },
  { value: "CONFERENCIAS_PAGADAS", label: "Conferencias Pagadas" },
  { value: "GRABACIONES", label: "Grabaciones" },
  { value: "OTROS", label: "Otros" },
] as const;

export const DESTINATION_AREAS = [
  { value: "EQUIPO_JS", label: "Equipo JS", contact: "Cristian Yoguez" },
  { value: "YOUTUBE", label: "YouTube", contact: "Rebeca Robles" },
  {
    value: "EQUIPO_MARKETING",
    label: "Equipo Marketing",
    contact: "Saúl Moreno / David Iriza",
  },
  {
    value: "EQUIPO_EDITORES",
    label: "Equipo Editores",
    contact: "Chuy Raygoza / Matías Villafañe",
  },
] as const;

export const LINK_TYPES = [
  { value: "FOLDER", label: "Carpeta" },
  { value: "FILE", label: "Archivo" },
] as const;

export const DEPARTMENTS = [
  { value: "TEAM_JS", label: "Team JS" },
  { value: "TEAM_MANUEL", label: "Team Manuel" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OTRO", label: "Otro" },
] as const;

export const ROLES = {
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
