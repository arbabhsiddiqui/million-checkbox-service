import { createServer } from 'node:http'
import { env } from './common/config/env'
import { createExpressApplication, state } from './modules'
import { Server } from 'socket.io';


async function main() {
    try {
        const server = createServer(createExpressApplication())

        const io = new Server();
        io.attach(server)

        io.on('connection', (socket) => {
            console.log('A user connected:', socket.id);

            socket.on('client:checkbox-change', (data) => {

                console.log(`[Socket:${socket.id}:client:checkbox:change]`, data)

                io.emit('server:checkbox-change', data)
                state.checkboxes[data.index] = data.checked
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