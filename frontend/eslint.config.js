import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // El visor 3D muta objetos imperativos de three.js (materiales, mapas de
    // textura) dentro de efectos sobre un objeto preparado con useMemo. Ese
    // patrón es el estándar en @react-three/fiber y choca con las reglas
    // estrictas de inmutabilidad/refs de react-hooks, que no aplican a
    // recursos externos al estado de React.
    files: ['src/components/ui/Prenda3D.jsx'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
])
