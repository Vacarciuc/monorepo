import { compile } from 'path-to-regexp'

export const authEndpoints = {
  login: compile('login'),
  register: compile('register'),
  validate: compile('validate'),
  getSelf: compile(''),

  findUser: compile('users/:id'),
  findUsers: compile('users'),
  updateUserRole: compile('users/:id/role'),
  deleteUser: compile('users/:id'),
}
