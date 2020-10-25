const ROUTES = ["", "assets", "auth", "dashboard", "game", "invite", "settings"];
const path = window.location.pathname.split("/");
export const BASE_PATH = ROUTES.includes(path[1]) ? "/" : `/${path[1]}/`;
