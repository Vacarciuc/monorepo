import { compile } from 'path-to-regexp';

export const authEndpoints = {
   login: compile('login'),
   register: compile('register'),
   validate: compile('validate'),
};
