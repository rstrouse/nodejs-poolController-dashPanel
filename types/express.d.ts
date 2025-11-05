import 'express';

// Minimal subset of Multer's File definition; adjust if needed.
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: any; // Using any to avoid Buffer type issues
  destination?: string;
  filename?: string;
  path?: string;
  stream?: any; // Using any to avoid NodeJS namespace issues
}

declare global {
  namespace Express {
    interface Request {
      /** Populated by multer single(field) */
      file?: MulterFile;
      /** Populated by multer array(field)/fields()/any() */
      files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
    }
  }
}

export {};