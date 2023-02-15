const { buildSchema } = require('graphql')
const schema = buildSchema(`
  type User {
    id: String!
    username: String!
    email: String!
    password: String!
  }

  type Employee {
    id: String!
    firstName: String!
    lastName: String!
    email: String!
    gender: String!
    salary: Float!
  }

  type LoginUserData {
    id: String!
    username: String!
    email: String!
    token: String!
  }

  type Query {
    login(username: String!, password: String!): LoginUserData!
    getAllEmployees: [Employee!]!
    searchEmployeeById(id: String!): Employee!
  }


  type Mutation {
    signup(username: String!, email: String!, password: String!): LoginUserData!
    addNewEmployee(
      firstName: String!
      lastName: String!
      email: String!
      gender: String!
      salary: Float!
    ): Employee!
    updateEmployeeById(
      id: String!
      firstName: String!
      lastName: String!
      email: String!
      gender: String!
      salary: Float!
    ): Employee!
    deleteEmployeeById(id: String!): String!
  }
`)

module.exports = schema
