const express = require('express')
const morgan = require('morgan')
const cheerio = require("cheerio")
const bodyParser = require('body-parser')
const spawn = require("child_process").spawn
const fs = require('fs')
const request = require('request')
const router = express.Router()
const root = "/home/smartcycle/smartcycle_server"
const nugu = require(`${root}/config.json`)

router.use(morgan('combined'))


// Models
const Trash = require(`${root}/models/trashModel`)
const LatelyTrash = require(`${root}/models/latelyTrashModel`)
const Quiz = require(`${root}/models/quizModel`)

function asyncWrap(asyncFn) {
    return (async (req, res, next) => {
        try {
            return await asyncFn(req, res, next)
        } catch (error) {
            return next(error)
        }
    })
}

// function get random integer number
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max))
}


// 경기데이터드림 종량제 봉투 가격 현황(개방표준)
// https://data.gg.go.kr/portal/data/service/selectServicePage.do?page=1&sortColumn=&sortDirection=&infId=068TWVSS5T7G3375J2DV25973193&infSeq=1&searchWord=%EC%A2%85%EB%9F%89%EC%A0%9C
router.use('/priceTrashbagAction', asyncWrap(async (req, res) => {

    const city = req.body.action.parameters['BID_LOC_CITY'].value
    const capacity = req.body.action.parameters['CAPACITY'].value

    console.log(city)
    console.log(capacity)

    const URL = `https://openapi.gg.go.kr/MrsEnvelpSalepc?KEY=8207f8ee4c884c71a36452cd5199733c&pIndex=1&pSize=1&SIGUN_NM=${encodeURI(city)}`

    let price

    await request(URL, function (err, res, body) {
        var $ = cheerio.load(body)
        console.log(body) // n리터 쓰레기 봉투 가격
        price = $(`L${capacity}_AMT`).text()
        
    })

    
    if (price)
    nugu.response.output = {
        "value_price": `${price}원 입니다.`
    }
    
    else
    nugu.response.output = {
        "value_price": "원하시는 용량의 쓰레기 봉투 정보가 존재하지 않습니다."
    }
    

    console.log(price)
    return await res.json(nugu.response)
}))


// quiz
router.use('/quizAction', asyncWrap(async (req, res) => {
    const random = getRandomInt(10) + 1

    let quiz_nugu

    await Quiz.findOne({
        'id': random.toString()
    }, (err, quiz) => {
        if (err) return console.log(err)
        console.log(quiz)

        quiz_nugu = quiz.quiz
    })

    const file = 'data.txt'

    fs.writeFile(file, random, 'utf8', function (error) {
        console.log('write success')
    })


    nugu.response.output = {
        "random_quiz": quiz_nugu
    }

    return res.json(nugu.response)
}))


// if answer yes
router.use('/q_a_yesBranch', asyncWrap(async (req, res) => {
    let answer_nugu
    let incorrect_script_nugu


    const file = './data.txt'
    const id = fs.readFileSync(file, 'utf8')


    await Quiz.findOne({
        'id': id
    }, (err, quiz) => {
        if (err) return console.log(err)

        answer_nugu = quiz.answer
        incorrect_script_nugu = quiz.incorrect_script

    })


    if (answer_nugu == "O") {
        nugu.response.output = {
            "correct_answer_quiz": "정답입니다! 축하드려요."
        }
    } else {
        nugu.response.output = {
            "correct_answer_quiz": `아니에요. ${incorrect_script_nugu}`
        }
    }

    return res.json(nugu.response)
}))


// if answer no
router.use('/q_a_noBranch', asyncWrap(async (req, res) => {
    let answer_nugu
    let incorrect_script_nugu


    const file = './data.txt'
    const id = fs.readFileSync(file, 'utf8')


    const quiz = await Quiz.findOne({
        id
    })

    answer_nugu = quiz.answer
    incorrect_script_nugu = quiz.incorrect_script

    if (answer_nugu == "X") {
        nugu.response.output = {
            "incorrect_answer_quiz": "정답입니다! 축하드려요."
        }
    } else {
        nugu.response.output = {
            "incorrect_answer_quiz": `아니에요. ${incorrect_script_nugu}`
        }
    }

    return res.json(nugu.response)
}))


