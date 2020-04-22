const express = require('express')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')
const spawn = require("child_process").spawn
const router = express.Router()
const root = "/home/smartcycle/smartcycle_server"


router.use(morgan('combined'))

// Models
const Trash = require(`${root}/models/trashModel`)
const LatelyTrash = require(`${root}/models/latelyTrashModel`)
const WrongTrash = require(`${root}/models/wrongTrashModel`)


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

    fs.writeFile(path.join(root, '/pictures/ai/', filename), buf, function (error) {
        if (error) {
            console.log("error")
            throw error
        } else {
            console.log('File created from base64 string!')
            return true
        }
    })
}

function decode_base64_success(base64str, filename) {
  const buf = Buffer.from(base64str, 'base64')

  fs.writeFile(path.join(root, '/pictures/success/', filename), buf, function (error) {
      if (error) {
          console.log("error")
          throw error
      } else {
          console.log('success Picture created from base64 string!')
          return true
      }
  })
}


function decode_base64_wrong(base64str, filename) {
  const buf = Buffer.from(base64str, 'base64')

  fs.writeFile(path.join(root, '/pictures/wrong/', filename), buf, function (error) {
      if (error) {
          console.log("error")
          throw error
      } else {
          console.log('wrong Picture created from base64 string!')
          return true
      }
  })
}

const timeout = ms => new Promise(res => setTimeout(res, ms))


// test API
router.get('/test', asyncWrap(async (req, res) => {
  
  var text = ""

  while(true) {
    try{
      text = fs.readFileSync(`${root}/predicted.txt`, "utf8");
      console.log(text)
      break
    } catch(err){
      await timeout(100)
      continue
    }
  }

  await timeout(500)

  fs.unlink(`${root}/predicted.txt`, function(err) {
      if( err ) throw err;
      console.log('file deleted');
  });      

  res.send(text)
}))


router.get('/test/test', asyncWrap(async (req, res) => {
  
  console.log("Start")

  const pythonProcess = spawn('python3', [`${root}/ObjectDetection/classifier.py`])

    pythonProcess.stdout.on('data', async (data) => {

        let temp = data.toString()
        let trash_id = temp.slice(0, 1)
        console.log(`trash : ${trash_id}`)

        return res.json({ trashId: trash_id })

    })
}))


// what is trash about picture from phone
let fileName = ""
router.post('/phone/what', asyncWrap(async (req, res) => {
    // console.log(req)
    fileName = Date.now() + ".jpg"
    decode_base64(req.body.img, fileName)

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
  });      

  return res.json({ trashId: trash_id })
}))

router.post('/success', (req, res) => {
   // save mongoDB
   decode_base64_success(req.body.img, fileName)
   const latelyTrash = new LatelyTrash()

   const date = new Date()
   const y = date.getFullYear().toString()
   const m = (date.getMonth()+1).toString()
   const d = date.getDate().toString()


   latelyTrash.user_email = req.body.user_email
   latelyTrash.trash_id = req.body.trash
   latelyTrash.imageURL = "/" + fileName
   latelyTrash.date = `${y}/${m}/${d}`

   latelyTrash.save()

   res.send("1")
})


router.post('/wrong', (req, res) => {
  decode_base64_wrong(req.body.img, fileName)
  
  const date = new Date()
  const y = date.getFullYear().toString()
  const m = (date.getMonth()+1).toString()
  const d = date.getDate().toString()

  const wrongTrash = new WrongTrash()

  wrongTrash.success = req.body.success
  wrongTrash.user_email = req.body.user_email
  wrongTrash.trash = req.body.trash
  wrongTrash.fileName = "/" + fileName
  wrongTrash.date = `${y}/${m}/${d}`

  wrongTrash.save()

  if(req.body.success == "true") {
    decode_base64_success(req.body.img, fileName)
    const latelyTrash = new LatelyTrash()
  
    latelyTrash.user_email = req.body.user_email
    latelyTrash.trash_id = req.body.trash
    latelyTrash.imageURL = "/" + fileName
    latelyTrash.date = `${y}/${m}/${d}`

    latelyTrash.save()
  }
  

  res.send("1")
})


