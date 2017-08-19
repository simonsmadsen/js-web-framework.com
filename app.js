const web = require('js-web')
const db = web.storage.mysql

/**
 * Tables!
*/
const users = db.table('users')

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

/**
 * Routes
*/

web.route('/', _ => web.redirect('/docs/routing'))
web.htmlRoute('/docs/:doc','html/docs.html', async (input,session,cookie) => {
  return {
    doc: input.doc ? 'html/docs/'+input.doc+'.html' : 'html/docs/routing.html'
  }
},injections)

web.htmlRoute('/questions','html/questions.html', async (input,session,cookie) => {
  return { questions:[
    {question: 'test',category:'test',name:'simon'},
    {question: 'test',category:'test',name:'simon'},
    {question: 'test',category:'test',name:'simon'},
    {question: 'test',category:'test',name:'simon'}
  ] }
},questionInjections)

web.route('/tutorials', _ => web.redirect('/tutorials/hello-world'))
web.htmlRoute('/tutorials/:tutorial','html/tutorials.html', async (input,session,cookie) => {
  return {
    tut: input.tutorial ? 'html/tuts/'+input.tutorial+'.html' : 'html/tuts/hello-world.html'
  }
},questionInjections)

web.start()
