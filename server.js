const port = process.env.PORT || 3000
console.log(`Starting server on port ${port}`)

// Start the TanStack Start server
import('./dist/server/server.js').catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})