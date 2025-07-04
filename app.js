const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const databasePath = path.join(__dirname, 'todoApplication.db')
const app = express()
const {isMatch, format} = require('date-fns')
app.use(express.json())

let database = null

const initilizeDbServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}

initilizeDbServer()

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityAndCategoryProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  )
}

const hasStatusAndCategoryProperty = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const todoList = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

// API 1 //

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', category, priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE 
                priority = '${priority}' AND status = '${status}';`

          data = await database.all(getTodoQuery)
          response.send(data.map(eachItem => todoList(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case hasPriorityAndCategoryProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          category === 'WORK' ||
          category === 'HOME' ||
          category === 'LEARNING'
        ) {
          getTodoQuery = `
              SELECT 
                  *
              FROM 
                  todo
              WHERE 
                  priority = '${priority}' AND category = '${category}';`

          data = await database.all(getTodoQuery)
          response.send(data.map(eachItem => todoList(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Category')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case hasStatusAndCategoryProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        if (
          category === 'WORK' ||
          category === 'HOME' ||
          category === 'LEARNING'
        ) {
          getTodoQuery = `
              SELECT 
                  *
              FROM 
                  todo
              WHERE 
                  status = '${status}' AND category = '${category}';`

          data = await database.all(getTodoQuery)
          response.send(data.map(eachItem => todoList(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Category')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }

      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `
              SELECT 
                  *
              FROM 
                  todo
              WHERE 
                  priority = '${priority}';`

        data = await database.all(getTodoQuery)
        response.send(data.map(eachItem => todoList(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE 
                 status = '${status}';`

        data = await database.all(getTodoQuery)
        response.send(data.map(eachItem => todoList(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }

      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQuery = `
              SELECT 
                  *
              FROM 
                  todo
              WHERE 
                  category = '${category}';`

        data = await database.all(getTodoQuery)
        response.send(data.map(eachItem => todoList(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    case hasSearchProperty(request.query):
      getTodoQuery = `
              SELECT 
                  *
              FROM 
                  todo
              WHERE 
                  todo
              LIKE '%${search_q}%' ;`

      data = await database.all(getTodoQuery)
      response.send(data.map(eachItem => todoList(eachItem)))

      break

    default:
      getTodoQuery = `
              SELECT 
                  *
              FROM 
                  todo;`

      data = await database.all(getTodoQuery)
      response.send(data.map(eachItem => todoList(eachItem)))
  }
})

// API 2 //

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoIdQuery = `
  SELECT * 
  FROM todo
  WHERE id = ${todoId};`
  const todoIdData = await database.get(getTodoIdQuery)
  if (todoIdData) {
    response.send(todoList(todoIdData))
  } else {
    response.send('Todo Not Found')
  }
})

// API 3 //

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')

    const getTodoByDateQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE 
        due_date = '${newDate}';`

    const dueDateTodoResponse = await database.all(getTodoByDateQuery)
    response.send(dueDateTodoResponse.map(each => todoList(each)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

// API 4 //

app.post('/todos/', async (request, response) => {
  try {
    const {id, todo, priority, status, category, dueDate} = request.body

    const validPriorities = ['HIGH', 'MEDIUM', 'LOW']
    const validStatuses = ['TO DO', 'IN PROGRESS', 'DONE']
    const validCategories = ['WORK', 'HOME', 'LEARNING']

    if (!validPriorities.includes(priority)) {
      return response.status(400).send('Invalid Todo Priority')
    }

    if (!validStatuses.includes(status)) {
      return response.status(400).send('Invalid Todo Status')
    }

    if (!validCategories.includes(category)) {
      return response.status(400).send('Invalid Todo Category')
    }
    if (!isMatch(dueDate, 'yyyy-MM-dd')) {
      return response.status(400).send('Invalid Due Date')
    }

    const formattedDueDate = format(new Date(dueDate), 'yyyy-MM-dd')

    const insertTodoQuery = `
      INSERT INTO todo (id,todo, priority, status, category, due_date)
      VALUES ('${id}', '${todo}','${priority}','${status}', '${category}', '${formattedDueDate}');
    `

    await database.run(insertTodoQuery)

    response.send('Todo Successfully Added')
  } catch (error) {
    console.error(error)
    response.send(`Internal Server Error ${error}`)
  }
})

// API 5 //

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  const validPriorities = ['HIGH', 'MEDIUM', 'LOW']
  const validStatuses = ['TO DO', 'IN PROGRESS', 'DONE']
  const validCategories = ['WORK', 'HOME', 'LEARNING']

  const fieldToUpdate = []

  let updateMessage = ''
  if (requestBody.status !== undefined) {
    if (!validStatuses.includes(requestBody.status)) {
      return response.status(400).send('Invalid Todo Status')
    }
    fieldToUpdate.push(`status = '${requestBody.status}'`)
    updateMessage = 'Status Updated'
  } else if (requestBody.category !== undefined) {
    if (!validCategories.includes(requestBody.category)) {
      return response.status(400).send('Invalid Todo Category')
    }
    fieldToUpdate.push(`category = '${requestBody.category}'`)
    updateMessage = 'Category Updated'
  } else if (requestBody.priority !== undefined) {
    if (!validPriorities.includes(requestBody.priority)) {
      return response.status(400).send('Invalid Todo Priority')
    }
    fieldToUpdate.push(`priority = '${requestBody.priority}'`)
    updateMessage = 'Priority Updated'
  } else if (requestBody.todo !== undefined) {
    fieldToUpdate.push(`todo = '${requestBody.todo}'`)
    updateMessage = 'Todo Updated'
  } else if (requestBody.dueDate !== undefined) {
    if (!isMatch(requestBody.dueDate, 'yyyy-MM-dd')) {
      return response.status(400).send('Invalid Due Date')
    }
    fieldToUpdate.push(`due_date = '${requestBody.dueDate}'`)
    updateMessage = 'Due Date Updated'
  } else {
    return response.status(400).send('No Valid Fields to Update')
  }

  const updateTodoQuery = `
  UPDATE todo
  SET ${fieldToUpdate.join(',')}
  WHERE id = ${todoId};
`
  await database.run(updateTodoQuery)
  response.send(updateMessage)
})

// API 6 //

app.delete('/todos/:todoId/', async (request, response) => {
  try {
    const {todoId} = request.params
    const deleteTodoQuery = `
      DELETE FROM 
          todo
      WHERE 
          id = ${todoId};    
      `
    await database.run(deleteTodoQuery)
    response.send('Todo Deleted')
  } catch (e) {
    response.send(e.message)
  }
})

module.exports = app
