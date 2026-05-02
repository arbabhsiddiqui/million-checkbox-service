import { createServer } from 'node:http'
import { env } from './common/config/env'
import { createExpressApplication } from './modules'


async function main() {
    try {
        const server = createServer(createExpressApplication())

        server.listen(env.PORT, () => {
            console.log(`http server is running on PORT ${env.PORT}`)
        })

    } catch (error) {
        console.error(`Error starting server: ${error}`)
        throw error
    }
}


main()