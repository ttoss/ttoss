// vite.config.ts
import { babelConfig } from "file:///hdd1T/startup/ttoss/ttoss/packages/config/dist/index.js";
import { config } from "file:///hdd1T/startup/ttoss/ttoss/terezinha-farm/config/dist/index.js";
import { defineConfig } from "file:///hdd1T/startup/ttoss/ttoss/node_modules/vite/dist/node/index.js";
import { visualizer } from "file:///hdd1T/startup/ttoss/ttoss/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import babel from "file:///hdd1T/startup/ttoss/ttoss/node_modules/vite-plugin-babel/dist/index.mjs";
import react from "file:///hdd1T/startup/ttoss/ttoss/node_modules/@vitejs/plugin-react-swc/index.mjs";
var configVite = Object.entries(config).reduce((acc, [key, value]) => {
  acc[`VITE_${key}`] = value;
  return acc;
}, {});
var vite_config_default = defineConfig(async () => {
  return {
    define: {
      global: {},
      "process.env": {
        ...configVite
      }
    },
    plugins: [
      react(),
      babel({
        babelConfig: {
          babelrc: false,
          configFile: false,
          plugins: babelConfig().plugins
        }
      }),
      visualizer({
        filename: "stats/index.html"
      })
    ],
    resolve: {
      alias: {
        "./runtimeConfig": "./runtimeConfig.browser"
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaGRkMVQvc3RhcnR1cC90dG9zcy90dG9zcy90ZXJlemluaGEtZmFybS9hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9oZGQxVC9zdGFydHVwL3R0b3NzL3R0b3NzL3RlcmV6aW5oYS1mYXJtL2FwcC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaGRkMVQvc3RhcnR1cC90dG9zcy90dG9zcy90ZXJlemluaGEtZmFybS9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBiYWJlbENvbmZpZyB9IGZyb20gJ0B0dG9zcy9jb25maWcnO1xuaW1wb3J0IHsgY29uZmlnIH0gZnJvbSAnQHRlcmV6aW5oYS1mYXJtL2NvbmZpZyc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xuaW1wb3J0IGJhYmVsIGZyb20gJ3ZpdGUtcGx1Z2luLWJhYmVsJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuXG4vKipcbiAqIENyZWF0ZSBhbiBvYmplY3Qgd2l0aCB0aGUgc2FtZSB2YWx1ZXMgYXMgdGhlIGNvbmZpZyBvYmplY3QsIGJ1dCB3aXRoIHRoZVxuICoga2V5cyBwcmVmaXhlZCB3aXRoIGBWSVRFX2AuXG4gKi9cbmNvbnN0IGNvbmZpZ1ZpdGUgPSBPYmplY3QuZW50cmllcyhjb25maWcpLnJlZHVjZSgoYWNjLCBba2V5LCB2YWx1ZV0pID0+IHtcbiAgYWNjW2BWSVRFXyR7a2V5fWBdID0gdmFsdWU7XG4gIHJldHVybiBhY2M7XG59LCB7fSk7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoYXN5bmMgKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIGRlZmluZToge1xuICAgICAgZ2xvYmFsOiB7fSxcbiAgICAgICdwcm9jZXNzLmVudic6IHtcbiAgICAgICAgLi4uY29uZmlnVml0ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgYmFiZWwoe1xuICAgICAgICBiYWJlbENvbmZpZzoge1xuICAgICAgICAgIGJhYmVscmM6IGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ0ZpbGU6IGZhbHNlLFxuICAgICAgICAgIHBsdWdpbnM6IGJhYmVsQ29uZmlnKCkucGx1Z2lucyxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgdmlzdWFsaXplcih7XG4gICAgICAgIGZpbGVuYW1lOiAnc3RhdHMvaW5kZXguaHRtbCcsXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICcuL3J1bnRpbWVDb25maWcnOiAnLi9ydW50aW1lQ29uZmlnLmJyb3dzZXInLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlULFNBQVMsbUJBQW1CO0FBQ3JWLFNBQVMsY0FBYztBQUN2QixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGtCQUFrQjtBQUMzQixPQUFPLFdBQVc7QUFDbEIsT0FBTyxXQUFXO0FBTWxCLElBQU0sYUFBYSxPQUFPLFFBQVEsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLE1BQU07QUFDdEUsTUFBSSxRQUFRLFNBQVM7QUFDckIsU0FBTztBQUNULEdBQUcsQ0FBQyxDQUFDO0FBR0wsSUFBTyxzQkFBUSxhQUFhLFlBQVk7QUFDdEMsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sUUFBUSxDQUFDO0FBQUEsTUFDVCxlQUFlO0FBQUEsUUFDYixHQUFHO0FBQUEsTUFDTDtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxRQUNKLGFBQWE7QUFBQSxVQUNYLFNBQVM7QUFBQSxVQUNULFlBQVk7QUFBQSxVQUNaLFNBQVMsWUFBWSxFQUFFO0FBQUEsUUFDekI7QUFBQSxNQUNGLENBQUM7QUFBQSxNQUNELFdBQVc7QUFBQSxRQUNULFVBQVU7QUFBQSxNQUNaLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxtQkFBbUI7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
