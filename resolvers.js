// const { users, employees } = require('./config/mongoCollections')
const users = require('./config/mongoCollections').users
const employees = require('./config/mongoCollections').employees
const { ApolloError } = require('apollo-server-errors')

const bcrypt = require('bcrypt')
const { validateEmail } = require('./validateEmail')
const jwt = require('jsonwebtoken')
const { ObjectId } = require('mongodb')
const resolvers = {
  Query: {
    login: async (parent, args) => {
      // console.log(args)
      const { username, password } = args

      if (!username || !password) {
        throw new ApolloError('Please provide username and password')
      }
      const usersCollections = await users()
      const usr = await usersCollections.findOne({ username })

      const valid = await bcrypt.compare(password, usr.password)
      if (!valid) {
        throw new ApolloError('Invalid password')
      }

      // const { password, ...userData } = usr

      const userId = usr._id
      const id = userId.toString()
      const token = jwt.sign({ userId }, 'secretkey', {
        expiresIn: '30h',
      })
      return {
        id: id,
        email: usr.email,
        username: usr.username,
        token,
      }
    },
    searchEmployeeById: async (parent, args, { userId }) => {
      if (!userId) {
        throw new ApolloError('Authentication invalid')
      }
      const { id } = args
      if (!id) throw new ApolloError('Please provide id')
      const employeeCollections = await employees()
      const findEmployee = await employeeCollections.findOne({
        _id: new ObjectId(id),
      })
      // console.log(findEmployee)
      if (!findEmployee) throw new ApolloError('Employee does not exist')
      return {
        id: id,
        firstName: findEmployee.firstName,
        lastName: findEmployee.lastName,
        email: findEmployee.email,
        gender: findEmployee.gender,
        salary: findEmployee.salary,
      }
    },
    getAllEmployees: async (parent, args, { userId }) => {
      if (!userId) {
        throw new ApolloError('Authentication invalid')
      }
      const employeeCollections = await employees()

      const emps = await employeeCollections.find().toArray()

      // console.log(emps)
      const result = emps.map((emp) => {
        const { _id, firstName, lastName, email, gender, salary } = emp
        const uID = _id.toString()
        return {
          id: uID,
          firstName,
          lastName,
          email,
          gender,
          salary,
        }
      })

      return result
    },
  },
  Mutation: {
    signup: async (parent, args) => {
      const { username, email, password } = args

      if (!username || !email || !password) {
        throw new ApolloError('Please provide email, username, and password')
      }
      console.log('passed first')
      if (!validateEmail(email)) {
        throw new ApolloError('Please provide valid email address')
      }
      const usersCollections = await users()

      const findUser = await usersCollections.findOne({
        email: email,
      })
      if (findUser) {
        throw new ApolloError('User already exists')
      }
      const findUser2 = await usersCollections.findOne({
        username: username,
      })
      if (findUser2) {
        throw new ApolloError('User already exists')
      }
      console.log('passed third')
      const salt = await bcrypt.genSalt(10)
      const hashPassword = await bcrypt.hash(password, salt)

      const addUser = await usersCollections.insertOne({
        email,
        password: hashPassword,
        username,
      })
      const newuser = await usersCollections.findOne({
        username: username,
      })
      const userId = newuser._id
      const id = userId.toString()
      const token = jwt.sign({ userId }, 'secretkey', {
        expiresIn: '30h',
      })
      return {
        id: id,
        email: newuser.email,
        username: newuser.username,
        token,
      }
    },
    addNewEmployee: async (parent, args, { userId }) => {
      if (!userId) {
        throw new ApolloError('Authentication invalid')
      }
      const employeeCollections = await employees()
      let { firstName, lastName, email, gender, salary } = args
      if (!firstName || !lastName || !email || !gender || !salary) {
        throw new ApolloError('Please provide all require fields')
      }
      const oldEmployee = await employeeCollections.findOne({
        email,
      })
      if (oldEmployee) {
        throw new ApolloError(`Employee with email ${email} already exists`)
      }
      gender = gender.toLowerCase()
      if (
        !(gender === 'male') &&
        !(gender === 'female') &&
        !(gender === 'other')
      ) {
        throw new ApolloError('Invalid Gender')
      }
      const createEmp = await employeeCollections.insertOne({
        firstName,
        lastName,
        email,
        gender,
        salary,
      })
      // console.log(createEmp)

      const findEmployee = await employeeCollections.findOne({
        _id: new ObjectId(createEmp.insertedId),
      })

      // console.log(findEmployee)
      const empID = findEmployee._id
      const id = empID.toString()

      // console.log({ id: id, ...findEmployee })
      return {
        id: id,
        ...findEmployee,
      }
    },
    deleteEmployeeById: async (pa, args, { userId }) => {
      if (!userId) {
        throw new ApolloError('Authentication invalid')
      }
      const { id } = args
      if (!id) throw new ApolloError('Please provide id')

      const employeeCollections = await employees()

      const deleteEmp = await employeeCollections.deleteOne({
        _id: new ObjectId(id),
      })
      // console.log(deleteEmp)
      if (deleteEmp.deletedCount === 0) {
        throw new ApolloError('No employee exist with given id')
      }

      return `Employee with ${id} has been successfully deleted.`
    },
    updateEmployeeById: async (parent, args, { userId }) => {
      if (!userId) {
        throw new ApolloError('Authentication invalid')
      }
      const employeeCollections = await employees()
      let { firstName, lastName, email, gender, salary } = args
      if (!firstName && !lastName && !email && !gender && !salary) {
        throw new ApolloError('Please update atleast one field')
      }
      const { id } = args
      if (!id) throw new ApolloError('Please provide id')

      const oldEmployee = await employeeCollections.findOne({
        _id: new ObjectId(id),
      })
      // console.log(oldEmployee)
      if (!oldEmployee) {
        throw new ApolloError(`No employee exists with given id`)
      }
      if (gender) {
        gender = gender.toLowerCase()
        if (
          !(gender === 'male') &&
          !(gender === 'female') &&
          !(gender === 'other')
        ) {
          throw new ApolloError('Invalid Gender')
        }
      }
      if (email) {
        if (email !== oldEmployee.email) {
          if (!validateEmail(email)) {
            throw new ApolloError('Invalid email')
          }
          const checkEmail = await employeeCollections.findOne({ email })
          if (checkEmail) {
            throw new ApolloError(
              'Employee already exists with the given email'
            )
          }
        }
      }
      let fName = firstName ? firstName : oldEmployee.firstName
      let lName = lastName ? lastName : oldEmployee.lastName
      let mail = email ? email : oldEmployee.email
      let newGender = gender ? gender : oldEmployee.gender
      let newSalary = salary ? salary : oldEmployee.salary
      const updateUser = await employeeCollections.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            firstName: fName,
            lastName: lName,
            email: mail,
            gender: newGender,
            salary: newSalary,
          },
        }
      )
      // console.log(updateUser)

      const findEmployee = await employeeCollections.findOne({
        _id: new ObjectId(id),
      })

      // console.log(findEmployee)
      const empID = findEmployee._id
      const stringid = empID.toString()

      // console.log({ id: id, ...findEmployee })
      return {
        id: stringid,
        ...findEmployee,
      }
    },
  },
}

module.exports = resolvers
