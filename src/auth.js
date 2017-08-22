const web = require('js-web')
const social = web.social
const db = web.storage.mysql
/**
 * Tables!
*/
const users = db.table('users')
const googleAccess = db.table('google_access')
const twitterAccess = db.table('twitter_access')
const facebookAccess = db.table('facebook_access')

const createUser = async (name) => {
   return await users.create({name: name})
}

module.exports.getUserByAccess = async (access) => {
  if(typeof access === "number"){
      return await users.find({id: access})
  }
  return await users.find({id: access.user_id})
}

/**
 * Facebook Auth
 */

module.exports.facebookAccessExists = async (input) => {
  return await facebookAccess.find({facebook_id:input.userID})
}

module.exports.createFacebookAccess = async (input) => {
  const user_id = await createUser(input.name)
  social.getFacebookImage(input.accessToken,'assets/user-images/'+user_id+'.jpg')
  await facebookAccess.create({
    accessToken: input.accessToken,
    signedRequest: input.signedRequest,
    user_id: user_id,
    expiresIn: input.expiresIn,
    facebook_id: input.userID
    })
  return user_id
}

/**
 * Twitter Auth
 */

module.exports.twitterAccessExists = async (input) => {
  return await twitterAccess.find({twitter_id:input.user_id})
}

module.exports.createTwitterAccess = async (input) => {
  const user_id = await createUser(input.screen_name)
  social.getTwitterImage(input.screen_name,'assets/user-images/'+user_id+'.jpg')
  await twitterAccess.create({
      accessToken: input.accessToken,
      accessTokenSecret: input.accessTokenSecret,
      screen_name: input.screen_name,
      twitter_id: input.user_id,
      user_id: user_id
    })
  return user_id
}

/**
 * Google Auth
 */
module.exports.googleAccessExists = async (input) => {
  return await googleAccess.find({google_id:input.id})
}

module.exports.createGoogleAccess = async (input) => {
  const user_id = await createUser(input.givenName+' '+input.familyName)
  social.getGoogleImage(input.id,'assets/user-images/'+user_id+'.jpg')
  await googleAccess.create(Object.assign(
    input.only([
      'resourceName',,
      'displayName',
      'familyName',
      'givenName',
    ]),{
      google_id: input.id,
      user_id: user_id
    }
  ))
  return user_id
}
