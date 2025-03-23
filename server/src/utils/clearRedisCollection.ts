import { redisClient } from "./redis";

export const clearRedisCollection = async (pattern: string) => {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Cleared ${keys.length} keys matching pattern: ${pattern}`);
    } else {
        console.log(`No keys found matching pattern: ${pattern}`);
    }
};