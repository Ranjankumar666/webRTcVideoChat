const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const isVerified = (req, res, next) => {
    if (!req.session || !req.session.user) {
        res.redirect('/login');
        return;
    }
    next();
};

const redirectHome = (req, res, next) => {
    if (req.session && req.session.user) {
        res.redirect('/');
        return;
    }

    next();
};

router.get('/', isVerified, (req, res, next) => {
    const { user } = req.session;
    res.render('home', {
        user,
    });
});

router.get('/login', redirectHome, (req, res, next) => {
    res.render('login');
});

router.post('/login', (req, res, next) => {
    const { email, name } = req.body;

    if (!name || !email) {
        return res.redirect('/login');
    }
    req.session.user = {
        name,
        email,
    };
    res.redirect('/');
});

router.get('/chat', isVerified, (req, res, next) => {
    const { type, name, email } = req.query;
    const room = crypto.randomBytes(4).toString('hex');

    res.redirect(`/chat/${room}?type=${type}&name=${name}&email=${email}`);
});

router.get('/chat/:room', isVerified, (req, res, next) => {
    const { type, name, email } = req.query;

    res.render('chatRoom', {
        room: req.params.room,
        viewer: type === 'viewer' ? true : false,
        name,
        email,
    });
});

module.exports = router;
