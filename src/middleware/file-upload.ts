import multer from 'multer';
import uniqid from 'uniqid';

const MIMETYPE_TO_EXT: { [key: string]: string } = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg'
};

export const fileUpload = multer({
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

export const csvFileUpload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'static/csv');
    },
    filename: (req, file, cb) => {
      const ext = 'csv';
      cb(null, uniqid('csv') + '.' + ext);
    }
  }),
  fileFilter(req, file, cb) {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      return cb(new Error('Only .csv format allowed!'));
    }
  }
});
