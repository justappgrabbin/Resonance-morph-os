// Netlify Function — API proxy for secure backend calls
exports.handler = async (event, context) => {
  const path = event.path.replace('/.netlify/functions/', '')

  // Route to appropriate handler
  switch (path) {
    case 'health':
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'ok', timestamp: Date.now() }),
      }
    default:
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not found' }),
      }
  }
}
