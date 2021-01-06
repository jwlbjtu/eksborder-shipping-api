import passport from 'passport';
import passportLocal from 'passport-local';
import passportJwt from 'passport-jwt';
import User from '../../models/user.model';
import '../env';
import { USER_ROLES } from '../constants';
// import passportApiKey from "passport-headerapikey";

const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: 'user[email]',
      passwordField: 'user[password]'
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          email: email.toLowerCase(),
          role: USER_ROLES.ADMIN_SUPER,
          isActive: true
        });
        if (!user)
          return done({ message: `Invalid username or password.` }, false);
        // @ts-expect-error: ignore
        const isMatch = await user.comparePassword(password);
        if (!isMatch)
          return done({ message: 'Invalid username or password.' }, false);

        return done(undefined, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET
    },
    function (jwtToken, done) {
      return done(undefined, false, jwtToken);
    }
  )
);
