const userApi = require('./controller/user.controller');
const endorseApi = require('./controller/endorse.controller');
const notificationApi = require("./controller/notification.controller");
const blockApi = require("./controller/block.controller");
const { verifyJWT } = require("../../utils/auth_tokens");
class Routes {

  constructor(app) {
    this.app = app;
  }

  /* creating app Routes starts */
  appRoutes() {
    this.app.post("/user/email-test", userApi.emailTest);
    this.app.post("/user/signup", userApi.signup);
    this.app.post("/user/login", userApi.login);
    this.app.post("/user/otp-signup", userApi.signupOtp);
    this.app.post("/user/otp-login", userApi.loginOtp);
    this.app.post("/user/otp-login-signup", userApi.handleLoginOrSignup);

    this.app.post("/user/social-login", (req, res) =>
      userApi.socialSignup(req, res)
    );

    this.app.post("/user/check-email", userApi.checkEmailExists);
    this.app.post("/user/check-username", userApi.checkUsernameExists);

    this.app.get("/user/auth", [verifyJWT], userApi.authSessionToken);
    this.app.post("/user/profile-data", [verifyJWT], userApi.getUserData);
    this.app.post(
      "/user/profile-update",
      [verifyJWT],
      userApi.userProfileUpdate
    );
    this.app.post("/user/badge/shown-update", [verifyJWT], userApi.shownUpdate);

    this.app.post("/user/create-link", userApi.createLink);
    this.app.post("/user/send-verification", userApi.sendVerification);
    this.app.get("/reset-password", userApi.showResetPasswordForm);
    this.app.post("/user/update-password", userApi.updatePassword);
    this.app.delete("/user/remove-account", [verifyJWT], userApi.removeAccount);
    this.app.post("/user/save-token", [verifyJWT], userApi.saveToken);
    this.app.post("/user/logout", [verifyJWT], userApi.logoutUser);
    this.app.post("/user/invite", [verifyJWT], userApi.inviteUser);

    /* Endorse Related Route */
    this.app.post("/user/endorse", [verifyJWT], endorseApi.endorseUser);

    /* Notification Routes */
    this.app.post(
      "/user/notification",
      [verifyJWT],
      notificationApi.notificationList
    );
    this.app.get(
      "/user/notification/:notification_id",
      [verifyJWT],
      notificationApi.readNotificationUpdate
    );

    /* Block Routes */
    this.app.post("/user/block", [verifyJWT], blockApi.blockUser);

    /*Friend Request routes */
    this.app.post(
      "/user/request-status",
      [verifyJWT],
      userApi.checkRequestStatus
    );
    this.app.post(
      "/user/send-friend-request",
      [verifyJWT],
      userApi.sendFriendrequest
    );
    this.app.post(
      "/user/accept-friend-request",
      [verifyJWT],
      userApi.acceptFriendrequest
    );
    this.app.get(
      "/user/fetch-friend-requests",
      [verifyJWT],
      userApi.fetchFriendRequests
    );
    this.app.get("/user/get-all-users", [verifyJWT], userApi.fetchAllUsers);
    this.app.post(
      "/user/get-all-friends",
      [verifyJWT],
      userApi.fetchAllFriends
    );
    this.app.post(
      "/user/add-remove-close-friend",
      [verifyJWT],
      userApi.addRemoveCloseFriend
    );
  }

  routesConfig() {
    this.appRoutes();
  }
}

module.exports = Routes;
