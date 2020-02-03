// all modules
const expressLayouts = require('express-ejs-layouts');
const express = require('express');
const app = express();
var ejs = require('ejs');
const morgan = require('morgan');
const mysql = require('mysql');
const bodyparser = require('body-parser');
var flash = require('connect-flash')
const session = require('express-session')
const check = require('express-validator')
const dotenv = require('dotenv');
dotenv.config();
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);
var MySQLStore = require('express-mysql-session')(session);
var fileUpload = require('express-fileupload')
const fs = require('fs')
const validatePhoneNumber = require('validate-phone-number-node-js');
var cookieParser = require('cookie-parser')

//middleware
app.use(morgan('short'))// for info on request from users
app.use(express.static('./public'))// access static files like js,css,images
app.use(express.static(__dirname + '/public/images'));
app.use(bodyparser.urlencoded({ extended: false }))// get info from the html files
app.use(bodyparser.json());//pass json as parameters
app.use(fileUpload());// upload photos

app.use(cookieParser('keyboard cat'));//for flash messages
app.use(flash());//for flash messages

app.use(function (req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});// prevent login using back after logout

app.set('view-engine', 'ejs');

//store in sessions
var options = {
    host: 'localhost',
    port: 3308,
    user: 'root',
    password: 'minifinal',
    database: 'school'
};
var sessionStore = new MySQLStore(options);
app.use(session({ secret: process.env.SECRET, resave: false, saveUninitialized: false, store: sessionStore, cookie: { maxAge: 600000 } }));

function createConn()// create a connection
{
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'minifinal',
        database: 'school',
        port: 3308
    });
}
//post functions
// get info of feedback
app.post("/feedback", checkUsernot, [check.check('email').isEmail()],
    (req, res) => {
        var name = req.body.fname
        var email = req.body.email
        var num = req.body.number
        const isnum = validatePhoneNumber.validate(num);
        var feed = req.body.feed
        const errors = check.validationResult(req);
        if (!errors.isEmpty() || isnum === false) {
            req.flash('error','enter valid email and number')
            res.redirect('/feedback')
            return
        }
        const conn = createConn()
        const statement = "INSERT INTO feedback (P_name,email,mob,feed) values (?,?,?,?)"
        conn.query(statement, [name, email, num, feed], (err, results) => {
            try {
                if (err) {
                    req.flash('error','Error')
                    res.redirect('/feedback')
                    return
                }
                req.flash('success','Feedback Recorded')
                res.redirect('/feedback')
            }
            catch{
                req.flash('error','Error')
                res.redirect('/feedback')
            }
        })
    })

