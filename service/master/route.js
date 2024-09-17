const categoryapi = require('./controller/category.controller');
const interest_api = require("./controller/interests.controller");
const { verifyJWT } = require("../../utils/auth_tokens");

class Routes {
  constructor(app) {
    this.app = app;
  }

  /* creating app Routes starts */
  appRoutes() {
    this.app.post("/master/categories", [verifyJWT], categoryapi.addCategory);
    this.app.get(
      "/master/categorieslist",
      [verifyJWT],
      categoryapi.listCategories
    );

    this.app.post(
      "/master/add-subcategory",
      [verifyJWT],
      categoryapi.addSubcategory
    );
    this.app.post(
      "/master/subcategories",
      [verifyJWT],
      categoryapi.listSubcategories
    );

    this.app.post(
      "/master/add-interest",
      [verifyJWT],
      interest_api.addInterest
    );

    this.app.post(
      "/master/get-interests",
      [verifyJWT],
      interest_api.listInterests
    );
  }

  routesConfig() {
    this.appRoutes();
  }
}

module.exports = Routes;
