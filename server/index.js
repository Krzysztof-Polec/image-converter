import express from "express"
import multer from "multer"
import sharp from "sharp"
import bodyParser from "body-parser"
import helmet from "helmet"

const app = express()
const port = 5000

app.use(helmet())
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000")
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.use(bodyParser.json())

const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if(file.mimetype.startsWith("image/")){
      return cb(null, true)
    }else{
      return cb(new Error("Niewłaściwy format pliku"), false)
    }
  },
})

const validateImage = (req, res, next) => {
  if(!req.file){
    return res.status(400).send("Brak przesłanego pliku")
  }
  next()
}

const validateFormat = (req, res, next) => {
  const selectedFormat = req.body.format
  if(!["png","jpg","jpeg","webp"].includes(selectedFormat)){
    return res.status(400).send("Nieobsługiwany format obrazu")
  }
  next()
}

app.post("/process-image", upload.single("image"), validateImage, validateFormat, async (req, res) => {
  try{
    const imageBuffer = req.file.buffer
    const selectedFormat = req.body.format

    const processedImageBuffer = await sharp(imageBuffer)
      .toFormat(selectedFormat)
      .toBuffer()

    const processedImageBase64 = processedImageBuffer.toString("base64")

    res.send(processedImageBase64)
  }catch(error){
    console.error("Błąd przetwarzania obrazu na serwerze:", error)

    if(error.message === "Niewłaściwy format pliku"){
      res.status(400).send("Niewłaściwy format pliku")
    }else{
      res.status(500).send("Wewnętrzny błąd serwera")
    }
  }
})

app.listen(port, () => {
  console.log(`Serwer: http://localhost:${port}`)
})