app.post('/admin/deletefeedback', checkUser, (req, res) => {
    const conn = createConn()
    var fedno = req.body.delfeed
    const statement = "DELETE FROM feedback where ID =? "
    var sql = "SELECT * FROM feedback WHERE ID= ?"
    conn.query(sql, [fedno], (err, rows) => {
        try {
            if (err) {
                req.flash('error', 'Error')
                res.redirect('/admin')
                return
            }
            if (rows.length) {
                conn.query(statement, [fedno], (err, results) => {
                    try {
                        if (err) {
                            req.flash('error', 'Error')
                            res.redirect('/admin')
                            return
                        }
                        req.flash('success', 'deleted')
                        res.redirect('/admin')
                    }
                    catch{
                        req.flash('error', 'Error')
                        res.redirect('/admin')
                    }
                })
            }

            else
            {
                req.flash('error', 'Error')
                res.redirect('/admin')

            }
        }
        catch{
            req.flash('error', 'Error')
            res.redirect('/admin')

        }
    })
})
//login
app.post("/login", checkUsernot, (req, res) => {
    const conn = createConn()
    var username = req.body.username
    var password = req.body.password
    conn.query("SELECT * FROM user_deets where username = ?", [username], (err, result) => {
        try {
            if (err) {
                throw err
                res.sendStatus(500)
                return
            }
            var hash = result[0].password

            bcrypt.compare(password, hash, (err, yy) => {
                if (err) {
                    throw err
                    return
                }
                else if (yy === true) {
                    req.session.username = result[0].username
                    res.redirect('/admin')
                }
                else {
                    req.flash('error','Wrong Password')
                    res.redirect('/login')
                }
            });
        }
        catch{
            req.flash('error','Wrong Username')
            res.redirect('/login')
        }
    })
})
// insert new notice
app.post('/admin/notices', checkUser, (req, res) => {
    const conn = createConn()
    var ti = req.body.title
    var des = req.body.des
    if (req.files.noticepdf != 'null')
        var pdf = req.files.noticepdf;
    pdf.mv('public/notices/' + pdf.name, function (err) {
        if (err) {
            req.flash('error', 'Cannot upload to server')
            res.redirect('/admin')
        }
        const statement = "INSERT INTO news (Title,des,pdf) values (?,?,?)"
        conn.query(statement, [ti, des, pdf.name], (err, results) => {
            try {
                if (err) {
                    req.flash('error', 'Error')
                    res.redirect('/admin')
                    return
                }
                req.flash('success', 'Uploaded')
                res.redirect('/admin')
            }
            catch{
                req.flash('error', 'Error')
                res.redirect('/admin')
            }
        })
    })
})
//delete notice
app.post('/admin/deletenotice', checkUser, (req, res) => {
    const conn = createConn()
    var ti = req.body.delnotice
    const statement = "DELETE FROM news where Title =? "
    var sql = "SELECT * FROM news WHERE Title = ?"
    conn.query(sql, [ti], (err, rows) => {
        try {
            if (err) {
                req.flash('error', 'Error')
                req.redirect('/admin')
            }
            fs.unlink('public/notices/' + rows[0].pdf, (err) => {
                if (err) {
                    req.flash('error', 'Cannot Delete')
                    res.redirect('/admin')
                }
            })
            conn.query(statement, [ti], (err, results) => {
                try {
                    if (err) {
                        req.flash('error', 'Error')
                        res.redirect('/admin')
                        return
                    }
                    req.flash('success', 'Deleted')
                    res.redirect('/admin')
                }
                catch{
                    req.flash('error', 'Error')
                    res.redirect('/admin')
                }
            })
        }
        catch{
            req.flash('error', 'Error')
            res.redirect('/admin')
        }
    })
})
//insert new activity
app.post('/admin/activities', checkUser, (req, res) => {
    const conn = createConn()
    var ti = req.body.title
    var date = req.body.date
    var std = req.body.standard
    var time = req.body.time
    var ven = req.body.ven
    var sec = req.body.section
    var event_i = req.files.event_image
    var dis = req.body.event_des
    event_i.mv('public/images/event_images/' + event_i.name, function (err) {
        if (err) {
            req.flash('error', 'Error Occurred')
            res.redirect('/admin')
        }
        const statement = "INSERT INTO activities (Acti_name,Acti_date,Std,time,Venue,Section,event_img,event_des) values (?,?,?,?,?,?,?,?)"
        conn.query(statement, [ti, date, std, time, ven, sec, event_i.name, dis], (err, results) => {
            try {
                if (err) {
                    req.flash('error', 'Error')
                    res.redirect('/admin#activs')
                    return
                }
                req.flash('success', 'Uploaded')
                res.redirect('/admin')
            }
            catch{
                req.flash('error', 'Error')
                res.redirect('/admin')
            }
        })
    })
})
//delete activity
app.post('/admin/deleteactivity', checkUser, (req, res) => {
    const conn = createConn()
    var ti = req.body.del
    const statement = "DELETE FROM activities where Acti_name =? "
    var sql = "SELECT * FROM activities WHERE Acti_name = ?"
    conn.query(sql, [ti], (err, rows) => {
        try {
            if (err) {
                req.flash('error', 'Error')
                req.redirect('/admin')
            }
            fs.unlink('public/images/event_images/' + rows[0].event_img, (err) => {
                if (err) {
                    req.flash('error', 'Cannot Delete')
                    res.redirect('/admin')
                }
            })
            conn.query(statement, [ti], (err, results) => {
                try {
                    if (err) {
                        req.flash('error', 'Error')
                        res.redirect('/admin')
                        return
                    }
                    req.flash('success', 'Deleted')
                    res.redirect('/admin')
                }
                catch{
                    req.flash('error', 'Error')
                    res.redirect('/admin')
                }
            })
        }
        catch{
            req.flash('error', 'Error')
            res.redirect('/admin')
        }
    })

})
//insert new photo
app.post('/admin/photos', checkUser, (req, res) => {
    const conn = createConn()
    var file = req.files.uploaded;
    var img = file.name;
    var name = req.body.image_name
    var des = req.body.description
    file.mv('public/images/upload_images/' + img, function (err) {
        if (err) {
            req.flash('error', 'Cannot upload to server')
            res.redirect('/admin')
        }

        const statement = "INSERT INTO photos (img_name,image,img_des) values (?,?,?)"
        conn.query(statement, [name, img, des], (err, results) => {
            try {
                if (err) {
                    req.flash('error', 'Error')
                    res.redirect('/admin')
                    return
                }
                req.flash('success', 'Uploded')
                res.redirect('/admin')
            }
            catch{
                req.flash('error', 'Error')
                res.redirect('/admin')
            }
        })

    })
})
//delete photo
app.post('/admin/deletephotos', checkUser, (req, res) => {
    const conn = createConn()
    var name = req.body.deleteimage
    const statement = "DELETE FROM photos WHERE img_name =?"
    var sql = "SELECT * FROM photos WHERE img_name = ?"

    conn.query(sql, [name], (err, rows) => {
        try {
            if (err) {
                req.flash('error', 'Error')
                req.redirect('/admin')
            }
            fs.unlink('public/images/upload_images/' + rows[0].image, (err) => {
                if (err) {
                    console.log("cannot delete from sever")
                    return
                }
                console.log("unlinked")
                //file removed
            })
            conn.query(statement, [name], (err, results) => {
                try {
                    if (err) {
                        req.flash('error', 'Error')
                        res.redirect('/admin')
                        return
                    }
                    req.flash('success', 'Deleted')
                    res.redirect('/admin')
                }
                catch{
                    req.flash('error', 'Error')
                    res.redirect('/admin')
                }

            })
        }
        catch
        {
            req.flash('error', 'Error')
            res.redirect('/admin')
        }
    })
})
//insert carousel photo
app.post('/admin/carup', checkUser, (req, res) => {
    const conn = createConn()
    var file = req.files.car;
    var img = file.name;
    file.mv('public/images/car_images/' + img, function (err) {
        if (err) {
            req.flash('error', 'Error Occurred')
            res.redirect('/admin')
        }
        const statement = "INSERT INTO carousel (CAR_IMAGE) values (?)"
        conn.query(statement, [img], (err, results) => {
            try {
                if (err) {
                    req.flash('error', 'Error Occurred')
                    res.redirect('/admin')
                    return
                }
                req.flash('success', 'Uploaded Succefully')
                res.redirect('/admin')
            }
            catch{
                req.flash('error', 'Error Occurred')
                res.redirect('/admin')
            }
        })
    })
})
//delete carousel photo
app.post('/admin/deletecar', checkUser, (req, res) => {
    const conn = createConn()
    var name = req.body.cardel
    const statement = "DELETE FROM carousel WHERE CAR_IMAGE =?"
    var sql = "SELECT * FROM carousel WHERE CAR_IMAGE = ?"

    conn.query(sql, [name], (err, rows) => {
        try {
            if (err) {
                req.flash('error', 'Error Occurred')
                req.redirect('/admin')
            }
            fs.unlink('public/images/car_images/' + rows[0].CAR_IMAGE, (err) => {
                if (err) {
                    console.log("cannot delete from sever")
                    return
                }
                console.log("unlinked")
                //file removed
            })
            conn.query(statement, [name], (err, results) => {
                try {
                    if (err) {
                        req.flash('error', 'Error Occurred')
                        res.redirect('/admin')
                        return
                    }
                    req.flash('success', 'Deleted')
                    res.redirect('/admin')
                }
                catch{
                    req.flash('error', 'Error Occurred')
                    res.redirect('/admin')
                }

            })
        }
        catch
        {
            req.flash('error', 'Error Occurred')
            res.redirect('/admin')
        }
    })
})
//insert tesimonial
app.post('/admin/uptest', [check.check('personemail').isEmail()], checkUser, (req, res) => {
    var img = req.files.personphoto
    var name = req.body.personname
    var email = req.body.personemail
    var mob = req.body.personmobile
    var post = req.body.personpost
    var test = req.body.test
    const errors = check.validationResult(req);
    const isnum = validatePhoneNumber.validate(mob);
    if (!errors.isEmpty() || isnum === false) {
        req.flash('error', 'Enter valid Number and Email')
        res.redirect('/admin')
        return
    }
    var conn = createConn()
    img.mv('public/images/testimonial_images/' + img.name, function (err) {
        if (err) {
            req.flash('error','Error')
            res.redirect('/admin')
            return
        }
        const statement = "INSERT INTO testimonials (P_NAME,P_EMAIL,MOB,POST,IMG,TEST) values (?,?,?,?,?,?)"
        conn.query(statement, [name, email, mob, post, img.name, test], (err, results) => {
            try {
                if (err) {
                    req.flash('error', 'Error')
                    res.redirect('/admin')
                    return
                }
                req.flash('success', 'Uploded')
                res.redirect('/admin')
            }
            catch{
                req.flash('error', 'Error')
                res.redirect('/admin')
            }
        })
    })
})
//delete testimonial
app.post('/admin/deletetest', checkUser, (req, res) => {
    const conn = createConn()
    var name = req.body.delpersonname
    var email = req.body.delpersonemail
    var statement = "DELETE FROM testimonials WHERE P_NAME =? and P_EMAIL=?"
    var sql = "SELECT * FROM testimonials WHERE P_NAME =? and P_EMAIL=? "

    conn.query(sql, [name, email], (err, rows) => {
        try {
            if (err) {
                req.flash('error', ('Error'))
                req.redirect('/admin')
            }
            fs.unlink('public/images/testimonial_images/' + rows[0].IMG, (err) => {
                if (err) {
                    console.log("cannot delete from sever")
                    return
                }
                console.log("unlinked")
                //file removed
            })
            conn.query(statement, [name, email], (err, results) => {
                try {
                    if (err) {
                        req.flash('error', 'Error')
                        res.redirect('/admin')
                        return
                    }
                    req.flash('success', 'Deleted')
                    res.redirect('/admin')
                }
                catch{
                    req.flash('error', 'Error')
                    res.redirect('/admin')
                }

            })
        }
        catch
        {
            req.flash('error', 'Error')
            res.redirect('/admin')
        }

    })

})

