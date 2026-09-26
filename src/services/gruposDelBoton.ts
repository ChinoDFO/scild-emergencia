// A cuántos grupos les puede avisar un mismo botón. Es el mismo tope que
// impone el servidor (GRUPOS_POR_BOTON en scild-backend/src/acceso.js): aquí
// solo sirve para ofrecer u ocultar opciones sin esperar a que el servidor
// diga que no. Si uno cambia, el otro también.
export const GRUPOS_POR_BOTON = 3;

// Los grupos de un botón como texto corto para una fila de lista. Un botón sin
// vincular no avisa a nadie, y eso es lo que hay que decir.
export function describirGrupos(grupos: { name: string }[]): string {
  if (grupos.length === 0) return "Sin grupo";
  return grupos.map((g) => g.name).join(" · ");
}
