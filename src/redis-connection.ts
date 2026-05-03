import { Redis } from 'ioredis'


const redisHelper = () => {
    return new Redis({ host: 'valkey', port: 6379 })
}

export const redis = redisHelper()
export const publisher = redisHelper()
export const subscriber = redisHelper()