//routes
app.get('/', (req, res) => {

    res.redirect('/homepage')
})

app.get('/homepage', (req, res) => {
    const conn = createConn()
    var sql = "SELECT * FROM news"
    conn.query(sql, (err, rows) => {
        try {
            if (err) {
                return
            }

            var sql1 = "SELECT * FROM carousel"
            conn.query(sql1, (err, row) => {
                try {
                    if (err) {
                        return
                    }

                    var sql2 = "SELECT * FROM testimonials"
                    conn.query(sql2, (err, test) => {
                        try {
                            if (err) {
                                return
                            }
                            if (req.session.username)
                                res.render('index.ejs', { name: req.session.username, news: rows, img: row, test: test })
                            else
                                res.render('index.ejs', { name: 'Login', news: rows, img: row, test: test })
                        }
                        catch
                        {
                            res.redirect('/homepage')
                        }
                    })
                }
                catch
                {
                    res.redirect('/homepage')
                }
            })
        }
        catch
        {
            res.redirect('/homepage')
        }
    })
})

app.get('/login', checkUsernot, (req, res) => {
    res.render('login.ejs', { name: 'Login', error:req.flash('error')})
})

app.get('/feedback', (req, res) => {
    if (req.session.username)
        res.render('feedback.ejs', { name: req.session.username, success: req.flash('success'), error:req.flash('error') })
    else
        res.render('feedback.ejs', { name: 'Login', success: req.flash('success'), error:req.flash('error') })
})

