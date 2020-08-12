// @ts-ignore
import passport from "passport";
// @ts-ignore
import passportLocal from "passport-local";
// @ts-ignore
import passportJwt from "passport-jwt";
// @ts-ignore
import User from "../../models/user.model";
import '../../lib/env';
// import passportApiKey from "passport-headerapikey";


// @ts-ignore
const LocalStrategy = passportLocal.Strategy;
// @ts-ignore
const JwtStrategy = passportJwt.Strategy;
// @ts-ignore
const ExtractJwt = passportJwt.ExtractJwt;

passport.use(new LocalStrategy({
    usernameField: "user[email]",
    passwordField: 'user[password]'
}, (email, password, done) => {
    User.findOne({email: email.toLowerCase()}, (err: any, user: any) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(undefined, false, {message: `email ${email} not found.`});
        }
        user.comparePassword(password, (err: Error, isMatch: boolean) => {
            if (err) {
                return done(err);
            }
            if (isMatch) {
                return done(undefined, user);
            }
            return done(undefined, false, {message: "Invalid username or password."});
        });
    });
}));
//
passport.use(new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    }, function (jwtToken, done) {
        User.findOne({email: jwtToken.email}, function (err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(undefined, user, jwtToken);
            } else {
                return done(undefined, false);
            }
        });
    }));
//
