const ADJECTIVES = ["Swift", "Quiet", "Bold", "Calm", "Bright", "Lucky", "Sharp", "Gentle"];
const ANIMALS = ["Fox", "Owl", "Wolf", "Hawk", "Otter", "Lynx", "Falcon", "Heron"];
const COLORS = ["#e63946", "#2a9d8f", "#e9c46a", "#457b9d", "#f4a261", "#8e44ad", "#3d5a80"];

function randomFrom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export interface LocalUser {
  id: string;
  name: string;
  color: string;
}

// sessionStorage (not localStorage) so each browser TAB gets its own identity —
// lets you simulate multiple users locally before real auth exists.
export function getLocalUser(): LocalUser {
  const existing = sessionStorage.getItem("syncdoc:localUser");
  if (existing) {
    return JSON.parse(existing) as LocalUser;
  }

  const user: LocalUser = {
    id: crypto.randomUUID(),
    name: `${randomFrom(ADJECTIVES)} ${randomFrom(ANIMALS)}`,
    color: randomFrom(COLORS),
  };

  sessionStorage.setItem("syncdoc:localUser", JSON.stringify(user));
  return user;
}