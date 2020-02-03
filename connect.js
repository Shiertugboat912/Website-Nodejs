//app.js

const express = require('express');
const app = express();
const morgan = require('morgan');
const mysql = require('mysql');
const bodyparser = require('body-parser');


function createConn()
{
return mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'minifinal',
  database: 'elroy',
  port: 3308
});
}


app.get("/users/:id",(req,res)=>{
    
 const conn = createConn() 
 conn.connect((err) => {
  if (err) {
      console.log("error")
      res.sendStatus(404)
      return
      }
  console.log('Connected!');
});
    console.log("fetching data id:" + req.params.id) 
    var User_id = req.params.id
    conn.query("SELECT * FROM employees WHERE id = ?",[User_id],(err,rows,fields)=>{
        if(err)
            queryerror(res)
    console.log("fetched")
    const users = rows.map((row)=>{
    return {name : row.name}
    })
    res.json ([users,rows])
})
//res.end()
conn.end();
})


app.get("/",(req,res)=>{
    console.log("responding")
    res.send("hello we are live")
})

app.get("/users",(req,res)=>{
    conn = createConn()
    conn.query("SELECT * FROM employees",(err,rows,fields)=>{
        if(err)
            queryerror(res)
        console.log("fetched all")
        res.json(rows)
    })
})


app.listen(3000,()=>
          {
    console.log("server is listening")
})



//app.use(expressLayouts);//view ejs files
/*
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

passport.use(new LocalStrategy(
    function (username, password, done) {
        const conn = createConn();
        conn.query("SELECT * FROM user_deets where username = ?",[username],(err,result)=>{
           try{ if(err)
            {
                done(err)
            }
            const hash = result[0].password
            bcrypt.compare(password, hash,(err,yy) => {
                if(err)
                    {
                    throw err
                    return
                    }
                else if(yy===true)
                {
                    console.log("success")
                    done(null,true)
                }
                else
                {
                alert("Wrong Password")
                done(null,false)
                }
            });
        }
        catch{
            alert("no username")
            done(null,false)
        }
        })
    }));

*/


/*app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login',successRedirect: '/admin' }));*/