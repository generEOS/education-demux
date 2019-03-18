import { Router } from 'express'
import { listConfirmed } from '../services/post'

export default () => {
  let api = Router()

  api.get('/post',    listConfirmed)

  return api
}