// time to rot
router.use('/timeToRotAction', asyncWrap(async (req, res) => {

    const trashName = req.body.action.parameters['TRASH'].value
    console.log(trashName)

    let nugu_rot

    await Trash.find({
        name: trashName
    }, (err, trash) => {
        if (err) {
            nugu.response.output = {
            "rot_time": `${trashName}에 대한 정보가 많지 않아서 잘 모르겠어요.`
            }
        }
        else if (trash.length === 0){
            nugu.response.output = {
            "rot_time": `${trashName}에 대한 정보가 많지 않아서 잘 모르겠어요.`
            }
        }
        else {
            console.log(trash)
            nugu_rot = trash[0].information.time_rot

            nugu.response.output = {
                "rot_time": `${trashName}은 썩는데까지 ${nugu_rot}정도 걸립니다. 참고하세요!`
            }
        }
    })

    console.log(nugu_rot)

    


    return res.json(nugu.response)
}))


// let trash_id = ""
// // how to dispose trash
// router.use('/howtoDisposeAction', (req, res) => {
//     // 사진을 인공지능 모델에게 전달


//     // 사진 받는 방식 수정

//     console.log("Start")
//     // const pythonProcess = spawn('python3', [`${root}/ObjectDetection/classifier.py`])

//     pythonProcess.stdout.on('data', async (data) => {

//         console.log(trash_id)

//         let temp = data.toString()
//         trash_id = temp.slice(0, 1)
//         let nugu_script
//         console.log(trash_id)

//         // 받아와서 DB에서 검색
//         await Trash.findOne({
//             id: trash_id
//         }, (err, trash) => {
//             nugu_script = trash.nugu_script
//         })

//         console.log(nugu_script)


//         // 출력
//         nugu.response.output = {
//             "way_dispose": nugu_script.toString()
//         }

//         console.log(nugu.response)

//         return res.json(nugu.response)

//     })

// })


// if answer yes
router.use('/h_d_a_yesBranch', asyncWrap(async (req, res) => {

    return res.json(nugu.response)
}))


// if answer no
router.use('/h_d_a_noBranch', (req, res) => {

    nugu.response.output = {
        "way_dispose_thanks": "이용해주셔서 감사합니다."
    }

    return res.json(nugu.response)
})


// qrcode send to user_email
router.use('/h_d_a_qrCodeBranch', asyncWrap(async (req, res) => {

    // OAuth id put from nugu
    const nugu_id = await getAuthEmail(req.body.context.session.accessToken)
    if (!nugu_id) {
        nugu.response.output = {
            way_dispose: '서비스를 이용하시려면 먼저 누구 앱에서 로그인을 해주세요'
        }
        return res.send(nugu.response)
    }

    // find same nugu_id connected berry_id
    const socket_id = await SocketId.findOne({
        nugu_id
    })
    if (!socket_id) return res.status(404).send({
        error: 'Id not found'
    })
    const berry_id = socket_id.berry_id


    sockets[berry_id].send(2)


    const date = new Date()
    const y = date.getFullYear().toString()
    const m = date.getMonth().toString()
    const d = date.getDate().toString()

    const latelyTrash = new LatelyTrash({
        user_email,
        trash_id,
        date: `${y}/${m}/${d}`
    })

    await latelyTrash.save(err => {

        if (err) {
            console.error(err)
            nugu.response.output = {
                "qrcode_success": "스마트사이클 앱으로 정보를 보내는데 실패하였습니다. 나중에 다시 시도해주세요."
            }
        }


        nugu.response.output = {
            "qrcode_success": "스마트사이클 앱으로 정보를 보내드렸어요. 이용해주셔서 감사합니다."
        }

    })


    return res.json(nugu.response)

}))

module.exports = router