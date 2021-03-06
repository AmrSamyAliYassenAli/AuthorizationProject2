import passport from "passport";
import { User } from "../database/models";
import { APP_SECRET as secretOrKey } from "../constants";
import { Strategy, ExtractJwt } from "passport-jwt";

const opts = {
    secretOrKey,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

passport.use( new Strategy(opts,async({ id } ,done) =>{
    try {
        let user = await User.findById(id);
        if(!user){
            throw new Error("User NotFound.");
        }
        return done(null,user.getUserInfo());
    } catch (error) {
        done(null,false);
    }
    })
);