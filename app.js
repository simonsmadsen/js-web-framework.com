const web = require('js-web')

const db = web.storage.mysql
const auth = require('./src/auth.js')
const parseInputText = require('./src/parse-input-text.js')
/**
 * Injections
*/
const injections = [
  web.inject.jquery(),
  web.inject.bootstrap(),
  web.inject.style('style/syntax.css'),
  web.inject.style('style/style.sass'),
  web.inject.script('script/main.js')
]
const questionInjections = injections.concat([
  web.inject.style('style/questions.css')
])
const authInjections = questionInjections.concat([
  web.inject.googleAuth('/google-login', 'google-login'),
  web.inject.facebookAuth('/facebook-login', 'fb-login')
])
/**
 * Routes
*/

/*
  Docs!
*/
web.route('/alert', (i, s) => {
  s.setFlash('warning', 'This is a warning')
  return web.back()
})
web.route('/', () => web.redirect('/docs/routing'))
web.htmlRoute('/docs/:doc', 'html/docs.html', async input => ({
  doc: input.doc ? `html/docs/${input.doc}.html` : 'html/docs/routing.html'
}), injections)

/*
  Questions
*/
const categories = db.table('categories')
const questions = db.table('questions')
const answers = db.table('answers')
const answersExtended = db.table('answers'
+ ' left join users on users.id = answers.user_id'
+ ' left join questions on questions.id = answers.question_id'
)
const questionExtended = db.table('questions'
  + ' left join categories on categories.id = questions.category_id'
  + ' left join users on users.id = questions.user_id'
)
const questionExtendedFields =
  'questions.*, users.name as username, categories.name as category'
const answerExtendedFields =
  'answers.*, users.name as username, questions.title '

const setLoginWarning = (session) => {
  session.setFlash('warning', 'You need to sign in.')
  return false
}
const hasAuth = session => (session.get('user_id') ? true : setLoginWarning(session))

const setOwnAnswers = userId => (answer) => {
  const answerWithIsOwnProp = answer
  answerWithIsOwnProp.isOwn = userId === answer.user_id
  return answerWithIsOwnProp
}

web.htmlRoute('/questions', 'html/questions.html', async (input, session) => ({
  questions: (await questionExtended.selectFields(questionExtendedFields, null, 'id desc')).map(parseInputText.outputFormat('question')),
  user_id: session.get('user_id'),
  user_name: session.get('user_name'),
  twitter_url: await web.twitterRequestUrl('http://localhost:8080/twitter-login', session),
  categories: await categories.select()
}), authInjections)

web.htmlRoute('/questions/categories/:category/:id', 'html/questions.html', async (input, session) => ({
  questions: (await questionExtended.selectFields(questionExtendedFields, { category_id: input.id }, 'id desc')).map(parseInputText.outputFormat('question')),
  user_id: session.get('user_id'),
  user_name: session.get('user_name'),
  twitter_url: await web.twitterRequestUrl('http://localhost:8080/twitter-login', session),
  categories: await categories.select()
}), authInjections)

web.postRoute('/answers/create', async (input, session) => {
  if (!hasAuth(session)) return web.back()

  answers.create({
    question_id: input.question_id,
    answer: input.answer,
    created: db.now(),
    user_id: session.get('user_id', -1),
    isSolution: false
  })

  return web.back()
})

web.postRoute('/answers/update', async (input, session) => {
  if (!hasAuth(session)) return web.back()

  await answers.update({ answer: input.answer }, { id: input.answer_id })
  return web.redirect(`/questions/answers/-/-/${input.question_id}`)
})


const answersData = async (input, session) => {
  const question = parseInputText.outputFormat('question')(
    (await questionExtended.selectFields(questionExtendedFields, { 'questions.id': input.id }))[0]
  )
  return {
    user_id: session.get('user_id'),
    user_name: session.get('user_name'),
    twitter_url: await web.twitterRequestUrl('http://localhost:8080/twitter-login', session),
    categories: await categories.select(),
    answers: (await answersExtended.selectFields(answerExtendedFields, { question_id: input.id }))
      .map(parseInputText.outputFormat('answer'))
      .map(setOwnAnswers(session.get('user_id'))),
    question,
    isOwnQuestion: session.get('user_id') === question.user_id
  }
}

web.htmlRoute(
  '/questions/answers/:name/:title/:id',
  'html/anwers.html',
  answersData,
  questionInjections
)

