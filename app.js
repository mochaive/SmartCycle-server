const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const request = require('request')
const WebSocket = require('ws')
const nugu = require(`${__dirname}/config.json`)
const ipfilter = require('express-ipfilter').IpFilter
const fetch = require('node-fetch')
const qs = require('querystring')
const app = express()
const root = "/home/smartcycle/smartcycle_server"


const trashRouter = require('./routes/trash')
const nuguRouter = require('./routes/nugu')

const ips = ['118.24.48.113']
app.use(ipfilter(ips))


const client_id = '285306495565-73h5rcrc5jfndonmpkuprb7dnqceh2ad.apps.googleusercontent.com'
const client_secret = 'cbTgXzCOLyqrcaqFJ2BYGOzB'
const redirect_uri = 'https://smartcycle.ljhnas.com/getAccessToken'
const redirect_uri_old = 'https://smartcycle.ljhnas.com/getAccessToken'
const response_type = 'code'
const scope = 'email'

const auth_uri = 'https://accounts.google.com/o/oauth2/v2/auth'
const auth_uri_2 = 'https://developers.nugu.co.kr/app/callback.html'
const token_uri_2 = 'https://developers.nugu.co.kr/app/callback.html'
const token_uri = 'https://www.googleapis.com/oauth2/v4/token'
const email_uri = 'https://www.googleapis.com/oauth2/v3/userinfo'
const refresh_uri = 'https://www.googleapis.com/oauth2/v4/token'

// OAuth2
app.get('/getGoogleAuth', (req, res) => {

    var jsonObject

    const params = qs.stringify({
        client_id,
        prompt: 'consent',
        access_type: 'offline',
        redirect_uri,
        response_type,
        scope,
    })

    res.redirect(302, `${auth_uri}?${params}`)

})

app.get('/getAccessToken', (req, res) => {
    fetch(token_uri, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: qs.stringify({
            prompt: 'consent',
            approval_prompt: 'force',
            access_type: 'offline',
            client_id,
            client_secret,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri,
        })
    }).then(res => res.json()).then(json => {
        console.log(json)

        // { "nine": 9, "ten": 10, "eleven": 11 }
        var refresh_token = json.refresh_token
        var access_token = json.access_token
        var expires_in = json.expires_in

        jsonObject = `{
                "access_token": ${access_token},
                "refresh_token" : ${refresh_token},
                "expires_in" : ${expires_in}
                `

        res.send(jsonObject)
    })


})


// 앱으로 부터 access_token을 입력받아 구글 프로파일 리턴
app.get("/getGoogleProfile", asyncWrap(async (req, res) => {
    var accessToken = req.query.access_token;
    console.log(accessToken);
    var response =  await request(email_uri, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    })

    res.send(response);

}));

app.get('/getNewAccessToken', (req, res) => {
    // ?refresh_token=fwefawfwe
    var refresh_token = req.query.refresh_token
    //var refreshSample = '1/WLMm9KDSnq0VKcz6G7lP4bUqQYOhtZwT1x5C4UBWPHI'
    var resultAccessToken

    fetch(refresh_uri, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: qs.stringify({
            client_id,
            client_secret,
            grant_type: 'refresh_token',
            refresh_token: refresh_token

        })
    }).then(res => res.json()).then(json => {
        console.log(json)
        resultAccessToken = json.access_token
        console.log(token)
        res.send(resultAccessToken)
        // return fetch(email_uri, {
        //     headers: {
        //         Authorization: `Bearer ${json.access_token}`,
        //     }
        // })
    })

})


function getEmailByAccessToken(token) {
    var userEmail
    fetch(email_uri, {
        headers: {
            Authorization: `Bearer ${json.access_token}`,
        }
    }).then(res => res.json()).then(json => {
        console.log(json.email)
        userEmail = json.email
    })

    return userEmail
}




app.use(morgan('combined'))
app.use(express.json())


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))

app.use('/pictures', express.static(`${__dirname}/pictures/gsc`), (req, res) => {
    return res.send({
        error: 404
    })
})

app.use('/latelyPictures', express.static(`${__dirname}/pictures/success`), (req, res) => {
    return res.send({
        error: 404
    })
})

app.use((err, _req, res, _next) => {
    console.log(err);
    res.send('error');
})

function asyncWrap(asyncFn) {
    return (async (req, res, next) => {
        try {
            return await asyncFn(req, res, next)
        } catch (error) {
            return next(error)
        }
    })
}


// function decode image
function decode_base64(base64str, filename) {
    const buf = Buffer.from(base64str, 'base64')

    fs.writeFile(path.join(__dirname, '/pictures/ai/', filename), buf, function (error) {
        if (error) {
            throw error
        } else {
            console.log('File created from base64 string!')
            return true
        }
    })
}

