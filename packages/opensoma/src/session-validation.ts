import type { SomaHttp } from './http'

export type SessionValidator = Pick<SomaHttp, 'checkLogin'> & Partial<Pick<SomaHttp, 'verifySession'>>

export async function isSessionValid(validator: SessionValidator): Promise<boolean> {
  if (validator.verifySession) {
    return await validator.verifySession()
  }

  return Boolean(await validator.checkLogin())
}
