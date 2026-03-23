import index from "./index.html"

const server = Bun.serve({
  port: Number(process.env.PORT) || 5173,
  routes: {
    "/": index,
  },
  development: process.env.NODE_ENV !== "production"
    ? { hmr: true, console: true }
    : false,
})

console.log(`Listening on http://localhost:${server.port}`)