web.htmlRoute(
  '/questions/edit-answer/:name/:title/:id/:answer_id',
  'html/anwers.html',
  async (input, session) => {
    const answer = await answers.find({ id: input.answer_id })
    if (answer.user_id !== session.get('user_id')) {
      session.setFlash('warning', 'You need to sign in.')
      return web.back()
    }
    return Object.assign(
      await answersData(input, session),
      {
        edit: answer
      }
    )
  },
  questionInjections
)

web.htmlRoute('/questions/edit/:id', 'html/questions/edit.html', async (input, session) => {
  if (!hasAuth(session)) return web.back()
  const question = await questions.find({ id: input.id })

  if (question.user_id !== session.get('user_id')) {
    return web.back()
  }
  return {
    user_id: session.get('user_id'),
    user_name: session.get('user_name'),
    twitter_url: await web.twitterRequestUrl('http://localhost:8080/twitter-login', session),
    categories: (await categories.select()).map((c) => {
      c.isSelected = question.category_id === c.id ? 'selected' : ''
      return c
    }),
    question
  }
}, questionInjections)

web.htmlRoute('/questions/new', 'html/questions/new.html', async (input, session) => {
  if (!hasAuth(session)) return web.back()

  return {
    user_id: session.get('user_id'),
    user_name: session.get('user_name'),
    twitter_url: await web.twitterRequestUrl('http://localhost:8080/twitter-login', session),
    categories: await categories.select()
  }
}, questionInjections)

const validateQuestionInput = (input, session) => {
  if (input.question.trim() === '') {
    session.setFlash('danger', 'You can´t ask an empty question!')
    return false
  }
  if (input.title.trim() === '') {
    session.setFlash('danger', 'Title can´t be empty!')
    return false
  }
  return true
}

web.postRoute('/questions/update', async (input, session) => {
  if (!hasAuth(session)) return web.back()
  if (!validateQuestionInput(input, session)) return web.back()

  await questions.update({
    category_id: input.category,
    title: input.title,
    question: input.question
  }, { id: input.id })

  return web.redirect(`/questions/answers/-/-/${input.id}`)
})

web.route('/questions/delete/:id', async (input, session) => {
  if (!hasAuth(session)) return web.back()
  const question = await questions.find({ id: input.id })
  if (question.user_id !== session.get('user_id')) return web.back()
  await questions.delete({ id: question.id })
  return web.redirect('/questions')
})

web.route('/answers/delete/:id', async (input, session) => {
  if (!hasAuth(session)) return web.back()
  const answer = await answers.find({ id: input.id })
  if (answer.user_id !== session.get('user_id')) return web.back()
  await answers.delete({ id: answer.id })
  return web.redirect(`/questions/answers/-/-/${answer.question_id}`)
})

web.postRoute('/questions/create', async (input, session) => {
  if (!hasAuth(session)) return web.back()
  if (validateQuestionInput(input, session)) {
    await questions.create({
      category_id: input.category,
      title: input.title,
      question: input.question,
      user_id: session.get('user_id'),
      created: db.now()
    })
    return web.redirect('/questions')
  }
  return web.back()
})

/*
  Tutorials
*/
web.route('/tutorials', () => web.redirect('/tutorials/hello-world'))
web.htmlRoute('/tutorials/:tutorial', 'html/tutorials.html', async input => ({
  tut: input.tutorial ? `html/tuts/${input.tutorial}.html` : 'html/tuts/hello-world.html'
}), questionInjections)

/*
  AUTH
*/
web.postRoute('/google-login', async (input, session) => {
  let googleAccess = await auth.googleAccessExists(input)
  if (!googleAccess) {
    googleAccess = await auth.createGoogleAccess(input)
  }
  const user = await auth.getUserByAccess(googleAccess)
  session.set('user_id', user.id)
  session.set('user_name', user.name)
  return web.back()
})

web.postRoute('/facebook-login', async (input, session) => {
  let facebookAccess = await auth.facebookAccessExists(input)
  if (!facebookAccess) {
    const extendedData = await web.social.getFacebookFields(input.accessToken)
    facebookAccess = await auth.createFacebookAccess(
      Object.assign(input, extendedData)
    )
  }
  const user = await auth.getUserByAccess(facebookAccess)
  session.set('user_id', user.id)
  session.set('user_name', user.name)
  return web.back()
})

web.twitterRoute('/twitter-login', async (input, session) => {
  let twitterAccess = await auth.twitterAccessExists(input)
  if (!twitterAccess) {
    twitterAccess = await auth.createTwitterAccess(input)
  }
  const user = await auth.getUserByAccess(twitterAccess)
  session.set('user_id', user.id)
  session.set('user_name', user.name)
  return web.redirect('/questions')
})

web.start()
