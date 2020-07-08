const express = require("express");
const {check, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const UserModel = require("../model/user");

router.post(
    "/signup",
    [
        check("fullname", "Please Enter a Valid Name")
            .not()
            .isEmpty(),
        check("username", "Please Enter a Valid Username")
            .not()
            .isEmpty(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const {
            username,
            fullname,
            password
        } = req.body;
        try {
            let user = await UserModel.findOne({
                username
            });
            if (user) {
                return res.status(400).json({
                    msg: "User Already Exists"
                });
            }

            user = new UserModel({
                username,
                fullname,
                password
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            const payload = {
                user: {
                    id: user.id
                }
            };
            jwt.sign(
                payload,
                "randomString", {
                    expiresIn: '1h'
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({
                        id: user.id,
                        fullname: user.fullname,
                        token,
                        expires_at: (new Date().getTime() + 3600000)
                    });
                }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Error in Saving");
        }
    }
);
router.post(
    "/login",
    [
        check("username", "Please enter a valid username"),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        const {username, password, remember} = req.body;
        try {
            let user = await UserModel.findOne({
                username
            });
            if (!user)
                return res.status(400).json({
                    message: "User Not Exist"
                });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(400).json({
                    message: "Incorrect Password !"
                });

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                "randomString",
                {
                    expiresIn: remember ? '7d' : '1h'
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({
                        id: user.id,
                        fullname: user.fullname,
                        token,
                        expires_at: (new Date().getTime() + (remember ? (3600000 * 24 * 7) : 3600000))
                    });
                }
            );
        } catch (e) {
            console.error(e);
            res.status(500).json({
                message: "Server Error"
            });
        }
    }
);
module.exports = router;
