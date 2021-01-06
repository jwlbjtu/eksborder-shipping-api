import multer from 'multer';
import uniqid from 'uniqid';

const MIMETYPE_TO_EXT: { [key: string]: string } = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg'
};

const fileUpload = multer({
  limits: {
    fileSize: 1000000 // 1MB
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'static/images');
    },
    filename: (req, file, cb) => {
      const ext = MIMETYPE_TO_EXT[file.mimetype];
      cb(null, uniqid('Image') + '.' + ext);
    }
  }),
  fileFilter(req, file, cb) {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      return cb(new Error('Only .png .jpg and .jpeg format allowed!'));
    }
  }
});

export default fileUpload;
