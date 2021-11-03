import { Application } from 'express-serve-static-core';
import bodyParser from 'body-parser';
import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import cors from 'cors';
import { User } from '../../data/models/user';
import rateLimiter from '../modules/rate-limiter';
import multer from 'multer';
import { extname, resolve } from 'path';  
import validateImage from '../middleware/validate-image';
import crypto from 'crypto';
import { promisify } from 'util';
import { readFile, rename } from 'fs';

const renameAsync = promisify(rename); 
const readFileAsync = promisify(readFile); 

function setupMulter(app: Application) {
  const uploadDir = resolve('./assets/upload');

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: async (req, file, cb) => cb(null, Date.now() + extname(file.originalname)),
  });
  const upload = multer({ storage });

  // TODO: validate is logged in, etc.
  app.post('/v2/upload', upload.single('file'), validateImage, async (req, res) => {
    const file = req.file!;
  
    const buffer = await readFileAsync(file.path);
    const hash = crypto
      .createHash('md5')
      .update(buffer)
      .digest('hex'); 

    const newFileName = hash + extname(file.originalname);
    await renameAsync(file.path, `${uploadDir}/${newFileName}`);
    
    res.status(201).json({ url: `${process.env.ROOT_ENDPOINT}/assets/upload/${newFileName}` });
  });
}
function setupPassport(app: Application) {
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    (User as any).authenticate(),
  ));
  passport.serializeUser((User as any).serializeUser());
  passport.deserializeUser((User as any).deserializeUser());
}

export default (app: Application) => {
  app.use(cors());
  app.use(bodyParser.json());
  app.use(passport.initialize());
  app.use(rateLimiter);

  setupPassport(app);
  setupMulter(app);
}