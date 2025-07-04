import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.ts')
      },
      outDir: 'dist/main'
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts')
      },
      outDir: 'dist/preload'
    }
  },
  renderer: {
    root: 'src',
    build: {
      outDir: resolve(__dirname, 'dist/renderer'),
      rollupOptions: {
        input: resolve(__dirname, 'src/index.html')
      }
    },
    resolve: {
      alias: {
        '@': resolve('src'),
        '@/components': resolve('src/components'),
        '@/lib': resolve('src/lib')
      }
    },
    plugins: [
      react(), 
      tailwindcss(),
      obfuscatorPlugin({
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: [/node_modules/, /\.d\.ts$/],
        apply: 'build',
        debugger: false,
        options: {
          // Options conservatrices pour éviter de casser l'application
          compact: true,
          controlFlowFlattening: false, // Peut causer des problèmes de performance
          controlFlowFlatteningThreshold: 0,
          deadCodeInjection: false, // Peut augmenter la taille du bundle
          debugProtection: false, // Peut interférer avec le développement
          debugProtectionInterval: 0,
          disableConsoleOutput: false, // Garde les console.log pour le debug
          domainLock: [],
          domainLockRedirectUrl: 'about:blank',
          forceTransformStrings: [],
          identifierNamesGenerator: 'hexadecimal',
          identifiersDictionary: [],
          identifiersPrefix: '',
          ignoreImports: false,
          inputFileName: '',
          log: false,
          numbersToExpressions: false, // Peut causer des problèmes avec React
          optionsPreset: 'default',
          renameGlobals: false, // Important: ne pas renommer les globales
          renameProperties: false, // Important: ne pas renommer les propriétés React
          renamePropertiesMode: 'safe',
          reservedNames: [],
          reservedStrings: [],
          seed: 0,
          selfDefending: false, // Peut causer des problèmes en production
          simplify: true,
          sourceMap: false,
          sourceMapBaseUrl: '',
          sourceMapFileName: '',
          sourceMapMode: 'separate',
          sourceMapSourcesMode: 'sources-content',
          splitStrings: false, // Peut causer des problèmes avec les strings React
          splitStringsChunkLength: 10,
          stringArray: true,
          stringArrayCallsTransform: false, // Conservateur pour éviter les problèmes
          stringArrayCallsTransformThreshold: 0.5,
          stringArrayEncoding: [],
          stringArrayIndexShift: true,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          stringArrayWrappersCount: 1,
          stringArrayWrappersChainedCalls: true,
          stringArrayWrappersParametersMaxCount: 2,
          stringArrayWrappersType: 'variable',
          stringArrayThreshold: 0.75,
          target: 'browser',
          transformObjectKeys: false, // Important: ne pas transformer les clés d'objets React
          unicodeEscapeSequence: false
        }
      })
    ]
  }
}) 