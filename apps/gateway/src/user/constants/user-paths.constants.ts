import { compile } from 'path-to-regexp';

// Endpoints of User module of account service
export const userEndpoints = {
   // GET /:id
   getOne: compile(':id'),
   // PATCH /:id
   update: compile(':id'),
   // DELETE /:id
   delete: compile(':id'),
   // GET /
   get: compile(''),
   // POST /
   create: compile(''),
   // PATCH /:id/restore
   restore: compile(':id/restore'),
};