// function decode image test
function decode_base64_test(base64str, filename) {
    const buf = Buffer.from(base64str, 'base64')

    fs.writeFile(path.join(__dirname, '/pictures', filename), buf, function (error) {
        if (error) {
            throw error
        } else {
            console.log('File created from base64 string!')
            return true
        }
    })
}


// https
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/smartcycle.ljhnas.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/smartcycle.ljhnas.com/cert.pem')
}


// create server
http.createServer(app).listen(80 || 80)
https.createServer(options, app).listen(443 || 443)
const wss = new WebSocket.Server({
    port: 8080
})



// mongoDB connect
var db = mongoose.connection
db.on('error', console.error)
db.once('open', function () {
    console.log("Connected to mongod server")
})
mongoose.connect('mongodb://localhost/smartcycle', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})



// Models
const Trash = require('./models/trashModel')
const Picture = require('./models/pictureModel')
const Quiz = require('./models/quizModel')
const SocketId = require('./models/socketIdModel')


const timeout = ms => new Promise(res => setTimeout(res, ms))


// Socket server
// async
const sockets = {}
wss.on('connection', function connection(ws, req) {
    const id = req.url.slice(1)
    sockets[id] = ws

    console.log('SOCKET CONNECTED. ID:' + id)

    ws.on('message', function incoming(message) {
        console.log('received: %s', message)
    })

    ws.on('close', () => {
        delete sockets[id]
        console.log('SOCKET DISCONNECTED. ID:' + id)
    })

    ws.send('connected')

})


// how to dispose trash
app.use('/howtoDisposeAction', asyncWrap(async (req, res) => {
    // send "1" to raspbian
    const berry_id = "test"
    sockets[berry_id].send(1)

    // 사진 받는 방식 수정

    console.log("Start")

    var trash_id = ""
    let temp = ""
    while(true) {
        try{
          temp = fs.readFileSync(`${root}/predicted.txt`, "utf8");
          console.log(`trash_id : ${trash_id}`)
          break
        } catch(err){
          await timeout(100)
          continue
        }
      }
    
      trash_id = temp.slice(0, 1)
    
      await timeout(100)
    
      fs.unlink(`${root}/predicted.txt`, function(err) {
          if( err ) throw err;
          console.log('file deleted');
      })
      // 받아와서 DB에서 검색
      await Trash.findOne({
        id: trash_id
    }, (err, trash) => {
        nugu_script = trash.nugu_script
    })

    console.log(nugu_script)


    // 출력
    nugu.response.output = {
        "way_dispose": nugu_script.toString()
    }

    console.log(nugu.response)

    return res.json(nugu.response)
}))


// send picture from Raspbian
app.post('/picture/send', asyncWrap(async (req, res) => {
    // console.log(req)
    const filename = Date.now() + ".jpg"
    decode_base64(req.body.data_base64, filename)

    // Use for tes
    // decode_base64_test(req.body.data_base64, filename)

    

    res.send("success")
}))


app.use('/', nuguRouter)
app.use('/trash', trashRouter)


// API
// nugu, raspberry connect success
app.post('/socket/connect', asyncWrap(async (req, res) => {
    //const email = await getAuthEmail(req.body.access_token)
    const email = req.body.user_email;
    console.log(email);
    if (!email) return res.status(400).send({
        success: false
    })

    
    console.log("email : " + email);
    console.log("berry_id :" + req.body.berry_id);
    

    const socketId = new SocketId({
        nugu_id: email,
        berry_id: req.body.berry_id
    })

    if(await SocketId.findOne({
        nugu_id: socketId.nugu_id
    })) return res.send({ result: 2 });

    await socketId.save()
    return res.send({
        result: 1
    })
}))


// nugu, raspberry connect delete
app.delete('/socket/delete/:id', asyncWrap(async (req, res) => {
    await SocketId.remove({
        nugu_id: req.params.id
    })
    res.send({
        "result": 1
    })
}))


// Don't use
app.get('/test/test/test/test', (req, res) => {
       const berry_id = "test"
   
       sockets[berry_id].send(1)

       res.send("1")
})


// send QRcode info from Raspbian
const user_email = null
app.post('/qrcode/send', (req, res) => {

    user_email = req.body.user_email

    res.send("success")
})


// put quiz info
app.post('/quiz/update', (req, res) => {

    const quiz = new Quiz()

    quiz.id = req.body.id
    quiz.quiz = req.body.quiz
    quiz.answer = req.body.answer
    quiz.incorrect_script = req.body.incorrect_script

    quiz.save((err) => {
        if (err) {
            console.error(err)
            res.json({
                result: 0
            })
            return
        }
    })

    console.log(req.body)

    res.json({
        result: 1
    })
})


// show terms.html
app.get("/terms", (req, res) => {
    res.sendFile(__dirname + '/terms.html')
})


// root
app.get("/", (req, res) => {
    res.send("Hello, This is SmartCycle_server")
})