app.get('/admin', checkUser, (req, res) => {
    const conn = createConn()
    var sql = "SELECT * FROM feedback"
    conn.query(sql, (err, results) => {
        try {
            if (err) {
                res.flash('error','database error')
                return
            }
            var sql1 = "SELECT * FROM photos"
            conn.query(sql1, (err, rows) => {
                try {
                    if (err) {
                        res.sendStatus(401)
                        return
                    }

                    var sql2 = "SELECT Acti_name FROM activities"
                    conn.query(sql2, (err, row) => {
                        try {
                            if (err) {
                                res.sendStatus(401)
                                return
                            }

                            var sql3 = "SELECT * from carousel"
                            conn.query(sql3, (err, ro) => {
                                try {
                                    if (err) {
                                        res.sendStatus(401)
                                        return
                                    }

                                    var sql4 = "SELECT * FROM news"
                                    conn.query(sql4, (err, news) => {
                                        try {
                                            if (err) {
                                                res.sendStatus(401)
                                                return
                                            }

                                            var sql5 = "SELECT * FROM testimonials"
                                            conn.query(sql5, (err, test) => {
                                                try {
                                                    if (err) {
                                                        res.sendStatus(401)
                                                        return
                                                    }
                                                    res.render('admin.ejs', { data: rows, fed: results, event: row, car: ro, news: news, test: test, success: req.flash('success'), error: req.flash('error') })
                                                }
                                                catch
                                                {
                                                    res.redirect('/admin')
                                                }

                                            })


                                        }

                                        catch
                                        {
                                            res.redirect('/admin')
                                        }
                                    })

                                }
                                catch{
                                    res.redirect('/homepage')
                                }
                            })

                        }
                        catch
                        {
                            res.redirect('/homepage')
                        }

                    })

                }
                catch
                {
                    res.redirect('/homepage')
                }
            })
        }

        catch
        {
            res.redirect('/admin')
        }
    })
})

