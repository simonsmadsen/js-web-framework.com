const db = require('js-web').migration.mysql

/*
  Fieldtypes:
  id (auto increment),
  string,
  int,
  datetime,
  bool,
  text
 */

db.table('google_access',{
  id: 'id',
  resourceName: 'string',
  google_id: 'string',
  displayName: 'string',
  familyName: 'string',
  givenName: 'string',
  user_id: 'int'
})

db.table('twitter_access', {
  id: 'id',
  accessToken: 'string',
  accessTokenSecret: 'string',
  user_id: 'int',
  twitter_id: 'int',
  screen_name: 'string'
})

db.table('facebook_access', {
  id: 'id',
  accessToken: 'text',
  signedRequest: 'text',
  user_id: 'int',
  expiresIn: 'int',
  facebook_id: 'string'
})

db.table('users',{
  id: 'id',
  name: 'string'
})
