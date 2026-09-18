import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// Genera los PNG de la PWA a partir de public/icono.svg:
//   npx pwa-assets-generator
// Hacen falta PNG (no SVG) porque Android no muestra SVG en el ícono de
// instalación ni en las notificaciones, e iOS exige apple-touch-icon en PNG.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // El ícono ya trae fondo rojo a sangre, así que no se le agrega relleno.
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: "#dc2626" } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: "#dc2626" } },
  },
  images: ["public/icono.svg"],
});