app.get('/gallery', (req, res) => {
    const conn = createConn()
    var sql1 = "SELECT * FROM photos"
    conn.query(sql1, (err, rows) => {
        try {
            if (err) {
                res.sendStatus(401)
                return
            }
            if (req.session.username)
                res.render('gallery.ejs', { name: req.session.username, data: rows })
            else
                res.render('gallery.ejs', { name: 'Login', data: rows })
        }
        catch
        {
            res.redirect('/homepage')
        }
    })
})

app.get('/logout', checkUser, (req, res) => {
    req.session.destroy()
    res.redirect('/login')
})

app.get('/activity', (req, res) => {
    const conn = createConn()
    var sql = "SELECT * FROM activities"
    conn.query(sql, (err, rows) => {
        try {
            if (err) {
                return
            }

            if (req.session.username)
                res.render('activity.ejs', { name: req.session.username, data: rows })
            else
                res.render('activity.ejs', { name: 'Login', data: rows })

        }

        catch
        {
            res.redirect('/homepage')
        }
    })
});

app.get('/about-us', (req, res) => {
    if (req.session.username)
        res.render('about.ejs', { name: req.session.username })
    else
        res.render('about.ejs', { name: 'Login' })
})

app.get('/testimonies', (req, res) => {
    const conn = createConn()
    var sql = "SELECT * FROM testimonials"
    conn.query(sql, (err, test) => {
        try {
            if (err) {
                return
            }
            if (req.session.username)
                res.render('testimonies.ejs', { name: req.session.username, test: test })
            else
                res.render('testimonies.ejs', { name: 'Login', test: test })
        }
        catch
        {
            res.redirect('/homepage')
        }
    })

})

//for viewing description of image
app.get('/viewpage/:id/:des', (req, res) => {
    var id = req.params.id
    var des = req.params.des
    res.render('viewimage.ejs', { img: id, des: des })
})

app.get('/viewpage/:id/', (req, res) => {
    var id = req.params.id
    res.render('viewimage.ejs', { img: id, des: 'No Description' })
})
//routes end

//check user is admin or not 
function checkUser(req, res, next) {
    if (!req.session.username) {
        res.redirect('/login')
        return
    }
    return next()
}
//check user is logged in
function checkUsernot(req, res, next) {
    if (req.session.username) {
        res.redirect('/admin')
        return
    }
    return next()
}
// listen on port 3000
app.listen(3000, () => {
    console.log("server is listening at port 3000")
})