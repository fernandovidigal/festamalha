const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/User');

// APP LOGIN
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
    }, 
    (username, password, done) => {

        User.findOne({
            where: {username: username}
        }).then(user => {
            if(!user){
                return done(null, false);
            }

            bcrypt.compare(password, user.password, (err, matched) => {
                if(matched) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        }).catch(err => {
            console.log(err);
            return done(null, false);
        });
}))

passport.serializeUser(function(user, done){
    done(null, user.userId);
})

passport.deserializeUser(function(id, done){
    User.findByPk(id).then(user => {
        done(null, user);
    }).catch(err => {
        console.log(err);
        done(null, false);
    });
});

// ROUTES
router.all('/*', (req, res, next) => {
    req.app.locals.layout = 'login';
    next();
});

router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', (req,res,next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: "Dados de login inválidos"
    })(req, res, next);
});

module.exports = router;