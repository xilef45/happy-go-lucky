import reactPlugin from "eslint-plugin-react"
import tailwindPlugin from 'eslint-plugin-tailwindcss'
import typescriptPlugin from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"
import cypressPlugin from "eslint-plugin-cypress/flat"
import globals from "globals"

export default [
    // Global
    {
        ignores: ['node_modules/**', 'dist/**', '**/dist/**', 'client/dist/**', 'server/dist/**'],
    },
        
    // Client Typescript src
    {
        files: ['client/src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                tsconfigRootDir: import.meta.dirname, 
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true
                },
                ecmaVersion: 2020,
                project: './client/tsconfig.json',
            },
            globals: {
                ...globals.browser,
            }
        },
        plugins: {
            '@typescript-eslint': typescriptPlugin,
            react: reactPlugin,
            tailwindcss: tailwindPlugin
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...typescriptPlugin.configs.recommended.rules,
            ...tailwindPlugin.configs.recommended.rules,
            'tailwindcss/no-custom-classname': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',  // This line disable prop-types checking
        },
        settings: {
            react: {
              version: 'detect'
            },
          }
    },

    // Server Typescript src
    {
        files: ['server/**/*.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                sourceType: "module",
                ecmaVersion: 2020,
                project: './server/tsconfig.json',
            },
            globals: {
                ...globals.node,
            }
        },
        plugins: {
            '@typescript-eslint': typescriptPlugin,
        },
        rules: {
            ...typescriptPlugin.configs.recommended.rules,
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
        },
    },

    // Cypress
    {
        files: ['client/cypress/**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                tsconfigRootDir: import.meta.dirname, 
                sourceType: "module",
                ecmaVersion: 2020,
                project: './client/cypress/tsconfig.json',
            },
        },
        plugins: {
            cypress: cypressPlugin
        },
        rules: {
            ...cypressPlugin.configs.recommended.rules
        }
    },
];