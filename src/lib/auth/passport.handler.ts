import passport from 'passport';
import passportLocal from 'passport-local';
import passportJwt from 'passport-jwt';
import User from '../../models/user.model';
import '../env';
import { USER_ROLES } from '../constants';
import { logger } from '../logger';

const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'user[email]',
      passwordField: 'user[password]'
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          email: email.toLowerCase(),
          role: { $in: [USER_ROLES.ADMIN_SUPER, USER_ROLES.ADMIN] },
          isActive: true
        });
        if (!user)
          return done({ message: `Invalid username or password.` }, false);
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
  'client_local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          email: email.toLowerCase(),
          role: { $in: [USER_ROLES.API_USER] },
          isActive: true
        });
        if (!user)
          return done({ message: `Invalid username or password.` }, false);
        const isMatch = await user.comparePassword(password);
        if (!isMatch)
          return done({ message: 'Invalid username or password.' }, false);
        return done(undefined, user);
      } catch (error) {
        logger.error(error);
        return done(error, false);
      }
    }
  )
);

passport.use(
  'jwt',
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
