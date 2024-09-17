const postApi = require('./controller/post.controller');
const { verifyJWT } = require("../../utils/auth_tokens");

class Routes {

  constructor(app) {
    this.app = app;
  }

  /* creating app Routes starts */
  appRoutes() {
    this.app.post("/user/create-post", [verifyJWT], postApi.createPost);
    this.app.post("/user/list-posts", [verifyJWT], postApi.listPosts);
    this.app.post("/user/list-posts-noToken", postApi.listPostsNoToken);
    //---------------//
    this.app.post(
      "/user/list-postsPersonalized",
      [verifyJWT],
      postApi.listPersonalizedPosts
    );
    //-------------------//
    this.app.post("/user/list-owned-post", [verifyJWT], (req, res) =>
      postApi.listOwnedPosts(req, res)
    );
    this.app.post("/user/search-posts", [verifyJWT], postApi.searchPosts);
    this.app.delete("/user/post/:post_id", [verifyJWT], postApi.deletePost);
    this.app.get("/user/post/:post_id", [verifyJWT], postApi.getPostDetails);
    this.app.post("/user/like-unlike-post", [verifyJWT], postApi.likeUnlike);
    this.app.post("/user/post-report", [verifyJWT], postApi.reportPost);

    /* End Post Requests API */
    this.app.post(
      "/user/post/list-reports",
      [verifyJWT],
      postApi.reportPostList
    );
    this.app.post(
      "/user/tets-notification",
      [verifyJWT],
      postApi.testNotification
    );
  }

  routesConfig() {
    this.appRoutes();
  }
}

module.exports = Routes;
