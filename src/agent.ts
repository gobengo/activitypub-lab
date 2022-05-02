import Conf from "conf"
import { KeyPair } from "ucan-storage/keypair"
import ora from "ora"
import * as UCAN from "@ipld/dag-ucan"

const NAME = "web3-name"

const defaults = {
  secret: "",
  ucan: "",
}

interface Config {
  secret: string
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

export const secret = async (options: Partial<Options>) => {
  const { view, settings } = use(options)
  const key = settings.get("secret").trim()
  const keypair =
    key === "" ? null : await KeyPair.fromExportedKey(key).catch(() => null)

  if (!keypair) {
    view.text = "🔑 Generating secret key"
    const keypair = await KeyPair.create()
    view.text = "🔑 Saving secret key"
    settings.set("secret", keypair.export())

    return Object.assign(keypair, { algorithm: 0xed }) as UCAN.Issuer<number>
  }

  return Object.assign(keypair, { algorithm: 0xed }) as UCAN.Issuer<number>
}
