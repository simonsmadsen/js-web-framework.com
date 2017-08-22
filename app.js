const web = require('js-web')
const db = web.storage.mysql
const auth = require('./src/auth.js')

/**
 * Injections
*/
const injections = [
  web.inject.jquery(),
  web.inject.bootstrap(),
  web.inject.script('https://apis.google.com/js/api.js'),
  web.inject.googleAuth('/google-login','google-login'),
  web.inject.facebookAuth('/facebook-login','fb-login'),
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

/*
  Docs!
*/
web.route('/alert', (i,s) => {
  s.setFlash('warning','This is a warning')
  return web.back()
})
web.route('/', _ => web.redirect('/docs/routing'))
web.htmlRoute('/docs/:doc','html/docs.html', async (input,session,cookie) => {
  return {
    doc: input.doc ? 'html/docs/'+input.doc+'.html' : 'html/docs/routing.html'
  }
},injections)

/*
  Questions
*/
web.htmlRoute('/questions','html/questions.html', async (input,session,cookie) => {
  return { questions:[
    {question: 'test',category:'test',name:'simon'},
    {question: 'test',category:'test',name:'simon'},
    {question: 'test',category:'test',name:'simon'},
    {question: 'test',category:'test',name:'simon'}
  ],
  user_id: session.get('user_id'),
  user_name: session.get('user_name'),
  twitter_url: await web.twitterRequestUrl('http://localhost:8080/twitter-login',session)
 }
},questionInjections)

web.htmlRoute('/questions/new','html/questions/new.html', async (input, session, cookie) => {
  return {
    user_id: session.get('user_id'),
    user_name: session.get('user_name'),
    twitter_url: await web.twitterRequestUrl('http://localhost:8080/twitter-login',session)
  }
})
/*
  Tutorials
*/
web.route('/tutorials', _ => web.redirect('/tutorials/hello-world'))
web.htmlRoute('/tutorials/:tutorial','html/tutorials.html', async (input,session,cookie) => {
  return {
    tut: input.tutorial ? 'html/tuts/'+input.tutorial+'.html' : 'html/tuts/hello-world.html'
  }
},questionInjections)

/*
  AUTH
*/
web.postRoute('/google-login', async (input,session,cookie) => {
  let googleAccess = await auth.googleAccessExists(input)
  if( ! googleAccess){
      googleAccess = await auth.createGoogleAccess(input)
  }
  const user = await auth.getUserByAccess(googleAccess)
  session.set('user_id',user.id)
  session.set('user_name',user.name)
  return web.back()
})

web.postRoute('/facebook-login', async (input, session, cookie) => {

  let facebookAccess = await auth.facebookAccessExists(input)
  if( ! facebookAccess ){
    const extendedData = await web.social.getFacebookFields(input.accessToken)
    facebookAccess = await auth.createFacebookAccess(
      Object.assign(input,extendedData)
    )
  }
  const user = await auth.getUserByAccess(facebookAccess)
  session.set('user_id',user.id)
  session.set('user_name',user.name)
  return web.back()
})

web.twitterRoute('/twitter-login', async (input, session, cookie) => {
  let twitterAccess = await auth.twitterAccessExists(input)
  if( ! twitterAccess){
      twitterAccess = await auth.createTwitterAccess(input)
  }
  const user = await auth.getUserByAccess(twitterAccess)
  session.set('user_id',user.id)
  session.set('user_name',user.name)
  return web.redirect('/questions')
})

web.start()
