import { script } from "subprogram"
import Conf from "conf"
import { KeyPair } from "ucan-storage/keypair"
import ora from "ora"
import { sha256 } from "multiformats/hashes/sha2"
import { CID } from "multiformats/cid"
import * as UCAN from "@ipld/dag-ucan"

const NAME = "web3-name"

const defaults = {
  secret: "",
  ucan: "",
}

interface Config {
  secret: string
  ucan: string
}

interface Settings extends Conf<Config> {}
type Output = ReturnType<typeof ora>
interface Context {
  projectName: string
  config: Config
  settings: Settings
  view: Output
}

type Options = Partial<Context>

const use = ({
  projectName = NAME,
  config = defaults,
  settings = new Conf({ projectName, defaults: config }),
  view = ora("").start(),
}: Options = {}) => ({ projectName, config, settings, view })

/**
 * @param {Options} options
 */
const main = async (options: Options) => {
  const context = use(options)
  const id = await identify(context)

  context.view.info(`🆔 ${id.payload.aud}`)

  // @ts-ignore
  const digest = await sha256.digest(new TextEncoder().encode(id.jwt))

  const { view } = context

  view.start("🔬 Look for good cid code")
  let code = 0x787f
  let old = new Set()
}

const identify = async (options: Options) => {
  const { view, settings } = use(options)
  view.start("🎫 Load id")
  const id = await secret({ view, settings })
  const jwt = settings.get("ucan")
  // @ts-ignore
  const ucan = await UCAN.validate(jwt).catch(() => null)

  if (!ucan || ucan.payload.aud !== id.did()) {
    view.text = "🎫 Generating new id"
    // @ts-ignore
    const ucan = await UCAN.build({
      issuer: id,
      audience: id.did(),
      lifetimeInSeconds: 1000 * 60 * 60 * 24 * 30,
      capabilities: [
        {
          with: id.did(),
          can: /** @type {any} */ "*",
        },
      ],
    })
    view.text = "🎫 Saving new id"
    settings.set("ucan", ucan.jwt)

    view.succeed("🎫 Loaded new id")
    return ucan
  }

  view.succeed("🎫 Loaded id")
  return { jwt, ...ucan }
}

const secret = async (options: Partial<Options>) => {
  const { view, settings } = use(options)
  view.start("🔑 Loading secret key")
  const key = settings.get("secret").trim()
  const keypair =
    key === "" ? null : await KeyPair.fromExportedKey(key).catch(() => null)

  if (!keypair) {
    view.text = "🔑 Generating secret key"
    const keypair = await KeyPair.create()
    view.text = "🔑 Saving secret key"
    settings.set("secret", keypair.export())

    view.succeed("🔑 Loaded secret")
    return keypair
  }

  view.succeed("🔑 Loaded secret")
  return keypair
}

script({ ...import.meta, main })
