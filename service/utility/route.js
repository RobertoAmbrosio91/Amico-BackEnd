const postApi = require('./controller/utility-post.controller');
const { verifyJWT } = require("../../utils/auth_tokens");

class Routes {

  constructor(app) {
    this.app = app;
  }

  /* creating app Routes starts */
  appRoutes() {
    
    this.app.get('/utility/most-like-post', postApi.listPosts);
    
  }

  routesConfig() {
    this.appRoutes();
  }
}

module.exports = Routes;