// find lately trash by user_email
router.get('/lately/:user_email', (req, res) => {
    LatelyTrash.find({
        user_email: req.params.user_email
    }, (err, latelyTrash) => {
        if(err) return res.status(500).send("[]")
        if(latelyTrash == 0) return res.status(404).send("[]")
        res.json(latelyTrash)
    })
})


// search trash info by id
router.get('/info/:trash_id', (req, res) => {
    Trash.find({
      id: req.params.trash_id
  }, (err, trash) => {
      if (err) return res.status(500).json({
          error: err
      })
      if (trash.length === 0) return res.status(404).json({
          error: 'trash not found'
      })
      res.json(trash)
  })
})

router.get('/know', (req, res) => {
    res.send(    [
           {
        "contents": [
          {
            "secTitle": "설치해 주셔서 감사합니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국가는 균형있는 국민경제의 성장 및 안정과 적정한 소득의 분배를 유지하고, 시장의 지배와 경제력의 남용을 방지하며, 경제주체간의 조화를 통한 경제의 민주화를 위하여 경제에 관한 규제와 조정을 할 수 있다."
          },
          {
            "secTitle": "이 데이터는 데모 데이터입니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대통령은 제4항과 제5항의 규정에 의하여 확정된 법률을 지체없이 공포하여야 한다. 제5항에 의하여 법률이 확정된 후 또는 제4항에 의한 확정법률이 정부에 이송된 후 5일 이내에 대통령이 공포하지 아니할 때에는 국회의장이 이를 공포한다."
          },
          {
            "secTitle": "このデータはデモです。",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국회는 의장 1인과 부의장 2인을 선출한다. 대법관은 대법원장의 제청으로 국회의 동의를 얻어 대통령이 임명한다. 대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다."
          },
          {
            "secTitle": "This data is demo data.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대법원과 각급법원의 조직은 법률로 정한다. 광물 기타 중요한 지하자원·수산자원·수력과 경제상 이용할 수 있는 자연력은 법률이 정하는 바에 의하여 일정한 기간 그 채취·개발 또는 이용을 특허할 수 있다."
          },
        ],
        "_id": "5d88e78801095013472af4d8",
        "published_date": "2019-09-23T15:40:56.523Z",
        "docNum": "2",
        "title": "이렇게 하면 분리수거를 할 수 없어요! TOP5",
        "readTime": 4,
        "preImage": "https://images.unsplash.com/photo-1547671916-8dfb17579d01?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=564&q=80",
        "__v": 0
      },
      {
        "contents": [
          {
            "secTitle": "설치해 주셔서 감사합니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국가는 균형있는 국민경제의 성장 및 안정과 적정한 소득의 분배를 유지하고, 시장의 지배와 경제력의 남용을 방지하며, 경제주체간의 조화를 통한 경제의 민주화를 위하여 경제에 관한 규제와 조정을 할 수 있다."
          },
          {
            "secTitle": "이 데이터는 데모 데이터입니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대통령은 제4항과 제5항의 규정에 의하여 확정된 법률을 지체없이 공포하여야 한다. 제5항에 의하여 법률이 확정된 후 또는 제4항에 의한 확정법률이 정부에 이송된 후 5일 이내에 대통령이 공포하지 아니할 때에는 국회의장이 이를 공포한다."
          },
          {
            "secTitle": "このデータはデモです。",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국회는 의장 1인과 부의장 2인을 선출한다. 대법관은 대법원장의 제청으로 국회의 동의를 얻어 대통령이 임명한다. 대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다."
          },
          {
            "secTitle": "This data is demo data.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대법원과 각급법원의 조직은 법률로 정한다. 광물 기타 중요한 지하자원·수산자원·수력과 경제상 이용할 수 있는 자연력은 법률이 정하는 바에 의하여 일정한 기간 그 채취·개발 또는 이용을 특허할 수 있다."
          },
        ],
        "_id": "5d88e78801095013472af4d8",
        "published_date": "2019-09-23T15:40:56.523Z",
        "docNum": "3",
        "title": "인공지능이 알려주는 분리수거.",
        "readTime": 4,
        "preImage": "https://images.unsplash.com/photo-1572925151789-c13420b54514?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80",
        "__v": 0
      },
      {
        "contents": [
          {
            "secTitle": "설치해 주셔서 감사합니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국가는 균형있는 국민경제의 성장 및 안정과 적정한 소득의 분배를 유지하고, 시장의 지배와 경제력의 남용을 방지하며, 경제주체간의 조화를 통한 경제의 민주화를 위하여 경제에 관한 규제와 조정을 할 수 있다."
          },
          {
            "secTitle": "이 데이터는 데모 데이터입니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대통령은 제4항과 제5항의 규정에 의하여 확정된 법률을 지체없이 공포하여야 한다. 제5항에 의하여 법률이 확정된 후 또는 제4항에 의한 확정법률이 정부에 이송된 후 5일 이내에 대통령이 공포하지 아니할 때에는 국회의장이 이를 공포한다."
          },
          {
            "secTitle": "このデータはデモです。",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국회는 의장 1인과 부의장 2인을 선출한다. 대법관은 대법원장의 제청으로 국회의 동의를 얻어 대통령이 임명한다. 대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다."
          },
          {
            "secTitle": "This data is demo data.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대법원과 각급법원의 조직은 법률로 정한다. 광물 기타 중요한 지하자원·수산자원·수력과 경제상 이용할 수 있는 자연력은 법률이 정하는 바에 의하여 일정한 기간 그 채취·개발 또는 이용을 특허할 수 있다."
          },
        ],
        "_id": "5d88e78801095013472af4d8",
        "published_date": "2019-09-23T15:40:56.523Z",
        "docNum": "3",
        "title": "인공지능이 알려주는 분리수거.",
        "readTime": 4,
        "preImage": "https://images.unsplash.com/photo-1572925151789-c13420b54514?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80",
        "__v": 0
      },
      {
        "contents": [
          {
            "secTitle": "설치해 주셔서 감사합니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국가는 균형있는 국민경제의 성장 및 안정과 적정한 소득의 분배를 유지하고, 시장의 지배와 경제력의 남용을 방지하며, 경제주체간의 조화를 통한 경제의 민주화를 위하여 경제에 관한 규제와 조정을 할 수 있다."
          },
          {
            "secTitle": "이 데이터는 데모 데이터입니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대통령은 제4항과 제5항의 규정에 의하여 확정된 법률을 지체없이 공포하여야 한다. 제5항에 의하여 법률이 확정된 후 또는 제4항에 의한 확정법률이 정부에 이송된 후 5일 이내에 대통령이 공포하지 아니할 때에는 국회의장이 이를 공포한다."
          },
          {
            "secTitle": "このデータはデモです。",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국회는 의장 1인과 부의장 2인을 선출한다. 대법관은 대법원장의 제청으로 국회의 동의를 얻어 대통령이 임명한다. 대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다."
          },
          {
            "secTitle": "This data is demo data.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대법원과 각급법원의 조직은 법률로 정한다. 광물 기타 중요한 지하자원·수산자원·수력과 경제상 이용할 수 있는 자연력은 법률이 정하는 바에 의하여 일정한 기간 그 채취·개발 또는 이용을 특허할 수 있다."
          },
        ],
        "_id": "5d88e78801095013472af4d8",
        "published_date": "2019-09-23T15:40:56.523Z",
        "docNum": "3",
        "title": "인공지능이 알려주는 분리수거.",
        "readTime": 4,
        "preImage": "https://images.unsplash.com/photo-1572925151789-c13420b54514?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80",
        "__v": 0
      },
      {
        "contents": [
          {
            "secTitle": "설치해 주셔서 감사합니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국가는 균형있는 국민경제의 성장 및 안정과 적정한 소득의 분배를 유지하고, 시장의 지배와 경제력의 남용을 방지하며, 경제주체간의 조화를 통한 경제의 민주화를 위하여 경제에 관한 규제와 조정을 할 수 있다."
          },
          {
            "secTitle": "이 데이터는 데모 데이터입니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대통령은 제4항과 제5항의 규정에 의하여 확정된 법률을 지체없이 공포하여야 한다. 제5항에 의하여 법률이 확정된 후 또는 제4항에 의한 확정법률이 정부에 이송된 후 5일 이내에 대통령이 공포하지 아니할 때에는 국회의장이 이를 공포한다."
          },
          {
            "secTitle": "このデータはデモです。",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국회는 의장 1인과 부의장 2인을 선출한다. 대법관은 대법원장의 제청으로 국회의 동의를 얻어 대통령이 임명한다. 대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다."
          },
          {
            "secTitle": "This data is demo data.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대법원과 각급법원의 조직은 법률로 정한다. 광물 기타 중요한 지하자원·수산자원·수력과 경제상 이용할 수 있는 자연력은 법률이 정하는 바에 의하여 일정한 기간 그 채취·개발 또는 이용을 특허할 수 있다."
          },
        ],
        "_id": "5d88e78801095013472af4d8",
        "published_date": "2019-09-23T15:40:56.523Z",
        "docNum": "3",
        "title": "인공지능이 알려주는 분리수거.",
        "readTime": 4,
        "preImage": "https://images.unsplash.com/photo-1572925151789-c13420b54514?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80",
        "__v": 0
      },
      {
        "contents": [
          {
            "secTitle": "설치해 주셔서 감사합니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국가는 균형있는 국민경제의 성장 및 안정과 적정한 소득의 분배를 유지하고, 시장의 지배와 경제력의 남용을 방지하며, 경제주체간의 조화를 통한 경제의 민주화를 위하여 경제에 관한 규제와 조정을 할 수 있다."
          },
          {
            "secTitle": "이 데이터는 데모 데이터입니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대통령은 제4항과 제5항의 규정에 의하여 확정된 법률을 지체없이 공포하여야 한다. 제5항에 의하여 법률이 확정된 후 또는 제4항에 의한 확정법률이 정부에 이송된 후 5일 이내에 대통령이 공포하지 아니할 때에는 국회의장이 이를 공포한다."
          },
          {
            "secTitle": "このデータはデモです。",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국회는 의장 1인과 부의장 2인을 선출한다. 대법관은 대법원장의 제청으로 국회의 동의를 얻어 대통령이 임명한다. 대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다."
          },
          {
            "secTitle": "This data is demo data.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대법원과 각급법원의 조직은 법률로 정한다. 광물 기타 중요한 지하자원·수산자원·수력과 경제상 이용할 수 있는 자연력은 법률이 정하는 바에 의하여 일정한 기간 그 채취·개발 또는 이용을 특허할 수 있다."
          },
        ],
        "_id": "5d88e78801095013472af4d8",
        "published_date": "2019-09-23T15:40:56.523Z",
        "docNum": "3",
        "title": "인공지능이 알려주는 분리수거.",
        "readTime": 4,
        "preImage": "https://images.unsplash.com/photo-1572925151789-c13420b54514?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80",
        "__v": 0
      },
      {
        "contents": [
          {
            "secTitle": "설치해 주셔서 감사합니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국가는 균형있는 국민경제의 성장 및 안정과 적정한 소득의 분배를 유지하고, 시장의 지배와 경제력의 남용을 방지하며, 경제주체간의 조화를 통한 경제의 민주화를 위하여 경제에 관한 규제와 조정을 할 수 있다."
          },
          {
            "secTitle": "이 데이터는 데모 데이터입니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대통령은 제4항과 제5항의 규정에 의하여 확정된 법률을 지체없이 공포하여야 한다. 제5항에 의하여 법률이 확정된 후 또는 제4항에 의한 확정법률이 정부에 이송된 후 5일 이내에 대통령이 공포하지 아니할 때에는 국회의장이 이를 공포한다."
          },
          {
            "secTitle": "このデータはデモです。",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국회는 의장 1인과 부의장 2인을 선출한다. 대법관은 대법원장의 제청으로 국회의 동의를 얻어 대통령이 임명한다. 대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다."
          },
          {
            "secTitle": "This data is demo data.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대법원과 각급법원의 조직은 법률로 정한다. 광물 기타 중요한 지하자원·수산자원·수력과 경제상 이용할 수 있는 자연력은 법률이 정하는 바에 의하여 일정한 기간 그 채취·개발 또는 이용을 특허할 수 있다."
          },
        ],
        "_id": "5d88e78801095013472af4d8",
        "published_date": "2019-09-23T15:40:56.523Z",
        "docNum": "3",
        "title": "인공지능이 알려주는 분리수거.",
        "readTime": 4,
        "preImage": "https://images.unsplash.com/photo-1572925151789-c13420b54514?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80",
        "__v": 0
      },
      {
        "contents": [
          {
            "secTitle": "설치해 주셔서 감사합니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국가는 균형있는 국민경제의 성장 및 안정과 적정한 소득의 분배를 유지하고, 시장의 지배와 경제력의 남용을 방지하며, 경제주체간의 조화를 통한 경제의 민주화를 위하여 경제에 관한 규제와 조정을 할 수 있다."
          },
          {
            "secTitle": "이 데이터는 데모 데이터입니다.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대통령은 제4항과 제5항의 규정에 의하여 확정된 법률을 지체없이 공포하여야 한다. 제5항에 의하여 법률이 확정된 후 또는 제4항에 의한 확정법률이 정부에 이송된 후 5일 이내에 대통령이 공포하지 아니할 때에는 국회의장이 이를 공포한다."
          },
          {
            "secTitle": "このデータはデモです。",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "국회는 의장 1인과 부의장 2인을 선출한다. 대법관은 대법원장의 제청으로 국회의 동의를 얻어 대통령이 임명한다. 대통령은 내란 또는 외환의 죄를 범한 경우를 제외하고는 재직중 형사상의 소추를 받지 아니한다."
          },
          {
            "secTitle": "This data is demo data.",
            "image": "https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwibx-638rDkAhWUH3AKHZkQBp8QjRx6BAgBEAQ&url=https%3A%2F%2Fdoumiangel.tistory.com%2F10&psig=AOvVaw3wrKi8f9CirXDNK4a7t06Q&ust=1567470936195220",
            "secContent": "대법원과 각급법원의 조직은 법률로 정한다. 광물 기타 중요한 지하자원·수산자원·수력과 경제상 이용할 수 있는 자연력은 법률이 정하는 바에 의하여 일정한 기간 그 채취·개발 또는 이용을 특허할 수 있다."
          },
        ],
        "_id": "5d88e78801095013472af4d8",
        "published_date": "2019-09-23T15:40:56.523Z",
        "docNum": "3",
        "title": "인공지능이 알려주는 분리수거.",
        "readTime": 4,
        "preImage": "https://images.unsplash.com/photo-1572925151789-c13420b54514?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80",
        "__v": 0
      }
    ])
})



// make trash info
router.post('/info/update', (req, res) => {

  const trash = new Trash()

  trash.id = req.body.id
  trash.name = req.body.name
  trash.imageURL = req.body.imageURL
  trash.information.compo_number = req.body.information.compo_number
  trash.information.step_number = req.body.information.step_number
  trash.information.composition = req.body.information.composition
  trash.information.step = req.body.information.step
  trash.information.time_rot = req.body.information.time_rot
  trash.nugu_script = req.body.nugu_script
  trash.published_Date = new Date(req.body.published_date)

  trash.save((err) => {
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


module.exports = router