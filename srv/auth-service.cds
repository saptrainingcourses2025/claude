service AuthService @(path: 'auth', requires: 'any') {

    type LoginResponse {
        access    : String;
        refresh   : String;
        expiresIn : Integer;
    }

    type UserInfo {
        id        : String;
        loginName : String;
        firstName : String;
        lastName  : String;
        roles     : array of String;
    }

    type RegisterResponse {
        userID  : String;
        loginName : String;
        locked  : Boolean;
        message : String;
    }

    action   login(loginName: String, password: String) returns LoginResponse;
    action   refresh(refreshToken: String)              returns LoginResponse;
    function me()                                       returns UserInfo;

    // Public self-registration. Creates a TRAVELLER login + profile,
    // locked until an admin unlocks it.
    action   register(
        firstName : String,
        lastName  : String,
        email     : String,
        password  : String,
        phone     : String,
        addressType : String
    ) returns RegisterResponse;
}
