import { createServer } from 'node:http'
import { env } from './common/config/env'
import { createExpressApplication } from './modules'
import { Server } from 'socket.io';


import { subscriber, publisher, redis } from './redis-connection'
import { index } from 'drizzle-orm/sqlite-core/indexes';

export const CHECKBOX_SIZE = 300;
export const CHECKBOX_STATE_KEY = 'checkbox-state'
const rateLimitingHashMap = new Map()

async function main() {
    try {
        const server = createServer(createExpressApplication())

        const io = new Server();
        io.attach(server)

        await subscriber.subscribe('internal-server:checkbox:change')
        subscriber.on('message', (channel, message) => {
            if (channel === 'internal-server:checkbox:change') {

                const { index, checked } = JSON.parse(message)
                io.emit('server:checkbox-change', { index, checked })

            }
        })

        io.on('connection', (socket) => {
            console.log('A user connected:', socket.id);

            socket.on('client:checkbox-change', async (data) => {

                console.log(`[Socket:${socket.id}:client:checkbox:change]`, data)

                const lastOperationTime = rateLimitingHashMap.get(socket.id)

                if (lastOperationTime) {
                    const timeElapsed = Date.now() - lastOperationTime;
                    if (timeElapsed < 5.5 * 1000) {
                        socket.emit('server:error', { error: 'Rate limit exceeded. Please wait before sending another update.' })
                    }
                }


                rateLimitingHashMap.set(socket.id, Date.now())





                const existingState = await redis.get(CHECKBOX_STATE_KEY)

                if (existingState) {
                    const remoteData = JSON.parse(existingState)
                    remoteData[data.index] = data.checked
                    await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(remoteData))
                } else {
                    await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(new Array(CHECKBOX_SIZE).fill(false)))
                }



                await publisher.publish('internal-server:checkbox:change', JSON.stringify(data))

            })

            // socket.on('disconnect', () => {
            //     console.log('User disconnected:', socket.id);
            // });
        });




        server.listen(env.PORT, () => {
            console.log(`http server is running on PORT ${env.PORT}`)
        })

    } catch (error) {
        console.error(`Error starting server: ${error}`)
        throw error
    }
}


main()