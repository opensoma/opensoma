import { GlobalRegistrator } from '@happy-dom/global-registrator'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

GlobalRegistrator.register()

globalThis.IS_REACT_ACT_ENVIRONMENT = true
