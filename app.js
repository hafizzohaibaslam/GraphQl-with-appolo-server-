const express = require('express')
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const { ApolloServer } = require('apollo-server-express')
const buildSchema = require('./typeDefs')
const resolvers = require('./resolvers')
const PORT = 3000
const jwt = require('jsonwebtoken')

const startApolloServer = async () => {
  const server = new ApolloServer({
    typeDefs: buildSchema,
    resolvers: resolvers,
    context: ({ req }) => {
      const { authorization } = req.headers
      if (authorization) {
        const { userId } = jwt.verify(authorization, 'secretkey')
        return { userId }
      }
    },
  })
  await server.start()

  server.applyMiddleware({ app, path: '/graphql' })

  console.log(
    `apollo server is running at http://localhost:${PORT}${server.graphqlPath}`
  )
}

startApolloServer()

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`)
})
